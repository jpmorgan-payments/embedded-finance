import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textVariants = cva(
  'eb-leading-7 eb-text-gray-900  sm:eb-tracking-tight',
  {
    variants: {
      size: {
        sm: `eb-text-sm`,
        md: `eb-text-base`,
        lg: `eb-text-lg`,
        xl: `eb-text-xl`,
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

type tText = {
  asChild?: boolean;
};

const Text = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> &
    VariantProps<typeof textVariants> &
    tText
>(({ className, asChild, size, children, ...props }: any, ref) => (
  <p ref={ref} className={cn(textVariants({ size }), className)} {...props}>
    {children}
  </p>
));
Text.displayName = 'Text';

export { Text };