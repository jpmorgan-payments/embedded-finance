import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function ContributorWall() {
  const { contributors } = YEAR_IN_REVIEW_2025;
  const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-12 text-4xl font-bold">Contributor Wall</h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contributors.map((contributor) => (
          <Card
            key={contributor.name}
            className="transition-all hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl">
                    {contributor.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{contributor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {contributor.commits.toLocaleString()} commits
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(contributor.commits / totalCommits) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {((contributor.commits / totalCommits) * 100).toFixed(1)}% of
                total commits
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
