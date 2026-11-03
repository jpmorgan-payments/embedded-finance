import {
  addDays,
  isCloneBurst,
  weekdayIndex,
  WINDOW_DAYS,
  type DailyPoint,
  type WindowPoint,
} from './derive';

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The Monday that starts the week containing `iso`. */
export function weekStart(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

/** One Monday–Sunday week of a `daily` repo. */
export interface WeekTotal {
  start: string;
  end: string;
  views: number;
  clones: number;
  observedDays: number;
  /** The week has ended and all seven days were collected. */
  complete: boolean;
  /** The week contains the latest collected day and hasn't ended yet. */
  inProgress: boolean;
  peak: { date: string; views: number } | null;
  /** Median of the per-day unique visitors; daily uniques can't be added up. */
  visitorsPerDay: number | null;
  automationDays: number;
}

/** Calendar weeks (Monday start) rebuilt from the daily series. */
export function weeklyTotals(daily: DailyPoint[]): WeekTotal[] {
  if (daily.length === 0) return [];
  const lastDay = daily[daily.length - 1].date;
  const weeks = new Map<string, WeekTotal & { visitors: number[] }>();

  for (const day of daily) {
    const start = weekStart(day.date);
    let week = weeks.get(start);
    if (!week) {
      const end = addDays(start, 6);
      week = {
        start,
        end,
        views: 0,
        clones: 0,
        observedDays: 0,
        complete: false,
        inProgress: end > lastDay,
        peak: null,
        visitorsPerDay: null,
        automationDays: 0,
        visitors: [],
      };
      weeks.set(start, week);
    }
    if (!day.observed) continue;
    const views = day.views ?? 0;
    week.observedDays += 1;
    week.views += views;
    week.clones += day.clones ?? 0;
    week.visitors.push(day.visitors ?? 0);
    if (isCloneBurst(day)) week.automationDays += 1;
    if (!week.peak || views > week.peak.views) {
      week.peak = { date: day.date, views };
    }
  }

  return [...weeks.values()].map(({ visitors, ...week }) => ({
    ...week,
    complete: !week.inProgress && week.observedDays === 7,
    visitorsPerDay: median(visitors),
  }));
}

/** `current / previous - 1` between two complete weeks; `null` otherwise. */
export function weekOverWeek(weeks: WeekTotal[], index: number): number | null {
  const week = weeks[index];
  const previous = weeks[index - 1];
  if (!week?.complete || !previous?.complete || previous.views === 0) {
    return null;
  }
  return week.views / previous.views - 1;
}

/** GitHub's 14-day totals as they stood at the end of a week. */
export interface WeekSnapshot {
  /** The week's Sunday, or the latest snapshot day for the newest row. */
  end: string;
  /** The day the snapshot was actually taken (may be a day off `end`). */
  date: string;
  latest: boolean;
  views: number | null;
  visitors: number | null;
  clones: number | null;
  cloners: number | null;
  /** 14-day views from the non-overlapping window before this one. */
  previousViews: number | null;
}

function snapshotNear(
  byDate: Map<string, WindowPoint>,
  date: string
): WindowPoint | null {
  for (const offset of [0, -1, 1]) {
    const point = byDate.get(addDays(date, offset));
    if (point && point.views !== null) return point;
  }
  return null;
}

/**
 * The latest 14-day snapshot followed by one per earlier week (as of each
 * Sunday), newest first. Neighbouring rows overlap by a week by construction.
 */
export function weekEndSnapshots(
  windows: WindowPoint[],
  count = 8
): WeekSnapshot[] {
  const byDate = new Map(windows.map((w) => [w.date, w]));
  const latest = [...windows].reverse().find((w) => w.views !== null);
  if (!latest) return [];

  const rows: WeekSnapshot[] = [];
  const push = (end: string, point: WindowPoint | null, isLatest: boolean) => {
    const previous = point
      ? snapshotNear(byDate, addDays(point.date, -WINDOW_DAYS))
      : null;
    rows.push({
      end,
      date: point?.date ?? end,
      latest: isLatest,
      views: point?.views ?? null,
      visitors: point?.visitors ?? null,
      clones: point?.clones ?? null,
      cloners: point?.cloners ?? null,
      previousViews: previous?.views ?? null,
    });
  };

  push(latest.date, latest, true);
  const first = windows[0].date;
  // The Sunday on or before the day before the latest snapshot.
  let sunday = addDays(weekStart(addDays(latest.date, -1)), 6);
  if (sunday >= latest.date) sunday = addDays(sunday, -7);
  while (rows.length < count && sunday >= first) {
    push(sunday, snapshotNear(byDate, sunday), false);
    sunday = addDays(sunday, -7);
  }
  return rows;
}
