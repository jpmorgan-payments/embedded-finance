'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { FLOW_VIEW_TITLES } from '../PaymentFlow.constants';
import { useFlowContext } from './FlowContext';

interface FlowHeaderProps {
  title?: string;
  className?: string;
}

/**
 * FlowHeader component
 * Displays the header with back button (when in sub-view) and title
 */
export function FlowHeader({ title, className }: FlowHeaderProps) {
  const { currentView, canGoBack, popView } = useFlowContext();

  const displayTitle =
    title ?? FLOW_VIEW_TITLES[currentView] ?? 'Transfer Funds';

  return (
    <header
      role="banner"
      className={cn(
        'eb-flex eb-min-h-[48px] eb-items-center eb-justify-between eb-border-b eb-bg-card eb-px-4 eb-py-2',
        className
      )}
    >
      <div className="eb-flex eb-items-center eb-gap-2">
        {canGoBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={popView}
            className="eb--ml-2 eb-h-8 eb-w-8 eb-p-0"
            aria-label="Go back to previous screen"
          >
            <ArrowLeft className="eb-h-4 eb-w-4" aria-hidden="true" />
          </Button>
        )}
        <h1 className="eb-text-base eb-font-semibold">{displayTitle}</h1>
      </div>
    </header>
  );
}
