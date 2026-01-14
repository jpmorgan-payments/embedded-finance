import { useEffect, useState } from 'react';

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
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function HeroSection() {
  const { headline } = YEAR_IN_REVIEW_2025;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 text-center">
      <div className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          2025: A Year of Building
        </h1>
        <p className="text-xl text-muted-foreground md:text-2xl">
          <AnimatedCounter value={headline.totalCommits} /> commits.{' '}
          <AnimatedCounter value={headline.versionsReleased} /> versions.{' '}
          <AnimatedCounter value={headline.contributors} /> contributors. One
          mission.
        </p>
        <p className="text-lg text-muted-foreground md:text-xl">
          The Embedded Components library grew up in 2025.
        </p>
      </div>
    </div>
  );
}
