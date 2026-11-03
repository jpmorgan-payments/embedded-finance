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
  weekdayProfile,
  type DailyPoint,
  type MonthTotal,
  type RangeKey,
} from '@/lib/gh-metrics/derive';
import {
  formatDay,
  formatMonth,
  formatNumber,
  formatSpan,
  formatWeek,
} from '@/lib/gh-metrics/format';
import type { RepoView } from '@/lib/gh-metrics/repo-view';
import {
  weeklyTotals,
  weekOverWeek,
  type WeekTotal,
} from '@/lib/gh-metrics/weekly';

import { CalendarHeatmap } from './calendar-heatmap';
import {
  AUTOMATION_COLOR,
  ChangeBadge,
  compactTick,
  dayTickFormatter,
  gapBands,
  GapNote,
  REPO_COLORS,
  SECONDARY_INK,
  SegmentedControl,
  StatTile,
  tooltipDay,
} from './dashboard-ui';
import { ChartCard, ProvenanceLine, SLOT } from './detail-layout';
import { referrerBasis, ReferrerBreakdown } from './referrer-breakdown';
import { WeekTable, type WeekTableRow } from './week-table';

const COLOR = REPO_COLORS['embedded-finance'];

const viewsConfig = {
  views: { label: 'Views', color: COLOR },
  visitors: { label: 'Unique visitors that day', color: SECONDARY_INK },
} satisfies ChartConfig;

const clonesConfig = {
  clones: { label: 'Clones', color: COLOR },
  automation: { label: 'Automation-heavy day', color: AUTOMATION_COLOR },
  cloners: { label: 'Unique cloners that day', color: SECONDARY_INK },
} satisfies ChartConfig;

const weekdayConfig = {
  median: { label: 'Typical views', color: COLOR },
} satisfies ChartConfig;

const totalsConfig = {
  views: { label: 'Views', color: COLOR },
} satisfies ChartConfig;

const MONTH_STATUS: Record<MonthTotal['status'], (m: MonthTotal) => string> = {
  complete: () => 'All days collected',
  partial: (m) => `${m.observedDays} of ${m.daysInMonth} days collected`,
  'in-progress': (m) => `In progress: ${m.observedDays} days so far`,
  'no-data': () => 'No data collected',
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface DailyRepoDetailProps {
  view: RepoView;
  daily: DailyPoint[];
  range: RangeKey;
}

export function DailyRepoDetail({ view, daily, range }: DailyRepoDetailProps) {
  const [grain, setGrain] = useState<'week' | 'month'>('week');

  const days = useMemo(
    () => inRange(daily, range, view.lastDate),
    [daily, range, view.lastDate]
  );
  const weeks = useMemo(() => weeklyTotals(daily), [daily]);
  const months = useMemo(() => monthlyTotals(daily), [daily]);
  const weekdays = useMemo(() => weekdayProfile(days), [days]);
  const gaps = gapsInRange(view.gaps, range, view.lastDate);
  const tick = dayTickFormatter(days);

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
      visitorsPerDay: median(collected.map((d) => d.visitors ?? 0)),
      peak,
      bursts: cloneBursts(days),
    };
  }, [days]);
  const burstShare = stats.bursts.totalClones
    ? Math.round((stats.bursts.burstClones / stats.bursts.totalClones) * 100)
    : 0;

  const weekRows = useMemo(() => toWeekRows(weeks).slice(0, 8), [weeks]);

  const totals = useMemo(() => {
    if (grain === 'month') {
      return months.map((m) => ({
        key: m.month,
        views: m.views,
        faded: m.status !== 'complete',
        tooltip: [
          formatMonth(m.month),
          m.views === null ? null : `${formatNumber(m.views)} views`,
          m.clones === null ? null : `${formatNumber(m.clones)} clones`,
          MONTH_STATUS[m.status](m),
        ],
      }));
    }
    return inRange(
      weeks.map((w) => ({ ...w, date: w.end })),
      range === '30d' ? '90d' : range,
      weeks[weeks.length - 1]?.end ?? view.lastDate
    ).map((w) => ({
      key: w.start,
      views: w.observedDays ? w.views : null,
      faded: !w.complete,
      tooltip: [
        `Week of ${formatSpan(w.start, w.end)}`,
        `${formatNumber(w.views)} views · ${formatNumber(w.clones)} clones`,
        w.inProgress
          ? `In progress: ${w.observedDays} days so far`
          : `${w.observedDays} of 7 days collected`,
      ],
    }));
  }, [grain, months, weeks, range, view.lastDate]);

  const calendarCells = useMemo(
    () => daily.map((d) => ({ date: d.date, value: d.views })),
    [daily]
  );
  const cloneRows = useMemo(
    () =>
      days.map((d) => ({
        ...d,
        clones: d.clones !== null && !isCloneBurst(d) ? d.clones : null,
        automation: d.clones !== null && isCloneBurst(d) ? d.clones : null,
      })),
    [days]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Views"
          value={formatNumber(stats.views)}
          detail={`${formatNumber(Math.round(stats.perDay))} a day on average`}
        />
        <StatTile
          label="Visitors / day"
          value={
            stats.visitorsPerDay === null
              ? '—'
              : formatNumber(Math.round(stats.visitorsPerDay))
          }
          detail="Median unique visitors on a day"
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
      </div>
      <ProvenanceLine>
        Daily counts · {formatNumber(stats.collected)} of{' '}
        {formatNumber(days.length)} days collected in this range ·{' '}
        {formatNumber(view.collectedDays)} of {formatNumber(view.spanDays)}{' '}
        since {formatDay(view.firstDate)}
      </ProvenanceLine>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Week by week"
          description="Monday to Sunday, newest first. The current week is lighter until it ends."
          bodyHeight={SLOT.week}
        >
          <WeekTable
            caption="embedded-finance views per week"
            color={COLOR}
            columns={[
              { key: 'views', label: 'Views' },
              { key: 'change', label: 'vs prior week' },
              {
                key: 'visitors',
                label: 'Visitors/day',
                title: 'Median unique visitors per day',
              },
              { key: 'clones', label: 'Clones' },
            ]}
            rows={weekRows}
          />
        </ChartCard>

        <ChartCard
          title={grain === 'week' ? 'Weekly views' : 'Monthly views'}
          description={
            grain === 'week'
              ? 'Total views per calendar week. Lighter bars: weeks not fully collected or still in progress.'
              : 'Every month since tracking began. Lighter bars: months partly collected or in progress.'
          }
          bodyHeight={SLOT.week}
          action={
            <SegmentedControl
              label="Totals period"
              value={grain}
              onChange={setGrain}
              options={[
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
              ]}
            />
          }
        >
          <ChartContainer
            config={totalsConfig}
            className="aspect-auto h-full w-full"
          >
            <BarChart
              data={totals}
              margin={{ left: 4, right: 12, top: 8 }}
              barCategoryGap="22%"
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="key"
                tickFormatter={(k: string) =>
                  grain === 'month'
                    ? format(parseISO(`${k}-01`), 'MMM yy')
                    : format(parseISO(k), 'MMM d')
                }
                minTickGap={16}
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
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as
                    (typeof totals)[number] | undefined;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                      {row.tooltip.filter(Boolean).map((line, i) => (
                        <div
                          key={line}
                          className={
                            i === 0
                              ? 'font-medium'
                              : 'tabular-nums text-muted-foreground'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="views"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                isAnimationActive={false}
              >
                {totals.map((t) => (
                  <Cell
                    key={t.key}
                    fill={COLOR}
                    fillOpacity={t.faded ? 0.35 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Daily views and visitors"
        description="Page views per day with that day's unique visitors. Shaded bands are days the collector didn't run."
        bodyHeight={SLOT.daily}
        footnote={<GapNote gaps={gaps} />}
      >
        <ChartContainer
          config={viewsConfig}
          className="aspect-auto h-full w-full"
        >
          <ComposedChart data={days} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            {gapBands(gaps, days)}
            <XAxis
              dataKey="date"
              tickFormatter={tick}
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
            <Bar
              dataKey="views"
              fill="var(--color-views)"
              fillOpacity={0.8}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="var(--color-visitors)"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Daily views, last 12 months"
        description="Each square is a day, Monday on top. Darker means more views; hatched days weren't collected."
      >
        <CalendarHeatmap
          cells={calendarCells}
          end={view.lastDate}
          unit="views"
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Typical day of the week"
          description="Median views per weekday over the selected range. Weekends are lighter."
          bodyHeight={SLOT.side}
        >
          <ChartContainer
            config={weekdayConfig}
            className="aspect-auto h-full w-full"
          >
            <BarChart
              data={weekdays}
              margin={{ left: 4, right: 12, top: 8 }}
              barCategoryGap="28%"
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis width={32} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar
                dataKey="median"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {weekdays.map((w, i) => (
                  <Cell
                    key={w.day}
                    fill="var(--color-median)"
                    fillOpacity={i >= 5 ? 0.4 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Where visitors come from"
          description={referrerBasis(view.referrers)}
          bodyHeight={SLOT.side}
        >
          <ReferrerBreakdown summary={view.referrers} />
        </ChartCard>
      </div>

      <ChartCard
        title="Daily clones"
        description={`Clones include CI and other automation. Days where each cloner averaged ${BURST_CLONES_PER_CLONER}+ clones are marked automation-heavy.`}
        bodyHeight={SLOT.clones}
        footnote={
          <p className="h-4 truncate text-xs text-muted-foreground">
            {stats.bursts.days > 0
              ? `${stats.bursts.days} automation-heavy ${stats.bursts.days === 1 ? 'day accounts' : 'days account'} for ${formatNumber(stats.bursts.burstClones)} of ${formatNumber(stats.bursts.totalClones)} clones (${burstShare}%) in this range.`
              : 'No automation-heavy days in this range.'}
          </p>
        }
      >
        <ChartContainer
          config={clonesConfig}
          className="aspect-auto h-full w-full"
        >
          <ComposedChart
            data={cloneRows}
            margin={{ left: 4, right: 12, top: 8 }}
          >
            <CartesianGrid vertical={false} />
            {gapBands(gaps, cloneRows)}
            <XAxis
              dataKey="date"
              tickFormatter={tick}
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
            <Bar
              dataKey="clones"
              stackId="clones"
              fill="var(--color-clones)"
              fillOpacity={0.8}
              isAnimationActive={false}
            />
            <Bar
              dataKey="automation"
              stackId="clones"
              fill="var(--color-automation)"
              isAnimationActive={false}
            />
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
      </ChartCard>
    </div>
  );
}

function toWeekRows(weeks: WeekTotal[]): WeekTableRow[] {
  const rows: WeekTableRow[] = [];
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    const w = weeks[i];
    const change = weekOverWeek(weeks, i);
    const label = w.inProgress
      ? `This week · ${w.observedDays}d`
      : formatWeek(w.start, w.end);
    rows.push({
      id: w.start,
      label,
      bar: w.observedDays ? w.views : null,
      muted: !w.complete,
      cells: {
        views: w.observedDays ? formatNumber(w.views) : '—',
        change: w.inProgress ? (
          <span className="text-xs text-muted-foreground">in progress</span>
        ) : !w.complete ? (
          <span className="text-xs text-muted-foreground">
            {w.observedDays}/7 days
          </span>
        ) : (
          <ChangeBadge
            change={change}
            title="Change versus the previous week"
            empty="—"
          />
        ),
        visitors:
          w.visitorsPerDay === null
            ? '—'
            : formatNumber(Math.round(w.visitorsPerDay)),
        clones: w.observedDays ? (
          <span>
            {formatNumber(w.clones)}
            {w.automationDays > 0 && (
              <span
                className="ml-1 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: AUTOMATION_COLOR }}
                title={`${w.automationDays} automation-heavy ${w.automationDays === 1 ? 'day' : 'days'}`}
              />
            )}
          </span>
        ) : (
          '—'
        ),
      },
    });
  }
  return rows;
}
