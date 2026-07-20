import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';
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
import {
  buildDeltaSectionSummaries,
  collectBaselineDeltaPendingGroups,
  computeCompletedDeltaPendingGroupKeys,
  countDeltaQuestionProgress,
  isDeltaQuestionAnswered,
} from './screens/ReviewAndAttestSectionForms/ReviewForm/DeltaPendingFieldsPanel';
import { OnboardingFlowProps } from './types/onboarding.types';
import { isDeltaModeActive, scrollToDeltaSection } from './utils/deltaMode';
import {
  getFlowProgress,
  getStepperValidation,
  getStepperValidations,
} from './utils/flowUtils';
import { getLinkAccountEnabled } from './utils/getLinkAccountEnabled';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  alertOnExit = false,
  alertOnPreviousStep = false,
  userEventsHandler,
  userEventsLifecycle,
  height,
  onGetClientSettled,
  hideSidebar = false,
  flowEntry,
  ...props
}) => {
  const providerClientId = useClientId();
  const [clientId, setClientId] = useState(providerClientId ?? '');

  // Force sidebar hidden in docUploadOnlyMode
  const effectiveHideSidebar = hideSidebar || !!props.docUploadOnlyMode;

  const {
    data: clientData,
    status: clientGetStatus,
    error: clientGetError,
  } = useSmbdoGetClient(clientId, {
    query: {
      enabled: !!clientId,
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

  const canUseFlowEntry =
    !!flowEntry && !props.docUploadOnlyMode && !!organizationType;

  // When PTC is enabled but unanswered, route back to gateway so user can
  // confirm publicly-traded status before proceeding to overview.
  // Only applies to existing clients (loaded via providerClientId), not
  // freshly-created ones that just went through gateway in this session.
  const ptcAnswered = !!existingOrgParty?.organizationDetails?.publiclyTraded;
  const needsPTCGateway =
    !!props.enablePubliclyTradedCompanies &&
    !!providerClientId &&
    !!organizationType &&
    !ptcAnswered;

  const deltaModeEligible =
    !props.docUploadOnlyMode &&
    !!organizationType &&
    !needsPTCGateway &&
    isDeltaModeActive(props.deltaMode, clientData);

  const flowProviderInitialScreenId = props.docUploadOnlyMode
    ? 'upload-documents-section'
    : deltaModeEligible
      ? 'overview'
      : canUseFlowEntry
        ? flowEntry.screenId
        : organizationType && !needsPTCGateway
          ? 'overview'
          : 'gateway';

  const flowProviderSeedStepperStepId =
    canUseFlowEntry && flowEntry.stepperStepId ? flowEntry.stepperStepId : null;

  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  // #region User Events
  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'embedded-component-layout',
    userEventsHandler,
    userEventsLifecycle,
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
        hideSidebar: effectiveHideSidebar,
        userEventsHandler,
        userEventsLifecycle,
      }}
    >
      <main
        id="embedded-component-layout"
        aria-label={tString('onboarding-overview:mainLandmarkLabel')}
        className={cn(
          'eb-component eb-mx-auto eb-flex eb-max-w-screen-sm eb-flex-1 eb-flex-col eb-bg-background eb-p-4 eb-pb-6 eb-font-sans eb-text-foreground eb-antialiased sm:eb-p-10 sm:eb-pb-12',
          {
            'eb-max-w-screen-lg': !effectiveHideSidebar,
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
            initialScreenId={flowProviderInitialScreenId}
            flowConfig={flowConfig}
            seedInitialStepperStepId={flowProviderSeedStepperStepId}
            deltaModeActive={deltaModeEligible}
          >
            <FlowRenderer />
          </FlowProvider>
        )}
        <DisclosureFooter />
      </main>
    </OnboardingContext.Provider>
  );
};

// Memoize the FlowRenderer component to ensure consistent hook order
const FlowRenderer: React.FC = React.memo(() => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  // Resolve step title through content tokens at render time using titleKey.
  const resolveStepTitle = (step: { id: string; titleKey: string }) => {
    return t(step.titleKey as any) as string;
  };

  const {
    clientData,
    organizationType,
    docUploadOnlyMode,
    hideSidebar,
    showLinkAccountStep,
    linkAccountEnabledStatuses,
    linkAccountStepOptions,
    enablePubliclyTradedCompanies,
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
    liveReviewFormValues,
    deltaModeActive,
    currentStepperStepId,
    currentStepperGoTo,
    setCurrentStepperStepIdFallback,
    isFormSubmitting,
  } = useFlowContext();

  // When viewing a sub-screen (e.g. owner-stepper), highlight its parent
  // section in the sidebar instead of leaving no section highlighted.
  // Only sub-screens should fall back — top-level screens like overview
  // should not inherit the previous section.
  const isSubScreen =
    currentScreenId === 'owner-stepper' ||
    currentScreenId === 'document-upload-form';

  // PTC unanswered: lock sidebar sections so user must answer PTC first.
  const orgParty = getOrganizationParty(clientData);
  const ptcAnsweredInSession = !!sessionData.isPTCQuestionAnswered;
  const needsPTCGateway =
    !!enablePubliclyTradedCompanies &&
    !!clientData?.id &&
    !!organizationType &&
    !orgParty?.organizationDetails?.publiclyTraded &&
    !ptcAnsweredInSession;

  const sidebarSectionId = sections.some((s) => s.id === currentScreenId)
    ? currentScreenId
    : isSubScreen
      ? (originScreenId ?? currentScreenId)
      : currentScreenId;

  // Sidebar section-timeline progress/validation use saved values (stable) so
  // they don't re-validate on every keystroke. The delta timeline consumes live
  // values directly in its own memo above.
  const progressFormValues = savedFormValues;

  const deriveOwnerData = () => {
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
          progressFormValues,
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
            progressFormValues,
            'owner-stepper'
          )
        : undefined;

    // True when the owner stepper is open but no saved party exists yet
    // (e.g. the user just pressed "Add owner").
    const isAddingNewOwner =
      isInOwnerStepper &&
      !activeOwners.some((o) => o.id === editingPartyIds['owner-stepper']);

    return {
      isInOwnerStepper,
      ownerStepperConfig,
      activeOwners,
      ownerValidations,
      editingOwnerParty,
      ownerStepValidation,
      isAddingNewOwner,
    };
  };

  const {
    isInOwnerStepper,
    ownerStepperConfig,
    activeOwners,
    ownerValidations,
    editingOwnerParty,
    ownerStepValidation,
    isAddingNewOwner,
    // Not memoized: deriveOwnerData() transitively calls step schema hooks
    // (Component.schema() -> useGetValidationMessage -> useFormContext). React
    // 19 warns when hooks run inside useMemo, so this is computed at the top
    // level of render — the same uncached pattern StepperRenderer and
    // StepsReviewCards already use. The schema hooks only read context, so
    // recomputing per render is safe.
  } = deriveOwnerData();

  const { sectionStatuses, stepValidations } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  const linkAccountEnabled = getLinkAccountEnabled(
    clientData,
    linkAccountEnabledStatuses
  );

  // Fetch existing linked accounts to determine sidebar status
  const { data: recipientsData } = useGetAllRecipients(
    { type: 'LINKED_ACCOUNT', clientId: clientData?.id },
    {
      query: {
        enabled: !!showLinkAccountStep && !!clientData?.id,
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
  // Include the editing party id so the stepper remounts when switching owners.
  const editingPartyIdForScreen = editingPartyIds[currentScreenId];

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
  }, [screen, currentScreenId, editingPartyIdForScreen, t]);

  // ---------------------------------------------------------------
  // Freeze the sidebar snapshot while a form mutation is in flight.
  // This prevents any intermediate data states (deactivated parties,
  // new parties not yet linked, etc.) from flashing in the sidebar.
  // ---------------------------------------------------------------
  const timelineCurrentStepId = isInOwnerStepper
    ? isAddingNewOwner
      ? '__new-owner__'
      : editingPartyIds['owner-stepper']
    : currentStepperStepId;

  const timelineCurrentSubStepId = isInOwnerStepper
    ? currentStepperStepId
    : undefined;

  const buildTimelineSections = (): TimelineSection[] => [
    {
      id: 'gateway',
      title: t('onboarding-overview:flowRenderer.businessType'),
      status:
        organizationType && clientData?.status !== 'NEW'
          ? 'completed_disabled'
          : organizationType && !needsPTCGateway
            ? 'completed'
            : 'not_started',
      steps: [],
    },
    ...sections.map((section) => {
      // When a section creates a party (has getDefaultPartyRequestBody),
      // lock steps beyond the first until the party exists.
      // Step 1 collects countryOfResidence — required for party creation —
      // so skipping it would cause the API call to fail.
      const sectionParty = section.stepperConfig?.associatedPartyFilters
        ? getPartyByAssociatedPartyFilters(
            clientData,
            section.stepperConfig.associatedPartyFilters
          )
        : undefined;
      const partyRequiredButMissing =
        !!section.stepperConfig?.getDefaultPartyRequestBody &&
        !sectionParty?.id;

      // Owners section: always show owner names with
      // form sub-steps expanded under the owner being edited.
      if (section.id === 'owners-section') {
        return {
          ...section,
          status: needsPTCGateway
            ? 'on_hold'
            : sectionStatuses[section.id] || 'not_started',
          title: t(
            (section.sectionConfig.shortLabelKey ??
              section.sectionConfig.labelKey) as any
          ),
          steps: [
            ...activeOwners.map((owner) => {
              const isEditingThisOwner =
                isInOwnerStepper &&
                owner.id === editingPartyIds['owner-stepper'];
              const validation = owner.id
                ? ownerValidations[owner.id]
                : undefined;

              return {
                id: owner.id ?? '',
                title: getPartyName(owner) || 'Owner',
                status: validation?.allStepsValid
                  ? 'completed'
                  : 'missing_details',
                isExpanded: isEditingThisOwner,
                subSteps:
                  isEditingThisOwner &&
                  ownerStepperConfig &&
                  ownerStepValidation
                    ? ownerStepperConfig.steps.map((step, stepIndex) => ({
                        id: step.id,
                        title: resolveStepTitle(step),
                        status:
                          stepIndex > 0 && !editingOwnerParty?.id
                            ? ('on_hold' as const)
                            : ownerStepValidation.stepValidationMap[step.id]
                                  ?.isValid
                              ? ('completed' as const)
                              : step.stepType === 'check-answers'
                                ? ('on_hold' as const)
                                : ('not_started' as const),
                      }))
                    : undefined,
              } as TimelineStep;
            }),
            // Synthetic placeholder when adding a brand-new owner
            // (party not yet created in the backend).
            ...(isAddingNewOwner && ownerStepperConfig
              ? [
                  {
                    id: '__new-owner__',
                    title: 'New owner',
                    status: 'not_started' as const,
                    isExpanded: true,
                    subSteps: ownerStepperConfig.steps.map(
                      (step, stepIndex) => ({
                        id: step.id,
                        title: resolveStepTitle(step),
                        status:
                          stepIndex > 0
                            ? ('on_hold' as const)
                            : ownerStepValidation?.stepValidationMap[step.id]
                                  ?.isValid
                              ? ('completed' as const)
                              : step.stepType === 'check-answers'
                                ? ('on_hold' as const)
                                : ('not_started' as const),
                      })
                    ),
                  } as TimelineStep,
                ]
              : []),
          ],
        };
      }

      return {
        ...section,
        status: needsPTCGateway
          ? 'on_hold'
          : sectionStatuses[section.id] || 'not_started',
        title: t(
          (section.sectionConfig.shortLabelKey ??
            section.sectionConfig.labelKey) as any
        ),
        steps: (section.stepperConfig?.steps ?? []).map((step, stepIndex) => {
          // Check if this static step was explicitly
          // completed and recorded in session data.
          const isCompletedStaticStep =
            step.stepType === 'static' &&
            (sessionData.completedStaticStepIds ?? []).includes(step.id);

          return {
            ...step,
            title: resolveStepTitle(step),
            status:
              stepIndex > 0 && partyRequiredButMissing
                ? 'on_hold'
                : stepValidations[section.id][step.id].isValid ||
                    isCompletedStaticStep
                  ? 'completed'
                  : step.stepType === 'check-answers' ||
                      step.stepType === 'static'
                    ? 'on_hold'
                    : 'not_started',
          } as TimelineStep;
        }),
      };
    }),
    ...(showLinkAccountStep
      ? ([
          {
            id: 'link-account',
            title: t('onboarding-overview:flowRenderer.linkAccount'),
            status: (() => {
              if (!linkAccountEnabled) {
                return hasExistingLinkedAccount
                  ? 'completed_disabled'
                  : 'on_hold';
              }
              if (linkAccountStepOptions?.allowMultipleAccounts) {
                return 'not_started';
              }
              if (!hasExistingLinkedAccount) {
                return 'not_started';
              }
              return 'completed_disabled';
            })(),
            steps: [],
          },
        ] satisfies TimelineSection[])
      : []),
  ];

  // Delta completion view: swap the section timeline for a delta-specific
  // journey — "Complete your details" (with a checklist of what's outstanding)
  // followed by the combined "Review & attest" stage. Delta mode merges the
  // review + terms into a single step, so the journey is exactly two steps.
  // Derived synchronously (no effect) so the sidebar shows the right timeline
  // on first paint.
  //
  // collectBaselineDeltaPendingGroups + computeCompletedDeltaPendingGroupKeys
  // transitively call step schema hooks (getStepperValidation ->
  // Component.schema() -> useGetValidationMessage -> useFormContext). They MUST
  // run UNCONDITIONALLY at the top level of render — the same number of times
  // every render, on every screen. Gating them behind showDeltaTimeline (which
  // depends on sessionData.overviewViewMode / currentScreenId) changes the hook
  // count when toggling delta -> full view or navigating screens, tripping
  // "change in the order of Hooks". React 19 also warns when hooks run inside
  // useMemo, so a plain top-level call is used. The schema hooks only read
  // context, so recomputing per render is safe.
  const deltaTimelineOwnerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];
  const deltaTimelineBaselineGroups = collectBaselineDeltaPendingGroups({
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps: deltaTimelineOwnerSteps,
  });
  const deltaTimelineLiveOverlay = {
    ...savedFormValues,
    ...(liveReviewFormValues ?? {}),
  };
  const deltaTimelineCompletedKeys = computeCompletedDeltaPendingGroupKeys({
    baselinePendingGroups: deltaTimelineBaselineGroups,
    sections,
    clientData,
    ownerSteps: deltaTimelineOwnerSteps,
    liveOverlay: deltaTimelineLiveOverlay,
    currentScreenId,
  });

  const deltaTimelineSections: TimelineSection[] | undefined = (() => {
    const onOverview = currentScreenId === 'overview';
    const onReviewAttest = currentScreenId === 'review-attest-section';
    const showDeltaTimeline =
      deltaModeActive &&
      (onOverview || onReviewAttest) &&
      sessionData.overviewViewMode !== 'full';
    if (!showDeltaTimeline) {
      return undefined;
    }
    const baselineGroups = deltaTimelineBaselineGroups;
    const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
    // On the overview delta view, only show the delta timeline when there are
    // actually outstanding items. On the combined Review & attest step the
    // details are already saved (so nothing may remain pending) — keep showing
    // the 2-step delta journey there regardless.
    if (
      onOverview &&
      baselineGroups.length === 0 &&
      outstandingQuestionIds.length === 0
    ) {
      return undefined;
    }
    const completedKeys = deltaTimelineCompletedKeys;
    // Count questions individually (parent + revealed children). The timeline
    // has no fetched question tree, so children can't be resolved here — pass
    // `allQuestions: []` and the count falls back to the outstanding roots,
    // which is the right granularity for the sidebar's single "details" step.
    const questionProgress = countDeltaQuestionProgress({
      rootQuestionIds: outstandingQuestionIds.map(String),
      allQuestions: [],
      getAnswerValues: (id) => liveReviewFormValues?.[`question_${id}`],
      isAnswered: (id) => isDeltaQuestionAnswered(liveReviewFormValues, id),
    });
    const summaries = buildDeltaSectionSummaries({
      baselinePendingGroups: baselineGroups,
      completedGroupKeys: completedKeys,
      sections,
      questionProgress,
      clientData,
      tString,
    });
    const allComplete =
      summaries.length > 0 && summaries.every((s) => s.completed >= s.total);
    // Once on the Review & attest step, the details stage is behind us.
    const detailsComplete = onReviewAttest || allComplete;

    return [
      {
        id: 'complete-your-details',
        title: t(
          'screens.overview.deltaView.timeline.completeTitle',
          'Complete your details'
        ),
        status: detailsComplete ? 'completed' : 'missing_details',
        steps: summaries.map((summary) => ({
          id: summary.key,
          title: summary.title,
          status:
            onReviewAttest || summary.completed >= summary.total
              ? 'completed'
              : 'not_started',
        })),
      },
      {
        id: 'review-attest-section',
        title: t('screens.reviewAttestSection.label', 'Review and attest'),
        // Active (current) on the review step; locked while still completing
        // details on the overview.
        status: onReviewAttest ? 'not_started' : 'on_hold',
        steps: [],
      },
    ] satisfies TimelineSection[];
  })();

  const isDeltaTimeline = !!deltaTimelineSections;
  const timelineSections = deltaTimelineSections ?? buildTimelineSections();
  const effectiveSidebarSectionId = isDeltaTimeline
    ? currentScreenId === 'review-attest-section'
      ? 'review-attest-section'
      : 'complete-your-details'
    : sidebarSectionId;

  const frozenSidebarRef = useRef({
    sectionId: effectiveSidebarSectionId,
    stepId: timelineCurrentStepId,
    subStepId: timelineCurrentSubStepId,
    sections: timelineSections,
  });
  if (!isFormSubmitting) {
    frozenSidebarRef.current = {
      sectionId: effectiveSidebarSectionId,
      stepId: timelineCurrentStepId,
      subStepId: timelineCurrentSubStepId,
      sections: timelineSections,
    };
  }

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
            title={
              isDeltaTimeline
                ? t(
                    'screens.overview.deltaView.timeline.title',
                    'Your application'
                  )
                : t('onboarding-overview:documentUpload.onboardingProgress')
            }
            disableInteraction={isFormSubmitting}
            currentSectionId={frozenSidebarRef.current.sectionId}
            currentStepId={frozenSidebarRef.current.stepId}
            currentSubStepId={frozenSidebarRef.current.subStepId}
            onSectionClick={(screenId) => {
              if (isDeltaTimeline) {
                // From the combined "Review & attest" step, clicking the
                // completed "Complete your details" stage returns to the
                // overview so the user can adjust their answers. Otherwise the
                // active/locked stages have nothing to navigate to.
                if (
                  screenId === 'complete-your-details' &&
                  currentScreenId === 'review-attest-section'
                ) {
                  goTo('overview');
                }
                return;
              }
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
              if (isDeltaTimeline) {
                // Checklist items scroll to their group card and flash it.
                scrollToDeltaSection(stepId);
                return;
              }
              // Owners section: clicking an owner name opens their editor
              if (sectionId === 'owners-section') {
                // Already editing this exact owner (or new-owner placeholder)
                if (
                  isInOwnerStepper &&
                  (editingPartyIds['owner-stepper'] === stepId ||
                    (stepId === '__new-owner__' && isAddingNewOwner))
                ) {
                  return;
                }
                // Ignore clicks on the synthetic "New owner" placeholder
                if (stepId === '__new-owner__') return;

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
                  initialStepperStepId:
                    firstInvalidStep ?? ownerStepperConfig?.steps.at(-1)?.id,
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
            onSubStepClick={(_sectionId, ownerPartyId, subStepId) => {
              // Sub-step click within the owner's expanded form steps
              if (
                isInOwnerStepper &&
                (editingPartyIds['owner-stepper'] === ownerPartyId ||
                  (ownerPartyId === '__new-owner__' && isAddingNewOwner))
              ) {
                // Already editing this owner — just jump to the form step
                currentStepperGoTo(subStepId);
              } else if (ownerPartyId !== '__new-owner__') {
                // Navigate to this owner and open the requested step
                goTo('owner-stepper', {
                  editingPartyId: ownerPartyId,
                  initialStepperStepId: subStepId,
                });
              }
            }}
            sections={frozenSidebarRef.current.sections}
          />
        </div>
      )}
      <div className="eb-min-w-0 eb-flex-1">{renderScreen()}</div>
    </div>
  );
});
