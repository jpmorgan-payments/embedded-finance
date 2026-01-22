'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * ReviewSection component
 * Displays a labeled section in the review panel with plain text
 */
export function ReviewSection({
  title,
  children,
  className,
  icon,
}: ReviewSectionProps) {
  return (
    <div
      className={cn(
        'eb-flex eb-items-start eb-justify-between eb-gap-4',
        className
      )}
    >
      <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1.5 eb-text-sm eb-text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="eb-text-right eb-text-sm">{children}</div>
    </div>
  );
}

interface ReviewPlaceholderProps {
  text?: string;
}

/**
 * ReviewPlaceholder component
 * Shows placeholder text when a value is not yet selected
 */
export function ReviewPlaceholder({ text = '—' }: ReviewPlaceholderProps) {
  return <span className="eb-text-muted-foreground">{text}</span>;
}
