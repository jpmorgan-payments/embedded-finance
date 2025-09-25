import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
} from '@/core/OnboardingFlow/utils/dataUtils';

import {
  FormLoadingState,
  OnboardingTimeline,
  ServerErrorAlert,
  TimelineStep,
} from './components';
import { StepperRenderer } from './components/StepperRenderer/StepperRenderer';
import { flowConfig } from './config/flowConfig';
import { FlowProvider, useFlowContext } from './contexts/FlowContext';
import {
  OnboardingContext,
  useOnboardingContext,
} from './contexts/OnboardingContext';
import { OnboardingFlowProps } from './types/onboarding.types';
import { getFlowProgress } from './utils/flowUtils';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialClientId,
  alertOnExit = false,
  userEventsToTrack = [],
  userEventsHandler,
  height,
  onGetClientSettled,
  enableSidebar = false,
  ...props
}) => {
  const [clientId, setClientId] = useState(initialClientId ?? '');

  const { interceptorReady } = useInterceptorStatus();

  const {
    data: clientData,
    status: clientGetStatus,
    error: clientGetError,
  } = useSmbdoGetClient(clientId, {
    query: {
      enabled: !!clientId && interceptorReady, // Only fetch if clientId is defined AND interceptor is ready
      refetchOnWindowFocus: true,
      refetchInterval: 60000, // Refetch every 60 seconds
    },
  });

  // Call onGetClientSettled callback if provided
  useEffect(() => {
    if (onGetClientSettled) {
      onGetClientSettled(clientData, clientGetStatus, clientGetError);
    }
  }, [clientData, clientGetStatus, clientGetError, onGetClientSettled]);

  // Set clientId when initialClientId prop changes
  useEffect(() => {
    setClientId(initialClientId ?? '');
  }, [initialClientId]);

  const existingOrgParty = getOrganizationParty(clientData);

  const organizationType =
    existingOrgParty?.organizationDetails?.organizationType;

  const { t } = useTranslation(['onboarding-overview']);

  // Prevent the user from leaving the page
  useEffect(() => {
    const handleBeforeUnload = (event: {
      preventDefault: () => void;
      returnValue: boolean;
    }) => {
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      event.returnValue = true;
    };

    if (alertOnExit) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [alertOnExit]);

  // #region User Events
  const eventAnnotationHandler = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    if (Object.keys(target.dataset).includes('userEventTracking')) {
      userEventsHandler?.({
        actionName: `${e.type} on ${target.dataset?.userEventTracking}`,
      });
    }
  }, []);

  useEffect(() => {
    if (userEventsToTrack?.length > 0 && userEventsHandler) {
      const wrapper = document.getElementById('eb-component');
      userEventsToTrack.forEach((evt) =>
        wrapper?.addEventListener(evt, eventAnnotationHandler)
      );

      return () => {
        userEventsToTrack.forEach((evt) =>
          wrapper?.removeEventListener(evt, eventAnnotationHandler)
        );
      };
    }
    return () => {
      // Cleanup logic here (if needed)
    };
  }, []);

  useEnableDTRUMTracking({
    userEmail: 'test@test.com',
    DOMElementToTrack: 'embedded-component-layout',
    eventsToTrack: ['click', 'blur'],
  });
  // #endregion

  return (
    <OnboardingContext.Provider
      value={{
        ...props,
        clientData,
        setClientId,
        organizationType,
        enableSidebar,
      }}
    >
      <div
        id="embedded-component-layout"
        className={cn(
          'eb-component eb-mx-auto eb-flex eb-max-w-screen-sm eb-flex-1 eb-flex-col eb-bg-background eb-p-4 eb-pb-6 eb-font-sans eb-text-foreground eb-antialiased sm:eb-p-10 sm:eb-pb-12',
          {
            'eb-max-w-screen-lg': enableSidebar,
          }
        )}
        style={{ minHeight: height }}
        key={initialClientId}
      >
        {/* TODO: replace with actual screens / skeletons */}
        {clientGetError ? (
          <ServerErrorAlert error={clientGetError} />
        ) : clientGetStatus === 'pending' &&
          initialClientId &&
          !props.docUploadOnlyMode ? (
          <FormLoadingState
            message={t('onboarding-overview:fetchingClientData')}
          />
        ) : (
          <FlowProvider
            initialScreenId={
              props.docUploadOnlyMode
                ? 'upload-documents-section'
                : organizationType
                  ? 'overview'
                  : 'gateway'
            }
            flowConfig={flowConfig}
          >
            <FlowRenderer />
          </FlowProvider>
        )}
      </div>
    </OnboardingContext.Provider>
  );
};

// Memoize the FlowRenderer component to ensure consistent hook order
const FlowRenderer: React.FC = React.memo(() => {
  const { clientData, organizationType, docUploadOnlyMode, enableSidebar } =
    useOnboardingContext();
  const {
    currentScreenId,
    goTo,
    sessionData,
    updateSessionData,
    sections,
    savedFormValues,
    currentStepperStepId,
    currentStepperGoTo,
    setCurrentStepperStepIdFallback,
    isFormSubmitting,
  } = useFlowContext();

  const { sectionStatuses, stepValidations } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  const isMobile = useIsMobile();

  // Scroll to top on step change
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentScreenId]);

  // Redirect to gateway if organization type is not set
  useEffect(() => {
    if (
      docUploadOnlyMode &&
      !['upload-documents-section', 'document-upload-form'].includes(
        currentScreenId
      )
    ) {
      goTo('upload-documents-section', { resetHistory: true });
    } else if (
      !docUploadOnlyMode &&
      !organizationType &&
      currentScreenId !== 'gateway'
    ) {
      goTo('gateway', { resetHistory: true });
    }
  }, [currentScreenId, docUploadOnlyMode, organizationType]);

  // Clear mocked verifying state after a timeout
  useEffect(() => {
    if (sessionData.mockedVerifyingSectionId) {
      const timeout = setTimeout(() => {
        updateSessionData({
          mockedVerifyingSectionId: undefined,
        });
      }, 1500);

      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [sessionData.mockedVerifyingSectionId]);

  const screen = flowConfig.screens.find((s) => s.id === currentScreenId);
  // Memoize the rendered screen to help prevent hook ordering issues
  const renderScreen = useCallback(() => {
    if (!screen) {
      return <div>Unknown screen id: {currentScreenId}</div>;
    }

    if (screen.type === 'component') {
      const Comp = screen.Component;
      return <Comp key={currentScreenId} />;
    }

    if (screen.type === 'stepper') {
      return <StepperRenderer key={screen.id} {...screen.stepperConfig} />;
    }

    return <div>Unhandled screen error</div>;
  }, [screen, currentScreenId]);

  return (
    <div
      className="eb-flex eb-flex-1 eb-scroll-mt-44 eb-gap-6 sm:eb-scroll-mt-48"
      ref={mainRef}
      key={clientData?.id}
    >
      {!isMobile && enableSidebar && (
        <div className="eb-shrink-0">
          <OnboardingTimeline
            className="eb-w-64 eb-rounded-lg eb-border eb-py-2 eb-shadow-sm lg:eb-w-80"
            title="Onboarding Progress"
            disableInteraction={isFormSubmitting}
            currentSectionId={currentScreenId}
            currentStepId={currentStepperStepId}
            onSectionClick={(screenId) => {
              const section = sections.find((s) => s.id === screenId);
              if (!section) {
                goTo(screenId);
                return;
              }
              const existingPartyData = getPartyByAssociatedPartyFilters(
                clientData,
                section.stepperConfig?.associatedPartyFilters
              );

              const firstInvalidStep = stepValidations[section.id]
                ? section.stepperConfig?.steps.find((step) => {
                    return (
                      stepValidations[section.id][step.id] &&
                      !stepValidations[section.id][step.id].isValid
                    );
                  })?.id
                : undefined;

              const targetStepId =
                firstInvalidStep ??
                section.stepperConfig?.steps[0].id ??
                undefined;

              if (screenId === currentScreenId && targetStepId) {
                currentStepperGoTo(targetStepId);
                return;
              }

              goTo(screenId, {
                initialStepperStepId: firstInvalidStep,
                editingPartyId: existingPartyData?.id,
                previouslyCompleted:
                  sectionStatuses[section.id] === 'completed',
              });
              setCurrentStepperStepIdFallback(targetStepId);
            }}
            onStepClick={(sectionId, stepId) => {
              if (sectionId === currentScreenId) {
                currentStepperGoTo(stepId);
              } else {
                goTo(sectionId);
              }
            }}
            sections={[
              {
                id: 'gateway',
                title: 'Business type',
                status: organizationType ? 'completed' : 'not_started',
                steps: [],
              },
              ...sections.map((section) => ({
                ...section,
                status: sectionStatuses[section.id] || 'not_started',
                title:
                  section.sectionConfig.shortLabel ??
                  section.sectionConfig.label,
                steps: (section.stepperConfig?.steps ?? []).map(
                  (step) =>
                    ({
                      ...step,
                      status:
                        step.id === 'documents'
                          ? 'on_hold'
                          : stepValidations[section.id][step.id].isValid
                            ? 'completed'
                            : step.stepType === 'check-answers'
                              ? 'on_hold'
                              : 'not_started',
                    }) as TimelineStep
                ),
              })),
            ]}
          />
        </div>
      )}
      <div className="eb-min-w-0 eb-flex-1">{renderScreen()}</div>
    </div>
  );
});
