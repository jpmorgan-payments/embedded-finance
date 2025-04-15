'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'eb-flex eb-cursor-pointer eb-select-none eb-items-center eb-gap-2 eb-rounded-sm eb-px-2 eb-py-1.5 eb-text-sm eb-outline-none focus:eb-bg-accent data-[state=open]:eb-bg-accent [&_svg]:eb-pointer-events-none [&_svg]:eb-size-4 [&_svg]:eb-shrink-0',
      inset && 'eb-pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="eb-ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'eb-z-50 eb-min-w-[8rem] eb-origin-[--radix-dropdown-menu-content-transform-origin] eb-overflow-hidden eb-rounded-md eb-border eb-bg-popover eb-p-1 eb-text-popover-foreground eb-shadow-lg data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0 data-[state=closed]:eb-zoom-out-95 data-[state=open]:eb-zoom-in-95 data-[side=bottom]:eb-slide-in-from-top-2 data-[side=left]:eb-slide-in-from-right-2 data-[side=right]:eb-slide-in-from-left-2 data-[side=top]:eb-slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'eb-z-50 eb-max-h-[var(--radix-dropdown-menu-content-available-height)] eb-min-w-[8rem] eb-overflow-y-auto eb-overflow-x-hidden eb-rounded-md eb-border eb-bg-popover eb-p-1 eb-text-popover-foreground eb-shadow-md',
        'eb-origin-[--radix-dropdown-menu-content-transform-origin] data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0 data-[state=closed]:eb-zoom-out-95 data-[state=open]:eb-zoom-in-95 data-[side=bottom]:eb-slide-in-from-top-2 data-[side=left]:eb-slide-in-from-right-2 data-[side=right]:eb-slide-in-from-left-2 data-[side=top]:eb-slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'eb-relative eb-flex eb-cursor-pointer eb-select-none eb-items-center eb-gap-2 eb-rounded-sm eb-px-2 eb-py-1.5 eb-text-sm eb-outline-none eb-transition-colors focus:eb-bg-accent focus:eb-text-accent-foreground data-[disabled]:eb-pointer-events-none data-[disabled]:eb-opacity-50 [&>svg]:eb-size-4 [&>svg]:eb-shrink-0',
      inset && 'eb-pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'eb-relative eb-flex eb-cursor-pointer eb-select-none eb-items-center eb-rounded-sm eb-py-1.5 eb-pl-8 eb-pr-2 eb-text-sm eb-outline-none eb-transition-colors focus:eb-bg-accent focus:eb-text-accent-foreground data-[disabled]:eb-pointer-events-none data-[disabled]:eb-opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="eb-absolute eb-left-2 eb-flex eb-h-3.5 eb-w-3.5 eb-items-center eb-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="eb-h-4 eb-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'eb-relative eb-flex eb-cursor-pointer eb-select-none eb-items-center eb-rounded-sm eb-py-1.5 eb-pl-8 eb-pr-2 eb-text-sm eb-outline-none eb-transition-colors focus:eb-bg-accent focus:eb-text-accent-foreground data-[disabled]:eb-pointer-events-none data-[disabled]:eb-opacity-50',
      className
    )}
    {...props}
  >
    <span className="eb-absolute eb-left-2 eb-flex eb-h-3.5 eb-w-3.5 eb-items-center eb-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="eb-h-2 eb-w-2 eb-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'eb-px-2 eb-py-1.5 eb-text-sm eb-font-semibold',
      inset && 'eb-pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('eb--mx-1 eb-my-1 eb-h-px eb-bg-muted', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'eb-ml-auto eb-text-xs eb-tracking-widest eb-opacity-60',
        className
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
