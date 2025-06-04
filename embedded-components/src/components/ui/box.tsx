import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const boxVariants = cva('eb-leading-7 eb-text-gray-900 sm:eb-tracking-tight', {
  variants: {
    size: {
      sm: `eb-p-1`,
      md: `eb-p-1`,
      lg: `eb-p-1`,
      xl: `eb-p-1`,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type tBox = {
  asChild?: boolean;
};

const Box = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof boxVariants> & tBox
>(({ className, asChild, size, children, ...props }: any, ref) => (
  <div ref={ref} className={cn(boxVariants({ size }), className)} {...props}>
    {children}
  </div>
));
Box.displayName = 'Box';

export { Box };
