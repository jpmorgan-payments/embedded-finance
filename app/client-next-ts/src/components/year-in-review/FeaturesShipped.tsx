import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function FeaturesShipped() {
  const { featuresShipped } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-12 text-4xl font-bold">Features Shipped</h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuresShipped.map((feature) => (
          <Card key={`${feature.date}-${feature.title}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <Badge variant="outline" className="ml-2">
                  PR #{feature.pr}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(feature.date), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm font-medium">{feature.component}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
