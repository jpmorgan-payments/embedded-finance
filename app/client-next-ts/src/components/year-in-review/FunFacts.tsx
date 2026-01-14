import { Card, CardContent } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

export function FunFacts() {
  const { funFacts } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-12 text-4xl font-bold">Fun Facts & Insights</h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {funFacts.map((fact, index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <span className="text-4xl">{fact.emoji}</span>
              <p className="text-sm">{fact.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
