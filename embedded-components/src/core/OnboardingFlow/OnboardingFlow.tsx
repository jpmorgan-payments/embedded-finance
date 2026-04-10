import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useEnableDTRUMTracking } from '@/utils/useDTRUMAction';

import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  useClientId,
  useInterceptorStatus,
} from '@/core/EBComponentsProvider/EBComponentsProvider';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';

import {
  FormLoadingState,
  OnboardingTimeline,
  TimelineSection,
  TimelineStep,
} from './components';
import { DisclosureFooter } from './components/DisclosureFooter/DisclosureFooter';
import { StepperRenderer } from './components/StepperRenderer/StepperRenderer';
import { flowConfig } from './config/flowConfig';
import { FlowProvider, useFlowContext } from './contexts/FlowContext';
import {
  OnboardingContext,
  useOnboardingContext,
} from './contexts/OnboardingContext';
import { ONBOARDING_FLOW_USER_JOURNEYS } from './OnboardingFlow.constants';
import { OnboardingFlowProps } from './types/onboarding.types';
import {
  getFlowProgress,
  getStepperValidation,
  getStepperValidations,
} from './utils/flowUtils';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  alertOnExit = false,
  alertOnPreviousStep = false,
  userEventsHandler,
  userEventsLifecycle,
  height,
  onGetClientSettled,
  hideSidebar = false,
  ...props
}) => {
  const providerClientId = useClientId();
  const [clientId, setClientId] = useState(providerClientId ?? '');

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

  // Set clientId when provider clientId changes
  useEffect(() => {
    setClientId(providerClientId ?? '');
  }, [providerClientId]);

  const existingOrgParty = getOrganizationParty(clientData);

  const organizationType =
    existingOrgParty?.organizationDetails?.organizationType;

  const { t } = useTranslationWithTokens(['onboarding-overview']);

  // #region User Events
  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'embedded-component-layout',
    userEventsHandler,
    userEventsLifecycle,
  });

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
        alertOnExit,
        alertOnPreviousStep,
        clientData,
        clientGetStatus,
        setClientId,
        organizationType,
        hideSidebar,
        userEventsHandler,
        userEventsLifecycle,
      }}
    >
      <div
        id="embedded-component-layout"
        className={cn(
          'eb-component eb-mx-auto eb-flex eb-max-w-screen-sm eb-flex-1 eb-flex-col eb-bg-background eb-p-4 eb-pb-6 eb-font-sans eb-text-foreground eb-antialiased sm:eb-p-10 sm:eb-pb-12',
          {
            'eb-max-w-screen-lg': !hideSidebar,
          }
        )}
        style={{ minHeight: height }}
        key={clientId}
      >
        {/* TODO: replace with actual screens / skeletons */}
        {clientGetError ? (
          <ServerErrorAlert error={clientGetError} />
        ) : clientGetStatus === 'pending' &&
          clientId &&
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
        <DisclosureFooter />
      </div>
    </OnboardingContext.Provider>
  );
};

// Memoize the FlowRenderer component to ensure consistent hook order
const FlowRenderer: React.FC = React.memo(() => {
  const { t } = useTranslationWithTokens(['onboarding-overview']);
  const {
    clientData,
    organizationType,
    docUploadOnlyMode,
    hideSidebar,
    showLinkAccountStep,
    userEventsHandler,
  } = useOnboardingContext();
  const {
    currentScreenId,
    originScreenId,
    goTo,
    sessionData,
    updateSessionData,
    sections,
    staticScreens,
    editingPartyIds,
    savedFormValues,
    currentStepperStepId,
    currentStepperGoTo,
    setCurrentStepperStepIdFallback,
    isFormSubmitting,
  } = useFlowContext();

  // When viewing a sub-screen (e.g. owner-stepper), highlight its parent
  // section in the sidebar instead of leaving no section highlighted.
  const sidebarSectionId = sections.some((s) => s.id === currentScreenId)
    ? currentScreenId
    : (originScreenId ?? currentScreenId);

  // Owner sidebar data — supports the list view (each owner by name)
  // and the edit view (current owner's form steps).
  const isInOwnerStepper = currentScreenId === 'owner-stepper';
  const ownerStepperConfig = staticScreens.find(
    (s) => s.id === 'owner-stepper'
  )?.stepperConfig;

  const activeOwners = ownerStepperConfig
    ? (clientData?.parties?.filter(
        (p) =>
          p.active &&
          p.partyType === 'INDIVIDUAL' &&
          p.roles?.includes('BENEFICIAL_OWNER')
      ) ?? [])
    : [];

  const ownerValidations = ownerStepperConfig
    ? getStepperValidations(
        ownerStepperConfig.steps,
        activeOwners,
        clientData,
        savedFormValues,
        'owner-stepper'
      )
    : {};

  const editingOwnerParty = isInOwnerStepper
    ? clientData?.parties?.find(
        (p) => p.id === editingPartyIds['owner-stepper']
      )
    : undefined;
  const ownerStepValidation =
    isInOwnerStepper && ownerStepperConfig
      ? getStepperValidation(
          ownerStepperConfig.steps,
          editingOwnerParty ?? {},
          clientData,
          savedFormValues,
          'owner-stepper'
        )
      : undefined;

  const { sectionStatuses, stepValidations } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  // Fetch existing linked accounts to determine sidebar status
  const { data: recipientsData } = useGetAllRecipients(
    { type: 'LINKED_ACCOUNT' },
    {
      query: {
        enabled: !!showLinkAccountStep,
      },
    }
  );

  const hasExistingLinkedAccount = !!recipientsData?.recipients?.some(
    (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
  );

  // Scroll to top on step change and track navigation
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Track screen navigation
    if (userEventsHandler) {
      trackUserEvent({
        actionName: ONBOARDING_FLOW_USER_JOURNEYS.SCREEN_NAVIGATION,
        metadata: { screenId: currentScreenId },
        userEventsHandler,
      });
    }
  }, [currentScreenId, userEventsHandler]);

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
      return (
        <div>
          {t('onboarding-overview:errors.unknownScreenId', {
            screenId: currentScreenId,
          })}
        </div>
      );
    }

    if (screen.type === 'component') {
      const Comp = screen.Component;
      return <Comp key={currentScreenId} />;
    }

    if (screen.type === 'stepper') {
      return <StepperRenderer key={screen.id} {...screen.stepperConfig} />;
    }

    return <div>{t('onboarding-overview:errors.unhandledScreenError')}</div>;
  }, [screen, currentScreenId, t]);

  return (
    <div
      className="eb-flex eb-flex-1 eb-scroll-mt-44 eb-gap-6 eb-@container sm:eb-scroll-mt-48"
      ref={mainRef}
      key={clientData?.id}
    >
      {!hideSidebar && (
        <div className="eb-hidden eb-shrink-0 @3xl:eb-block">
          <OnboardingTimeline
            className="eb-w-64 eb-rounded-lg eb-border eb-py-2 eb-shadow-sm lg:eb-w-80"
            title={t('onboarding-overview:documentUpload.onboardingProgress')}
            disableInteraction={isFormSubmitting}
            currentSectionId={sidebarSectionId}
            currentStepId={currentStepperStepId}
            onSectionClick={(screenId) => {
              const section = sections.find((s) => s.id === screenId);
              if (!section || section.type !== 'stepper') {
                goTo(screenId, {
                  resetHistory: true,
                });
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
                firstInvalidStep ?? section.stepperConfig?.steps.at(-1)?.id;

              if (screenId === currentScreenId && targetStepId) {
                currentStepperGoTo(targetStepId);
                return;
              }

              goTo(screenId, {
                resetHistory: true,
                initialStepperStepId: firstInvalidStep,
                editingPartyId: existingPartyData?.id,
                previouslyCompleted:
                  sectionStatuses[section.id] === 'completed',
              });
              setCurrentStepperStepIdFallback(targetStepId);
            }}
            onStepClick={(sectionId, stepId) => {
              // Editing an owner: sidebar steps are the owner's form steps
              if (isInOwnerStepper && sectionId === 'owners-section') {
                currentStepperGoTo(stepId);
                return;
              }
              // Owners list: clicking an owner name opens their editor
              if (
                currentScreenId === 'owners-section' &&
                sectionId === 'owners-section'
              ) {
                const validation = ownerValidations[stepId];
                const firstInvalidStep = ownerStepperConfig?.steps.find(
                  (step) =>
                    validation?.stepValidationMap[step.id] &&
                    !validation.stepValidationMap[step.id].isValid
                )?.id;
                goTo('owner-stepper', {
                  editingPartyId: stepId,
                  previouslyCompleted: !!validation?.allStepsValid,
                  shortLabelOverride: 'Edit owner',
                  initialStepperStepId: firstInvalidStep,
                });
                return;
              }
              // Same section: navigate within the active stepper
              if (sectionId === currentScreenId) {
                currentStepperGoTo(stepId);
                return;
              }
              // Different section
              goTo(sectionId, { resetHistory: true });
            }}
            sections={[
              {
                id: 'gateway',
                title: t('onboarding-overview:flowRenderer.businessType'),
                status:
                  organizationType && clientData?.status !== 'NEW'
                    ? 'completed_disabled'
                    : organizationType
                      ? 'completed'
                      : 'not_started',
                steps: [],
              },
              ...sections.map((section) => {
                // When a section creates a party (has getDefaultPartyRequestBody),
                // lock steps beyond the first until the party exists.
                // Step 1 collects countryOfResidence — required for party creation —
                // so skipping it would cause the API call to fail.
                const sectionParty = section.stepperConfig
                  ?.associatedPartyFilters
                  ? getPartyByAssociatedPartyFilters(
                      clientData,
                      section.stepperConfig.associatedPartyFilters
                    )
                  : undefined;
                const partyRequiredButMissing =
                  !!section.stepperConfig?.getDefaultPartyRequestBody &&
                  !sectionParty?.id;

                // Owners section: owner-aware sidebar steps.
                if (section.id === 'owners-section') {
                  // Editing a specific owner → show their form steps
                  if (
                    isInOwnerStepper &&
                    ownerStepperConfig &&
                    ownerStepValidation
                  ) {
                    const ownerPartyMissing = !editingOwnerParty?.id;
                    return {
                      ...section,
                      status: sectionStatuses[section.id] || 'not_started',
                      title:
                        section.sectionConfig.shortLabel ??
                        section.sectionConfig.label,
                      steps: ownerStepperConfig.steps.map(
                        (step, stepIndex) =>
                          ({
                            ...step,
                            status:
                              stepIndex > 0 && ownerPartyMissing
                                ? 'on_hold'
                                : ownerStepValidation.stepValidationMap[step.id]
                                      ?.isValid
                                  ? 'completed'
                                  : step.stepType === 'check-answers'
                                    ? 'on_hold'
                                    : 'not_started',
                          }) as TimelineStep
                      ),
                    };
                  }

                  // List view → show each active owner by name
                  return {
                    ...section,
                    status: sectionStatuses[section.id] || 'not_started',
                    title:
                      section.sectionConfig.shortLabel ??
                      section.sectionConfig.label,
                    steps: activeOwners.map((owner) => {
                      const validation = owner.id
                        ? ownerValidations[owner.id]
                        : undefined;
                      return {
                        id: owner.id ?? '',
                        title: getPartyName(owner) || 'Owner',
                        status: validation?.allStepsValid
                          ? 'completed'
                          : 'missing_details',
                      } as TimelineStep;
                    }),
                  };
                }

                return {
                  ...section,
                  status: sectionStatuses[section.id] || 'not_started',
                  title:
                    section.sectionConfig.shortLabel ??
                    section.sectionConfig.label,
                  steps: (section.stepperConfig?.steps ?? []).map(
                    (step, stepIndex) =>
                      ({
                        ...step,
                        status:
                          step.id === 'documents'
                            ? 'on_hold'
                            : stepIndex > 0 && partyRequiredButMissing
                              ? 'on_hold'
                              : stepValidations[section.id][step.id].isValid
                                ? 'completed'
                                : step.stepType === 'check-answers'
                                  ? 'on_hold'
                                  : 'not_started',
                      }) as TimelineStep
                  ),
                };
              }),
              ...(showLinkAccountStep
                ? ([
                    {
                      id: 'link-account',
                      title: t('onboarding-overview:flowRenderer.linkAccount'),
                      status: hasExistingLinkedAccount
                        ? 'completed_disabled'
                        : clientData?.status === 'APPROVED'
                          ? 'not_started'
                          : 'on_hold',
                      steps: [],
                    },
                  ] satisfies TimelineSection[])
                : []),
            ]}
          />
        </div>
      )}
      <div className="eb-min-w-0 eb-flex-1">{renderScreen()}</div>
    </div>
  );
});
