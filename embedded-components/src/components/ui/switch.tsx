import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const swithcVariants = cva('', {
  variants: {
    variant: {
      default: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    VariantProps<typeof swithcVariants>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'eb-peer eb-inline-flex eb-h-5 eb-w-9 eb-shrink-0 eb-cursor-pointer eb-items-center eb-rounded-full eb-border-2 eb-border-transparent eb-shadow-sm eb-transition-colors',
      'focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 focus-visible:eb-ring-offset-background',
      'disabled:eb-cursor-not-allowed disabled:eb-opacity-50',
      'data-[state=checked]:eb-bg-blue-600 data-[state=unchecked]:eb-bg-gray-200',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'eb-pointer-events-none eb-block eb-h-4 eb-w-4 eb-rounded-full eb-bg-white eb-shadow-lg eb-ring-0 eb-transition-transform',
        'data-[state=checked]:eb-translate-x-4 data-[state=unchecked]:eb-translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
