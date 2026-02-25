import { Building2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

export interface ClientDetailsSkeletonProps {
  viewMode?: 'summary' | 'accordion' | 'cards';
  className?: string;
}

/**
 * Loading skeleton for ClientDetails component.
 * Generic skeleton structure that provides visual feedback during loading.
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
 * Skeleton for summary view mode - generic loading skeleton
 */
const SummarySkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'eb-w-full eb-overflow-hidden eb-rounded-lg eb-border eb-border-border eb-bg-card eb-shadow-sm eb-@container',
        className
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════
          HERO HEADER - Generic skeleton
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-bg-primary/5 eb-p-4 eb-pb-5 @sm:eb-p-6">
        <div className="eb-flex eb-items-start eb-gap-3 @sm:eb-gap-4">
          {/* Business Icon - static */}
          <div className="eb-flex eb-h-12 eb-w-12 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-xl eb-bg-primary eb-ring-2 eb-ring-primary/20 eb-ring-offset-2 eb-ring-offset-background @sm:eb-h-16 @sm:eb-w-16 @sm:eb-rounded-2xl">
            <Building2
              className="eb-h-6 eb-w-6 eb-text-primary-foreground @sm:eb-h-8 @sm:eb-w-8"
              aria-hidden="true"
            />
          </div>

          {/* Content placeholders */}
          <div className="eb-min-w-0 eb-flex-1">
            <div className="eb-flex eb-flex-wrap eb-items-start eb-gap-2">
              {/* Title */}
              <Skeleton className="eb-h-6 eb-w-48 @sm:eb-h-7 @sm:eb-w-56" />
              {/* Badge */}
              <Skeleton className="eb-h-6 eb-w-16 eb-rounded-full" />
            </div>
            {/* Subtitle */}
            <Skeleton className="eb-mt-1 eb-h-5 eb-w-36 @sm:eb-w-44" />
            {/* Info pills */}
            <div className="eb-mt-3 eb-flex eb-flex-wrap eb-gap-2">
              <Skeleton className="eb-h-7 eb-w-24 eb-rounded-md" />
              <Skeleton className="eb-h-7 eb-w-28 eb-rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTIONS - Generic row skeletons
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-divide-y eb-divide-border eb-border-t eb-border-border">
        {/* Section row 1 */}
        <div className="eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 @sm:eb-gap-3">
          <Skeleton className="eb-hidden eb-h-10 eb-w-10 eb-shrink-0 eb-rounded-lg @sm:eb-block" />
          <div className="eb-min-w-0 eb-flex-1">
            <div className="eb-flex eb-items-center eb-gap-1.5 @sm:eb-gap-2">
              <Skeleton className="eb-h-4 eb-w-4 eb-rounded @sm:eb-hidden" />
              <Skeleton className="eb-h-5 eb-w-32" />
            </div>
            <div className="eb-mt-1 eb-flex eb-flex-wrap eb-items-center eb-gap-x-3 eb-gap-y-1">
              <Skeleton className="eb-h-4 eb-w-24" />
              <Skeleton className="eb-h-4 eb-w-28" />
            </div>
          </div>
          <Skeleton className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 @sm:eb-mt-2.5" />
        </div>

        {/* Section row 2 */}
        <div className="eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 @sm:eb-gap-3">
          <Skeleton className="eb-hidden eb-h-10 eb-w-10 eb-shrink-0 eb-rounded-lg @sm:eb-block" />
          <div className="eb-min-w-0 eb-flex-1">
            <div className="eb-flex eb-items-center eb-gap-1.5 @sm:eb-gap-2">
              <Skeleton className="eb-h-4 eb-w-4 eb-rounded @sm:eb-hidden" />
              <Skeleton className="eb-h-5 eb-w-24" />
              <Skeleton className="eb-h-5 eb-w-6 eb-rounded-full" />
            </div>
            <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
              <Skeleton className="eb-h-[37px] eb-w-32 eb-rounded-lg" />
              <Skeleton className="eb-h-[37px] eb-w-28 eb-rounded-lg" />
            </div>
          </div>
          <Skeleton className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 @sm:eb-mt-2.5" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for accordion view mode - generic loading skeleton
 */
const AccordionSkeleton = ({ className }: { className?: string }) => {
  return (
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
};

/**
 * Skeleton for cards view mode - generic loading skeleton
 */
const CardsSkeleton = ({ className }: { className?: string }) => {
  return (
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
};
