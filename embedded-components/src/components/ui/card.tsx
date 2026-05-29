import * as React from 'react';

import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'eb-rounded-lg eb-border eb-bg-card eb-text-card-foreground eb-shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'eb-flex eb-flex-col eb-space-y-1.5 eb-rounded-t-lg eb-p-6',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level to render (1-6).
   * Use this to maintain proper heading hierarchy when embedding components.
   *
   * @default 2
   */
  headingLevel?: HeadingLevel;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, headingLevel = 2, ...props }, ref) => {
    const Tag = getHeadingTag(headingLevel);
    return (
      <Tag
        ref={ref}
        className={cn(
          'eb-text-2xl eb-font-semibold eb-leading-none eb-tracking-tight eb-text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('eb-text-sm eb-text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('eb-p-6 eb-pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('eb-flex eb-items-center eb-p-6 eb-pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
