import React from 'react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui';

/**
 * LinkedAccountCardSkeleton - Loading skeleton for LinkedAccountCard
 * Provides a placeholder while account data is being fetched
 * Matches the structure of LinkedAccountCard with header, account details,
 * payment methods, and action buttons
 */
export const LinkedAccountCardSkeleton: React.FC = () => {
  return (
    <Card
      className="eb-overflow-hidden eb-transition-shadow"
      role="article"
      aria-busy="true"
      aria-label="Loading linked account"
    >
      <CardContent className="eb-flex eb-flex-col eb-p-0">
        {/* Header Section */}
        <div className="eb-space-y-3 eb-p-3 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
            <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
              {/* Account name */}
              <Skeleton className="eb-h-5 eb-w-3/4" />
              {/* Account type icon and label */}
              <div className="eb-flex eb-items-center eb-gap-1.5">
                <Skeleton className="eb-h-3.5 eb-w-3.5 eb-rounded-full" />
                <Skeleton className="eb-h-3 eb-w-20" />
              </div>
            </div>
            {/* Status badge */}
            <div className="eb-shrink-0 eb-self-start">
              <Skeleton className="eb-h-5 eb-w-16 eb-rounded-full" />
            </div>
          </div>

          {/* Account Number with Toggle */}
          <div className="eb-space-y-1.5">
            <div className="eb-flex eb-items-center eb-gap-2">
              <Skeleton className="eb-h-3 eb-w-28" />
              <Skeleton className="eb-h-4 eb-w-12" />
            </div>
            <Skeleton className="eb-h-4 eb-w-40" />
          </div>
        </div>

        {/* Payment Methods Section */}
        <Separator />
        <div className="eb-space-y-2 eb-bg-muted/20 eb-px-3 eb-py-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-4 @md:eb-py-3">
          <div className="eb-flex eb-items-center eb-gap-2">
            <Skeleton className="eb-h-3 eb-w-28" />
            <Skeleton className="eb-h-4 eb-w-16" />
          </div>
          {/* Payment method badges */}
          <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-1.5">
            <Skeleton className="eb-h-5 eb-w-12 eb-rounded-full" />
            <Skeleton className="eb-h-5 eb-w-12 eb-rounded-full" />
            <Skeleton className="eb-h-5 eb-w-16 eb-rounded-full" />
          </div>
        </div>

        {/* Action Buttons Section */}
        <Separator />
        <div className="eb-mt-auto eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2 eb-bg-muted eb-px-2.5 eb-py-2 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-3 @md:eb-py-2.5">
          <Skeleton className="eb-h-8 eb-w-24 eb-rounded-md" />
          <Skeleton className="eb-h-8 eb-w-24 eb-rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};
