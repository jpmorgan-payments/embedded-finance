import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'eb-border-inputBorder eb-flex eb-min-h-[80px] eb-w-full eb-rounded-md eb-border eb-bg-input eb-px-3 eb-py-2 eb-text-base eb-ring-offset-background placeholder:eb-text-muted-foreground focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2 disabled:eb-cursor-not-allowed disabled:eb-opacity-50 md:eb-text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
