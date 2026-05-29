import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

const chartConfig = {
  commits: {
    label: 'Commits',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function MonthlyActivityChart() {
  const { monthlyCommits } = YEAR_IN_REVIEW_2025;

  const chartData = monthlyCommits.map((month) => ({
    month: month.month,
    commits: month.commits,
  }));

  const busiestMonth = monthlyCommits.reduce((max, month) =>
    month.commits > max.commits ? month : max
  );
  const quietestMonth = monthlyCommits.reduce((min, month) =>
    month.commits < min.commits ? month : min
  );

  const getFullMonthName = (abbrev: string): string => {
    const monthMap: Record<string, string> = {
      Jan: 'January',
      Feb: 'February',
      Mar: 'March',
      Apr: 'April',
      May: 'May',
      Jun: 'June',
      Jul: 'July',
      Aug: 'August',
      Sep: 'September',
      Oct: 'October',
      Nov: 'November',
      Dec: 'December',
    };
    return monthMap[abbrev] || abbrev;
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-4 text-4xl font-bold">Monthly Rhythm</h2>
      <div className="mb-8 space-y-2 text-center text-muted-foreground">
        <p>
          {getFullMonthName(busiestMonth.month)} was your busiest month with{' '}
          {busiestMonth.commits} commits
        </p>
        <p>
          The December sprint added {monthlyCommits[11].commits} commits to
          close the year strong
        </p>
        <p>
          {getFullMonthName(quietestMonth.month)} was the quietest
          month—vacation time?
        </p>
      </div>
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Commit Activity by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="var(--color-commits)"
                fill="var(--color-commits)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
