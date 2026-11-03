import { useMemo } from 'react';
import {
  AlertTriangle,
  Info,
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
import {
  RANGE_OPTIONS,
  REPO_COLORS,
  SegmentedControl,
  Skeleton,
} from './dashboard-ui';
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

/** Highlights are capped so the panel's height is known before data arrives. */
const MAX_HIGHLIGHTS = 6;

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
  const highlights = useMemo(
    () => buildHighlights(ready).slice(0, MAX_HIGHLIGHTS),
    [ready]
  );
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

      <section className="space-y-3" aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="text-lg font-semibold">
          Latest 14 days
        </h2>
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

      <section aria-label="Highlights" className="space-y-3">
        <h2 className="text-lg font-semibold">What changed</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {firstLoad
            ? Array.from({ length: MAX_HIGHLIGHTS }, (_, i) => (
                <Skeleton key={i} className="h-[66px]" />
              ))
            : highlights.map((h) => {
                const Icon = HIGHLIGHT_ICON[h.tone];
                return (
                  <p
                    key={h.id}
                    className="flex min-h-[66px] items-start gap-3 rounded-md border bg-card px-4 py-3 text-sm"
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${HIGHLIGHT_COLOR[h.tone]}`}
                    />
                    {h.text}
                  </p>
                );
              })}
        </div>
      </section>

      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y bg-background/90 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <span className="text-sm font-medium">
          Chart range
          <span className="ml-2 font-normal text-muted-foreground">
            applies to every chart below
          </span>
        </span>
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
              The one measure all three repositories share. Gaps are days the
              collector didn't run.
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
          {ready.length > 0 ? (
            <WindowTrendChart
              repos={ready}
              metric={metric}
              range={range}
              end={lastDate}
            />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </CardContent>
      </Card>

      <section id="repo-details" className="scroll-mt-32 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Repository deep dive</h2>
            <p className="text-sm text-muted-foreground">
              Week-by-week numbers, daily detail and sources for one repository.
            </p>
          </div>
        </div>
        <Tabs
          value={repo}
          onValueChange={(value) => onSearchChange({ repo: value as RepoId })}
        >
          <TabsList>
            {REPO_SOURCES.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: REPO_COLORS[s.id] }}
                />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {REPO_SOURCES.map((s) => {
            const view = ready.find((v) => v.source.id === s.id);
            return (
              <TabsContent key={s.id} value={s.id} className="mt-4">
                {view ? (
                  <RepoDetail view={view} range={range} />
                ) : repos[s.id]?.status === 'error' ? (
                  <p className="py-8 text-sm text-muted-foreground">
                    Metrics for {s.label} couldn't be loaded.
                  </p>
                ) : (
                  <DetailSkeleton />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      <DataQuality repos={repos} />
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

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <Skeleton className="h-5 w-2/3" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[440px]" />
        <Skeleton className="h-[440px]" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}
