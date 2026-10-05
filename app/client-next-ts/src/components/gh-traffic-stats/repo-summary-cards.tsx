import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

import type { RepoLoad } from '@/hooks/use-gh-metrics';
import { formatDay, formatNumber } from '@/lib/gh-metrics/format';
import { REPO_SOURCES, type RepoId } from '@/lib/gh-metrics/sources';
import { cn } from '@/lib/utils';

import { ChangeBadge, REPO_COLORS } from './dashboard-ui';

interface RepoSummaryCardsProps {
  repos: Partial<Record<RepoId, RepoLoad>>;
  selected: RepoId;
  onSelect: (repo: RepoId) => void;
}

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
        return (
          <article
            key={source.id}
            aria-label={source.label}
            className={cn(
              'flex flex-col rounded-md border bg-card p-4 shadow-sm transition-colors',
              selected === source.id && 'ring-2 ring-primary/40'
            )}
          >
            <header className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: REPO_COLORS[source.id] }}
                />
                <a
                  href={source.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  {source.label}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </div>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {source.kind === 'daily' ? 'Daily counts' : '14-day snapshots'}
              </span>
            </header>

            {load?.status === 'error' && (
              <p className="mt-4 flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Couldn't load this repository's metrics.
              </p>
            )}

            {view && (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Views</dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {view.latestViews
                        ? formatNumber(view.latestViews.current)
                        : '—'}
                    </dd>
                    <dd>
                      <ChangeBadge change={view.latestViews?.change ?? null} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Clones</dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {view.latestClones
                        ? formatNumber(view.latestClones.current)
                        : '—'}
                    </dd>
                    <dd>
                      <ChangeBadge change={view.latestClones?.change ?? null} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Unique visitors
                    </dt>
                    <dd
                      className="tabular-nums"
                      title={
                        view.latestVisitors === null
                          ? 'This repository only stores unique visitors per day, which cannot be added up.'
                          : undefined
                      }
                    >
                      {view.latestVisitors === null
                        ? 'not recorded'
                        : formatNumber(view.latestVisitors)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Unique cloners
                    </dt>
                    <dd className="tabular-nums">
                      {view.latestCloners === null
                        ? 'not recorded'
                        : formatNumber(view.latestCloners)}
                    </dd>
                  </div>
                </dl>
                <footer className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                  <span>
                    14 days to{' '}
                    {view.latestViews ? formatDay(view.latestViews.date) : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(source.id)}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Details
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </footer>
              </>
            )}

            {!load && (
              <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
            )}
          </article>
        );
      })}
    </div>
  );
}
