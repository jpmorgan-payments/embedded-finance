import React from 'react';
import { InfoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InfoPopoverProps {
  children: React.ReactNode;
}

export const InfoPopover = ({ children }: InfoPopoverProps) => {
  if (!children) {
    return null;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <InfoIcon className="eb-stroke-blue-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="eb-text-sm">
        {children}
      </PopoverContent>
    </Popover>
  );
};
