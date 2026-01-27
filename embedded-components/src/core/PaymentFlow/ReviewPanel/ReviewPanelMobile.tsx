'use client';

import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { MobileReviewConfig } from '../PaymentFlow.types';

interface ReviewPanelMobileProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  config: MobileReviewConfig;
  total: string;
  isComplete: boolean;
}

/**
 * ReviewPanelMobile component
 * Mobile-optimized review panel that requires user to view details before submitting
 */
export function ReviewPanelMobile({
  children,
  footer,
  config,
  total,
  isComplete,
}: ReviewPanelMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenReviewed, setHasBeenReviewed] = useState(false);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    if (!hasBeenReviewed) {
      setHasBeenReviewed(true);
      config.onReviewViewed?.();
    }
  }, [hasBeenReviewed, config]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const canSubmit = !config.requireReviewBeforeSubmit || hasBeenReviewed;

  return (
    <>
      {/* Collapsed state - always visible at bottom on mobile */}
      <div className="eb-fixed eb-inset-x-0 eb-bottom-0 eb-border-t eb-bg-background eb-p-4 lg:eb-hidden">
        <button
          type="button"
          onClick={handleExpand}
          className={cn(
            'eb-w-full eb-rounded-lg eb-border-2 eb-p-4 eb-text-left eb-transition-colors',
            !hasBeenReviewed &&
              isComplete &&
              'eb-animate-pulse eb-border-primary',
            hasBeenReviewed && 'eb-border-muted'
          )}
        >
          <div className="eb-flex eb-items-center eb-justify-between">
            <div>
              <div className="eb-font-semibold">
                {config.collapsedPreview.title}
              </div>
              <div className="eb-text-sm eb-text-muted-foreground">
                {!hasBeenReviewed
                  ? config.collapsedPreview.subtitle
                  : 'Tap to review again'}
              </div>
            </div>
            <div className="eb-text-right">
              <div className="eb-font-bold">{total}</div>
              <ChevronUp className="eb-mx-auto eb-mt-1 eb-h-4 eb-w-4" />
            </div>
          </div>

          {/* Visual indicator that review is required */}
          {!hasBeenReviewed &&
            config.requireReviewBeforeSubmit &&
            isComplete && (
              <div className="eb-mt-2 eb-flex eb-items-center eb-gap-1 eb-text-xs eb-text-primary">
                <Info className="eb-h-3 eb-w-3" />
                Please review before submitting
              </div>
            )}
        </button>
      </div>

      {/* Expanded state - bottom sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="eb-h-[85vh]">
          <SheetHeader>
            <div className="eb-flex eb-items-center eb-justify-between">
              <SheetTitle>Review Details</SheetTitle>
              <Button variant="ghost" size="sm" onClick={handleCollapse}>
                <ChevronDown className="eb-h-4 eb-w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="eb-flex-1 eb-overflow-auto eb-py-4">{children}</div>

          <div className="eb-border-t eb-py-4">
            {/* Legal disclosure */}
            {config.legalDisclosure && (
              <div className="eb-mb-3 eb-text-xs eb-text-muted-foreground">
                {config.legalDisclosure}
              </div>
            )}

            {/* CTA - only enabled if reviewed (when required) */}
            {React.isValidElement(footer) &&
              React.cloneElement(
                footer as React.ReactElement<{ disabled?: boolean }>,
                {
                  disabled:
                    !canSubmit ||
                    (footer as React.ReactElement<{ disabled?: boolean }>).props
                      .disabled,
                }
              )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
