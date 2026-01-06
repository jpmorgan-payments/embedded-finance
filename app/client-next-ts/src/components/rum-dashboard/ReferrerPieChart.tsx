import { useMemo } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { type ReferrerData } from '@/lib/csv-parser';

interface ReferrerPieChartProps {
  data: ReferrerData[];
  dateRange: { start: string | null; end: string | null };
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

export function ReferrerPieChart({ data, dateRange }: ReferrerPieChartProps) {
  const chartData = useMemo(() => {
    let filtered = [...data];

    if (dateRange.start) {
      filtered = filtered.filter((item) => item.date >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.date <= dateRange.end!);
    }

    const referrerMap = new Map<string, number>();

    for (const item of filtered) {
      const current = referrerMap.get(item.referrer) || 0;
      referrerMap.set(item.referrer, current + item.count);
    }

    return Array.from(referrerMap.entries())
      .map(([referrer, count], index) => ({
        referrer: referrer || 'Direct',
        count,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 referrers
  }, [data, dateRange]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for the selected date range
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="referrer"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ referrer, percent }) =>
            `${referrer}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

