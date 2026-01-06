import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRumData } from '@/hooks/use-rum-data';

import { ChartTypeSelector } from './ChartTypeSelector';
import { CloneChart } from './CloneChart';
import { DataSources } from './DataSources';
import { DateRangeFilter } from './DateRangeFilter';
import { ExportButton } from './ExportButton';
import { MetricSelector } from './MetricSelector';
import { MetricsTable } from './MetricsTable';
import { ModeSelector, type DataMode } from './ModeSelector';
import { MonthlyAggregateChart } from './MonthlyAggregateChart';
import { ReferrerChart } from './ReferrerChart';
import { ReferrerPieChart } from './ReferrerPieChart';
import { SummaryCards } from './SummaryCards';
import { TrafficChart } from './TrafficChart';
import { TrafficVsClonesChart } from './TrafficVsClonesChart';

export type ChartType = 'area' | 'line' | 'bar';
export type MetricType = 'traffic' | 'clones' | 'referrers';

export function RumDashboard() {
  const { data, loading, error, loadData } = useRumData();
  const [mode, setMode] = useState<DataMode>('daily');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    'traffic',
    'clones',
  ]);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });

  const hasData = data !== null;

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            RUM Data Exploration Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore GitHub repository metrics from CSV files
          </p>
        </div>
        <div className="flex gap-2">
          {hasData && <ExportButton data={data} />}
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
          {/* Data Sources */}
          <DataSources />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Customize the data view</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <ModeSelector selected={mode} onChange={setMode} />
                <MetricSelector
                  selected={selectedMetrics}
                  onChange={setSelectedMetrics}
                />
                <ChartTypeSelector
                  selected={chartType}
                  onChange={setChartType}
                />
                <DateRangeFilter
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onChange={setDateRange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <SummaryCards data={data} dateRange={dateRange} mode={mode} />

          {/* Charts - Daily Mode */}
          {mode === 'daily' && (
            <div className="grid gap-6 md:grid-cols-2">
              {selectedMetrics.includes('traffic') && (
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
              )}

              {selectedMetrics.includes('clones') && (
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
              )}

              {selectedMetrics.includes('referrers') && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Referrer Statistics</CardTitle>
                      <CardDescription>
                        Traffic sources and referrers (Bar Chart)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ReferrerChart data={data.referrers} dateRange={dateRange} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Referrers Distribution</CardTitle>
                      <CardDescription>
                        Top 5 referrers by traffic (Pie Chart)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ReferrerPieChart data={data.referrers} dateRange={dateRange} />
                    </CardContent>
                  </Card>
                </>
              )}
              {selectedMetrics.includes('traffic') &&
                selectedMetrics.includes('clones') && (
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
                )}
            </div>
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
              <MetricsTable
                data={data}
                dateRange={dateRange}
                selectedMetrics={selectedMetrics}
                mode={mode}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
