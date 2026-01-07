import { useMemo } from 'react';
import { Eye, GitBranch, Globe, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type RumData } from '@/hooks/use-rum-data';
import { type DataMode } from './ModeSelector';

interface SummaryCardsProps {
  data: RumData;
  dateRange: { start: string | null; end: string | null };
  mode: DataMode;
}

export function SummaryCards({ data, dateRange, mode }: SummaryCardsProps) {
  const stats = useMemo(() => {
    if (mode === 'daily') {
      let traffic = data.traffic;
      let clones = data.clones;
      let referrers = data.referrers;

      if (dateRange.start) {
        traffic = traffic.filter((item) => item.date >= dateRange.start!);
        clones = clones.filter((item) => item.date >= dateRange.start!);
        referrers = referrers.filter((item) => item.date >= dateRange.start!);
      }
      if (dateRange.end) {
        traffic = traffic.filter((item) => item.date <= dateRange.end!);
        clones = clones.filter((item) => item.date <= dateRange.end!);
        referrers = referrers.filter((item) => item.date <= dateRange.end!);
      }

      const totalViews = traffic.reduce((sum, item) => sum + item.views, 0);
      // Unique visitors: get max unique visitors per day, not sum
      const totalUniqueVisitors = Math.max(
        ...traffic.map((item) => item.unique_visitors),
        0
      );

      const totalClones = clones.reduce((sum, item) => sum + item.clones, 0);
      // Unique cloners: get max unique cloners per day, not sum
      const totalUniqueCloners = Math.max(
        ...clones.map((item) => item.unique_cloners),
        0
      );
      const uniqueReferrers = new Set(referrers.map((item) => item.referrer))
        .size;

      // Calculate averages
      const avgViews = traffic.length > 0 ? totalViews / traffic.length : 0;
      const avgClones = clones.length > 0 ? totalClones / clones.length : 0;

      return {
        totalViews,
        totalUniqueVisitors,
        totalClones,
        totalUniqueCloners,
        uniqueReferrers,
        avgViews,
        avgClones,
      };
    } else {
      // Monthly mode - show all data, no date filtering
      const traffic = data.monthlyTraffic;
      const clones = data.monthlyClones;

      const totalViews = traffic.reduce((sum, item) => sum + item.views, 0);
      const totalUniqueVisitors = Math.max(
        ...traffic.map((item) => item.unique_visitors),
        0
      );
      const totalClones = clones.reduce((sum, item) => sum + item.clones, 0);
      const totalUniqueCloners = Math.max(
        ...clones.map((item) => item.unique_cloners),
        0
      );

      const avgViews = traffic.length > 0 ? totalViews / traffic.length : 0;
      const avgClones = clones.length > 0 ? totalClones / clones.length : 0;

      return {
        totalViews,
        totalUniqueVisitors,
        totalClones,
        totalUniqueCloners,
        uniqueReferrers: 0,
        avgViews,
        avgClones,
      };
    }
  }, [data, dateRange, mode]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalViews.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: {Math.round(stats.avgViews).toLocaleString()} per day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUniqueVisitors.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Peak unique visitors ({mode === 'daily' ? 'per day' : 'per month'})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clones</CardTitle>
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalClones.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: {Math.round(stats.avgClones).toLocaleString()} per day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Cloners</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUniqueCloners.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Peak unique cloners ({mode === 'daily' ? 'per day' : 'per month'})
          </p>
        </CardContent>
      </Card>

      {mode === 'daily' && stats.uniqueReferrers > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Referrers
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.uniqueReferrers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Different traffic sources
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
