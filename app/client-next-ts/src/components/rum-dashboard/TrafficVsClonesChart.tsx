import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { type TrafficData, type CloneData } from '@/lib/csv-parser';

interface TrafficVsClonesChartProps {
  trafficData: TrafficData[];
  cloneData: CloneData[];
  dateRange: { start: string | null; end: string | null };
}

const chartConfig = {
  traffic: {
    label: 'Traffic (Views)',
    color: 'hsl(var(--chart-1))',
  },
  clones: {
    label: 'Clones',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function TrafficVsClonesChart({
  trafficData,
  cloneData,
  dateRange,
}: TrafficVsClonesChartProps) {
  const chartData = useMemo(() => {
    let filteredTraffic = [...trafficData];
    let filteredClones = [...cloneData];

    if (dateRange.start) {
      filteredTraffic = filteredTraffic.filter(
        (item) => item.date >= dateRange.start!
      );
      filteredClones = filteredClones.filter(
        (item) => item.date >= dateRange.start!
      );
    }
    if (dateRange.end) {
      filteredTraffic = filteredTraffic.filter(
        (item) => item.date <= dateRange.end!
      );
      filteredClones = filteredClones.filter(
        (item) => item.date <= dateRange.end!
      );
    }

    // Create a map of dates to combine data
    const dateMap = new Map<
      string,
      { date: string; traffic: number; clones: number }
    >();

    for (const item of filteredTraffic) {
      const existing = dateMap.get(item.date) || {
        date: item.date,
        traffic: 0,
        clones: 0,
      };
      existing.traffic += item.views;
      dateMap.set(item.date, existing);
    }

    for (const item of filteredClones) {
      const existing = dateMap.get(item.date) || {
        date: item.date,
        traffic: 0,
        clones: 0,
      };
      existing.clones += item.clones;
      dateMap.set(item.date, existing);
    }

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: format(parseISO(item.date), 'MMM dd'),
        fullDate: item.date,
        traffic: item.traffic,
        clones: item.clones,
      }));
  }, [trafficData, cloneData, dateRange]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for the selected date range
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="traffic"
          stroke="var(--color-traffic)"
          fill="var(--color-traffic)"
          fillOpacity={0.6}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="clones"
          stroke="var(--color-clones)"
          fill="var(--color-clones)"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  );
}

