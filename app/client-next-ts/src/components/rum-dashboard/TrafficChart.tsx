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
import { type TrafficData } from '@/lib/csv-parser';

import { type ChartType } from './GhTrafficStatsDashboard';

interface TrafficChartProps {
  data: TrafficData[];
  chartType: ChartType;
  dateRange: { start: string | null; end: string | null };
}

const chartConfig = {
  views: {
    label: 'Views',
    color: 'hsl(var(--chart-1))',
  },
  unique_visitors: {
    label: 'Unique Visitors',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function TrafficChart({
  data,
  chartType,
  dateRange,
}: TrafficChartProps) {
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
        views: item.views,
        unique_visitors: item.unique_visitors,
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
            dataKey="views"
            stackId="1"
            stroke="var(--color-views)"
            fill="var(--color-views)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="unique_visitors"
            stackId="2"
            stroke="var(--color-unique_visitors)"
            fill="var(--color-unique_visitors)"
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
            dataKey="views"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
            activeDot={{ r: 6, fill: 'hsl(var(--chart-1))' }}
          />
          <Line
            type="monotone"
            dataKey="unique_visitors"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--chart-2))' }}
            activeDot={{ r: 6, fill: 'hsl(var(--chart-2))' }}
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
            dataKey="views"
            fill="var(--color-views)"
            radius={4}
          />
          <Bar
            dataKey="unique_visitors"
            fill="var(--color-unique_visitors)"
            radius={4}
          />
        </BarChart>
      )}
    </ChartContainer>
  );
}
