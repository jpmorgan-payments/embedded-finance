import { Building2, ChevronRight, FileText, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

export interface ClientDetailsSkeletonProps {
  viewMode?: 'summary' | 'accordion' | 'cards';
  className?: string;
}

/**
 * Loading skeleton for ClientDetails component.
 * Matches the visual structure of the actual component for smooth transitions.
 * Uses actual icons and static labels to minimize visual shift when content loads.
 */
export const ClientDetailsSkeleton = ({
  viewMode = 'summary',
  className,
}: ClientDetailsSkeletonProps) => {
  if (viewMode === 'summary') {
    return <SummarySkeleton className={className} />;
  }

  if (viewMode === 'accordion') {
    return <AccordionSkeleton className={className} />;
  }

  return <CardsSkeleton className={className} />;
};

/**
 * Skeleton for summary view mode - matches ClientSummaryCard structure
 */
const SummarySkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'eb-w-full eb-overflow-hidden eb-rounded-lg eb-border eb-border-border eb-bg-card eb-shadow-sm eb-@container',
      className
    )}
  >
    {/* ═══════════════════════════════════════════════════════════════
        HEADER - Business Identity
        ═══════════════════════════════════════════════════════════════ */}
    <div className="eb-p-4 eb-pb-3">
      <div className="eb-flex eb-items-start eb-gap-2 @sm:eb-gap-3">
        {/* Business Icon - actual icon, not skeleton */}
        <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-primary/10 @sm:eb-h-14 @sm:eb-w-14 @sm:eb-rounded-xl">
          <Building2
            className="eb-h-5 eb-w-5 eb-text-primary @sm:eb-h-7 @sm:eb-w-7"
            aria-hidden="true"
          />
        </div>

        {/* Business Info - dynamic content */}
        <div className="eb-min-w-0 eb-flex-1">
          {/* Business name */}
          <Skeleton className="eb-h-6 eb-w-48 @sm:eb-w-56" />
          {/* DBA name */}
          <Skeleton className="eb-mt-1.5 eb-h-[18px] eb-w-36 @sm:eb-w-44" />
          {/* Status indicator */}
          <div className="eb-mt-2 eb-flex eb-items-center eb-gap-1.5">
            <Skeleton className="eb-h-2 eb-w-2 eb-rounded-full" />
            <Skeleton className="eb-h-[14px] eb-w-20" />
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════════════════════════════════════════
        SECTIONS - Clickable rows for drill-down navigation
        ═══════════════════════════════════════════════════════════════ */}
    <div className="eb-divide-y eb-divide-border eb-border-t eb-border-border">
      {/* Business Details Section */}
      <div className="eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 @sm:eb-gap-3">
        {/* Large container: Icon in colored box - static */}
        <div className="eb-hidden eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-blue-100 @sm:eb-flex dark:eb-bg-blue-900/30">
          <FileText
            className="eb-h-5 eb-w-5 eb-text-blue-600 dark:eb-text-blue-400"
            aria-hidden="true"
          />
        </div>
        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-flex eb-items-center eb-gap-1.5 @sm:eb-gap-2">
            {/* Small container: Inline icon - skeleton */}
            <Skeleton className="eb-h-4 eb-w-4 eb-rounded @sm:eb-hidden" />
            {/* Section title - static */}
            <span className="eb-text-sm eb-font-medium eb-text-foreground">
              Business Details
            </span>
          </div>
          {/* Subtitle lines - dynamic */}
          <div className="eb-mt-1.5 eb-space-y-1">
            <div className="eb-flex eb-items-center eb-gap-1">
              <Skeleton className="eb-h-3 eb-w-3 eb-rounded" />
              <Skeleton className="eb-h-[14px] eb-w-24" />
            </div>
            <div className="eb-flex eb-items-center eb-gap-1">
              <Skeleton className="eb-h-3 eb-w-3 eb-rounded" />
              <Skeleton className="eb-h-[14px] eb-w-40" />
            </div>
          </div>
        </div>
        {/* Chevron - static */}
        <ChevronRight
          className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground @sm:eb-mt-2.5"
          aria-hidden="true"
        />
      </div>

      {/* People Section */}
      <div className="eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 @sm:eb-gap-3">
        {/* Large container: Icon in colored box - static */}
        <div className="eb-hidden eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-purple-100 @sm:eb-flex dark:eb-bg-purple-900/30">
          <Users
            className="eb-h-5 eb-w-5 eb-text-purple-600 dark:eb-text-purple-400"
            aria-hidden="true"
          />
        </div>
        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-flex eb-items-center eb-gap-1.5 @sm:eb-gap-2">
            {/* Small container: Inline icon - skeleton */}
            <Skeleton className="eb-h-4 eb-w-4 eb-rounded @sm:eb-hidden" />
            {/* Section title - static */}
            <span className="eb-text-sm eb-font-medium eb-text-foreground">
              People
            </span>
            {/* Badge - dynamic count */}
            <Skeleton className="eb-h-5 eb-w-5 eb-rounded" />
          </div>
          {/* People list - dynamic */}
          <div className="eb-mt-1.5 eb-space-y-1">
            <div className="eb-flex eb-items-center eb-gap-1.5">
              <Skeleton className="eb-h-3 eb-w-3 eb-rounded" />
              <Skeleton className="eb-h-[14px] eb-w-28" />
              <Skeleton className="eb-h-[14px] eb-w-16" />
            </div>
            <div className="eb-flex eb-items-center eb-gap-1.5">
              <Skeleton className="eb-h-3 eb-w-3 eb-rounded" />
              <Skeleton className="eb-h-[14px] eb-w-24" />
              <Skeleton className="eb-h-[14px] eb-w-12" />
            </div>
          </div>
        </div>
        {/* Chevron - static */}
        <ChevronRight
          className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground @sm:eb-mt-2.5"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for accordion view mode
 */
const AccordionSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('eb-flex eb-w-full eb-flex-col', className)}>
    {/* Header */}
    <div className="eb-flex eb-min-h-[48px] eb-items-center eb-border-b eb-border-border eb-px-4 eb-py-3">
      <Skeleton className="eb-h-5 eb-w-32" />
    </div>

    {/* Accordion items */}
    <div className="eb-flex eb-flex-1 eb-flex-col eb-p-4">
      <div className="eb-divide-y eb-divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="eb-flex eb-items-center eb-gap-3 eb-py-4">
            <Skeleton className="eb-h-5 eb-w-40" />
            <div className="eb-flex-1" />
            <Skeleton className="eb-h-4 eb-w-4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for cards view mode
 */
const CardsSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('eb-flex eb-w-full eb-flex-col', className)}>
    {/* Header */}
    <div className="eb-flex eb-min-h-[48px] eb-items-center eb-border-b eb-border-border eb-px-4 eb-py-3">
      <Skeleton className="eb-h-5 eb-w-32" />
    </div>

    {/* Cards grid */}
    <div className="eb-grid eb-gap-4 eb-p-4 @md:eb-grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="eb-rounded-lg eb-border eb-border-border eb-bg-card eb-p-4"
        >
          <Skeleton className="eb-mb-4 eb-h-5 eb-w-32" />
          <div className="eb-space-y-3">
            <div className="eb-flex eb-justify-between">
              <Skeleton className="eb-h-4 eb-w-24" />
              <Skeleton className="eb-h-4 eb-w-32" />
            </div>
            <div className="eb-flex eb-justify-between">
              <Skeleton className="eb-h-4 eb-w-20" />
              <Skeleton className="eb-h-4 eb-w-28" />
            </div>
            <div className="eb-flex eb-justify-between">
              <Skeleton className="eb-h-4 eb-w-28" />
              <Skeleton className="eb-h-4 eb-w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
