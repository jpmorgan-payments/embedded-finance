'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import type {
  FlowContainerProps,
  PaymentFlowFormData,
} from '../PaymentFlow.types';
import { FlowContextProvider, useFlowContext } from './FlowContext';
import { FlowHeader } from './FlowHeader';

interface FlowContainerFullProps extends FlowContainerProps {
  /** When true, renders as a Dialog. When false, renders inline. */
  asModal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Partial<PaymentFlowFormData>;
  /** Hide the header entirely (useful when embedding in a page with its own header) */
  hideHeader?: boolean;
}

/**
 * FlowContainerInner - The actual layout without Dialog wrapper
 */
function FlowContainerInner({
  title,
  children,
  reviewPanel,
  reviewPanelWidth = 'sm',
  hideHeader = false,
  className,
}: Omit<
  FlowContainerFullProps,
  'asModal' | 'open' | 'onOpenChange' | 'initialData' | 'onClose'
> & { className?: string }) {
  const { currentView } = useFlowContext();

  // Hide review panel on success view (full-width success content)
  const isSuccessView = currentView === 'success';
  const showReviewPanel = reviewPanel && !isSuccessView;

  const reviewPanelWidthClasses = {
    sm: '@3xl:eb-w-[280px]',
    md: '@3xl:eb-w-[320px]',
    lg: '@3xl:eb-w-[380px]',
  };

  return (
    <div
      className={cn(
        'eb-component eb-flex eb-h-full eb-flex-col eb-@container',
        className
      )}
    >
      {/* Header - Optional */}
      {!hideHeader && <FlowHeader title={title} />}

      {/* Body - Two column layout (container 768px+) */}
      <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-hidden @3xl:eb-flex-row">
        {/* Left Column - Dynamic Content (scrollable, includes mobile review) */}
        <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-y-auto eb-px-3 eb-pt-3 @md:eb-px-6 @md:eb-pt-4">
          <div
            className={cn(
              'eb-flex-1',
              showReviewPanel ? 'eb-pb-0' : 'eb-pb-3 @md:eb-pb-4'
            )}
          >
            {children}
          </div>

          {/* Mobile Review Panel - inside scroll area on narrower containers */}
          {showReviewPanel && (
            <div className="eb--mx-3 eb-mt-4 eb-border-t eb-bg-muted eb-p-3 @md:eb--mx-6 @md:eb-px-6 @md:eb-py-4 @3xl:eb-hidden">
              {reviewPanel}
            </div>
          )}
        </div>

        {/* Right Column - Review Panel (hidden on mobile, shown on @3xl+) */}
        {showReviewPanel && (
          <div
            className={cn(
              'eb-hidden eb-shrink-0 eb-border-l eb-bg-muted @3xl:eb-block',
              reviewPanelWidthClasses[reviewPanelWidth]
            )}
          >
            <div className="eb-h-full eb-overflow-y-auto eb-px-5 eb-py-4">
              {reviewPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FlowContainer component
 * Main container for the payment flow - can be used standalone or as a modal
 */
export function FlowContainer({
  title,
  onClose: _onClose,
  children,
  reviewPanel,
  reviewPanelWidth = 'sm',
  asModal = true,
  open,
  onOpenChange,
  initialData,
  hideHeader = false,
}: FlowContainerFullProps) {
  const content = (
    <FlowContextProvider initialData={initialData}>
      <FlowContainerInner
        title={title}
        reviewPanel={reviewPanel}
        reviewPanelWidth={reviewPanelWidth}
        hideHeader={hideHeader}
        className={asModal ? undefined : 'eb-h-full'}
      >
        {children}
      </FlowContainerInner>
    </FlowContextProvider>
  );

  // Render as modal
  if (asModal && open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="eb-dialog-responsive-lg eb-flex eb-flex-col eb-gap-0 eb-overflow-hidden eb-p-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="eb-sr-only">{title}</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Render inline
  return content;
}
