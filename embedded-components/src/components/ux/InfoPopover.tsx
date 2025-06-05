import React from 'react';
import { InfoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LearnMorePopoverTrigger } from '@/core/OnboardingWizardBasic/OnboardingOverviewFlow/components/LearnMorePopover/LearnMorePopover';

interface InfoPopoverProps {
  children: React.ReactNode;
  popoutTooltip: boolean;
}

export const InfoPopover = ({ children, popoutTooltip }: InfoPopoverProps) => {
  const button = (
    <Button variant="ghost" size="icon" type="button">
      <InfoIcon className="eb-stroke-blue-500" />
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
