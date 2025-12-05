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
        success:
          'eb-border-transparent eb-bg-success-accent eb-text-success hover:eb-bg-success-accent/90',
        warning:
          'eb-border-transparent eb-bg-warning-accent eb-text-warning hover:eb-bg-warning-accent/90',
        informative:
          'eb-border-transparent eb-bg-informative-accent eb-text-informative hover:eb-bg-informative-accent/90',
        // Neutral
        outline: 'eb-text-foreground',
        // Muted variant (replaces legacy subtle with hardcoded colors)
        subtle:
          'eb-border-transparent eb-bg-muted eb-text-muted-foreground hover:eb-bg-muted/80',
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
