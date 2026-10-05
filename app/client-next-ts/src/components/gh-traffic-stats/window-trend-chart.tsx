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
import type { RepoView } from '@/lib/gh-metrics/repo-view';

import { dayTickFormatter, REPO_COLORS, tooltipDay } from './dashboard-ui';

interface WindowTrendChartProps {
  repos: RepoView[];
  metric: 'views' | 'clones';
  range: RangeKey;
  end: string;
}

type Row = { date: string } & Record<string, number | null | string>;

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

  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={dayTickFormatter(data)}
          minTickGap={32}
          tickLine={false}
          axisLine={false}
        />
        <YAxis width={48} tickLine={false} axisLine={false} />
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
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
