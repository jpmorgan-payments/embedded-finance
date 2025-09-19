import React from 'react';
import { Check, CircleDashed } from 'lucide-react';

import { cn } from '@/lib/utils';

export type TimelineItemStatus = 'pending' | 'current' | 'completed';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
}

export interface TimelineSection {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
  steps: TimelineStep[];
}

export interface OnboardingTimelineProps extends React.ComponentProps<'div'> {
  sections: TimelineSection[];
  currentSectionId?: string;
  currentStepId?: string;
  onSectionClick?: (sectionId: string) => void;
  onStepClick?: (sectionId: string, stepId: string) => void;
}

/**
 * OnboardingTimeline component that displays a step-by-step progress timeline
 * for the onboarding flow with expandable sections and clickable navigation.
 */
export const OnboardingTimeline: React.FC<OnboardingTimelineProps> = ({
  sections,
  currentSectionId,
  currentStepId,
  onSectionClick,
  onStepClick,
  className,
  ...props
}) => {
  const getStatusIcon = (status: TimelineItemStatus, isSubItem = false) => {
    const iconSize = isSubItem ? 'eb-size-4' : 'eb-size-6';

    switch (status) {
      case 'completed':
        return (
          <div
            className={cn(
              'eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-green-500 eb-text-white',
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
              'eb-flex eb-items-center eb-justify-center eb-rounded-full eb-border-2 eb-border-green-500 eb-bg-green-500',
              iconSize
            )}
          >
            <div
              className={cn(
                'eb-rounded-full eb-bg-white',
                isSubItem ? 'eb-size-1' : 'eb-size-1.5'
              )}
            />
          </div>
        );
      case 'pending':
      default:
        return (
          <div
            className={cn(
              'eb-relative eb-z-30 eb-flex eb-items-center eb-justify-center eb-rounded-full eb-bg-white',
              iconSize
            )}
          >
            <CircleDashed className={cn('eb-text-gray-400', iconSize)} />
          </div>
        );
    }
  };

  const getItemStatus = (
    sectionId: string,
    stepId?: string
  ): TimelineItemStatus => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return 'pending';

    if (stepId) {
      const step = section.steps.find((s) => s.id === stepId);
      if (!step) return 'pending';

      if (currentSectionId === sectionId && currentStepId === stepId) {
        return 'current';
      }
      return step.status;
    }

    if (currentSectionId === sectionId) {
      return 'current';
    }
    return section.status;
  };

  return (
    <div
      className={cn(
        'eb-flex eb-flex-col eb-bg-sidebar eb-text-sidebar-foreground',
        className
      )}
      {...props}
    >
      {sections.map((section) => {
        const sectionStatus = getItemStatus(section.id);
        const isCurrentSection = currentSectionId === section.id;
        const hasCurrentStep = section.steps.some(
          (step) => currentSectionId === section.id && currentStepId === step.id
        );

        return (
          <div key={section.id} className="eb-group/menu-item eb-relative">
            <button
              type="button"
              className={cn(
                'eb-peer/menu-button eb-relative eb-flex eb-w-full eb-cursor-pointer eb-items-center eb-gap-2 eb-overflow-hidden eb-rounded-md eb-border-0 eb-bg-transparent eb-p-2 eb-text-left eb-text-sm eb-outline-none eb-ring-sidebar-ring eb-transition-[width,height,padding] eb-duration-200 eb-ease-linear hover:eb-bg-sidebar-accent hover:eb-text-sidebar-accent-foreground focus-visible:eb-ring-2 active:eb-bg-sidebar-accent active:eb-text-sidebar-accent-foreground disabled:eb-pointer-events-none disabled:eb-opacity-50 [&>span:last-child]:eb-truncate [&>svg]:eb-size-4 [&>svg]:eb-shrink-0',
                (isCurrentSection || hasCurrentStep) &&
                  'eb-bg-sidebar-accent eb-font-medium eb-text-sidebar-accent-foreground'
              )}
              onClick={(e) => {
                e.preventDefault();
                onSectionClick?.(section.id);
              }}
            >
              {/* Current section blue vertical line */}
              {(isCurrentSection || hasCurrentStep) && (
                <div className="eb-absolute eb-inset-y-0 eb-left-0 eb-z-20 eb-w-1 eb-rounded-r eb-bg-blue-500" />
              )}

              <div className="eb-flex eb-items-center eb-gap-3">
                {/* Section icon with connecting line */}
                <div className="eb-relative eb-z-20 eb-flex eb-flex-col eb-items-center">
                  {/* Top connecting line */}
                  {sections.findIndex((s) => s.id === section.id) > 0 && (
                    <div
                      className={cn(
                        'eb-absolute eb-top-0 eb-h-6 eb-w-0.5 eb--translate-y-6 eb-transform',
                        // Green solid line or gray dashed line using background pattern
                        (() => {
                          const currentIndex = sections.findIndex(
                            (s) => s.id === section.id
                          );
                          const prevSection = sections[currentIndex - 1];
                          const prevStatus = prevSection
                            ? getItemStatus(prevSection.id)
                            : 'pending';
                          const currentStatus = sectionStatus;

                          const isGreen =
                            (prevStatus === 'completed' ||
                              prevStatus === 'current') &&
                            (currentStatus === 'completed' ||
                              currentStatus === 'current');

                          return isGreen
                            ? 'eb-bg-green-500'
                            : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_8px] eb-bg-repeat-y';
                        })()
                      )}
                    />
                  )}

                  {getStatusIcon(sectionStatus)}

                  {/* Bottom connecting line */}
                  {sections.findIndex((s) => s.id === section.id) <
                    sections.length - 1 ||
                  (section.steps?.length && isCurrentSection) ? (
                    <div
                      className={cn(
                        'eb-absolute eb-w-0.5 eb-transform',
                        // Adjust positioning and height based on whether we have steps showing
                        section.steps?.length && isCurrentSection
                          ? 'eb-top-4 eb-h-12'
                          : 'eb-bottom-0 eb-h-6 eb-translate-y-6',
                        // Green solid line or gray dashed line using background pattern
                        (() => {
                          if (section.steps?.length && isCurrentSection) {
                            // Connecting to first step
                            const firstStep = section.steps[0];
                            const firstStepStatus = firstStep
                              ? getItemStatus(section.id, firstStep.id)
                              : 'pending';
                            const currentStatus = sectionStatus;

                            const isGreen =
                              (currentStatus === 'completed' ||
                                currentStatus === 'current') &&
                              (firstStepStatus === 'completed' ||
                                firstStepStatus === 'current');

                            return isGreen
                              ? 'eb-bg-green-500'
                              : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_4px] eb-bg-repeat-y';
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

                          const isGreen =
                            (currentStatus === 'completed' ||
                              currentStatus === 'current') &&
                            (nextStatus === 'completed' ||
                              nextStatus === 'current');

                          return isGreen
                            ? 'eb-bg-green-500'
                            : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_8px] eb-bg-repeat-y';
                        })()
                      )}
                    />
                  ) : null}
                </div>

                {/* Section content */}
                <div className="eb-flex eb-flex-1 eb-flex-col eb-items-start">
                  <span
                    className={cn(
                      'eb-font-medium',
                      (isCurrentSection || hasCurrentStep) && 'eb-font-semibold'
                    )}
                  >
                    {section.title}
                  </span>
                </div>
              </div>
            </button>

            {section.steps?.length && isCurrentSection ? (
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
                        className={cn(
                          'eb-flex eb-h-7 eb-w-full eb-min-w-0 eb-cursor-pointer eb-items-center eb-gap-2 eb-overflow-hidden eb-rounded-md eb-border-0 eb-bg-transparent eb-px-2 eb-text-left eb-text-sm eb-text-sidebar-foreground eb-outline-none eb-ring-sidebar-ring eb-transition-colors eb-duration-200 eb-ease-linear hover:eb-bg-sidebar-accent hover:eb-text-sidebar-accent-foreground focus-visible:eb-ring-2 active:eb-bg-sidebar-accent active:eb-text-sidebar-accent-foreground disabled:eb-pointer-events-none disabled:eb-opacity-50 [&>span:last-child]:eb-truncate [&>svg]:eb-size-4 [&>svg]:eb-shrink-0',
                          isCurrentStep &&
                            'eb-bg-sidebar-accent eb-font-medium eb-text-sidebar-accent-foreground'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          onStepClick?.(section.id, step.id);
                        }}
                      >
                        <div className="eb-ml-1 eb-flex eb-items-center eb-gap-3">
                          {/* Step icon aligned with section icons */}
                          <div className="eb-relative eb-z-20 eb-flex eb-flex-col eb-items-center">
                            {/* Top connecting line to previous step or section */}
                            {section.steps.findIndex((s) => s.id === step.id) >
                            0 ? (
                              <div
                                className={cn(
                                  'eb-absolute eb-top-0 eb-h-3 eb-w-0.5 eb--translate-y-3 eb-transform',
                                  // Green solid line or gray dashed line using background pattern
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
                                      ? 'eb-bg-green-500'
                                      : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_4px] eb-bg-repeat-y';
                                  })()
                                )}
                              />
                            ) : (
                              // Connect to section icon
                              <div
                                className={cn(
                                  'eb-absolute eb-top-0 eb-h-6 eb-w-0.5 eb--translate-y-6 eb-transform',
                                  // Green solid line or gray dashed line using background pattern
                                  (() => {
                                    const currentStepStatus = stepStatus;
                                    const isGreen =
                                      (sectionStatus === 'completed' ||
                                        sectionStatus === 'current') &&
                                      (currentStepStatus === 'completed' ||
                                        currentStepStatus === 'current');

                                    return isGreen
                                      ? 'eb-bg-green-500'
                                      : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_4px] eb-bg-repeat-y';
                                  })()
                                )}
                              />
                            )}

                            {getStatusIcon(stepStatus, true)}

                            {/* Bottom connecting line to next step */}
                            {section.steps.findIndex((s) => s.id === step.id) <
                            section.steps.length - 1 ? (
                              <div
                                className={cn(
                                  'eb-absolute eb-bottom-0 eb-h-3 eb-w-0.5 eb-translate-y-3 eb-transform',
                                  // Green solid line or gray dashed line using background pattern
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
                                      ? 'eb-bg-green-500'
                                      : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_4px] eb-bg-repeat-y';
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
                                    <div
                                      className={cn(
                                        'eb-absolute eb-bottom-0 eb-h-4 eb-w-0.5 eb-translate-y-4 eb-transform',
                                        // Green solid line or gray dashed line using background pattern
                                        (() => {
                                          const currentStepStatus = stepStatus;
                                          const nextSectionStatus =
                                            getItemStatus(nextSection.id);

                                          const isGreen =
                                            (currentStepStatus ===
                                              'completed' ||
                                              currentStepStatus ===
                                                'current') &&
                                            (nextSectionStatus ===
                                              'completed' ||
                                              nextSectionStatus === 'current');

                                          return isGreen
                                            ? 'eb-bg-green-500'
                                            : 'eb-bg-gradient-to-b eb-from-gray-300 eb-via-transparent eb-to-gray-300 eb-bg-[length:2px_8px] eb-bg-repeat-y';
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
                          <div className="eb-ml-4 eb-flex eb-flex-1 eb-flex-col eb-items-start">
                            <span
                              className={cn(isCurrentStep && 'eb-font-medium')}
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
