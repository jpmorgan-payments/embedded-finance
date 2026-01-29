'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'eb-fixed eb-inset-0 eb-z-overlay eb-bg-white/70 data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base styles
        'eb-component eb-fixed eb-z-overlay eb-flex eb-flex-col eb-border eb-bg-card eb-shadow-lg eb-duration-200',
        // Responsive styles via viewport media queries (see index.css)
        'eb-dialog-responsive',
        // Animation styles
        'data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0 data-[state=closed]:eb-zoom-out-95 data-[state=open]:eb-zoom-in-95',
        'data-[state=closed]:eb-slide-out-to-left-1/2 data-[state=closed]:eb-slide-out-to-top-[48%] data-[state=open]:eb-slide-in-from-left-1/2 data-[state=open]:eb-slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="eb-absolute eb-right-4 eb-top-4 eb-rounded-sm eb-opacity-70 eb-ring-offset-background eb-transition-opacity hover:eb-opacity-100 focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2 disabled:eb-pointer-events-none data-[state=open]:eb-bg-accent data-[state=open]:eb-text-muted-foreground">
        <X className="eb-h-4 eb-w-4" />
        <span className="eb-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'eb-flex eb-flex-col eb-space-y-1.5 eb-text-center sm:eb-text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'eb-flex eb-flex-col-reverse sm:eb-flex-row sm:eb-justify-end sm:eb-space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'eb-text-lg eb-font-semibold eb-leading-none eb-tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('eb-text-sm eb-text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
