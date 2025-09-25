import React from 'react';
import { AlertTriangle, Check, CircleDashed, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ScreenId, SectionStatus } from '@/core/OnboardingFlow/types';

export type TimelineItemStatus = SectionStatus | 'current';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
}

export interface TimelineSection {
  id: ScreenId;
  title: string;
  description?: string;
  status: TimelineItemStatus;
  steps: TimelineStep[];
}

export interface OnboardingTimelineProps extends React.ComponentProps<'div'> {
  title?: string;
  description?: string;
  sections: TimelineSection[];
  currentSectionId?: string;
  currentStepId?: string;
  onSectionClick?: (sectionId: ScreenId) => void;
  onStepClick?: (sectionId: ScreenId, stepId: string) => void;
  disableInteraction?: boolean;
}

/**
 * OnboardingTimeline component that displays a step-by-step progress timeline
 * for the onboarding flow with expandable sections and clickable navigation.
 */
export const OnboardingTimeline: React.FC<OnboardingTimelineProps> = ({
  title,
  sections,
  currentSectionId,
  currentStepId,
  onSectionClick,
  onStepClick,
  className,
  disableInteraction = false,
  ...props
}) => {
  const getStatusIcon = (status: TimelineItemStatus, isSubItem = false) => {
    const iconSize = isSubItem ? 'eb-size-4' : 'eb-size-6';

    switch (status) {
      case 'completed':
      case 'completed_disabled':
        return (
          <div
            className={cn(
              'eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-success eb-text-success-accent',
              iconSize
            )}
          >
            <Check
              className={cn(
                isSubItem ? 'eb-size-3' : 'eb-size-4',
                'eb-stroke-[3]'
              )}
            />
          </div>
        );
      case 'current':
        return (
          <div
            className={cn(
              'eb-relative eb-z-30 eb-flex eb-items-center eb-justify-center eb-rounded-full eb-border-2 eb-border-success eb-bg-sidebar',
              iconSize
            )}
          >
            <div
              className={cn(
                'eb-rounded-full eb-bg-success',
                isSubItem ? 'eb-size-2' : 'eb-size-3.5'
              )}
            />
          </div>
        );
      case 'on_hold':
        return (
          <div
            className={cn(
              'eb-relative eb-z-30 eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-transparent',
              iconSize
            )}
          >
            <Lock className={cn('eb-text-muted-foreground', iconSize)} />
          </div>
        );
      case 'missing_details':
        return (
          <div
            className={cn(
              'eb-relative eb-z-30 eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-transparent',
              iconSize
            )}
          >
            <AlertTriangle className={cn('eb-text-warning', iconSize)} />
          </div>
        );
      case 'not_started':
      default:
        return (
          <div
            className={cn(
              'eb-relative eb-z-30 eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-sidebar',
              iconSize
            )}
          >
            <CircleDashed
              className={cn('eb-text-muted-foreground/80', iconSize)}
            />
          </div>
        );
    }
  };

  const getItemStatus = (
    sectionId: string,
    stepId?: string
  ): TimelineItemStatus => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return 'not_started';

    if (stepId) {
      const step = section.steps.find((s) => s.id === stepId);
      if (!step) return 'not_started';

      // Prioritize completed status over current status
      if (step.status === 'completed' || step.status === 'completed_disabled') {
        return step.status;
      }

      if (currentSectionId === sectionId && currentStepId === stepId) {
        return 'current';
      }
      return step.status;
    }

    // Prioritize completed status over current status for sections
    if (
      section.status === 'completed' ||
      section.status === 'completed_disabled'
    ) {
      return section.status;
    }

    if (currentSectionId === sectionId) {
      return 'current';
    }
    return section.status;
  };

  return (
    <div
      className={cn(
        'eb-component eb-flex eb-flex-col eb-bg-sidebar eb-text-sidebar-foreground',
        className
      )}
      {...props}
    >
      <h2 className="eb-ml-4 eb-pb-2 eb-pt-1 eb-font-header eb-text-xl eb-font-medium">
        {title}
      </h2>
      {sections.map((section) => {
        const sectionStatus = getItemStatus(section.id);
        const isCurrentSection = currentSectionId === section.id;
        const hasCurrentStep = section.steps.some(
          (step) => currentSectionId === section.id && currentStepId === step.id
        );
        // Only highlight section if it's current AND has no steps OR has no current step
        const shouldHighlightSection =
          isCurrentSection && (section.steps.length === 0 || !hasCurrentStep);

        if (sectionStatus === 'hidden') {
          return null;
        }

        return (
          <div key={section.id} className="eb-group/menu-item eb-relative">
            <button
              type="button"
              disabled={
                sectionStatus === 'on_hold' ||
                sectionStatus === 'completed_disabled'
              }
              className={cn(
                'eb-peer/menu-button eb-relative eb-flex eb-min-h-[2.5rem] eb-w-full eb-items-start eb-gap-2 eb-overflow-hidden eb-border-0 eb-bg-transparent eb-p-2 eb-pl-4 eb-text-left eb-text-sm eb-outline-none eb-ring-inset eb-ring-ring eb-transition-[width,height,padding,color,background-color] eb-duration-200 eb-ease-linear disabled:eb-pointer-events-none disabled:eb-opacity-50 [&>svg]:eb-size-4 [&>svg]:eb-shrink-0',
                !disableInteraction &&
                  'eb-cursor-pointer hover:eb-bg-sidebar-accent hover:eb-text-sidebar-accent-foreground focus-visible:eb-ring-2 active:eb-bg-sidebar-accent active:eb-text-sidebar-accent-foreground',
                disableInteraction &&
                  'eb-pointer-events-none eb-cursor-default',
                shouldHighlightSection &&
                  'eb-bg-sidebar-accent eb-font-medium eb-text-sidebar-accent-foreground'
              )}
              onClick={(e) => {
                e.preventDefault();
                if (!disableInteraction) {
                  onSectionClick?.(section.id);
                }
              }}
            >
              {/* Current section vertical line - only show if no steps or no current step */}
              {shouldHighlightSection && (
                <div className="eb-absolute eb-inset-y-0 eb-left-0 eb-z-20 eb-w-1 eb-rounded-r eb-bg-primary" />
              )}

              <div className="eb-flex eb-items-center eb-gap-3">
                {/* Section icon with connecting line */}
                <div className="eb-relative eb-z-20 eb-flex eb-flex-col eb-items-center">
                  {/* Top connecting line */}
                  {sections.findIndex((s) => s.id === section.id) > 0 && (
                    <span
                      className={cn(
                        'eb-absolute eb-top-0 eb-h-6 eb--translate-y-6 eb-transform eb-border-l-2',
                        // Green solid line or gray dashed line
                        (() => {
                          const currentIndex = sections.findIndex(
                            (s) => s.id === section.id
                          );
                          const prevSection = sections[currentIndex - 1];
                          const prevStatus = prevSection
                            ? getItemStatus(prevSection.id)
                            : 'pending';
                          const currentStatus = sectionStatus;

                          // Check if previous section is truly completed
                          // If it has steps, all steps must be completed
                          const isPrevSectionFullyCompleted = prevSection
                            ? prevSection.steps.length === 0
                              ? prevStatus === 'completed'
                              : prevSection.steps.every(
                                  (step) =>
                                    step.status === 'completed' ||
                                    step.status === 'completed_disabled'
                                )
                            : false;

                          const isGreen =
                            isPrevSectionFullyCompleted &&
                            (currentStatus === 'completed' ||
                              currentStatus === 'current');

                          return isGreen
                            ? 'eb-border-solid eb-border-success'
                            : 'eb-border-dotted eb-border-muted-foreground/40';
                        })()
                      )}
                    />
                  )}

                  {getStatusIcon(sectionStatus)}

                  {/* Bottom connecting line */}
                  {sections.findIndex((s) => s.id === section.id) <
                    sections.length - 1 ||
                  (section.steps.length && isCurrentSection) ? (
                    <span
                      className={cn(
                        'eb-absolute eb-transform eb-border-l-2',
                        // Adjust positioning and height based on whether we have steps showing
                        section.steps.length && isCurrentSection
                          ? 'eb-top-4 eb-h-16'
                          : 'eb-bottom-0 eb-h-8 eb-translate-y-8',
                        // Green solid line or gray dashed line
                        (() => {
                          if (section.steps.length && isCurrentSection) {
                            // Connecting to first step
                            const firstStep = section.steps[0];
                            const firstStepStatus = firstStep
                              ? getItemStatus(section.id, firstStep.id)
                              : 'pending';
                            const currentStatus = sectionStatus;

                            const isGreen =
                              currentStatus === 'completed' &&
                              (firstStepStatus === 'completed' ||
                                firstStepStatus === 'current');

                            return isGreen
                              ? 'eb-border-solid eb-border-success'
                              : 'eb-border-dotted eb-border-muted-foreground/40';
                          }

                          // Connecting to next section
                          const currentIndex = sections.findIndex(
                            (s) => s.id === section.id
                          );
                          const nextSection = sections[currentIndex + 1];
                          const nextStatus = nextSection
                            ? getItemStatus(nextSection.id)
                            : 'pending';
                          const currentStatus = sectionStatus;

                          // Check if current section is truly completed
                          // If it has steps, all steps must be completed
                          const isCurrentSectionFullyCompleted =
                            section.steps.length === 0
                              ? currentStatus === 'completed'
                              : section.steps.every(
                                  (step) =>
                                    step.status === 'completed' ||
                                    step.status === 'completed_disabled'
                                );

                          const isGreen =
                            isCurrentSectionFullyCompleted &&
                            (nextStatus === 'completed' ||
                              nextStatus === 'current');

                          return isGreen
                            ? 'eb-border-solid eb-border-success'
                            : 'eb-border-dotted eb-border-muted-foreground/40';
                        })()
                      )}
                    />
                  ) : null}
                </div>

                {/* Section content */}
                <div className="eb-flex eb-flex-1 eb-flex-col eb-items-start eb-py-1">
                  <span
                    className={cn(
                      'eb-hyphens-auto eb-break-words eb-font-medium eb-leading-5',
                      shouldHighlightSection && 'eb-font-semibold'
                    )}
                  >
                    {section.title}
                  </span>
                </div>
              </div>
            </button>

            {section.steps.length && isCurrentSection ? (
              <div className="eb-ml-0 eb-space-y-0 eb-border-l-0 eb-pl-0">
                {section.steps.map((step) => {
                  const stepStatus = getItemStatus(section.id, step.id);
                  const isCurrentStep =
                    currentSectionId === section.id &&
                    currentStepId === step.id;

                  return (
                    <div key={step.id}>
                      <button
                        type="button"
                        disabled={
                          stepStatus === 'on_hold' ||
                          stepStatus === 'completed_disabled'
                        }
                        className={cn(
                          'eb-relative eb-flex eb-min-h-[1.75rem] eb-w-full eb-min-w-0 eb-items-start eb-gap-2 eb-overflow-hidden eb-border-0 eb-bg-transparent eb-px-2 eb-pl-4 eb-text-left eb-text-sm eb-text-sidebar-foreground eb-outline-none eb-ring-ring eb-transition-colors eb-duration-200 eb-ease-linear disabled:eb-pointer-events-none disabled:eb-opacity-50 [&>svg]:eb-size-4 [&>svg]:eb-shrink-0',
                          !disableInteraction &&
                            'eb-cursor-pointer hover:eb-bg-sidebar-accent hover:eb-text-sidebar-accent-foreground focus-visible:eb-ring-2 active:eb-bg-sidebar-accent active:eb-text-sidebar-accent-foreground',
                          disableInteraction &&
                            'eb-pointer-events-none eb-cursor-default',
                          isCurrentStep &&
                            'eb-bg-sidebar-accent eb-font-medium eb-text-sidebar-accent-foreground'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!disableInteraction) {
                            onStepClick?.(section.id, step.id);
                          }
                        }}
                      >
                        {/* Current step vertical line */}
                        {isCurrentStep && (
                          <div className="eb-absolute eb-inset-y-0 eb-left-0 eb-z-20 eb-w-1 eb-rounded-r eb-bg-primary" />
                        )}

                        <div className="eb-ml-1 eb-flex eb-items-center eb-gap-3">
                          {/* Step icon aligned with section icons */}
                          <div className="eb-relative eb-z-20 eb-flex eb-flex-col eb-items-center">
                            {/* Top connecting line to previous step or section */}
                            {section.steps.findIndex((s) => s.id === step.id) >
                            0 ? (
                              <span
                                className={cn(
                                  'eb-absolute eb-top-0 eb-h-4 eb--translate-y-4 eb-transform eb-border-l-2',
                                  // Green solid line or gray dashed line
                                  (() => {
                                    const currentStepIndex =
                                      section.steps.findIndex(
                                        (s) => s.id === step.id
                                      );
                                    const prevStep =
                                      section.steps[currentStepIndex - 1];
                                    const prevStepStatus = prevStep
                                      ? getItemStatus(section.id, prevStep.id)
                                      : 'pending';
                                    const currentStepStatus = stepStatus;

                                    const isGreen =
                                      (prevStepStatus === 'completed' ||
                                        prevStepStatus === 'current') &&
                                      (currentStepStatus === 'completed' ||
                                        currentStepStatus === 'current');

                                    return isGreen
                                      ? 'eb-border-solid eb-border-success'
                                      : 'eb-border-dotted eb-border-muted-foreground/40';
                                  })()
                                )}
                              />
                            ) : (
                              // Connect to section icon
                              <span
                                className={cn(
                                  'eb-absolute eb-top-0 eb-h-8 eb--translate-y-8 eb-transform eb-border-l-2',
                                  // Green solid line or gray dashed line
                                  (() => {
                                    const currentStepStatus = stepStatus;
                                    const isGreen =
                                      sectionStatus === 'completed' &&
                                      (currentStepStatus === 'completed' ||
                                        currentStepStatus === 'current');

                                    return isGreen
                                      ? 'eb-border-solid eb-border-success'
                                      : 'eb-border-dotted eb-border-muted-foreground/40';
                                  })()
                                )}
                              />
                            )}

                            {getStatusIcon(stepStatus, true)}

                            {/* Bottom connecting line to next step */}
                            {section.steps.findIndex((s) => s.id === step.id) <
                            section.steps.length - 1 ? (
                              <span
                                className={cn(
                                  'eb-absolute eb-bottom-0 eb-h-4 eb-translate-y-4 eb-transform eb-border-l-2',
                                  // Green solid line or gray dashed line
                                  (() => {
                                    const currentStepIndex =
                                      section.steps.findIndex(
                                        (s) => s.id === step.id
                                      );
                                    const nextStep =
                                      section.steps[currentStepIndex + 1];
                                    const nextStepStatus = nextStep
                                      ? getItemStatus(section.id, nextStep.id)
                                      : 'pending';
                                    const currentStepStatus = stepStatus;

                                    const isGreen =
                                      (currentStepStatus === 'completed' ||
                                        currentStepStatus === 'current') &&
                                      (nextStepStatus === 'completed' ||
                                        nextStepStatus === 'current');

                                    return isGreen
                                      ? 'eb-border-solid eb-border-success'
                                      : 'eb-border-dotted eb-border-muted-foreground/40';
                                  })()
                                )}
                              />
                            ) : (
                              // For last step, connect to next section if exists
                              (() => {
                                const currentSectionIndex = sections.findIndex(
                                  (s) => s.id === section.id
                                );
                                const nextSection =
                                  sections[currentSectionIndex + 1];

                                if (nextSection) {
                                  return (
                                    <span
                                      className={cn(
                                        'eb-absolute eb-bottom-0 eb-h-6 eb-translate-y-6 eb-transform eb-border-l-2',
                                        // Green solid line or gray dashed line
                                        (() => {
                                          const currentStepStatus = stepStatus;
                                          const nextSectionStatus =
                                            getItemStatus(nextSection.id);

                                          const isGreen =
                                            currentStepStatus === 'completed' &&
                                            (nextSectionStatus ===
                                              'completed' ||
                                              nextSectionStatus === 'current');

                                          return isGreen
                                            ? 'eb-border-solid eb-border-success'
                                            : 'eb-border-dotted eb-border-muted-foreground/40';
                                        })()
                                      )}
                                    />
                                  );
                                }
                                return null;
                              })()
                            )}
                          </div>

                          {/* Step content */}
                          <div className="eb-ml-4 eb-flex eb-flex-1 eb-flex-col eb-items-start eb-py-0.5">
                            <span
                              className={cn(
                                'eb-hyphens-auto eb-break-words eb-leading-5',
                                isCurrentStep && 'eb-font-medium'
                              )}
                            >
                              {step.title}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

OnboardingTimeline.displayName = 'OnboardingTimeline';
