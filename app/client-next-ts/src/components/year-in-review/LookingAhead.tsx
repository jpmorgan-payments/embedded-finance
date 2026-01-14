import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function LookingAhead() {
  const { lookingAhead, componentStatus } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-8 text-4xl font-bold">Looking Ahead - 2026 Preview</h2>

      <Card className="mb-8 w-full max-w-4xl">
        <CardHeader>
          <CardTitle>The Road to v1.0.0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            The library is working towards its first production-ready release.
            Version 1.0.0 will mark components as stable and ready for
            production use.
          </p>
          <div className="space-y-2">
            {lookingAhead.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {componentStatus.stable.map((component) => (
                <Badge key={component} variant="default" className="mr-2">
                  {component}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">In Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {componentStatus.inTesting.map((component) => (
                <Badge key={component} variant="secondary" className="mr-2">
                  {component}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deprecated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {componentStatus.deprecated.map((component) => (
                <Badge key={component} variant="outline" className="mr-2">
                  {component}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
