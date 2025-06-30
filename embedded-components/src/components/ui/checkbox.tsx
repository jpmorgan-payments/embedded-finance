import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'eb-peer eb-h-4 eb-w-4 eb-shrink-0 eb-cursor-pointer eb-border eb-border-primary eb-bg-input eb-ring-offset-background focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 disabled:eb-cursor-not-allowed disabled:eb-opacity-50 data-[state=checked]:eb-bg-primary data-[state=checked]:eb-text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        'eb-flex eb-items-center eb-justify-center eb-text-current'
      )}
    >
      <Check className="eb-h-4 eb-w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
