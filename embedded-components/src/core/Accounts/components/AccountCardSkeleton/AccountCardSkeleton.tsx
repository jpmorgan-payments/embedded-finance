import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui';

/**
 * Props for AccountCardSkeleton component
 */
export interface AccountCardSkeletonProps {
  /** Use compact display mode with reduced padding and smaller elements */
  compact?: boolean;
}

/**
 * AccountCardSkeleton - Loading skeleton for AccountCard
 * Provides a placeholder while account data is being fetched
 * Matches the structure of AccountCard with header and balance sections
 */
export const AccountCardSkeleton: React.FC<AccountCardSkeletonProps> = ({
  compact = false,
}) => {
  if (compact) {
    return (
      <Card
        className="eb-rounded-none eb-border-x-0 eb-border-t-0 eb-shadow-none"
        role="article"
        aria-busy="true"
        aria-label="Loading account"
      >
        <CardContent className="eb-flex eb-items-center eb-gap-3 eb-p-3 @sm:eb-px-4 @md:eb-px-5">
          {/* Icon placeholder */}
          <Skeleton className="eb-h-10 eb-w-10 eb-shrink-0 eb-rounded-full" />

          {/* Account details */}
          <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
            {/* Name and status badge */}
            <div className="eb-flex eb-items-center eb-gap-2">
              <Skeleton className="eb-h-4 eb-w-40" />
              <Skeleton className="eb-h-5 eb-w-14 eb-rounded-full" />
            </div>
            {/* Account number */}
            <div className="eb-flex eb-items-center eb-gap-2">
              <Skeleton className="eb-h-2.5 eb-w-20" />
              <Skeleton className="eb-h-3.5 eb-w-16" />
            </div>
          </div>

          {/* Right side - Balance */}
          <Skeleton className="eb-h-6 eb-w-24 eb-shrink-0" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="eb-overflow-hidden"
      role="article"
      aria-busy="true"
      aria-label="Loading account"
    >
      <CardContent className="eb-flex eb-flex-col eb-p-0">
        {/* Header Section */}
        <div className="eb-space-y-3 eb-p-3 @md:eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
            <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
              {/* Account name */}
              <Skeleton className="eb-h-5 eb-w-48" />
              {/* Category subheader */}
              <div className="eb-flex eb-items-center eb-gap-1.5">
                <Skeleton className="eb-h-3.5 eb-w-3.5 eb-rounded" />
                <Skeleton className="eb-h-3 eb-w-24" />
              </div>
            </div>
            {/* Status badge */}
            <Skeleton className="eb-h-5 eb-w-14 eb-shrink-0 eb-rounded-full" />
          </div>

          {/* Account Number */}
          <div className="eb-space-y-1.5">
            <div className="eb-flex eb-items-center eb-gap-2">
              <Skeleton className="eb-h-2.5 eb-w-20" />
              <Skeleton className="eb-h-3.5 eb-w-16" />
            </div>
            {/* ACH Routing */}
            <div className="eb-flex eb-items-center eb-gap-2">
              <Skeleton className="eb-h-2.5 eb-w-24" />
              <Skeleton className="eb-h-3.5 eb-w-20" />
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="eb-border-t eb-bg-muted/20 eb-p-3 @md:eb-p-4">
          <div className="eb-flex eb-flex-wrap eb-gap-6">
            <div className="eb-space-y-1">
              <Skeleton className="eb-h-2.5 eb-w-20" />
              <Skeleton className="eb-h-7 eb-w-28" />
            </div>
            <div className="eb-space-y-1">
              <Skeleton className="eb-h-2.5 eb-w-16" />
              <Skeleton className="eb-h-7 eb-w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
