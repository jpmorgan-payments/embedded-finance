import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YEAR_IN_REVIEW_2025 } from '@/data/year-in-review-2025';

function AnimatedCounter({
  value,
  duration = 2000,
  suffix = '',
  prefix = '',
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(startValue + (value - startValue) * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="text-4xl font-bold">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const cards = [
  {
    title: 'Commits Pushed',
    value: YEAR_IN_REVIEW_2025.headline.totalCommits,
    suffix: '',
  },
  {
    title: 'Versions Released',
    value: YEAR_IN_REVIEW_2025.headline.versionsReleased,
    suffix: '',
  },
  {
    title: 'Net Lines of Code',
    value: YEAR_IN_REVIEW_2025.headline.netLinesOfCode,
    prefix: '+',
    suffix: '',
  },
  {
    title: 'Files Touched',
    value: YEAR_IN_REVIEW_2025.headline.filesChanged,
    suffix: '',
  },
  {
    title: 'PRs Merged',
    value: YEAR_IN_REVIEW_2025.headline.prsMerged,
    suffix: '',
  },
  {
    title: 'Contributors',
    value: YEAR_IN_REVIEW_2025.headline.contributors,
    suffix: '',
  },
];

export function HighlightCards() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h2 className="mb-12 text-4xl font-bold">The Numbers</h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedCounter
                value={card.value}
                prefix={card.prefix || ''}
                suffix={card.suffix || ''}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
