import React from 'react';
import { InfoIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { LearnMorePopoverTrigger } from './LearnMorePopover';

interface InfoPopoverProps {
  children: React.ReactNode;
  popoutTooltip?: boolean;
  className?: string;
}

export const InfoPopover = ({
  children,
  popoutTooltip,
  className,
}: InfoPopoverProps) => {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={cn('eb-text-gray-400 hover:eb-text-gray-600', className)}
    >
      <InfoIcon />
    </Button>
  );

  if (!children) {
    return null;
  }
  if (popoutTooltip) {
    return (
      <LearnMorePopoverTrigger content={children}>
        {button}
      </LearnMorePopoverTrigger>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent side="top" className="eb-text-sm">
        {children}
      </PopoverContent>
    </Popover>
  );
};
