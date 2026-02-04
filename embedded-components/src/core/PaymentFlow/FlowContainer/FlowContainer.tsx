'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  /** Trigger element to open the dialog */
  trigger?: React.ReactNode;
  /** Key to force reset of flow state. Change this to reset the flow. */
  resetKey?: string | number;
  /** Whether the form is currently submitting (synced to context) */
  isSubmitting?: boolean;
  /** Additional CSS class name(s) for the container (inline mode only) */
  className?: string;
  /** Whether to show a visible container (border, shadow) in inline mode. Default: true */
  showContainer?: boolean;
}

/**
 * DialogWrapper - Wraps content in Dialog and dynamically adjusts size based on success state
 */
function DialogWrapper({
  open,
  onOpenChange,
  title,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { currentView, isSubmitting } = useFlowContext();
  const isSuccessView = currentView === 'success';

  // Prevent closing while submitting
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) {
      return; // Block close attempts while submitting
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <span className="eb-component eb-inline-block">{trigger}</span>
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          'eb-dialog-responsive-lg eb-flex eb-flex-col eb-gap-0 eb-overflow-hidden eb-p-0',
          isSuccessView && 'eb-dialog-success'
        )}
        aria-describedby={undefined}
      >
        <DialogTitle className="eb-sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
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
  showContainer = true,
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
        'eb-component eb-flex eb-flex-col eb-@container',
        // Container styling for inline mode (Card-like appearance)
        showContainer && [
          'eb-w-full eb-overflow-hidden eb-rounded-lg eb-border eb-bg-background eb-shadow-sm',
          'eb-min-h-[500px]', // Sensible minimum height
        ],
        // Height handling
        showContainer ? 'eb-h-auto' : 'eb-h-full',
        className
      )}
    >
      {/* Header - Optional */}
      {!hideHeader && <FlowHeader title={title} />}

      {/* Body - Two column layout (container 768px+) */}
      <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-hidden eb-bg-card @3xl:eb-flex-row">
        {/* Left Column - Dynamic Content (scrollable, includes mobile review) */}
        <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-y-auto eb-px-3 eb-pt-0 @md:eb-px-6 @md:eb-pt-4">
          <div
            className={cn(
              'eb-flex-1',
              showReviewPanel
                ? 'eb-pb-0 @3xl:eb-pb-4' // No padding on mobile (review panel below has mt-4), but add padding on desktop (side panel)
                : 'eb-pb-3 @md:eb-pb-4'
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
  trigger,
  resetKey,
  isSubmitting = false,
  className,
  showContainer,
}: FlowContainerFullProps) {
  // For inline mode, default showContainer to true unless explicitly set to false
  const shouldShowContainer = asModal ? false : (showContainer ?? true);

  const innerContent = (
    <FlowContainerInner
      title={title}
      reviewPanel={reviewPanel}
      reviewPanelWidth={reviewPanelWidth}
      hideHeader={hideHeader}
      showContainer={shouldShowContainer}
      className={asModal ? undefined : className}
    >
      {children}
    </FlowContainerInner>
  );

  // Render as modal - wrap with provider outside dialog so DialogWrapper can access context
  if (asModal && open !== undefined && onOpenChange) {
    return (
      <FlowContextProvider
        key={resetKey}
        initialData={initialData}
        isSubmitting={isSubmitting}
      >
        <DialogWrapper
          open={open}
          onOpenChange={onOpenChange}
          title={title}
          trigger={trigger}
        >
          {innerContent}
        </DialogWrapper>
      </FlowContextProvider>
    );
  }

  // Render inline
  return (
    <FlowContextProvider
      key={resetKey}
      initialData={initialData}
      isSubmitting={isSubmitting}
    >
      {innerContent}
    </FlowContextProvider>
  );
}
