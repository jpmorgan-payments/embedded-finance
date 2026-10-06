import {
  buildDaily,
  compareLatestWindow,
  findGaps,
  windowsFromDaily,
  windowsFromSnapshots,
  type DailyPoint,
  type Gap,
  type WindowComparison,
  type WindowPoint,
} from './derive';
import type { ParsedSeries, RecordedName, ReferrerRow } from './parse';
import { summarizeReferrers, type ReferrerSummary } from './referrers';
import type { RepoSource } from './sources';

export interface RepoView {
  source: RepoSource;
  firstDate: string;
  lastDate: string;
  /** Per-day series; only for `daily` repos. */
  daily: DailyPoint[] | null;
  windows: WindowPoint[];
  latestViews: WindowComparison | null;
  latestClones: WindowComparison | null;
  /** GitHub-reported 14-day uniques; `null` for `daily` repos, where they can't be derived. */
  latestVisitors: number | null;
  latestCloners: number | null;
  collectedDays: number;
  spanDays: number;
  gaps: Gap[];
  names: RecordedName[];
  referrers: ReferrerSummary;
  skippedRows: number;
}

export function buildRepoView(
  source: RepoSource,
  views: ParsedSeries,
  clones: ParsedSeries,
  referrers: ReferrerRow[]
): RepoView {
  const daily = source.kind === 'daily' ? buildDaily(views, clones) : null;
  const windows = daily
    ? windowsFromDaily(daily)
    : windowsFromSnapshots(views, clones);
  const collected = daily
    ? daily.map((d) => ({ date: d.date, observed: d.observed }))
    : windows.map((w) => ({
        date: w.date,
        observed: w.views !== null || w.clones !== null,
      }));

  const latestViews = compareLatestWindow(windows, 'views');
  const latestClones = compareLatestWindow(windows, 'clones');
  const latestWindow = latestViews
    ? windows.find((w) => w.date === latestViews.date)
    : undefined;
  const latestCloneWindow = latestClones
    ? windows.find((w) => w.date === latestClones.date)
    : undefined;

  const names = [...views.names];
  for (const n of clones.names) {
    if (!names.some((m) => m.name === n.name)) names.push(n);
  }

  return {
    source,
    firstDate: collected[0]?.date ?? '',
    lastDate: collected[collected.length - 1]?.date ?? '',
    daily,
    windows,
    latestViews,
    latestClones,
    latestVisitors: latestWindow?.visitors ?? null,
    latestCloners: latestCloneWindow?.cloners ?? null,
    collectedDays: collected.filter((c) => c.observed).length,
    spanDays: collected.length,
    gaps: findGaps(collected),
    names,
    referrers: summarizeReferrers(referrers),
    skippedRows: views.skippedRows + clones.skippedRows,
  };
}
