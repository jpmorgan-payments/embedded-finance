import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { type ReferrerData } from '@/lib/csv-parser';

interface ReferrerChartProps {
  data: ReferrerData[];
  dateRange: { start: string | null; end: string | null };
}

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function ReferrerChart({ data, dateRange }: ReferrerChartProps) {
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (dateRange.start) {
      filtered = filtered.filter((item) => item.date >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.date <= dateRange.end!);
    }

    return filtered;
  }, [data, dateRange]);

  const chartData = useMemo(() => {
    const referrerMap = new Map<string, number>();

    for (const item of filteredData) {
      const current = referrerMap.get(item.referrer) || 0;
      referrerMap.set(item.referrer, current + item.count);
    }

    return Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({
        referrer: referrer || 'Direct',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 referrers
  }, [filteredData]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for the selected date range
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
