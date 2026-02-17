import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'eb-fixed eb-inset-0 eb-z-50 eb-bg-black/80 data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'eb-component eb-fixed eb-z-50 eb-gap-4 eb-bg-background eb-p-6 eb-shadow-lg eb-transition eb-ease-in-out data-[state=closed]:eb-duration-300 data-[state=open]:eb-duration-500 data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out',
  {
    variants: {
      side: {
        top: 'eb-inset-x-0 eb-top-0 eb-border-b data-[state=closed]:eb-slide-out-to-top data-[state=open]:eb-slide-in-from-top',
        bottom:
          'eb-inset-x-0 eb-bottom-0 eb-border-t data-[state=closed]:eb-slide-out-to-bottom data-[state=open]:eb-slide-in-from-bottom',
        left: 'eb-inset-y-0 eb-left-0 eb-h-full eb-w-3/4 eb-border-r data-[state=closed]:eb-slide-out-to-left data-[state=open]:eb-slide-in-from-left sm:eb-max-w-sm',
        right:
          'eb-inset-y-0 eb-right-0 eb-h-full eb-w-3/4 eb-border-l data-[state=closed]:eb-slide-out-to-right data-[state=open]:eb-slide-in-from-right sm:eb-max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="eb-absolute eb-right-4 eb-top-4 eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-md eb-border eb-border-input eb-bg-background eb-text-muted-foreground eb-ring-offset-background eb-transition-colors hover:eb-bg-accent hover:eb-text-accent-foreground focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2 disabled:eb-pointer-events-none">
        <X className="eb-h-4 eb-w-4" />
        <span className="eb-sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'eb-flex eb-flex-col eb-space-y-2 eb-text-center sm:eb-text-left',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({
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
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('eb-text-lg eb-font-semibold eb-text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('eb-text-sm eb-text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
