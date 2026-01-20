import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type RumData } from '@/hooks/use-rum-data';

import { type DataMode } from './ModeSelector';

interface AnalyticalInsightsProps {
  data: RumData;
  dateRange: { start: string | null; end: string | null };
  mode: DataMode;
}

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'info';
  text: string;
}

export function AnalyticalInsights({
  data,
  dateRange,
  mode,
}: AnalyticalInsightsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];

    if (mode === 'daily') {
      let traffic = [...data.traffic];
      let clones = [...data.clones];

      // Apply date filtering
      if (dateRange.start) {
        traffic = traffic.filter((item) => item.date >= dateRange.start!);
        clones = clones.filter((item) => item.date >= dateRange.start!);
      }
      if (dateRange.end) {
        traffic = traffic.filter((item) => item.date <= dateRange.end!);
        clones = clones.filter((item) => item.date <= dateRange.end!);
      }

      if (traffic.length === 0 && clones.length === 0) {
        return [];
      }

      // Sort by date
      traffic.sort((a, b) => a.date.localeCompare(b.date));
      clones.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate date range info
      const dates =
        traffic.length > 0
          ? traffic.map((t) => t.date)
          : clones.map((c) => c.date);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const dayCount =
        differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

      // 1. Traffic trend analysis
      if (traffic.length >= 2) {
        const firstHalf = traffic.slice(0, Math.floor(traffic.length / 2));
        const secondHalf = traffic.slice(Math.floor(traffic.length / 2));

        const firstHalfAvg =
          firstHalf.reduce((sum, item) => sum + item.views, 0) /
          firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, item) => sum + item.views, 0) /
          secondHalf.length;

        const trendChange =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (Math.abs(trendChange) > 10) {
          if (trendChange > 0) {
            result.push({
              type: 'positive',
              text: `Traffic is trending upward: average daily views increased by ${Math.round(trendChange)}% in the second half of the period.`,
            });
          } else {
            result.push({
              type: 'negative',
              text: `Traffic is trending downward: average daily views decreased by ${Math.round(Math.abs(trendChange))}% in the second half of the period.`,
            });
          }
        }
      }

      // 2. Peak day analysis
      if (traffic.length > 0) {
        const peakDay = traffic.reduce((max, item) =>
          item.views > max.views ? item : max
        );
        const avgViews =
          traffic.reduce((sum, item) => sum + item.views, 0) / traffic.length;

        if (peakDay.views > avgViews * 1.5) {
          const peakDate = format(parseISO(peakDay.date), 'MMM dd, yyyy');
          result.push({
            type: 'info',
            text: `Peak traffic day: ${peakDate} with ${peakDay.views.toLocaleString()} views (${Math.round((peakDay.views / avgViews - 1) * 100)}% above average).`,
          });
        }
      }

      // 3. Clone activity analysis
      if (clones.length > 0) {
        const totalClones = clones.reduce((sum, item) => sum + item.clones, 0);
        const avgClones = totalClones / clones.length;
        const peakCloneDay = clones.reduce((max, item) =>
          item.clones > max.clones ? item : max
        );

        if (peakCloneDay.clones > avgClones * 1.5) {
          const peakDate = format(parseISO(peakCloneDay.date), 'MMM dd, yyyy');
          result.push({
            type: 'info',
            text: `Highest clone activity: ${peakDate} with ${peakCloneDay.clones.toLocaleString()} clones (${Math.round((peakCloneDay.clones / avgClones - 1) * 100)}% above average).`,
          });
        }
      }

      // 4. Traffic vs Clones comparison
      if (traffic.length > 0 && clones.length > 0) {
        const totalViews = traffic.reduce((sum, item) => sum + item.views, 0);
        const totalClones = clones.reduce((sum, item) => sum + item.clones, 0);
        const viewsToClonesRatio = totalViews / totalClones;

        if (viewsToClonesRatio > 50) {
          result.push({
            type: 'info',
            text: `High engagement ratio: ${Math.round(viewsToClonesRatio)} views per clone, indicating strong interest but lower conversion to actual repository usage.`,
          });
        } else if (viewsToClonesRatio < 10) {
          result.push({
            type: 'positive',
            text: `Strong conversion: ${Math.round(viewsToClonesRatio)} views per clone, showing high intent to actually use the repositories.`,
          });
        }
      }

      // 5. Unique visitors trend
      if (traffic.length >= 2) {
        const firstHalf = traffic.slice(0, Math.floor(traffic.length / 2));
        const secondHalf = traffic.slice(Math.floor(traffic.length / 2));

        const firstHalfMaxVisitors = Math.max(
          ...firstHalf.map((item) => item.unique_visitors)
        );
        const secondHalfMaxVisitors = Math.max(
          ...secondHalf.map((item) => item.unique_visitors)
        );

        const visitorChange =
          ((secondHalfMaxVisitors - firstHalfMaxVisitors) /
            firstHalfMaxVisitors) *
          100;

        if (Math.abs(visitorChange) > 15) {
          if (visitorChange > 0) {
            result.push({
              type: 'positive',
              text: `Growing audience: peak unique visitors increased by ${Math.round(visitorChange)}% in the second half, indicating expanding reach.`,
            });
          } else {
            result.push({
              type: 'negative',
              text: `Declining audience: peak unique visitors decreased by ${Math.round(Math.abs(visitorChange))}% in the second half.`,
            });
          }
        }
      }

      // 6. Activity consistency
      if (traffic.length > 0) {
        const views = traffic.map((item) => item.views);
        const avg = views.reduce((sum, v) => sum + v, 0) / views.length;
        const variance =
          views.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
          views.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / avg) * 100;

        if (coefficientOfVariation < 30) {
          result.push({
            type: 'positive',
            text: `Consistent traffic: low variability (${Math.round(coefficientOfVariation)}%) indicates stable daily engagement patterns.`,
          });
        } else if (coefficientOfVariation > 70) {
          result.push({
            type: 'info',
            text: `Variable traffic: high variability (${Math.round(coefficientOfVariation)}%) suggests irregular or event-driven activity patterns.`,
          });
        }
      }

      // 7. Time period summary
      if (dayCount > 0) {
        const periodText =
          dayCount === 1
            ? 'single day'
            : dayCount <= 7
              ? `${dayCount} days`
              : dayCount <= 30
                ? `${Math.round(dayCount / 7)} weeks`
                : `${Math.round(dayCount / 30)} months`;

        result.push({
          type: 'info',
          text: `Analyzing ${periodText} of data from ${format(parseISO(startDate), 'MMM dd')} to ${format(parseISO(endDate), 'MMM dd, yyyy')}.`,
        });
      }
    } else {
      // Monthly mode insights
      const traffic = data.monthlyTraffic;
      const clones = data.monthlyClones;

      if (traffic.length === 0 && clones.length === 0) {
        return [];
      }

      // Sort by month
      traffic.sort((a, b) => a.month.localeCompare(b.month));
      clones.sort((a, b) => a.month.localeCompare(b.month));

      // 1. Monthly trend
      if (traffic.length >= 2) {
        const firstHalf = traffic.slice(0, Math.floor(traffic.length / 2));
        const secondHalf = traffic.slice(Math.floor(traffic.length / 2));

        const firstHalfAvg =
          firstHalf.reduce((sum, item) => sum + item.views, 0) /
          firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, item) => sum + item.views, 0) /
          secondHalf.length;

        const trendChange =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (Math.abs(trendChange) > 10) {
          if (trendChange > 0) {
            result.push({
              type: 'positive',
              text: `Monthly traffic trend: average monthly views increased by ${Math.round(trendChange)}% in recent months.`,
            });
          } else {
            result.push({
              type: 'negative',
              text: `Monthly traffic trend: average monthly views decreased by ${Math.round(Math.abs(trendChange))}% in recent months.`,
            });
          }
        }
      }

      // 2. Best performing month
      if (traffic.length > 0) {
        const bestMonth = traffic.reduce((max, item) =>
          item.views > max.views ? item : max
        );
        const avgViews =
          traffic.reduce((sum, item) => sum + item.views, 0) / traffic.length;

        if (bestMonth.views > avgViews * 1.2) {
          result.push({
            type: 'info',
            text: `Best performing month: ${bestMonth.month} with ${bestMonth.views.toLocaleString()} views (${Math.round((bestMonth.views / avgViews - 1) * 100)}% above average).`,
          });
        }
      }

      // 3. Data coverage
      result.push({
        type: 'info',
        text: `Analyzing ${traffic.length} months of aggregated data across all available repositories.`,
      });
    }

    return result;
  }, [data, dateRange, mode]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm"
            >
              {insight.type === 'positive' && (
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              )}
              {insight.type === 'negative' && (
                <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              {insight.type === 'info' && (
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
              {insight.type === 'neutral' && (
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-muted" />
              )}
              <p className="flex-1 leading-relaxed text-foreground">
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
