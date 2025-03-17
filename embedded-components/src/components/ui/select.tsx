import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'eb-flex eb-h-10 eb-w-full eb-items-center eb-justify-between eb-rounded-input eb-border eb-border-input eb-bg-background eb-px-3 eb-py-2 eb-text-sm eb-text-foreground eb-ring-offset-background placeholder:eb-text-muted-foreground focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2 disabled:eb-cursor-not-allowed disabled:eb-opacity-50 [&>span]:eb-line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="eb-h-4 eb-w-4 eb-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'eb-flex eb-cursor-default eb-items-center eb-justify-center eb-py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="eb-h-4 eb-w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'eb-flex eb-cursor-default eb-items-center eb-justify-center eb-py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="eb-h-4 eb-w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'eb-component eb-relative eb-z-overlay eb-max-h-96 eb-min-w-[8rem] eb-overflow-hidden eb-rounded-md eb-border eb-bg-popover eb-text-popover-foreground eb-shadow-md data-[state=open]:eb-animate-in data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=open]:eb-fade-in-0 data-[state=closed]:eb-zoom-out-95 data-[state=open]:eb-zoom-in-95 data-[side=bottom]:eb-slide-in-from-top-2 data-[side=left]:eb-slide-in-from-right-2 data-[side=right]:eb-slide-in-from-left-2 data-[side=top]:eb-slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:eb-translate-y-1 data-[side=left]:eb--translate-x-1 data-[side=right]:eb-translate-x-1 data-[side=top]:eb--translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'eb-p-1',
          position === 'popper' &&
            'eb-h-[var(--radix-select-trigger-height)] eb-w-full eb-min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'eb-py-1.5 eb-pl-8 eb-pr-2 eb-text-sm eb-font-semibold eb-text-foreground',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'eb-relative eb-flex eb-w-full eb-cursor-pointer eb-select-none eb-items-center eb-rounded-sm eb-py-1.5 eb-pl-8 eb-pr-2 eb-text-sm eb-text-foreground eb-outline-none focus:eb-bg-accent focus:eb-text-accent-foreground data-[disabled]:eb-pointer-events-none data-[disabled]:eb-opacity-50',
      className
    )}
    {...props}
  >
    <span className="eb-absolute eb-left-2 eb-flex eb-h-3.5 eb-w-3.5 eb-items-center eb-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="eb-h-4 eb-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('eb--mx-1 eb-my-1 eb-h-px eb-bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
