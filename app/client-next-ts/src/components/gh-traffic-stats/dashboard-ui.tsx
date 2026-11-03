import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { ReferenceArea } from 'recharts';

import { daysBetween, type Gap, type RangeKey } from '@/lib/gh-metrics/derive';
import {
  formatChange,
  formatCompact,
  formatDay,
  formatShortDay,
  formatSpan,
} from '@/lib/gh-metrics/format';
import type { RepoId } from '@/lib/gh-metrics/sources';
import { cn } from '@/lib/utils';

/**
 * One hue per repository, used everywhere that repository appears. Validated
 * as a set (lightness band, chroma, colorblind and normal-vision separation);
 * aqua sits below 3:1 on white, so every chart that uses it also has direct
 * labels or a table.
 */
export const REPO_COLORS: Record<RepoId, string> = {
  'embedded-finance': '#2a78d6',
  'unicorn-finance': '#eb6834',
  ai: '#1baf7a',
};

/** Neutral ink for secondary series (uniques next to totals). */
export const SECONDARY_INK = '#52514e';

/** Days the collector missed: a light neutral band, never a value color. */
export const NO_DATA_FILL = '#e1e0d9';

/** Reserved status color for automation-heavy clone days (always labeled). */
export const AUTOMATION_COLOR = '#ec835a';

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

/**
 * Always renders exactly one line so a chart card keeps its height when the
 * range changes; the full list is in the tooltip when it doesn't fit.
 */
export function GapNote({ gaps }: { gaps: Gap[] }) {
  const text =
    gaps.length === 0
      ? 'Every day in this range was collected.'
      : `No data for ${gaps
          .map(
            (g) =>
              `${formatSpan(g.from, g.to)} (${g.days} ${g.days === 1 ? 'day' : 'days'})`
          )
          .join('; ')}. Shaded and left blank, never shown as zero.`;
  return (
    <p className="h-4 truncate text-xs text-muted-foreground" title={text}>
      {text}
    </p>
  );
}

export function compactTick(value: number) {
  return formatCompact(value);
}

/** A placeholder with the exact footprint of the block it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  );
}

export function ChangeBadge({
  change,
  className,
  title = 'Change versus the previous 14 days',
  empty = 'no earlier window',
}: {
  change: number | null;
  className?: string;
  title?: string;
  empty?: string;
}) {
  if (change === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center py-0.5 text-xs text-muted-foreground',
          className
        )}
      >
        {empty}
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
      title={title}
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
    <div className={cn('h-full rounded-md border bg-card p-4', className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 flex h-5 items-center truncate text-xs text-muted-foreground">
        {detail}
      </div>
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

/**
 * Light neutral bands over days the collector missed, clamped to the plotted
 * range. A function, not a component: Recharts 2 only draws its own child
 * types, so the elements must be returned directly.
 */
export function gapBands(gaps: Gap[], points: { date: string }[]) {
  if (points.length === 0) return [];
  const first = points[0].date;
  const last = points[points.length - 1].date;
  return gaps
    .filter((g) => g.to >= first && g.from <= last)
    .map((g) => (
      <ReferenceArea
        key={g.from}
        x1={g.from < first ? first : g.from}
        x2={g.to > last ? last : g.to}
        fill={NO_DATA_FILL}
        fillOpacity={0.6}
        strokeOpacity={0}
      />
    ));
}
