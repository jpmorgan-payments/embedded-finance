/* eslint-disable tailwindcss/classnames-order */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'eb-button eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-whitespace-nowrap eb-rounded-button eb-font-button eb-text-sm eb-font-medium eb-ring-offset-background eb-transition-colors focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 active:eb-translate-y-[var(--eb-button-translate-y-active)] disabled:eb-pointer-events-none disabled:eb-opacity-50 [&_svg]:eb-pointer-events-none [&_svg]:eb-size-4 [&_svg]:eb-shrink-0',
  {
    variants: {
      variant: {
        default:
          'eb-bg-primary eb-text-button eb-font-button-primary eb-tracking-button eb-text-primary-foreground eb-shadow-border-primary eb-button-text-transform [--tw-shadow-color:theme(colors.primary.foreground.DEFAULT)] hover:eb-bg-primary-hover hover:eb-text-primary-foreground-hover hover:[--tw-shadow-color:theme(colors.primary.foreground.hover)] active:eb-bg-primary-active active:eb-text-primary-foreground-active active:[--tw-shadow-color:theme(colors.primary.foreground.active)]',
        destructive:
          'eb-bg-destructive eb-text-button eb-font-button-destructive eb-tracking-button eb-text-destructive-foreground eb-shadow-border-destructive eb-button-text-transform [--tw-shadow-color:theme(colors.destructive.foreground.DEFAULT)] hover:eb-bg-destructive-hover hover:eb-text-destructive-foreground-hover hover:[--tw-shadow-color:theme(colors.destructive.foreground.hover)] active:eb-bg-destructive-active active:eb-text-destructive-foreground-active active:[--tw-shadow-color:theme(colors.destructive.foreground.active)]',
        warning:
          'eb-text-warning-foreground eb-shadow-border-warning hover:eb-bg-warning-hover hover:eb-text-warning-foreground-hover active:eb-bg-warning-active active:eb-text-warning-foreground-active eb-bg-warning eb-text-button eb-font-button-destructive eb-tracking-button eb-button-text-transform [--tw-shadow-color:theme(colors.warning.foreground.DEFAULT)] hover:[--tw-shadow-color:theme(colors.warning.foreground.hover)] active:[--tw-shadow-color:theme(colors.warning.foreground.active)]',
        outline:
          'eb-border eb-border-border eb-bg-transparent eb-tracking-button eb-text-foreground eb-button-text-transform hover:eb-bg-accent hover:eb-text-accent-foreground',
        secondary:
          'eb-bg-secondary eb-text-button eb-font-button-secondary eb-tracking-button eb-text-secondary-foreground eb-shadow-border-secondary eb-button-text-transform [--tw-shadow-color:theme(colors.secondary.foreground.DEFAULT)] hover:eb-bg-secondary-hover hover:eb-text-secondary-foreground-hover hover:[--tw-shadow-color:theme(colors.secondary.foreground.hover)] active:eb-bg-secondary-active active:eb-text-secondary-foreground-active active:[--tw-shadow-color:theme(colors.secondary.foreground.active)]',
        ghost:
          'eb-tracking-button eb-button-text-transform hover:eb-bg-accent hover:eb-text-accent-foreground',
        link: 'eb-tracking-button eb-text-primary eb-underline-offset-4 eb-button-text-transform hover:eb-underline',
        input:
          'eb-font-sm eb-w-full eb-rounded-input eb-border eb-border-inputBorder eb-bg-input eb-font-normal eb-text-foreground active:eb-translate-y-0 disabled:eb-pointer-events-auto disabled:eb-cursor-not-allowed disabled:eb-bg-gray-100',
      },
      size: {
        default: 'eb-h-10 eb-px-4 eb-py-2',
        sm: 'eb-h-9 eb-rounded-button eb-px-3',
        lg: 'eb-h-11 eb-rounded-button eb-px-8',
        icon: 'eb-h-3 eb-w-3',
        input: 'eb-h-10 eb-px-3 eb-py-2',
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
