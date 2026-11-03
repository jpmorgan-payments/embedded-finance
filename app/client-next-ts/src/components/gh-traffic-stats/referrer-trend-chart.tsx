import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { inRange, type RangeKey } from '@/lib/gh-metrics/derive';
import {
  REFERRER_BANDS,
  type ReferrerTrendPoint,
} from '@/lib/gh-metrics/referrers';

import { compactTick, dayTickFormatter, tooltipDay } from './dashboard-ui';

interface ReferrerTrendChartProps {
  points: ReferrerTrendPoint[];
  range: RangeKey;
  end: string;
  height: number;
}

/**
 * Stacked 14-day referrals per source band over time. Only bands that
 * appear in the range are drawn; their colors never change.
 */
export function ReferrerTrendChart({
  points,
  range,
  end,
  height,
}: ReferrerTrendChartProps) {
  const data = useMemo(() => inRange(points, range, end), [points, range, end]);
  const bands = useMemo(
    () => REFERRER_BANDS.filter((b) => data.some((p) => (p[b.band] ?? 0) > 0)),
    [data]
  );
  const config = useMemo(
    () =>
      Object.fromEntries(
        bands.map((b) => [b.band, { label: b.label, color: b.color }])
      ) satisfies ChartConfig,
    [bands]
  );

  if (bands.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No referrers recorded in this range.
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={dayTickFormatter(data)}
          minTickGap={32}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={40}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactTick}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={tooltipDay} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {bands.map((b) => (
          <Area
            key={b.band}
            dataKey={b.band}
            stackId="referrers"
            type="monotone"
            fill={`var(--color-${b.band})`}
            fillOpacity={0.7}
            stroke={`var(--color-${b.band})`}
            strokeWidth={1.5}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
