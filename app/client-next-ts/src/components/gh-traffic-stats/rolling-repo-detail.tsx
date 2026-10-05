import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { gapsInRange, inRange, type RangeKey } from '@/lib/gh-metrics/derive';
import { formatDay, formatNumber, formatSpan } from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';

import {
  ChangeBadge,
  dayTickFormatter,
  GapNote,
  StatTile,
  tooltipDay,
} from './dashboard-ui';
import { ReferrerBreakdown } from './referrer-breakdown';

const viewsConfig = {
  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
  visitors: { label: 'Unique visitors', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const clonesConfig = {
  clones: { label: 'Clones', color: 'hsl(var(--chart-2))' },
  cloners: { label: 'Unique cloners', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

interface RollingRepoDetailProps {
  view: RepoView;
  range: RangeKey;
}

export function RollingRepoDetail({ view, range }: RollingRepoDetailProps) {
  const points = useMemo(
    () => inRange(view.windows, range, view.lastDate),
    [view.windows, range, view.lastDate]
  );
  const gaps = gapsInRange(view.gaps, range, view.lastDate);
  const tick = dayTickFormatter(points);
  const { latestViews, latestClones, latestVisitors, latestCloners } = view;

  return (
    <div className="space-y-6">
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

      {view.names.length > 1 && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Recorded as{' '}
          {view.names
            .map((n) => `${n.name} (${formatSpan(n.from, n.to)})`)
            .join(', then ')}
          . The charts treat these as one repository.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WindowChart
          title="Views and unique visitors"
          config={viewsConfig}
          data={points}
          keys={['views', 'visitors']}
          tick={tick}
        />
        <WindowChart
          title="Clones and unique cloners"
          config={clonesConfig}
          data={points}
          keys={['clones', 'cloners']}
          tick={tick}
        />
      </div>
      <GapNote gaps={gaps} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where visitors come from</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferrerBreakdown summary={view.referrers} />
        </CardContent>
      </Card>
    </div>
  );
}

function WindowChart({
  title,
  config,
  data,
  keys,
  tick,
}: {
  title: string;
  config: ChartConfig;
  data: RepoView['windows'];
  keys: [string, string];
  tick: (iso: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          Each point is GitHub's total for the 14 days up to that date, so
          neighbouring points overlap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-[240px] w-full"
        >
          <LineChart data={data} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tick}
              minTickGap={32}
              tickLine={false}
              axisLine={false}
            />
            <YAxis width={40} tickLine={false} axisLine={false} />
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
                strokeDasharray={i === 0 ? undefined : '4 3'}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
