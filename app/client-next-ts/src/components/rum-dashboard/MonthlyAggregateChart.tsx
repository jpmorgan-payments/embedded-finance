import { useMemo } from 'react';
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
import {
  type MonthlyCloneData,
  type MonthlyTrafficData,
} from '@/lib/csv-parser';

import { type ChartType } from './RumDashboard';

interface MonthlyAggregateChartProps {
  trafficData: MonthlyTrafficData[];
  cloneData: MonthlyCloneData[];
  chartType: ChartType;
  showTraffic?: boolean;
  showClones?: boolean;
}

const chartConfig = {
  traffic_views: {
    label: 'Traffic Views',
    color: 'hsl(var(--chart-1))',
  },
  traffic_visitors: {
    label: 'Traffic Visitors',
    color: 'hsl(var(--chart-2))',
  },
  clone_clones: {
    label: 'Clones',
    color: 'hsl(var(--chart-3))',
  },
  clone_cloners: {
    label: 'Cloners',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function MonthlyAggregateChart({
  trafficData,
  cloneData,
  chartType,
  showTraffic = true,
  showClones = true,
}: MonthlyAggregateChartProps) {
  const chartData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        month: string;
        traffic_views: number;
        traffic_visitors: number;
        clone_clones: number;
        clone_cloners: number;
      }
    >();

    if (showTraffic) {
      for (const item of trafficData) {
        const existing = monthMap.get(item.month) || {
          month: item.month,
          traffic_views: 0,
          traffic_visitors: 0,
          clone_clones: 0,
          clone_cloners: 0,
        };
        existing.traffic_views += item.views;
        existing.traffic_visitors += item.unique_visitors;
        monthMap.set(item.month, existing);
      }
    }

    if (showClones) {
      for (const item of cloneData) {
        const existing = monthMap.get(item.month) || {
          month: item.month,
          traffic_views: 0,
          traffic_visitors: 0,
          clone_clones: 0,
          clone_cloners: 0,
        };
        existing.clone_clones += item.clones;
        existing.clone_cloners += item.unique_cloners;
        monthMap.set(item.month, existing);
      }
    }

    return Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [trafficData, cloneData, showTraffic, showClones]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No monthly data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      {chartType === 'area' ? (
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {showTraffic && (
            <>
              <Area
                type="monotone"
                dataKey="traffic_views"
                stackId="traffic"
                stroke="var(--color-traffic_views)"
                fill="var(--color-traffic_views)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="traffic_visitors"
                stackId="traffic"
                stroke="var(--color-traffic_visitors)"
                fill="var(--color-traffic_visitors)"
                fillOpacity={0.6}
              />
            </>
          )}
          {showClones && (
            <>
              <Area
                type="monotone"
                dataKey="clone_clones"
                stackId="clones"
                stroke="var(--color-clone_clones)"
                fill="var(--color-clone_clones)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="clone_cloners"
                stackId="clones"
                stroke="var(--color-clone_cloners)"
                fill="var(--color-clone_cloners)"
                fillOpacity={0.6}
              />
            </>
          )}
        </AreaChart>
      ) : chartType === 'line' ? (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {showTraffic && (
            <>
              <Line
                type="monotone"
                dataKey="traffic_views"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
                activeDot={{ r: 6, fill: 'hsl(var(--chart-1))' }}
              />
              <Line
                type="monotone"
                dataKey="traffic_visitors"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--chart-2))' }}
                activeDot={{ r: 6, fill: 'hsl(var(--chart-2))' }}
              />
            </>
          )}
          {showClones && (
            <>
              <Line
                type="monotone"
                dataKey="clone_clones"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--chart-3))' }}
                activeDot={{ r: 6, fill: 'hsl(var(--chart-3))' }}
              />
              <Line
                type="monotone"
                dataKey="clone_cloners"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--chart-4))' }}
                activeDot={{ r: 6, fill: 'hsl(var(--chart-4))' }}
              />
            </>
          )}
        </LineChart>
      ) : (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {showTraffic && (
            <>
              <Bar
                dataKey="traffic_views"
                fill="var(--color-traffic_views)"
                radius={4}
              />
              <Bar
                dataKey="traffic_visitors"
                fill="var(--color-traffic_visitors)"
                radius={4}
              />
            </>
          )}
          {showClones && (
            <>
              <Bar
                dataKey="clone_clones"
                fill="var(--color-clone_clones)"
                radius={4}
              />
              <Bar
                dataKey="clone_cloners"
                fill="var(--color-clone_cloners)"
                radius={4}
              />
            </>
          )}
        </BarChart>
      )}
    </ChartContainer>
  );
}
