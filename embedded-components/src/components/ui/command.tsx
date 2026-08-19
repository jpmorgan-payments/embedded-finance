import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'eb-flex eb-h-full eb-w-full eb-flex-col eb-overflow-hidden eb-rounded-md eb-bg-popover eb-text-popover-foreground',
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="eb-overflow-hidden eb-p-0 eb-shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:eb-px-2 [&_[cmdk-group-heading]]:eb-font-medium [&_[cmdk-group-heading]]:eb-text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:eb-pt-0 [&_[cmdk-group]]:eb-px-2 [&_[cmdk-input-wrapper]_svg]:eb-h-5 [&_[cmdk-input-wrapper]_svg]:eb-w-5 [&_[cmdk-input]]:eb-h-12 [&_[cmdk-item]]:eb-px-2 [&_[cmdk-item]]:eb-py-3 [&_[cmdk-item]_svg]:eb-h-5 [&_[cmdk-item]_svg]:eb-w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="eb-flex eb-items-center eb-border-b eb-px-3"
    // eslint-disable-next-line react/no-unknown-property -- temp fix while using wrong cmdk package
    cmdk-input-wrapper=""
  >
    <Search className="eb-mr-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'eb-flex eb-h-11 eb-w-full eb-rounded-md eb-bg-transparent eb-py-3 eb-text-sm eb-outline-none placeholder:eb-text-muted-foreground disabled:eb-cursor-not-allowed disabled:eb-opacity-50',
        className
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'eb-max-h-[300px] eb-overflow-y-auto eb-overflow-x-hidden',
      className
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="eb-py-6 eb-text-center eb-text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'eb-overflow-hidden eb-p-1 eb-text-foreground [&_[cmdk-group-heading]]:eb-px-2 [&_[cmdk-group-heading]]:eb-py-1.5 [&_[cmdk-group-heading]]:eb-text-xs [&_[cmdk-group-heading]]:eb-font-medium [&_[cmdk-group-heading]]:eb-text-muted-foreground',
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('eb--mx-1 eb-h-px eb-bg-border', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "eb-relative eb-flex eb-cursor-default eb-select-none eb-items-center eb-rounded-sm eb-px-2 eb-py-1.5 eb-text-sm eb-outline-none data-[disabled=true]:eb-pointer-events-none data-[selected='true']:eb-bg-accent data-[selected=true]:eb-text-accent-foreground data-[disabled=true]:eb-opacity-50",
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'eb-ml-auto eb-text-xs eb-tracking-widest eb-text-muted-foreground',
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
