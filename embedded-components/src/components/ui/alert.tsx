import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'eb-relative eb-w-full eb-rounded-lg eb-border [&>svg]:eb-absolute [&>svg]:eb-text-foreground',
  {
    variants: {
      variant: {
        default: 'eb-bg-background eb-text-foreground',
        destructive:
          'eb-border-destructive/50 eb-bg-[#FFECEA] eb-text-destructive dark:eb-border-destructive [&>svg]:eb-text-destructive',
        informative:
          'eb-border-[#0078CF] eb-bg-[#EAF6FF] eb-text-[#0078CF] [&>svg]:eb-text-[#0078CF]',
        warning:
          'eb-border-[#C75300] eb-bg-[#FFECD9] [&>svg]:eb-text-[#C75300]',
        success:
          'eb-border-[#00875D] eb-bg-[#EAF5F2] eb-text-[#00875D] [&>svg]:eb-text-[#00875D]',
      },
      density: {
        default:
          'eb-p-4 [&>svg+div]:eb-translate-y-[-3px] [&>svg]:eb-left-4 [&>svg]:eb-top-4 [&>svg~*]:eb-pl-7',
        sm: 'eb-p-3 [&>svg+div]:eb-translate-y-[-2px] [&>svg]:eb-left-3 [&>svg]:eb-top-3 [&>svg~*]:eb-pl-6',
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
      'eb-text-sm eb-text-foreground [&_p]:eb-leading-relaxed',
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
