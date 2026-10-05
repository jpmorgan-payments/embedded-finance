import { useMemo } from 'react';
import {
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGhMetrics } from '@/hooks/use-gh-metrics';
import type { RangeKey } from '@/lib/gh-metrics/derive';
import { formatDay } from '@/lib/gh-metrics/format';
import { buildHighlights, type Highlight } from '@/lib/gh-metrics/highlights';
import type { RepoView } from '@/lib/gh-metrics/repo-view';
import { REPO_SOURCES, type RepoId } from '@/lib/gh-metrics/sources';

import { DailyRepoDetail } from './daily-repo-detail';
import { RANGE_OPTIONS, SegmentedControl } from './dashboard-ui';
import { DataQuality } from './data-quality';
import { RepoSummaryCards } from './repo-summary-cards';
import { RollingRepoDetail } from './rolling-repo-detail';
import { WindowTrendChart } from './window-trend-chart';

export interface GhTrafficSearch {
  repo?: RepoId;
  range?: RangeKey;
  metric?: 'views' | 'clones';
}

interface GhTrafficStatsDashboardProps {
  search: GhTrafficSearch;
  onSearchChange: (next: GhTrafficSearch) => void;
}

const HIGHLIGHT_ICON: Record<Highlight['tone'], typeof Info> = {
  up: TrendingUp,
  down: TrendingDown,
  info: Info,
  warning: AlertTriangle,
};

const HIGHLIGHT_COLOR: Record<Highlight['tone'], string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
};

export function GhTrafficStatsDashboard({
  search,
  onSearchChange,
}: GhTrafficStatsDashboardProps) {
  const { loading, repos, reload } = useGhMetrics();
  const repo = search.repo ?? REPO_SOURCES[0].id;
  const range = search.range ?? '90d';
  const metric = search.metric ?? 'views';

  const ready = useMemo(
    () =>
      REPO_SOURCES.flatMap((s) => {
        const load = repos[s.id];
        return load?.status === 'ready' ? [load.view] : [];
      }),
    [repos]
  );
  const failed = REPO_SOURCES.filter((s) => repos[s.id]?.status === 'error');
  const highlights = useMemo(() => buildHighlights(ready), [ready]);
  const lastDate = ready.reduce(
    (max, v) => (v.lastDate > max ? v.lastDate : max),
    ''
  );
  const firstLoad = loading && ready.length === 0 && failed.length === 0;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Repository traffic
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            GitHub views, clones and referrers for J.P. Morgan Payments
            open-source repositories, saved daily from the GitHub traffic API.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {lastDate && <span>Data through {formatDay(lastDate)}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </header>

      {failed.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Couldn't load metrics for {failed.map((s) => s.label).join(', ')}. The
          rest of the page uses the repositories that loaded.
        </div>
      )}

      {firstLoad ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading traffic data…
        </div>
      ) : (
        <>
          {highlights.length > 0 && (
            <section
              aria-label="Highlights"
              className="grid gap-3 md:grid-cols-2"
            >
              {highlights.map((h) => {
                const Icon = HIGHLIGHT_ICON[h.tone];
                return (
                  <p
                    key={h.id}
                    className="flex items-start gap-3 rounded-md border bg-card px-4 py-3 text-sm"
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${HIGHLIGHT_COLOR[h.tone]}`}
                    />
                    {h.text}
                  </p>
                );
              })}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Latest 14 days</h2>
            <RepoSummaryCards
              repos={repos}
              selected={repo}
              onSelect={(id) => {
                onSearchChange({ repo: id });
                document
                  .getElementById('repo-details')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </section>

          {ready.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
                <span className="text-sm font-medium">Chart range</span>
                <SegmentedControl
                  label="Chart range"
                  value={range}
                  onChange={(value) => onSearchChange({ range: value })}
                  options={RANGE_OPTIONS}
                />
              </div>

              <Card>
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">
                      14-day totals by repository
                    </CardTitle>
                    <CardDescription>
                      The only measure all three repositories share. Gaps are
                      days the collector didn't run.
                    </CardDescription>
                  </div>
                  <SegmentedControl
                    label="Trend metric"
                    value={metric}
                    onChange={(value) => onSearchChange({ metric: value })}
                    options={[
                      { value: 'views', label: 'Views' },
                      { value: 'clones', label: 'Clones' },
                    ]}
                  />
                </CardHeader>
                <CardContent>
                  <WindowTrendChart
                    repos={ready}
                    metric={metric}
                    range={range}
                    end={lastDate}
                  />
                </CardContent>
              </Card>

              <section id="repo-details" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg font-semibold">Repository details</h2>
                <Tabs
                  value={repo}
                  onValueChange={(value) =>
                    onSearchChange({ repo: value as RepoId })
                  }
                >
                  <TabsList>
                    {REPO_SOURCES.map((s) => (
                      <TabsTrigger key={s.id} value={s.id}>
                        {s.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {REPO_SOURCES.map((s) => {
                    const view = ready.find((v) => v.source.id === s.id);
                    return (
                      <TabsContent key={s.id} value={s.id}>
                        {view ? (
                          <RepoDetail view={view} range={range} />
                        ) : (
                          <p className="py-8 text-sm text-muted-foreground">
                            {loading
                              ? 'Loading…'
                              : `Metrics for ${s.label} couldn't be loaded.`}
                          </p>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </section>
            </>
          )}

          <DataQuality repos={repos} />
        </>
      )}
    </div>
  );
}

function RepoDetail({ view, range }: { view: RepoView; range: RangeKey }) {
  return view.daily ? (
    <DailyRepoDetail view={view} daily={view.daily} range={range} />
  ) : (
    <RollingRepoDetail view={view} range={range} />
  );
}
