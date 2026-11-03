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
import { inRange, type RangeKey } from '@/lib/gh-metrics/derive';
import { formatCompact } from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';

import {
  compactTick,
  dayTickFormatter,
  REPO_COLORS,
  tooltipDay,
} from './dashboard-ui';

interface WindowTrendChartProps {
  repos: RepoView[];
  metric: 'views' | 'clones';
  range: RangeKey;
  end: string;
}

type Row = { date: string } & Record<string, number | null | string>;

interface EndLabelProps {
  x?: number;
  y?: number;
  index?: number;
  value?: number | null;
}

/** 14-day totals of every repo on one time axis; collection gaps stay blank. */
export function WindowTrendChart({
  repos,
  metric,
  range,
  end,
}: WindowTrendChartProps) {
  const config: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        repos.map((r) => [
          r.source.id,
          { label: r.source.label, color: REPO_COLORS[r.source.id] },
        ])
      ),
    [repos]
  );

  const data = useMemo(() => {
    const rows = new Map<string, Row>();
    for (const repo of repos) {
      for (const w of repo.windows) {
        const row = rows.get(w.date) ?? { date: w.date };
        row[repo.source.id] = w[metric];
        rows.set(w.date, row);
      }
    }
    const sorted = [...rows.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return inRange(sorted, range, end);
  }, [repos, metric, range, end]);

  // Each line ends on its own latest value; the label sits there.
  const lastIndex = useMemo(
    () =>
      Object.fromEntries(
        repos.map((r) => {
          let i = data.length - 1;
          while (i >= 0 && (data[i][r.source.id] ?? null) === null) i -= 1;
          return [r.source.id, i];
        })
      ),
    [repos, data]
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 120, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={dayTickFormatter(data)}
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
        {repos.map((r) => (
          <Line
            key={r.source.id}
            type="monotone"
            dataKey={r.source.id}
            stroke={`var(--color-${r.source.id})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
            connectNulls={false}
            isAnimationActive={false}
            label={({ x, y, index, value }: EndLabelProps) =>
              index === lastIndex[r.source.id] &&
              typeof value === 'number' &&
              x !== undefined &&
              y !== undefined ? (
                <text
                  x={x + 8}
                  y={y}
                  dy={4}
                  className="fill-foreground text-xs"
                >
                  <tspan fontWeight={600}>{formatCompact(value)}</tspan>
                  <tspan className="fill-muted-foreground">
                    {' '}
                    {r.source.label}
                  </tspan>
                </text>
              ) : (
                <g />
              )
            }
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
