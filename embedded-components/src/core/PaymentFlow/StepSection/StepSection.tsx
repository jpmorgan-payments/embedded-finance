'use client';

import React from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/** Mutually-exclusive visual state of a step indicator. */
type StepIndicatorState = 'loading' | 'error' | 'complete' | 'active' | 'idle';

/**
 * Resolve the single visual state of a step indicator from its status flags.
 *
 * States are mutually exclusive and evaluated by priority:
 * `loading` > `error` > `complete` > `active` > `idle`.
 */
function getStepIndicatorState({
  isLoading,
  hasError,
  isComplete,
  isActive,
}: {
  isLoading: boolean;
  hasError: boolean;
  isComplete: boolean;
  isActive: boolean;
}): StepIndicatorState {
  if (isLoading) return 'loading';
  if (hasError) return 'error';
  if (isComplete) return 'complete';
  if (isActive) return 'active';
  return 'idle';
}

const STEP_INDICATOR_STYLES: Record<StepIndicatorState, string> = {
  loading: 'eb-border-2 eb-border-primary/50 eb-bg-background eb-text-primary',
  error:
    'eb-border-2 eb-border-destructive eb-bg-destructive/10 eb-text-destructive',
  complete: 'eb-bg-primary eb-text-primary-foreground',
  active: 'eb-border-2 eb-border-primary eb-bg-background eb-text-primary',
  idle: 'eb-border-2 eb-border-muted-foreground/30 eb-bg-background eb-text-muted-foreground',
};

/** Icon shown inside the step indicator for the given visual state. */
function renderStepIcon(
  state: StepIndicatorState,
  stepNumber: number
): React.ReactNode {
  if (state === 'loading') {
    return <Loader2 className="eb-h-4 eb-w-4 eb-animate-spin" />;
  }
  if (state === 'complete') {
    return <Check className="eb-h-4 eb-w-4" strokeWidth={3} />;
  }
  if (state === 'error') {
    return <AlertCircle className="eb-h-4 eb-w-4" />;
  }
  return <span>{stepNumber}</span>;
}

/** Text color class for a step title based on its state. */
function getTitleColorClass(
  hasError: boolean,
  isActive: boolean,
  isComplete: boolean
): string {
  if (hasError) return 'eb-text-destructive';
  if (isActive || isComplete) return 'eb-text-foreground';
  return 'eb-text-muted-foreground';
}

export interface StepSectionProps {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  summary?: React.ReactNode;
  children: React.ReactNode;
  onHeaderClick?: () => void;
  onCollapse?: () => void;
  isLast?: boolean;
  disabledReason?: string;
  isLoading?: boolean;
  /** Show error state on this section */
  hasError?: boolean;
  /** Disable section interactions (e.g., while form is submitting) */
  disabled?: boolean;
  /** Ref to the section container for scrolling */
  sectionRef?: React.RefObject<HTMLDivElement>;
}

function StepIndicator({
  stepNumber,
  isComplete,
  isActive,
  isLoading,
  hasError,
}: {
  stepNumber: number;
  isComplete: boolean;
  isActive: boolean;
  isLoading: boolean;
  hasError: boolean;
}) {
  const state = getStepIndicatorState({
    isLoading,
    hasError,
    isComplete,
    isActive,
  });

  return (
    <div
      className={cn(
        'eb-relative eb-z-10 eb-flex eb-h-8 eb-w-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-text-sm eb-font-medium eb-transition-all eb-duration-300',
        STEP_INDICATOR_STYLES[state]
      )}
    >
      {renderStepIcon(state, stepNumber)}
    </div>
  );
}

function StepHeaderTitle({
  title,
  hasError,
  isActive,
  isComplete,
  summary,
}: {
  title: string;
  hasError: boolean;
  isActive: boolean;
  isComplete: boolean;
  summary?: React.ReactNode;
}) {
  const titleColorClass = getTitleColorClass(hasError, isActive, isComplete);

  return (
    <div className="eb-flex eb-items-center eb-gap-2">
      <span
        className={cn(
          'eb-font-medium eb-transition-colors eb-duration-200',
          titleColorClass
        )}
      >
        {title}
      </span>
      {hasError && !isActive && (
        <span className="eb-text-xs eb-font-medium eb-text-destructive">
          (Required)
        </span>
      )}
      {isComplete && !isActive && !hasError && summary && (
        <span className="eb-text-sm eb-text-muted-foreground">— {summary}</span>
      )}
    </div>
  );
}

function StepActionLabel({
  actionLabel,
  isDisabled,
  isLoading,
  isActive,
}: {
  actionLabel: { text: string; chevron: 'up' | 'down' | null };
  isDisabled: boolean;
  isLoading: boolean;
  isActive: boolean;
}) {
  return (
    <span
      className={cn(
        'eb-flex eb-items-center eb-gap-0.5 eb-text-xs eb-font-medium',
        // When disabled, always use muted styling
        (isDisabled || isLoading) && 'eb-text-muted-foreground/60',
        // Active (expanded) state
        isActive && 'eb-text-muted-foreground',
        // Clickable states - use primary color
        !isActive && !isDisabled && !isLoading && 'eb-text-primary'
      )}
    >
      {actionLabel.text}
      {actionLabel.chevron === 'down' && (
        <ChevronDown className="eb-h-3.5 eb-w-3.5" />
      )}
      {actionLabel.chevron === 'up' && (
        <ChevronUp className="eb-h-3.5 eb-w-3.5" />
      )}
    </span>
  );
}

/**
 * StepSection component
 * A clean stepper-style section with smooth animations
 */
export function StepSection({
  stepNumber,
  title,
  isComplete,
  isActive,
  summary,
  children,
  onHeaderClick,
  onCollapse,
  isLast = false,
  disabledReason,
  isLoading = false,
  hasError = false,
  disabled = false,
  sectionRef,
}: StepSectionProps) {
  const isDisabled = !!disabledReason || disabled;
  // Can click to expand if not active, not disabled, and not loading
  // Can click to collapse if active (and not loading)
  const canClick = isLoading ? false : isActive || !isDisabled;

  // Ref to set inert attribute imperatively (React doesn't handle it well as a prop)
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (contentRef.current) {
      if (!isActive) {
        contentRef.current.setAttribute('inert', '');
      } else {
        contentRef.current.removeAttribute('inert');
      }
    }
  }, [isActive]);

  const handleClick = () => {
    if (isLoading) {
      return; // Don't allow any clicks while loading
    }
    if (isActive && onCollapse) {
      onCollapse();
    } else if (!isActive && !isDisabled && onHeaderClick) {
      onHeaderClick();
    }
  };

  // Determine the action label and chevron direction
  const getActionLabel = (): {
    text: string;
    chevron: 'up' | 'down' | null;
  } => {
    if (isActive) {
      return { text: 'Cancel', chevron: 'up' };
    }
    if (isLoading) {
      return { text: 'Loading...', chevron: null };
    }
    // When disabled, show the disabled reason (no chevron since not clickable)
    if (isDisabled) {
      return { text: disabledReason ?? '', chevron: null };
    }
    // Clickable states - show down chevron
    if (isComplete) {
      return { text: 'Change', chevron: 'down' };
    }
    return { text: 'Select', chevron: 'down' };
  };

  const actionLabel = getActionLabel();

  return (
    <div ref={sectionRef} className="eb-relative">
      {/* Connecting line (except for last item) */}
      {!isLast && (
        <div
          className={cn(
            'eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-[2px]',
            isComplete ? 'eb-bg-primary/30' : 'eb-bg-border'
          )}
        />
      )}

      {/* Header */}
      <button
        type="button"
        onClick={canClick ? handleClick : undefined}
        disabled={!canClick}
        className={cn(
          'eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2 eb-text-left eb-transition-all eb-duration-200',
          canClick && !isDisabled && 'eb-cursor-pointer hover:eb-opacity-80',
          (!canClick || isDisabled) && 'eb-cursor-default'
        )}
      >
        {/* Step indicator */}
        <StepIndicator
          stepNumber={stepNumber}
          isComplete={isComplete}
          isActive={isActive}
          isLoading={isLoading}
          hasError={hasError}
        />

        {/* Title and summary */}
        <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
          <StepHeaderTitle
            title={title}
            hasError={hasError}
            isActive={isActive}
            isComplete={isComplete}
            summary={summary}
          />

          {/* Action label */}
          <StepActionLabel
            actionLabel={actionLabel}
            isDisabled={isDisabled}
            isLoading={isLoading}
            isActive={isActive}
          />
        </div>
      </button>

      {/* Content with animation */}
      <div
        ref={contentRef}
        className={cn(
          'eb-ml-11 eb-overflow-hidden eb-transition-all eb-duration-300 eb-ease-in-out',
          isActive
            ? 'eb-max-h-[1000px] eb-opacity-100'
            : 'eb-max-h-0 eb-opacity-0'
        )}
        aria-hidden={!isActive}
      >
        <div className="eb-pt-1">{children}</div>
      </div>
    </div>
  );
}
