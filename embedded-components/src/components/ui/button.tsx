import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'eb-inline-flex eb-items-center eb-justify-center eb-whitespace-nowrap eb-rounded-md eb-text-sm eb-font-medium eb-ring-offset-background eb-transition-colors focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 disabled:eb-pointer-events-none disabled:eb-opacity-50',
  {
    variants: {
      variant: {
        default:
          'hover:eb-bg-secondary eb-text-primary-foreground',
        destructive:
          'hover:eb-bg-destructive/90 eb-bg-destructive eb-text-destructive-foreground',
        outline:
          'eb-border eb-border-input eb-bg-background eb-text-foreground hover:eb-bg-accent hover:eb-text-accent-foreground',
        secondary:
          'hover:eb-bg-secondary/80 eb-bg-secondary eb-text-secondary-foreground',
        ghost: 'hover:eb-bg-accent hover:eb-text-accent-foreground',
        link: 'eb-text-primary eb-underline-offset-4 hover:eb-underline',
      },
      size: {
        default: 'eb-h-10 eb-px-4 eb-py-2',
        sm: 'eb-h-9 eb-rounded-md eb-px-3',
        lg: 'eb-h-11 eb-rounded-md eb-px-8',
        icon: 'eb-h-10 eb-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
