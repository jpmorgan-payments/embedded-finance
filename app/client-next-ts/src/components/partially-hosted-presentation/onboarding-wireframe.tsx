import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Lock,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Lays children out at a fixed design width and scales them to the container,
 * so the wireframe keeps the real component's proportions at any size.
 */
export function FitToWidth({
  designWidth,
  className,
  children,
}: {
  designWidth: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // clientWidth/Height ignore the stage's CSS transform, which is what we want.
    const update = () =>
      setBox({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = box && box.width > 0 ? box.width / designWidth : 1;
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: designWidth,
          height: box ? box.height / scale : '100%',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

type TimelineStatus = 'completed' | 'current' | 'not_started' | 'on_hold';

interface TimelineRow {
  label: string;
  status: TimelineStatus;
  level: 'section' | 'step';
  active?: boolean;
}

// Section and step labels are the OnboardingFlow en-US strings.
const TIMELINE: readonly TimelineRow[] = [
  { label: 'Controller details', status: 'completed', level: 'section' },
  { label: 'Business details', status: 'current', level: 'section' },
  { label: 'Business identity', status: 'completed', level: 'step' },
  {
    label: 'Description & industry classification',
    status: 'current',
    level: 'step',
    active: true,
  },
  { label: 'Contact information', status: 'not_started', level: 'step' },
  { label: 'Check your answers', status: 'not_started', level: 'step' },
  { label: 'Owners and key roles', status: 'not_started', level: 'section' },
  { label: 'Operational details', status: 'not_started', level: 'section' },
  { label: 'Review and attest', status: 'not_started', level: 'section' },
  { label: 'Supporting documents', status: 'on_hold', level: 'section' },
];

const isStarted = (status: TimelineStatus) =>
  status === 'completed' || status === 'current';

function connector(a: TimelineRow, b: TimelineRow) {
  return isStarted(a.status) && isStarted(b.status)
    ? 'border-solid border-ph-good'
    : 'border-dotted border-ph-muted';
}

function StatusIcon({
  status,
  small,
}: {
  status: TimelineStatus;
  small: boolean;
}) {
  const size = small ? 'h-4 w-4' : 'h-6 w-6';
  if (status === 'completed') {
    return (
      <span
        className={cn(
          'grid place-items-center rounded-full bg-ph-good text-ph-surface',
          size
        )}
      >
        <Check className={small ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3} />
      </span>
    );
  }
  if (status === 'current') {
    return (
      <span
        className={cn(
          'grid place-items-center rounded-full border-2 border-ph-good bg-ph-surface',
          size
        )}
      >
        <span
          className={cn(
            'rounded-full bg-ph-good',
            small ? 'h-2 w-2' : 'h-3.5 w-3.5'
          )}
        />
      </span>
    );
  }
  const Icon = status === 'on_hold' ? Lock : CircleDashed;
  return (
    <span className="rounded-full bg-ph-surface">
      <Icon className={cn('text-ph-muted', size)} />
    </span>
  );
}

function OnboardingTimelineWireframe() {
  return (
    <div className="flex w-[256px] shrink-0 flex-col self-start rounded-lg border border-ph-border bg-ph-surface py-2 shadow-sm">
      <p className="ph-heading ml-4 pb-2 pt-1 text-[20px] font-medium">
        Onboarding Progress
      </p>
      {TIMELINE.map((row, i) => {
        const prev = TIMELINE[i - 1];
        const next = TIMELINE[i + 1];
        const isSection = row.level === 'section';
        return (
          <div
            key={row.label}
            className={cn(
              'relative flex items-center gap-3 pl-4 pr-2',
              isSection ? 'min-h-[40px] py-2' : 'min-h-[30px] py-1',
              row.active && 'bg-ph-brand-soft'
            )}
          >
            {row.active ? (
              <span className="absolute inset-y-0 left-0 w-1 rounded-r bg-ph-brand" />
            ) : null}
            <span className="relative flex w-6 shrink-0 items-center justify-center self-stretch">
              {prev ? (
                <span
                  className={cn(
                    'absolute left-1/2 top-0 h-1/2 -translate-x-1/2 border-l-2',
                    connector(prev, row)
                  )}
                />
              ) : null}
              {next ? (
                <span
                  className={cn(
                    'absolute left-1/2 top-1/2 h-1/2 -translate-x-1/2 border-l-2',
                    connector(row, next)
                  )}
                />
              ) : null}
              <span className="relative z-10 flex">
                <StatusIcon status={row.status} small={!isSection} />
              </span>
            </span>
            <span
              className={cn(
                'leading-5',
                isSection ? 'text-[15px] font-medium' : 'text-[14px]',
                row.active && 'font-semibold',
                row.status === 'on_hold' && 'opacity-50'
              )}
            >
              {row.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WireField({
  label,
  hint,
  placeholder,
  tall,
  select,
}: {
  label: string;
  hint: string;
  placeholder: string;
  tall?: boolean;
  select?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[14px] font-medium">{label}</p>
      <div
        className={cn(
          'flex justify-between rounded-md border border-ph-border bg-ph-surface px-3 text-[14px] text-ph-muted',
          tall ? 'h-20 items-start py-2' : 'h-10 items-center'
        )}
      >
        {placeholder}
        {select ? <ChevronDown className="h-4 w-4" /> : null}
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-ph-muted">{hint}</p>
    </div>
  );
}

/**
 * High-level wireframe of the real OnboardingFlow: Onboarding Progress
 * timeline on the left, the current step form on the right.
 */
export function OnboardingFlowWireframe() {
  return (
    <div className="flex h-full gap-6 bg-ph-surface p-6 text-ph-ink">
      <OnboardingTimelineWireframe />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-center gap-1 text-[14px] text-ph-muted">
          <span className="inline-flex items-center gap-1 text-ph-brand">
            <ArrowLeft className="h-3.5 w-3.5" />
            Overview
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          Business details
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-ph-ink">Step 2 of 4</span>
        </p>
        <p className="ph-heading mt-3 text-[28px] font-medium leading-tight">
          Description &amp; industry classification
        </p>
        <p className="mt-3 text-[14px] leading-snug">
          Provide a description for your business, then choose a classification
          that best describes your income-producing lines of business.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <WireField
            label="Business description"
            placeholder="Enter business description"
            hint="A summary of the products and services you offer to consumers."
            tall
          />
          <WireField
            label="Industry classification"
            placeholder="Search by keyword or 6-digit NAICS code"
            hint={'e.g. "Boat dealers" or "441222".'}
            select
          />
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-6 text-[17px] font-semibold">
          <span className="rounded-md bg-ph-brand py-2.5 text-center text-ph-on-brand">
            Continue
          </span>
          <span className="rounded-md bg-ph-soft py-2.5 text-center">
            Previous
          </span>
        </div>
      </div>
    </div>
  );
}
