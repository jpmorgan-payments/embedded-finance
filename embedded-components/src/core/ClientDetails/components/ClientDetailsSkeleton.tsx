import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

export interface ClientDetailsSkeletonProps {
  viewMode?: 'summary' | 'accordion' | 'cards';
  className?: string;
}

/**
 * Loading skeleton for ClientDetails component.
 * Matches the visual structure of the actual component for smooth transitions.
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
 * Skeleton for summary view mode
 */
const SummarySkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'eb-rounded-lg eb-border eb-border-border eb-bg-card eb-shadow-sm',
      className
    )}
  >
    {/* Header with business name and status */}
    <div className="eb-flex eb-items-start eb-justify-between eb-border-b eb-border-border/60 eb-p-4">
      <div className="eb-flex eb-flex-col eb-gap-2">
        <Skeleton className="eb-h-5 eb-w-48" />
        <Skeleton className="eb-h-4 eb-w-32" />
      </div>
      <Skeleton className="eb-h-6 eb-w-20 eb-rounded-full" />
    </div>

    {/* Section list */}
    <div className="eb-divide-y eb-divide-border/60 eb-p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="eb-flex eb-items-center eb-gap-3 eb-py-3 first:eb-pt-0 last:eb-pb-0"
        >
          <Skeleton className="eb-h-8 eb-w-8 eb-rounded" />
          <div className="eb-flex eb-flex-1 eb-flex-col eb-gap-1">
            <Skeleton className="eb-h-4 eb-w-32" />
            <Skeleton className="eb-h-3 eb-w-48" />
          </div>
          <Skeleton className="eb-h-4 eb-w-4" />
        </div>
      ))}
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
