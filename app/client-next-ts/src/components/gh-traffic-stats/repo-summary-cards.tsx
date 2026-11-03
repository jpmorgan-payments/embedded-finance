import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

import type { RepoLoad } from '@/hooks/use-gh-metrics';
import { inRange, WINDOW_DAYS } from '@/lib/gh-metrics/derive';
import { formatDay, formatNumber } from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';
import { REPO_SOURCES, type RepoId } from '@/lib/gh-metrics/sources';
import { cn } from '@/lib/utils';

import { ChangeBadge, REPO_COLORS, Skeleton } from './dashboard-ui';
import { Sparkline } from './sparkline';

interface RepoSummaryCardsProps {
  repos: Partial<Record<RepoId, RepoLoad>>;
  selected: RepoId;
  onSelect: (repo: RepoId) => void;
}

const SPARK_DAYS = 90;

/** Median per-day uniques over the latest 14 collected days. */
function uniquesPerDay(
  view: RepoView,
  key: 'visitors' | 'cloners'
): number | null {
  if (!view.daily) return null;
  const recent = view.daily.filter((d) => d.observed).slice(-WINDOW_DAYS);
  if (recent.length === 0) return null;
  const sorted = recent.map((d) => d[key] ?? 0).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * One scorecard per repository. Loading, error and ready states share the same
 * footprint so nothing below moves when data arrives.
 */
export function RepoSummaryCards({
  repos,
  selected,
  onSelect,
}: RepoSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REPO_SOURCES.map((source) => {
        const load = repos[source.id];
        const view = load?.status === 'ready' ? load.view : null;
        const color = REPO_COLORS[source.id];
        return (
          <article
            key={source.id}
            aria-label={source.label}
            className={cn(
              'relative flex h-[268px] flex-col overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-shadow',
              selected === source.id && 'shadow-md ring-2 ring-offset-1'
            )}
            style={
              selected === source.id
                ? ({ '--tw-ring-color': `${color}66` } as CSSProperties)
                : undefined
            }
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: color }}
            />
            <header className="flex items-start justify-between gap-2">
              <a
                href={source.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold hover:underline"
              >
                {source.label}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {source.kind === 'daily' ? 'Daily counts' : '14-day snapshots'}
              </span>
            </header>

            {view ? (
              <ReadyBody
                view={view}
                color={color}
                onSelect={() => onSelect(source.id)}
              />
            ) : load?.status === 'error' ? (
              <p className="mt-6 flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Couldn't load this repository's metrics.
              </p>
            ) : (
              <div className="mt-4 flex flex-1 flex-col gap-3">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-[60px] w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ReadyBody({
  view,
  color,
  onSelect,
}: {
  view: RepoView;
  color: string;
  onSelect: () => void;
}) {
  const spark = inRange(view.windows, '90d', view.lastDate).map((w) => ({
    date: w.date,
    value: w.views,
  }));
  const visitorsPerDay = uniquesPerDay(view, 'visitors');
  const clonersPerDay = uniquesPerDay(view, 'cloners');

  return (
    <>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Views · 14 days
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold">
          {view.latestViews ? formatNumber(view.latestViews.current) : '—'}
        </span>
        <ChangeBadge change={view.latestViews?.change ?? null} />
      </div>

      <div className="mt-2">
        <Sparkline
          points={spark}
          color={color}
          unit="views in 14 days"
          caption={`14-day views, last ${SPARK_DAYS} days`}
        />
      </div>

      <dl className="mt-2 grid grid-cols-3 gap-2 border-t pt-2">
        <Metric label="Clones">
          {view.latestClones ? formatNumber(view.latestClones.current) : '—'}
          <ChangeBadge
            change={view.latestClones?.change ?? null}
            empty=""
            className="ml-1 px-1 py-0 text-[11px]"
          />
        </Metric>
        {view.latestVisitors !== null ? (
          <Metric label="Visitors">{formatNumber(view.latestVisitors)}</Metric>
        ) : (
          <Metric
            label="Visitors / day"
            title="Median unique visitors per day over the latest 14 days. Daily uniques can't be added into a 14-day figure."
          >
            {visitorsPerDay === null ? '—' : formatNumber(visitorsPerDay)}
          </Metric>
        )}
        {view.latestCloners !== null ? (
          <Metric label="Cloners">{formatNumber(view.latestCloners)}</Metric>
        ) : (
          <Metric
            label="Cloners / day"
            title="Median unique cloners per day over the latest 14 days. Daily uniques can't be added into a 14-day figure."
          >
            {clonersPerDay === null ? '—' : formatNumber(clonersPerDay)}
          </Metric>
        )}
      </dl>

      <footer className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>
          {WINDOW_DAYS} days to{' '}
          {view.latestViews ? formatDay(view.latestViews.date) : '—'}
        </span>
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
        >
          Details
          <ArrowRight className="h-3 w-3" />
        </button>
      </footer>
    </>
  );
}

function Metric({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div title={title} className="min-w-0">
      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
      <dd className="flex items-center whitespace-nowrap text-sm font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  );
}
