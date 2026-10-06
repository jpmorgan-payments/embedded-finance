import Papa from 'papaparse';

export interface CountPoint {
  date: string; // YYYY-MM-DD
  count: number;
  uniques: number;
}

/** A `repository_name` value and the days it was recorded under (renames). */
export interface RecordedName {
  name: string;
  from: string;
  to: string;
}

export interface ParsedSeries {
  points: CountPoint[];
  names: RecordedName[];
  skippedRows: number;
}

export interface ReferrerRow {
  /** Snapshot day; `null` when the source keeps no dates. */
  date: string | null;
  site: string;
  count: number;
  uniques: number;
}

const DATE_KEYS = ['date'];
const COUNT_KEYS = ['views', 'total views', 'clones', 'total clones', 'count'];
const UNIQUE_KEYS = [
  'unique_visitors/cloners',
  'unique_visitors',
  'unique visitors',
  'unique_cloners',
  'unique clones',
  'uniques',
];
const SITE_KEYS = ['site', 'referrer'];
const NAME_KEYS = ['repository_name'];

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;

function readRows(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => v.trim(),
  });
  return result.data;
}

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return undefined;
}

function toInt(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  return Number(value);
}

function toDay(value: string | undefined): string | null {
  return value && ISO_DAY.test(value) ? value.slice(0, 10) : null;
}

/**
 * Parses a views or clones CSV from any of the collectors. When a day has
 * several rows (multiple runs that day) the last one wins.
 */
export function parseCountCsv(text: string): ParsedSeries {
  const byDay = new Map<string, CountPoint>();
  const names = new Map<string, RecordedName>();
  let skippedRows = 0;

  for (const row of readRows(text)) {
    const date = toDay(pick(row, DATE_KEYS));
    const count = toInt(pick(row, COUNT_KEYS));
    const uniques = toInt(pick(row, UNIQUE_KEYS));
    if (!date || count === null || uniques === null) {
      skippedRows += 1;
      continue;
    }
    byDay.set(date, { date, count, uniques });

    const name = pick(row, NAME_KEYS);
    if (name) {
      const seen = names.get(name);
      if (!seen) names.set(name, { name, from: date, to: date });
      else {
        if (date < seen.from) seen.from = date;
        if (date > seen.to) seen.to = date;
      }
    }
  }

  return {
    points: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    names: [...names.values()].sort((a, b) => a.from.localeCompare(b.from)),
    skippedRows,
  };
}

/** Parses a referrer CSV; drops the collectors' empty `no-referrers` marker. */
export function parseReferrerCsv(text: string): ReferrerRow[] {
  const rows: ReferrerRow[] = [];
  for (const row of readRows(text)) {
    const site = pick(row, SITE_KEYS);
    const count = toInt(pick(row, COUNT_KEYS));
    const uniques = toInt(pick(row, UNIQUE_KEYS)) ?? 0;
    if (!site || site === 'no-referrers' || !count) continue;
    rows.push({ date: toDay(pick(row, DATE_KEYS)), site, count, uniques });
  }
  return rows;
}
