import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';

import { daysBetween, type Gap, type RangeKey } from '@/lib/gh-metrics/derive';
import {
  formatChange,
  formatDay,
  formatShortDay,
  formatSpan,
} from '@/lib/gh-metrics/format';
import type { RepoId } from '@/lib/gh-metrics/sources';
import { cn } from '@/lib/utils';

export const REPO_COLORS: Record<RepoId, string> = {
  'embedded-finance': 'hsl(var(--chart-1))',
  'unicorn-finance': 'hsl(var(--chart-2))',
  ai: 'hsl(var(--chart-3))',
};

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All' },
];

export function dayTickFormatter(points: { date: string }[]) {
  const long =
    points.length > 1 &&
    daysBetween(points[0].date, points[points.length - 1].date) > 180;
  return (iso: string) =>
    long ? format(parseISO(iso), 'MMM yy') : formatShortDay(iso);
}

export function tooltipDay(value: unknown): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatDay(value)
    : String(value ?? '');
}

export function GapNote({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      No data collected for{' '}
      {gaps
        .map(
          (g) =>
            `${formatSpan(g.from, g.to)} (${g.days} ${g.days === 1 ? 'day' : 'days'})`
        )
        .join('; ')}
      . These days are left blank.
    </p>
  );
}

export function ChangeBadge({
  change,
  className,
}: {
  change: number | null;
  className?: string;
}) {
  if (change === null) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        no earlier window
      </span>
    );
  }
  const flat = Math.abs(change) < 0.05;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
        flat && 'bg-muted text-muted-foreground',
        !flat && change > 0 && 'bg-emerald-50 text-emerald-700',
        !flat && change < 0 && 'bg-rose-50 text-rose-700',
        className
      )}
      title="Change versus the previous 14 days"
    >
      {formatChange(change)}
    </span>
  );
}

export function StatTile({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border bg-card p-4', className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {detail && (
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      )}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-md border bg-muted p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
