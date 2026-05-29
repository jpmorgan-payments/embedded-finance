'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface TotalItem {
  label: string;
  value: number;
  className?: string;
}

interface ReviewTotalsProps {
  items: TotalItem[];
  total: number;
  currency?: string;
  className?: string;
}

/**
 * Format currency value
 */
function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * ReviewTotals component
 * Displays fee breakdown and total - only renders when there are fees
 */
export function ReviewTotals({
  items,
  total,
  currency = 'USD',
  className,
}: ReviewTotalsProps) {
  // Don't render if no fees (only amount)
  const fees = items.filter((item) => item.label.toLowerCase().includes('fee'));
  if (fees.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('eb-space-y-1.5 eb-border-t eb-pt-3 eb-text-sm', className)}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'eb-flex eb-items-center eb-justify-between',
            item.className
          )}
        >
          <span className="eb-text-muted-foreground">{item.label}</span>
          <span>{formatCurrency(item.value, currency)}</span>
        </div>
      ))}

      <div className="eb-flex eb-items-center eb-justify-between eb-pt-1 eb-font-medium">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
