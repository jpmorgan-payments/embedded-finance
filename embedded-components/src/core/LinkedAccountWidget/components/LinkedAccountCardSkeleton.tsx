import React from 'react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui';

/**
 * LinkedAccountCardSkeleton - Loading skeleton for LinkedAccountCard
 * Provides a placeholder while account data is being fetched
 */
export const LinkedAccountCardSkeleton: React.FC = () => {
  return (
    <Card className="eb-h-full eb-overflow-hidden">
      <CardContent className="eb-flex eb-h-full eb-flex-col eb-p-0">
        {/* Header Section */}
        <div className="eb-space-y-3 eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
            <div className="eb-flex-1 eb-space-y-1.5">
              {/* Account name */}
              <Skeleton className="eb-h-5 eb-w-3/4" />
              {/* Account type */}
              <div className="eb-flex eb-items-center eb-gap-1.5">
                <Skeleton className="eb-h-3.5 eb-w-3.5 eb-rounded-full" />
                <Skeleton className="eb-h-3 eb-w-16" />
              </div>
            </div>
            {/* Status badge */}
            <Skeleton className="eb-h-5 eb-w-16 eb-rounded-full" />
          </div>

          {/* Account Information */}
          <div className="eb-space-y-1.5">
            {/* Account number row */}
            <div className="eb-flex eb-items-center eb-justify-between">
              <Skeleton className="eb-h-3 eb-w-24" />
              <Skeleton className="eb-h-4 eb-w-28" />
            </div>

            {/* Payment methods row */}
            <div className="eb-flex eb-items-center eb-justify-between">
              <Skeleton className="eb-h-3 eb-w-28" />
              <div className="eb-flex eb-gap-1">
                <Skeleton className="eb-h-5 eb-w-12 eb-rounded-full" />
                <Skeleton className="eb-h-5 eb-w-12 eb-rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons Section */}
        <div className="eb-mt-auto eb-flex eb-gap-2 eb-bg-muted/30 eb-p-3">
          <Skeleton className="eb-h-8 eb-min-w-[120px] eb-flex-1 eb-rounded-md" />
          <Skeleton className="eb-h-8 eb-w-[120px] eb-rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};
