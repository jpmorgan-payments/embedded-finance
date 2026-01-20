import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function VersionTimeline() {
  const { versionJourney } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-12 text-4xl font-bold">Version Journey</h2>
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>
            From {versionJourney.start} to {versionJourney.end}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted" />

            {/* Milestones */}
            <div className="relative flex justify-between">
              {versionJourney.milestones.map((milestone) => (
                <div
                  key={milestone.version}
                  className="relative flex flex-col items-center"
                >
                  <div className="relative z-10 rounded-full bg-primary p-3">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {milestone.version}
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.date}
                    </p>
                  </div>
                </div>
              ))}
              <div className="relative flex flex-col items-center">
                <div className="relative z-10 rounded-full bg-primary p-3">
                  <span className="text-sm font-semibold text-primary-foreground">
                    v1.0.0
                  </span>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">2026</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
