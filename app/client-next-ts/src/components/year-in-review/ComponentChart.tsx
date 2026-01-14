import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

export function ComponentChart() {
  const { componentActivity } = YEAR_IN_REVIEW_2025;

  const chartData = componentActivity.map((component) => ({
    name: component.name,
    commits: component.commits,
  }));

  const topComponent = componentActivity[0];

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-4 text-4xl font-bold">Component Spotlight</h2>
      <p className="mb-8 text-muted-foreground">
        {topComponent.name} received the most love in 2025 with{' '}
        {topComponent.commits} commits!
      </p>
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Commits per Component</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="commits" fill="var(--color-commits)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
