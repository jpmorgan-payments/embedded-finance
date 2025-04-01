import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('eb-grid eb-gap-3', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      ref={ref}
      className={cn(
        `eb-focus-visible:border-ring aria-invalid:eb-ring-destructive/20 dark:aria-invalid:eb-ring-destructive/40 aria-invalid:eb-border-destructive eb-shadow-xs eb-aspect-square eb-size-4 eb-shrink-0 eb-cursor-default eb-rounded-full eb-border eb-border-muted-foreground eb-text-primary eb-outline-none eb-transition-[color,box-shadow] focus-visible:eb-ring-[3px] focus-visible:eb-ring-ring/50 disabled:eb-cursor-not-allowed disabled:eb-opacity-50 dark:eb-bg-input/30`,
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="eb-relative eb-flex eb-items-center eb-justify-center"
      >
        <Circle className="eb-absolute eb-left-1/2 eb-top-1/2 eb-size-2 -eb-translate-x-1/2 -eb-translate-y-1/2 eb-fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
