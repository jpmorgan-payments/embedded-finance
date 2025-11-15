'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'eb-z-50 eb-w-fit eb-origin-[--radix-tooltip-content-transform-origin] eb-text-balance eb-rounded-md eb-bg-foreground eb-px-3 eb-py-1.5 eb-text-xs eb-text-background eb-animate-in eb-fade-in-0 eb-zoom-in-95 data-[state=closed]:eb-animate-out data-[state=closed]:eb-fade-out-0 data-[state=closed]:eb-zoom-out-95 data-[side=bottom]:eb-slide-in-from-top-2 data-[side=left]:eb-slide-in-from-right-2 data-[side=right]:eb-slide-in-from-left-2 data-[side=top]:eb-slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="eb-z-50 eb-size-2.5 eb-translate-y-[calc(-50%_-_2px)] eb-rotate-45 eb-rounded-[2px] eb-bg-foreground eb-fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
