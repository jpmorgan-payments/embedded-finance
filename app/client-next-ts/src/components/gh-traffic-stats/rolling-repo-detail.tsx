import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { gapsInRange, inRange, type RangeKey } from '@/lib/gh-metrics/derive';
import {
  formatDay,
  formatNumber,
  formatShortDay,
  formatSpan,
} from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';
import { weekEndSnapshots } from '@/lib/gh-metrics/weekly';

import { CalendarHeatmap } from './calendar-heatmap';
import {
  ChangeBadge,
  compactTick,
  dayTickFormatter,
  gapBands,
  GapNote,
  REPO_COLORS,
  SECONDARY_INK,
  StatTile,
  tooltipDay,
} from './dashboard-ui';
import { ChartCard, ProvenanceLine, SLOT } from './detail-layout';
import { referrerBasis, ReferrerBreakdown } from './referrer-breakdown';
import { ReferrerTrendChart } from './referrer-trend-chart';
import { WeekTable, type WeekTableRow } from './week-table';

interface RollingRepoDetailProps {
  view: RepoView;
  range: RangeKey;
}

export function RollingRepoDetail({ view, range }: RollingRepoDetailProps) {
  const color = REPO_COLORS[view.source.id];
  const points = useMemo(
    () => inRange(view.windows, range, view.lastDate),
    [view.windows, range, view.lastDate]
  );
  const gaps = gapsInRange(view.gaps, range, view.lastDate);
  const tick = dayTickFormatter(points);
  const { latestViews, latestClones, latestVisitors, latestCloners } = view;

  const viewsConfig = {
    views: { label: 'Views', color },
    visitors: { label: 'Unique visitors', color: SECONDARY_INK },
  } satisfies ChartConfig;
  const clonesConfig = {
    clones: { label: 'Clones', color },
    cloners: { label: 'Unique cloners', color: SECONDARY_INK },
  } satisfies ChartConfig;
  const engagementConfig = {
    viewsPerVisitor: { label: 'Views per visitor', color },
    clonesPerCloner: { label: 'Clones per cloner', color: SECONDARY_INK },
  } satisfies ChartConfig;

  const weekRows = useMemo<WeekTableRow[]>(
    () =>
      weekEndSnapshots(view.windows).map((s) => {
        const change =
          s.views !== null && s.previousViews
            ? s.views / s.previousViews - 1
            : null;
        return {
          id: s.end,
          label: s.latest
            ? `Latest · ${formatShortDay(s.date)}`
            : `To ${formatShortDay(s.end)}`,
          bar: s.views,
          muted: s.views === null,
          cells: {
            views: s.views === null ? '—' : formatNumber(s.views),
            change:
              s.views === null ? (
                <span className="text-xs text-muted-foreground">no data</span>
              ) : (
                <ChangeBadge
                  change={change}
                  title="Change versus the 14 days before"
                  empty="—"
                />
              ),
            visitors: s.visitors === null ? '—' : formatNumber(s.visitors),
            clones: s.clones === null ? '—' : formatNumber(s.clones),
          },
        };
      }),
    [view.windows]
  );

  const engagement = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        viewsPerVisitor:
          p.views !== null && p.visitors
            ? Math.round((p.views / p.visitors) * 10) / 10
            : null,
        clonesPerCloner:
          p.clones !== null && p.cloners
            ? Math.round((p.clones / p.cloners) * 10) / 10
            : null,
      })),
    [points]
  );

  const calendarCells = useMemo(
    () => view.windows.map((w) => ({ date: w.date, value: w.views })),
    [view.windows]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Views · 14 days"
          value={latestViews ? formatNumber(latestViews.current) : '—'}
          detail={<ChangeBadge change={latestViews?.change ?? null} />}
        />
        <StatTile
          label="Unique visitors · 14 days"
          value={latestVisitors === null ? '—' : formatNumber(latestVisitors)}
          detail={
            latestViews && latestVisitors
              ? `${(latestViews.current / latestVisitors).toFixed(1)} views per visitor`
              : undefined
          }
        />
        <StatTile
          label="Clones · 14 days"
          value={latestClones ? formatNumber(latestClones.current) : '—'}
          detail={<ChangeBadge change={latestClones?.change ?? null} />}
        />
        <StatTile
          label="Unique cloners · 14 days"
          value={latestCloners === null ? '—' : formatNumber(latestCloners)}
          detail={
            latestViews ? `As of ${formatDay(latestViews.date)}` : undefined
          }
        />
      </div>
      <ProvenanceLine>
        14-day snapshots · {formatNumber(view.collectedDays)} of{' '}
        {formatNumber(view.spanDays)} days collected since{' '}
        {formatDay(view.firstDate)}
        {view.names.length > 1 && (
          <>
            {' '}
            · Recorded as{' '}
            {view.names
              .map((n) => `${n.name} (${formatSpan(n.from, n.to)})`)
              .join(', then ')}
            ; shown as one repository.
          </>
        )}
      </ProvenanceLine>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Week by week"
          description="GitHub's 14-day totals at the end of each week, newest first. Rows overlap by a week, so compare each with the row two below."
          bodyHeight={SLOT.week}
        >
          <WeekTable
            caption={`${view.source.label} 14-day totals at each week's end`}
            color={color}
            columns={[
              { key: 'views', label: 'Views (14d)' },
              {
                key: 'change',
                label: 'vs 14d before',
                title: 'Against the non-overlapping 14 days before',
              },
              { key: 'visitors', label: 'Visitors (14d)' },
              { key: 'clones', label: 'Clones (14d)' },
            ]}
            rows={weekRows}
          />
        </ChartCard>

        <ChartCard
          title="Where visitors come from, over time"
          description="GitHub's top referrers for the 14 days to each date, grouped by kind of site."
          bodyHeight={SLOT.week}
        >
          {view.referrerTrend ? (
            <ReferrerTrendChart
              points={view.referrerTrend}
              range={range}
              end={view.lastDate}
              height={SLOT.week}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              This repository's referrer file has no dates.
            </p>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Views and unique visitors"
        description="Each point is GitHub's total for the 14 days up to that date, so neighbouring points overlap. Shaded bands are days without a snapshot."
        bodyHeight={SLOT.daily}
        footnote={<GapNote gaps={gaps} />}
      >
        <WindowLines
          config={viewsConfig}
          data={points}
          keys={['views', 'visitors']}
          tick={tick}
          gaps={gaps}
        />
      </ChartCard>

      <ChartCard
        title="14-day views by collection day, last 12 months"
        description="Each square is one day's snapshot of the 14-day total, Monday on top. Hatched days have no snapshot."
      >
        <CalendarHeatmap
          cells={calendarCells}
          end={view.lastDate}
          unit="views in the 14 days to that date"
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Engagement"
          description="Views per unique visitor and clones per unique cloner, over each 14-day window."
          bodyHeight={SLOT.side}
        >
          <WindowLines
            config={engagementConfig}
            data={engagement}
            keys={['viewsPerVisitor', 'clonesPerCloner']}
            tick={tick}
            gaps={gaps}
          />
        </ChartCard>

        <ChartCard
          title="Where visitors come from"
          description={referrerBasis(view.referrers)}
          bodyHeight={SLOT.side}
        >
          <ReferrerBreakdown summary={view.referrers} />
        </ChartCard>
      </div>

      <ChartCard
        title="Clones and unique cloners"
        description="GitHub's 14-day clone totals. Clones include CI and other automation."
        bodyHeight={SLOT.clones}
        footnote={<GapNote gaps={gaps} />}
      >
        <WindowLines
          config={clonesConfig}
          data={points}
          keys={['clones', 'cloners']}
          tick={tick}
          gaps={gaps}
        />
      </ChartCard>
    </div>
  );
}

function WindowLines<T extends { date: string }>({
  config,
  data,
  keys,
  tick,
  gaps,
}: {
  config: ChartConfig;
  data: T[];
  keys: [string, string];
  tick: (iso: string) => string;
  gaps: RepoView['gaps'];
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        {gapBands(gaps, data)}
        <XAxis
          dataKey="date"
          tickFormatter={tick}
          minTickGap={32}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactTick}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={tooltipDay} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={i === 0 ? 2 : 1.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
