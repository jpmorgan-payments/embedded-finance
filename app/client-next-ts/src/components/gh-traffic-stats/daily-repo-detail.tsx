import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

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
import {
  BURST_CLONES_PER_CLONER,
  cloneBursts,
  gapsInRange,
  inRange,
  isCloneBurst,
  monthlyTotals,
  trailingMean,
  weekdayProfile,
  type DailyPoint,
  type MonthTotal,
  type RangeKey,
} from '@/lib/gh-metrics/derive';
import { formatDay, formatMonth, formatNumber } from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';

import {
  dayTickFormatter,
  GapNote,
  SegmentedControl,
  StatTile,
  tooltipDay,
} from './dashboard-ui';
import { ReferrerBreakdown } from './referrer-breakdown';

const viewsConfig = {
  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
  average: { label: '7-day average', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const clonesConfig = {
  clones: { label: 'Clones', color: 'hsl(var(--chart-2))' },
  cloners: { label: 'Unique cloners', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const weekdayConfig = {
  median: { label: 'Typical views', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const monthConfig = {
  value: { label: 'Total', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const BURST_COLOR = 'hsl(var(--chart-5))';

const MONTH_STATUS: Record<MonthTotal['status'], (m: MonthTotal) => string> = {
  complete: () => 'All days collected',
  partial: (m) => `${m.observedDays} of ${m.daysInMonth} days collected`,
  'in-progress': (m) => `In progress: ${m.observedDays} days so far`,
  'no-data': () => 'No data collected',
};

interface DailyRepoDetailProps {
  view: RepoView;
  daily: DailyPoint[];
  range: RangeKey;
}

export function DailyRepoDetail({ view, daily, range }: DailyRepoDetailProps) {
  const [monthMetric, setMonthMetric] = useState<'views' | 'clones'>('views');

  const days = useMemo(
    () => inRange(daily, range, view.lastDate),
    [daily, range, view.lastDate]
  );

  const viewRows = useMemo(() => {
    const average = trailingMean(daily, 'views');
    const byDate = new Map(daily.map((d, i) => [d.date, average[i]]));
    return days.map((d) => ({
      date: d.date,
      views: d.views,
      average: byDate.get(d.date) ?? null,
    }));
  }, [daily, days]);

  const stats = useMemo(() => {
    const collected = days.filter((d) => d.observed);
    const views = collected.reduce((sum, d) => sum + (d.views ?? 0), 0);
    const peak = collected.reduce<DailyPoint | null>(
      (best, d) => (!best || (d.views ?? 0) > (best.views ?? 0) ? d : best),
      null
    );
    return {
      collected: collected.length,
      views,
      perDay: collected.length ? views / collected.length : 0,
      peak,
      bursts: cloneBursts(days),
    };
  }, [days]);

  const weekdays = useMemo(() => weekdayProfile(days), [days]);
  const months = useMemo(() => monthlyTotals(daily), [daily]);
  const gaps = gapsInRange(view.gaps, range, view.lastDate);
  const burstShare = stats.bursts.totalClones
    ? Math.round((stats.bursts.burstClones / stats.bursts.totalClones) * 100)
    : 0;
  const noDataMonths = months.filter((m) => m.status === 'no-data');
  const tick = dayTickFormatter(days);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Views"
          value={formatNumber(stats.views)}
          detail={`${formatNumber(Math.round(stats.perDay))} a day on average`}
        />
        <StatTile
          label="Busiest day"
          value={stats.peak ? formatNumber(stats.peak.views ?? 0) : '—'}
          detail={stats.peak ? formatDay(stats.peak.date) : undefined}
        />
        <StatTile
          label="Clones"
          value={formatNumber(stats.bursts.totalClones)}
          detail={
            stats.bursts.days
              ? `${burstShare}% on ${stats.bursts.days} automation-heavy ${stats.bursts.days === 1 ? 'day' : 'days'}`
              : 'No automation-heavy days'
          }
        />
        <StatTile
          label="Days with data"
          value={`${formatNumber(stats.collected)} / ${formatNumber(days.length)}`}
          detail={
            days.length
              ? `${formatDay(days[0].date)} – ${formatDay(days[days.length - 1].date)}`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily views</CardTitle>
          <CardDescription>
            Page views per day, with a 7-day average to smooth out weekends.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ChartContainer
            config={viewsConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <ComposedChart data={viewRows} margin={{ left: 4, right: 12 }}>
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
              <Bar
                dataKey="views"
                fill="var(--color-views)"
                fillOpacity={0.55}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="var(--color-average)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
          <GapNote gaps={gaps} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Typical day of the week</CardTitle>
            <CardDescription>
              Median views per weekday over the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={weekdayConfig}
              className="aspect-auto h-[220px] w-full"
            >
              <BarChart data={weekdays} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis width={32} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="median" radius={4} isAnimationActive={false}>
                  {weekdays.map((w, i) => (
                    <Cell
                      key={w.day}
                      fill="var(--color-median)"
                      fillOpacity={i >= 5 ? 0.4 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Where visitors come from
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReferrerBreakdown summary={view.referrers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Monthly totals</CardTitle>
            <CardDescription>
              Every month since tracking began, added up from the daily counts.
              Lighter bars are months that were only partly collected or are
              still in progress.
            </CardDescription>
          </div>
          <SegmentedControl
            label="Monthly metric"
            value={monthMetric}
            onChange={setMonthMetric}
            options={[
              { value: 'views', label: 'Views' },
              { value: 'clones', label: 'Clones' },
            ]}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          <ChartContainer
            config={monthConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart
              data={months.map((m) => ({ ...m, value: m[monthMetric] }))}
              margin={{ left: 4, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={(m: string) =>
                  format(parseISO(`${m}-01`), 'MMM yy')
                }
                minTickGap={16}
                tickLine={false}
                axisLine={false}
              />
              <YAxis width={48} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={({ active, payload }) => {
                  const m = payload?.[0]?.payload as MonthTotal | undefined;
                  if (!active || !m) return null;
                  const value = m[monthMetric];
                  return (
                    <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                      <div className="font-medium">{formatMonth(m.month)}</div>
                      {value !== null && (
                        <div className="tabular-nums">
                          {formatNumber(value)} {monthMetric}
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        {MONTH_STATUS[m.status](m)}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={3} isAnimationActive={false}>
                {months.map((m) => (
                  <Cell
                    key={m.month}
                    fill={
                      monthMetric === 'views'
                        ? 'hsl(var(--chart-1))'
                        : 'hsl(var(--chart-2))'
                    }
                    fillOpacity={m.status === 'complete' ? 0.85 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          {noDataMonths.length > 0 && (
            <p className="text-xs text-muted-foreground">
              No data for{' '}
              {noDataMonths.map((m) => formatMonth(m.month)).join(', ')}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily clones</CardTitle>
          <CardDescription>
            Clones include CI pipelines and other automation. Orange bars mark
            days where each cloner averaged {BURST_CLONES_PER_CLONER} or more
            clones, which is unlikely to be people.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ChartContainer
            config={clonesConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <ComposedChart data={days} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={tick}
                minTickGap={32}
                tickLine={false}
                axisLine={false}
              />
              <YAxis width={48} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={tooltipDay} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="clones" isAnimationActive={false}>
                {days.map((d) => (
                  <Cell
                    key={d.date}
                    fill={isCloneBurst(d) ? BURST_COLOR : 'var(--color-clones)'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="cloners"
                stroke="var(--color-cloners)"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
          {stats.bursts.days > 0 && (
            <p className="text-xs text-muted-foreground">
              {stats.bursts.days} automation-heavy{' '}
              {stats.bursts.days === 1 ? 'day accounts' : 'days account'} for{' '}
              {formatNumber(stats.bursts.burstClones)} of{' '}
              {formatNumber(stats.bursts.totalClones)} clones ({burstShare}%) in
              this range.
            </p>
          )}
          <GapNote gaps={gaps} />
        </CardContent>
      </Card>
    </div>
  );
}
