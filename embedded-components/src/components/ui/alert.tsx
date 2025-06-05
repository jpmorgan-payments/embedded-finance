import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'eb-relative eb-w-full eb-rounded-lg eb-border [&>svg]:eb-absolute [&>svg]:eb-text-foreground',
  {
    variants: {
      variant: {
        default: 'eb-bg-alert eb-text-alert-foreground',
        destructive:
          'eb-border-destructive/50 eb-bg-destructive-accent eb-text-alert-foreground dark:eb-border-destructive [&>svg]:eb-text-destructive',
        informative:
          'eb-border-informative/50 eb-bg-informative-accent eb-text-alert-foreground dark:eb-border-informative [&>svg]:eb-text-informative',
        warning:
          'eb-border-warning/50 eb-bg-warning-accent eb-text-alert-foreground dark:eb-border-warning [&>svg]:eb-text-warning',
        success:
          'eb-border-success/50 eb-bg-success-accent eb-text-alert-foreground dark:eb-border-success [&>svg]:eb-text-success',
      },
      density: {
        default:
          'eb-p-4 [&>svg+div]:eb-translate-y-[-3px] [&>svg]:eb-left-4 [&>svg]:eb-top-4 [&>svg~*]:eb-pl-7',
        sm: 'eb-p-3 eb-pt-2.5 eb-text-sm [&>svg+div]:eb-translate-y-[-2px] [&>svg]:eb-left-3 [&>svg]:eb-top-3 [&>svg~*]:eb-pl-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      density: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, density, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, density }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/heading-has-content
  <h5
    ref={ref}
    className={cn(
      'eb-mb-1 eb-font-medium eb-leading-none eb-tracking-tight',
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'eb-text-sm eb-text-alert-foreground [&_p]:eb-leading-relaxed',
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
