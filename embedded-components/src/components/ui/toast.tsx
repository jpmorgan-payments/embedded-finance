'use client';

import * as React from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'sm:eb-eb-bottom-0 eb-fixed eb-top-0 eb-z-[100] eb-flex eb-max-h-screen eb-w-full eb-flex-col-reverse eb-p-4 sm:eb-right-0 sm:eb-top-auto sm:eb-flex-col md:eb-max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'eb-group eb-pointer-events-auto eb-relative eb-flex eb-w-full eb-items-center eb-justify-between eb-space-x-2 eb-overflow-hidden eb-rounded-md eb-border eb-p-4 eb-pr-6 eb-shadow-lg eb-transition-all data-[swipe=cancel]:eb-translate-x-0 data-[swipe=end]:eb-translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:eb-translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:eb-transition-none data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[swipe=end]:eb-animate-out data-[state=closed]:eb-fade-out-80 data-[state=closed]:eb-slide-out-to-right-full data-[state=open]:eb-slide-in-from-top-full data-[state=open]:sm:eb-slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'eb-border eb-bg-background eb-text-foreground',
        destructive:
          'eb-destructive eb-group eb-border-destructive eb-bg-destructive eb-text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'eb-inline-flex eb-h-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-md eb-border eb-bg-transparent eb-px-3 eb-text-sm eb-font-medium eb-transition-colors hover:eb-bg-secondary focus:eb-outline-none focus:eb-ring-1 focus:eb-ring-ring disabled:eb-pointer-events-none disabled:eb-opacity-50 group-[.destructive]:eb-border-muted/40 group-[.destructive]:hover:eb-border-destructive/30 group-[.destructive]:hover:eb-bg-destructive group-[.destructive]:hover:eb-text-destructive-foreground group-[.destructive]:focus:eb-ring-destructive',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'eb-absolute eb-right-1 eb-top-1 eb-rounded-md eb-p-1 eb-text-foreground/50 eb-opacity-0 eb-transition-opacity hover:eb-text-foreground focus:eb-opacity-100 focus:eb-outline-none focus:eb-ring-1 group-hover:eb-opacity-100 group-[.destructive]:eb-text-red-300 group-[.destructive]:hover:eb-text-red-50 group-[.destructive]:focus:eb-ring-red-400 group-[.destructive]:focus:eb-ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <Cross2Icon className="eb-h-4 eb-w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('eb-text-sm eb-font-semibold [&+div]:eb-text-xs', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('eb-text-sm eb-opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
