import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function UXTestingJourney() {
  const { uxTesting } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-8 text-4xl font-bold">UX Testing & Quality Journey</h2>

      <div className="mb-8 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {uxTesting.sessions.map((session) => (
          <Card key={session.date}>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(parseISO(session.date), 'MMM dd, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Load Time:</span>{' '}
                  {session.avgLoadTime}ms
                </p>
                <p className="text-sm">
                  <span className="font-medium">Components:</span>{' '}
                  {session.componentsCount} ✅
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.findings}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Performance Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uxTesting.performanceRatings.map((rating) => (
              <div key={rating.component} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">
                  {rating.component}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < rating.rating
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {rating.loadTime}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <Badge variant="outline">
              {uxTesting.totalIssuesTracked}+ Issues Tracked
            </Badge>
            <span className="text-muted-foreground">
              All components load in &lt; 2 seconds
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
