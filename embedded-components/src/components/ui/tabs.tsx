'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn('eb-flex eb-flex-col eb-gap-2', className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'eb-inline-flex eb-h-9 eb-w-fit eb-items-center eb-justify-center eb-rounded-lg eb-bg-muted eb-p-1 eb-text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'eb-inline-flex eb-flex-1 eb-items-center eb-justify-center eb-gap-1.5 eb-whitespace-nowrap eb-rounded-md eb-border eb-border-transparent eb-px-3 eb-py-1 eb-text-sm eb-font-medium eb-shadow-none eb-transition-all eb-duration-200 eb-ease-in-out',
      'eb-text-muted-foreground hover:eb-text-foreground',
      'focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2',
      'disabled:eb-pointer-events-none disabled:eb-opacity-50',
      'data-[state=active]:eb-border-border data-[state=active]:eb-bg-background data-[state=active]:eb-text-foreground data-[state=active]:eb-shadow',
      '[&_svg]:eb-pointer-events-none [&_svg]:eb-size-4 [&_svg]:eb-shrink-0',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'eb-flex-1 eb-text-sm eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2',
      'data-[state=active]:eb-animate-fade-in',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
