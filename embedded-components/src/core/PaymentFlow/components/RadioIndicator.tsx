'use client';

import React from 'react';
import { Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface RadioIndicatorProps {
  /** Whether the radio is selected */
  isSelected: boolean;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Whether the radio is locked (shows muted empty state) */
  locked?: boolean;
  /** Optional additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * RadioIndicator component
 * A visual radio button indicator (not interactive - just for display)
 * Used in selection lists where the entire row is clickable
 */
export function RadioIndicator({
  isSelected,
  disabled = false,
  locked = false,
  className,
  size = 'md',
}: RadioIndicatorProps) {
  const sizeClasses = size === 'sm' ? 'eb-size-4' : 'eb-size-5';
  const dotSizeClasses = size === 'sm' ? 'eb-size-2' : 'eb-size-2.5';

  return (
    <div
      className={cn(
        'eb-relative eb-shrink-0 eb-rounded-full eb-border eb-transition-colors',
        sizeClasses,
        locked
          ? 'eb-border-muted-foreground/30 eb-bg-transparent'
          : isSelected
            ? 'eb-border-primary eb-bg-primary/5'
            : 'eb-border-muted-foreground/50 eb-bg-background',
        (disabled || locked) && 'eb-opacity-50',
        className
      )}
      aria-hidden="true"
    >
      {!locked && isSelected && (
        <Circle
          className={cn(
            'eb-absolute eb-left-1/2 eb-top-1/2 -eb-translate-x-1/2 -eb-translate-y-1/2 eb-fill-primary eb-text-primary',
            dotSizeClasses
          )}
        />
      )}
    </div>
  );
}
