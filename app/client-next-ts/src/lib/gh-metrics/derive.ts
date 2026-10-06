import type { ParsedSeries } from './parse';

/** GitHub keeps 14 days of traffic; it is the only window all repos share. */
export const WINDOW_DAYS = 14;

const DAY_MS = 86_400_000;

export function addDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS
  );
}

function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  return (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** One calendar day of a `daily` repo. Values are `null` when nothing was collected. */
export interface DailyPoint {
  date: string;
  observed: boolean;
  views: number | null;
  visitors: number | null;
  clones: number | null;
  cloners: number | null;
}

/** Totals for the 14 days ending on `date`. Unique counts only exist when GitHub reported them. */
export interface WindowPoint {
  date: string;
  views: number | null;
  visitors: number | null;
  clones: number | null;
  cloners: number | null;
}

/**
 * A day counts as collected when either file has it. GitHub omits days
 * without activity, so a collected day missing from one file is a zero.
 */
export function buildDaily(
  views: ParsedSeries,
  clones: ParsedSeries
): DailyPoint[] {
  const v = new Map(views.points.map((p) => [p.date, p]));
  const c = new Map(clones.points.map((p) => [p.date, p]));
  const days = [...new Set([...v.keys(), ...c.keys()])].sort();
  if (days.length === 0) return [];

  return eachDay(days[0], days[days.length - 1]).map((date) => {
    const tv = v.get(date);
    const tc = c.get(date);
    const observed = Boolean(tv || tc);
    return {
      date,
      observed,
      views: observed ? (tv?.count ?? 0) : null,
      visitors: observed ? (tv?.uniques ?? 0) : null,
      clones: observed ? (tc?.count ?? 0) : null,
      cloners: observed ? (tc?.uniques ?? 0) : null,
    };
  });
}

/** Rolling 14-day sums; `null` unless all 14 days were collected. */
export function windowsFromDaily(daily: DailyPoint[]): WindowPoint[] {
  let views = 0;
  let clones = 0;
  let missing = 0;
  return daily.map((day, i) => {
    views += day.views ?? 0;
    clones += day.clones ?? 0;
    missing += day.observed ? 0 : 1;
    if (i >= WINDOW_DAYS) {
      const old = daily[i - WINDOW_DAYS];
      views -= old.views ?? 0;
      clones -= old.clones ?? 0;
      missing -= old.observed ? 0 : 1;
    }
    const full = i >= WINDOW_DAYS - 1 && missing === 0;
    return {
      date: day.date,
      views: full ? views : null,
      visitors: null,
      clones: full ? clones : null,
      cloners: null,
    };
  });
}

/** One point per calendar day; days without a snapshot are `null`. */
export function windowsFromSnapshots(
  views: ParsedSeries,
  clones: ParsedSeries
): WindowPoint[] {
  const v = new Map(views.points.map((p) => [p.date, p]));
  const c = new Map(clones.points.map((p) => [p.date, p]));
  const days = [...new Set([...v.keys(), ...c.keys()])].sort();
  if (days.length === 0) return [];

  return eachDay(days[0], days[days.length - 1]).map((date) => ({
    date,
    views: v.get(date)?.count ?? null,
    visitors: v.get(date)?.uniques ?? null,
    clones: c.get(date)?.count ?? null,
    cloners: c.get(date)?.uniques ?? null,
  }));
}

export interface WindowComparison {
  date: string;
  current: number;
  previousDate: string | null;
  previous: number | null;
  /** `current / previous - 1`; `null` when there is no comparable window. */
  change: number | null;
}

/** Latest 14-day total against the non-overlapping window before it. */
export function compareLatestWindow(
  points: WindowPoint[],
  key: 'views' | 'clones'
): WindowComparison | null {
  const latest = [...points].reverse().find((p) => p[key] !== null);
  if (!latest) return null;
  const byDate = new Map(points.map((p) => [p.date, p[key]]));
  const target = addDays(latest.date, -WINDOW_DAYS);

  for (const offset of [0, -1, 1]) {
    const date = addDays(target, offset);
    const previous = byDate.get(date);
    if (previous !== undefined && previous !== null) {
      return {
        date: latest.date,
        current: latest[key]!,
        previousDate: date,
        previous,
        change: previous > 0 ? latest[key]! / previous - 1 : null,
      };
    }
  }
  return {
    date: latest.date,
    current: latest[key]!,
    previousDate: null,
    previous: null,
    change: null,
  };
}

export interface Gap {
  from: string;
  to: string;
  days: number;
}

export function findGaps(points: { date: string; observed: boolean }[]): Gap[] {
  const gaps: Gap[] = [];
  for (const p of points) {
    if (p.observed) continue;
    const last = gaps[gaps.length - 1];
    if (last && daysBetween(last.to, p.date) === 1) {
      last.to = p.date;
      last.days += 1;
    } else {
      gaps.push({ from: p.date, to: p.date, days: 1 });
    }
  }
  return gaps;
}

export type MonthStatus = 'complete' | 'partial' | 'no-data' | 'in-progress';

export interface MonthTotal {
  month: string; // YYYY-MM
  views: number | null;
  clones: number | null;
  observedDays: number;
  daysInMonth: number;
  status: MonthStatus;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Calendar-month totals rebuilt from the daily series (single source of truth). */
export function monthlyTotals(daily: DailyPoint[]): MonthTotal[] {
  if (daily.length === 0) return [];
  const lastDay = daily[daily.length - 1].date;
  const months = new Map<string, MonthTotal>();

  for (const day of daily) {
    const month = day.date.slice(0, 7);
    let total = months.get(month);
    if (!total) {
      total = {
        month,
        views: 0,
        clones: 0,
        observedDays: 0,
        daysInMonth: daysInMonth(month),
        status: 'complete',
      };
      months.set(month, total);
    }
    if (day.observed) {
      total.observedDays += 1;
      total.views! += day.views ?? 0;
      total.clones! += day.clones ?? 0;
    }
  }

  for (const total of months.values()) {
    if (total.observedDays === 0) {
      total.status = 'no-data';
      total.views = null;
      total.clones = null;
    } else if (
      total.month === lastDay.slice(0, 7) &&
      Number(lastDay.slice(8)) < total.daysInMonth
    ) {
      total.status = 'in-progress';
    } else if (total.observedDays < total.daysInMonth) {
      total.status = 'partial';
    }
  }
  return [...months.values()];
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface WeekdayStat {
  day: string;
  median: number;
  samples: number;
}

/** Median daily views per weekday, over collected days only. */
export function weekdayProfile(daily: DailyPoint[]): WeekdayStat[] {
  const buckets: number[][] = WEEKDAYS.map(() => []);
  for (const d of daily) {
    if (d.observed) buckets[weekdayIndex(d.date)].push(d.views ?? 0);
  }
  return WEEKDAYS.map((day, i) => ({
    day,
    median: median(buckets[i]),
    samples: buckets[i].length,
  }));
}

export function workweekSplit(daily: DailyPoint[]): {
  weekdayMedian: number;
  weekendMedian: number;
} | null {
  const weekday: number[] = [];
  const weekend: number[] = [];
  for (const d of daily) {
    if (!d.observed) continue;
    (weekdayIndex(d.date) < 5 ? weekday : weekend).push(d.views ?? 0);
  }
  if (weekday.length < 5 || weekend.length < 2) return null;
  return { weekdayMedian: median(weekday), weekendMedian: median(weekend) };
}

/** Sum of `key` over the `days` ending on `end`; `null` unless every day was collected. */
export function sumWindow(
  daily: DailyPoint[],
  end: string,
  days: number,
  key: 'views' | 'clones'
): number | null {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  let sum = 0;
  for (let i = 0; i < days; i += 1) {
    const day = byDate.get(addDays(end, -i));
    if (!day?.observed) return null;
    sum += day[key] ?? 0;
  }
  return sum;
}

export interface PeriodComparison {
  end: string;
  previousEnd: string;
  days: number;
  current: number;
  previous: number;
}

/** Latest `days` against the same weekdays 52 weeks earlier. */
export function yearOverYear(
  daily: DailyPoint[],
  days = 28
): PeriodComparison | null {
  const last = [...daily].reverse().find((d) => d.observed);
  if (!last) return null;
  const previousEnd = addDays(last.date, -364);
  const current = sumWindow(daily, last.date, days, 'views');
  const previous = sumWindow(daily, previousEnd, days, 'views');
  if (current === null || previous === null || previous === 0) return null;
  return { end: last.date, previousEnd, days, current, previous };
}

/** Each cloner averaging this many clones in a day looks like CI, not people. */
export const BURST_CLONES_PER_CLONER = 10;
const BURST_MIN_CLONES = 100;

export function isCloneBurst(day: Pick<DailyPoint, 'clones' | 'cloners'>) {
  return (
    (day.clones ?? 0) >= BURST_MIN_CLONES &&
    (day.clones ?? 0) >= BURST_CLONES_PER_CLONER * Math.max(day.cloners ?? 0, 1)
  );
}

export function cloneBursts(daily: DailyPoint[]): {
  days: number;
  burstClones: number;
  totalClones: number;
} {
  let days = 0;
  let burstClones = 0;
  let totalClones = 0;
  for (const d of daily) {
    totalClones += d.clones ?? 0;
    if (isCloneBurst(d)) {
      days += 1;
      burstClones += d.clones ?? 0;
    }
  }
  return { days, burstClones, totalClones };
}

/** Mean of the last `days` values; `null` unless all of them were collected. */
export function trailingMean(
  daily: DailyPoint[],
  key: 'views' | 'clones',
  days = 7
): (number | null)[] {
  return daily.map((_, i) => {
    if (i < days - 1) return null;
    let sum = 0;
    for (let j = i - days + 1; j <= i; j += 1) {
      if (!daily[j].observed) return null;
      sum += daily[j][key] ?? 0;
    }
    return sum / days;
  });
}

export type RangeKey = '30d' | '90d' | '12m' | 'all';

export const RANGE_DAYS: Record<RangeKey, number | null> = {
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: null,
};

export function inRange<T extends { date: string }>(
  points: T[],
  range: RangeKey,
  end: string
): T[] {
  const days = RANGE_DAYS[range];
  if (days === null) return points;
  const start = addDays(end, -(days - 1));
  return points.filter((p) => p.date >= start && p.date <= end);
}

export function gapsInRange(gaps: Gap[], range: RangeKey, end: string): Gap[] {
  const days = RANGE_DAYS[range];
  const start = days === null ? '' : addDays(end, -(days - 1));
  return gaps.filter((g) => g.to >= start && g.from <= end);
}
