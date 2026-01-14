import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

function getHeatmapColor(commits: number): string {
  if (commits === 0) return 'bg-muted';
  if (commits <= 5) return 'bg-primary/20';
  if (commits <= 10) return 'bg-primary/40';
  if (commits <= 15) return 'bg-primary/60';
  return 'bg-primary/80';
}

export function ContributionHeatmap() {
  const { contributionHeatmap } = YEAR_IN_REVIEW_2025;

  // Create a 52x7 grid (52 weeks, 7 days)
  const weeks = Array.from({ length: 52 }, (_, weekIndex) => {
    const weekData = contributionHeatmap.weeks[weekIndex];
    return Array.from({ length: 7 }, (_, dayIndex) => {
      // Distribute commits across the week (more on Wednesdays)
      const dayOfWeek = dayIndex;
      const isWednesday = dayOfWeek === 2;
      const baseCommits = Math.floor(weekData.commits / 7);
      const commits = isWednesday
        ? baseCommits + Math.floor(weekData.commits * 0.2)
        : baseCommits;
      return commits;
    });
  });

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-8 text-4xl font-bold">
        GitHub-Style Contribution Heatmap
      </h2>
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>365 Days of Continuous Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex flex-col gap-2 pr-4 text-xs text-muted-foreground">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((commits, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`h-3 w-3 rounded-sm ${getHeatmapColor(commits)}`}
                          title={`Week ${weekIndex + 1}, Day ${dayIndex + 1}: ${commits} commits`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-muted" />
                  <div className="h-3 w-3 rounded-sm bg-primary/20" />
                  <div className="h-3 w-3 rounded-sm bg-primary/40" />
                  <div className="h-3 w-3 rounded-sm bg-primary/60" />
                  <div className="h-3 w-3 rounded-sm bg-primary/80" />
                </div>
                <span>More</span>
              </div>
              <div>
                <p>Busiest day: {contributionHeatmap.busiestDay}</p>
                <p>
                  {contributionHeatmap.totalDaysWithCommits} days with commits
                </p>
                <p>Longest streak: {contributionHeatmap.longestStreak} days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
