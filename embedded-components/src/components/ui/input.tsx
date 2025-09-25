import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'focus-visible:eb-default eb-flex eb-h-10 eb-w-full eb-rounded-input eb-border eb-border-inputBorder eb-bg-input eb-px-3 eb-py-2 eb-text-sm eb-text-foreground eb-ring-ring eb-ring-offset-background file:eb-border-0 file:eb-bg-transparent file:eb-text-sm file:eb-font-medium placeholder:eb-text-muted-foreground focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-offset-2 disabled:eb-cursor-not-allowed disabled:eb-bg-gray-100 disabled:eb-opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
