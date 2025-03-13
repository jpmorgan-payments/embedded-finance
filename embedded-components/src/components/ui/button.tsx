/* eslint-disable tailwindcss/classnames-order */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'eb-inline-flex eb-items-center eb-rounded-button eb-text-button eb-font-medium eb-button eb-justify-center eb-gap-2 eb-whitespace-nowrap eb-ring-offset-background eb-transition-colors focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 active:eb-translate-y-0.25 disabled:eb-pointer-events-none disabled:eb-opacity-50 [&_svg]:eb-pointer-events-none [&_svg]:eb-size-4 [&_svg]:eb-shrink-0',
  {
    variants: {
      variant: {
        default:
          'eb-bg-primary hover:eb-text-primary-foreground-hover active:eb-text-primary-foreground-active eb-text-primary-foreground eb-shadow-border-primary [--tw-shadow-color:theme(colors.primary.foreground.DEFAULT)] hover:[--tw-shadow-color:theme(colors.primary.foreground.hover)] active:[--tw-shadow-color:theme(colors.primary.foreground.active)]  hover:eb-bg-primary-hover hover:eb-drop-shadow-md active:eb-bg-primary-active eb-font-button-primary',
        destructive:
          'eb-bg-destructive hover:eb-text-destructive-foreground-hover active:eb-text-destructive-foreground-active eb-shadow-border-destructive [--tw-shadow-color:theme(colors.destructive.foreground.DEFAULT)] hover:[--tw-shadow-color:theme(colors.destructive.foreground.hover)] active:[--tw-shadow-color:theme(colors.destructive.foreground.active)] eb-text-destructive-foreground hover:eb-bg-destructive-hover hover:eb-drop-shadow-md active:eb-bg-destructive-active eb-font-button-destructive',
        outline:
          'eb-border eb-border-input eb-bg-background eb-text-foreground hover:eb-bg-accent hover:eb-text-accent-foreground',
        secondary:
          'eb-bg-secondary hover:eb-text-secondary-foreground-hover active:eb-text-secondary-foreground-active eb-shadow-border-secondary [--tw-shadow-color:theme(colors.secondary.foreground.DEFAULT)] hover:[--tw-shadow-color:theme(colors.secondary.foreground.hover)] active:[--tw-shadow-color:theme(colors.secondary.foreground.active)] eb-text-secondary-foreground hover:eb-bg-secondary-hover hover:eb-drop-shadow-md active:eb-bg-secondary-active eb-font-button-secondary',
        ghost: 'hover:eb-bg-accent hover:eb-text-accent-foreground',
        link: 'eb-text-primary eb-underline-offset-4 hover:eb-underline',
        input:
          'active:eb-translate-y-0 disabled:eb-cursor-not-allowed eb-text-sm disabled:eb-bg-gray-100 eb-font-normal eb-text-foreground eb-w-full eb-rounded-input eb-bg-background eb-border eb-border-input',
      },
      size: {
        default: 'eb-h-10 eb-px-4 eb-py-2',
        sm: 'eb-h-9 eb-rounded-md eb-px-3',
        lg: 'eb-h-11 eb-rounded-md eb-px-8',
        icon: 'eb-h-3 eb-w-3',
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

const Button = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & ButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
