import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'eb-inline-flex eb-items-center eb-rounded-full eb-border eb-px-2.5 eb-py-0.5 eb-transition-colors focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2',
  {
    variants: {
      variant: {
        // Actionable variants (for buttons/actions)
        default:
          'eb-border-transparent eb-bg-primary eb-text-primary-foreground hover:eb-bg-primary/90',
        secondary:
          'eb-border-transparent eb-bg-secondary eb-text-secondary-foreground hover:eb-bg-secondary/80',
        destructive:
          'eb-border-transparent eb-bg-destructive eb-text-destructive-foreground hover:eb-bg-destructive/80',
        // Status variants (for status pills) - Salt Status tokens
        success: 'eb-border-transparent eb-bg-success-accent eb-text-success',
        warning: 'eb-border-transparent eb-bg-warning-accent eb-text-warning',
        informative:
          'eb-border-transparent eb-bg-informative-accent eb-text-informative',
        // Neutral
        outline: 'eb-text-foreground',
        // Legacy - consider removing in future
        subtle: 'eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]',
      },
      size: {
        default: 'eb-text-xs eb-font-semibold',
        lg: 'eb-text-sm eb-font-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
