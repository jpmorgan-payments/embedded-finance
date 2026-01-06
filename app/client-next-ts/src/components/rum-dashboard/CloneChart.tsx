import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { type CloneData } from '@/lib/csv-parser';

import { type ChartType } from './GhTrafficStatsDashboard';

interface CloneChartProps {
  data: CloneData[];
  chartType: ChartType;
  dateRange: { start: string | null; end: string | null };
}

const chartConfig = {
  clones: {
    label: 'Clones',
    color: 'hsl(var(--chart-3))',
  },
  unique_cloners: {
    label: 'Unique Cloners',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function CloneChart({ data, chartType, dateRange }: CloneChartProps) {
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (dateRange.start) {
      filtered = filtered.filter((item) => item.date >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.date <= dateRange.end!);
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, dateRange]);

  const chartData = useMemo(
    () =>
      filteredData.map((item) => ({
        date: format(parseISO(item.date), 'MMM dd'),
        fullDate: item.date,
        clones: item.clones,
        unique_cloners: item.unique_cloners,
      })),
    [filteredData]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for the selected date range
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      {chartType === 'area' ? (
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="clones"
            stackId="1"
            stroke="var(--color-clones)"
            fill="var(--color-clones)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="unique_cloners"
            stackId="2"
            stroke="var(--color-unique_cloners)"
            fill="var(--color-unique_cloners)"
            fillOpacity={0.6}
          />
        </AreaChart>
      ) : chartType === 'line' ? (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="clones"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--chart-3))' }}
            activeDot={{ r: 6, fill: 'hsl(var(--chart-3))' }}
          />
          <Line
            type="monotone"
            dataKey="unique_cloners"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--chart-4))' }}
            activeDot={{ r: 6, fill: 'hsl(var(--chart-4))' }}
          />
        </LineChart>
      ) : (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="clones"
            fill="var(--color-clones)"
            radius={4}
          />
          <Bar
            dataKey="unique_cloners"
            fill="var(--color-unique_cloners)"
            radius={4}
          />
        </BarChart>
      )}
    </ChartContainer>
  );
}
