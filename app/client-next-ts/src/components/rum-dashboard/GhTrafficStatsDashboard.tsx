import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRumData } from '@/hooks/use-rum-data';

import { AnalyticalInsights } from './AnalyticalInsights';
import { ChartTypeSelector } from './ChartTypeSelector';
import { CloneChart } from './CloneChart';
import { DataSources } from './DataSources';
import { DateRangePresets } from './DateRangePresets';
import { MetricsTable } from './MetricsTable';
import { ModeSelector, type DataMode } from './ModeSelector';
import { MonthlyAggregateChart } from './MonthlyAggregateChart';
import { ReferrerTable } from './ReferrerTable';
import { SummaryCards } from './SummaryCards';
import { TrafficChart } from './TrafficChart';
import { TrafficVsClonesChart } from './TrafficVsClonesChart';

export type ChartType = 'area' | 'line' | 'bar';
export type MetricType = 'traffic' | 'clones' | 'referrers';

export function GhTrafficStatsDashboard() {
  const { data, loading, error, loadData } = useRumData();
  const [mode, setMode] = useState<DataMode>('daily');
  const [chartType, setChartType] = useState<ChartType>('area');

  // Initialize with MTD (Month to Date) as default
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>(() => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    return {
      start: format(startOfCurrentMonth, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    };
  });

  const hasData = data !== null;

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            GH Traffic Stats
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore GitHub repository metrics from CSV files
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {hasData ? 'Reload Data' : 'Load Data'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Data
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Empty State */}
      {!hasData && !loading && !error && <DataSources />}

      {/* Dashboard Content */}
      {hasData && (
        <>
          {/* Mode Selector - VERY TOP */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Data Mode</CardTitle>
              <CardDescription>
                Select daily or monthly data view - this determines all charts
                and metrics below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeSelector selected={mode} onChange={setMode} />
            </CardContent>
          </Card>

          {/* Data Sources - Collapsible Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="data-sources">
              <AccordionTrigger>
                <CardTitle className="text-lg">Data Sources</CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <DataSources />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                {mode === 'daily'
                  ? 'Customize the data view'
                  : 'Monthly mode shows all data - date ranges do not apply'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`grid gap-4 ${mode === 'daily' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
              >
                <ChartTypeSelector
                  selected={chartType}
                  onChange={setChartType}
                />
                {mode === 'daily' && (
                  <DateRangePresets
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onChange={setDateRange}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analytical Insights */}
          <AnalyticalInsights data={data} dateRange={dateRange} mode={mode} />

          {/* Summary Cards */}
          <SummaryCards data={data} dateRange={dateRange} mode={mode} />

          {/* Charts - Daily Mode */}
          {mode === 'daily' && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Statistics</CardTitle>
                    <CardDescription>
                      Daily page views and unique visitors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrafficChart
                      data={data.traffic}
                      chartType={chartType}
                      dateRange={dateRange}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clone Statistics</CardTitle>
                    <CardDescription>
                      Daily repository clones and unique cloners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CloneChart
                      data={data.clones}
                      chartType={chartType}
                      dateRange={dateRange}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Traffic vs Clones Comparison</CardTitle>
                  <CardDescription>
                    Combined view of traffic and clone activity over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrafficVsClonesChart
                    trafficData={data.traffic}
                    cloneData={data.clones}
                    dateRange={dateRange}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referrer Statistics</CardTitle>
                  <CardDescription>
                    Traffic sources sorted by count (descending)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReferrerTable data={data.referrers} dateRange={dateRange} />
                </CardContent>
              </Card>
            </>
          )}

          {/* Charts - Monthly Mode */}
          {mode === 'monthly' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Traffic Statistics</CardTitle>
                  <CardDescription>
                    Monthly aggregated traffic data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyAggregateChart
                    trafficData={data.monthlyTraffic}
                    cloneData={[]}
                    chartType={chartType}
                    showClones={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Clone Statistics</CardTitle>
                  <CardDescription>
                    Monthly aggregated clone data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyAggregateChart
                    trafficData={[]}
                    cloneData={data.monthlyClones}
                    chartType={chartType}
                    showTraffic={false}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>
                Browse and filter the loaded data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsTable data={data} dateRange={dateRange} mode={mode} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
