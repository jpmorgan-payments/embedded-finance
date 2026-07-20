import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import type { ParseKeys } from 'i18next';
import { ArrowLeftIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useFormState } from 'react-hook-form';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  CreatePartyRequestInline,
  PartyResponse,
  UpdatePartyRequestInline,
} from '@/api/generated/smbdo.schemas';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Badge, Button, Form } from '@/components/ui';
import { StepLayout, StepsReviewCards } from '@/core/OnboardingFlow/components';
import { partyFieldMap } from '@/core/OnboardingFlow/config';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import {
  OnboardingFormValuesInitial,
  OnboardingFormValuesSubmit,
} from '@/core/OnboardingFlow/types';
import {
  FormStepComponent,
  StepConfig,
  StepperConfig,
  StepperStepProps,
  StepValidationMap,
} from '@/core/OnboardingFlow/types/flow.types';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { shouldSuppressOnboardingLeaveWarnings } from '@/core/OnboardingFlow/utils/flowLeaveWarnings';
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  useFormWithFilters,
} from '@/core/OnboardingFlow/utils/formUtils';

type AddPartyItem = CreatePartyRequestInline & UpdatePartyRequestInline;

type StepperRendererProps = StepperConfig & {
  buttonsOverride?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary';
  }>;
};

export const StepperRenderer: React.FC<StepperRendererProps> = ({
  steps: rawSteps,
  getDefaultPartyRequestBody,
}) => {
  const { clientData, organizationType, alertOnPreviousStep } =
    useOnboardingContext();
  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  const resolveStepTitle = (step: StepConfig) => {
    return t(step.titleKey as any);
  };

  const resolveStepDescription = (step: StepConfig) => {
    if (step.descriptionKey) {
      return t(step.descriptionKey as any);
    }
    return undefined;
  };

  // Filter out steps whose isVisible predicate returns false
  const orgParty = getOrganizationParty(clientData);
  const visibleSteps = rawSteps.filter(
    (step) => step.isVisible?.({ orgParty }) ?? true
  );

  const {
    currentScreenId,
    goTo,
    goBack,
    originScreenId,
    editingPartyIds,
    updateEditingPartyId,
    previouslyCompleted,
    updateSessionData,
    initialStepperStepId,
    setCurrentStepper,
    sections,
    shortLabelOverride,
    savedFormValues,
    setCurrentStepperStepIdFallback,
    setIsFormSubmitting,
    unsavedChangesRef,
    deltaModeActive,
  } = useFlowContext();

  // Delta mode merges Review + Terms & conditions into a single combined
  // "Review & attest" step (rendered by ReviewForm), so the standalone Terms
  // ("documents") step is dropped from the review-attest-section stepper.
  const steps = visibleSteps.filter(
    (step) =>
      !(
        deltaModeActive &&
        currentScreenId === 'review-attest-section' &&
        step.id === 'documents'
      )
  );

  const editingPartyId = editingPartyIds[currentScreenId];

  // Holds the most recent party returned by a submit mutation. It bridges the
  // brief window between writing the mutation response into the query cache and
  // that update propagating back down through `clientData` (which comes from
  // the parent's useSmbdoGetClient observer). Without it, advancing to the
  // check-answers step — which re-validates each step against `clientData` —
  // renders one stale frame where the just-completed step momentarily looks
  // incomplete before flipping to completed.
  const [lastSubmittedParty, setLastSubmittedParty] = useState<
    PartyResponse | undefined
  >();

  // When flowEntry navigates directly to a section, editingPartyId may not
  // yet be set.  Fall back to the section's associatedPartyFilters (same
  // logic the sidebar uses when opening a section).
  const currentSectionConfig = sections.find((s) => s.id === currentScreenId);
  const partyDataFromCache = editingPartyId
    ? clientData?.parties?.find((party) => party.id === editingPartyId)
    : getPartyByAssociatedPartyFilters(
        clientData,
        currentSectionConfig?.stepperConfig?.associatedPartyFilters
      );

  // Prefer the freshly-submitted party while the cache update is still
  // propagating. Only applied when it matches the party currently being
  // edited, so switching parties/sections falls back to the cache.
  const existingPartyData =
    lastSubmittedParty && lastSubmittedParty.id === editingPartyId
      ? { ...partyDataFromCache, ...lastSubmittedParty }
      : partyDataFromCache;

  // Once the cache-derived party reflects the latest write, drop the bridge so
  // the query cache remains the single source of truth. `partyDataFromCache`
  // only changes reference when the party actually changes (React Query
  // structural sharing), so this fires exactly when propagation completes.
  // Intentionally keyed only on `partyDataFromCache` — adding
  // `lastSubmittedParty` would clear the bridge before propagation finishes.
  useEffect(() => {
    if (lastSubmittedParty) {
      setLastSubmittedParty(undefined);
    }
  }, [partyDataFromCache]);

  const setExistingPartyData = (partyData: PartyResponse | undefined) => {
    setLastSubmittedParty(partyData);
    updateEditingPartyId(currentScreenId, partyData?.id);
  };

  const [checkAnswersStepId, setCheckAnswersStepId] = useState<string | null>(
    null
  );
  const checkAnswersMode = checkAnswersStepId !== null;
  const reviewMode = originScreenId === 'review-attest-section';

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const currentStepper = useStepper({
    initialStep: previouslyCompleted
      ? steps[steps.length - 1].id
      : (initialStepperStepId ?? steps[0].id),
  });
  const {
    current: currentStep,
    goTo: stepperGoTo,
    next: stepperNext,
    prev: stepperPrev,
  } = currentStepper;

  useEffect(() => {
    setCurrentStepper(currentStepper);
  }, [currentStepper]);

  if (!currentStep) {
    return <div>{t('stepperRenderer.noStepsFound')}</div>;
  }

  const currentStepNumber = stepperUtils.getIndex(currentStep.id) + 1;
  const formStepCount = steps.filter(
    (s) => s.stepType !== 'check-answers'
  ).length;
  const isCheckAnswersStep = currentStep.stepType === 'check-answers';
  // Delta mode renders the review step as a single combined "Review & attest"
  // page (review summary + terms), so give it a fitting title and drop the
  // "Step 1 of 1" counter.
  const isDeltaReviewStep =
    deltaModeActive &&
    currentScreenId === 'review-attest-section' &&
    currentStep.id === 'review';
  const currentSection = sections.find(
    (section) => section.id === currentScreenId
  );
  const currentSectionIndex = sections.findIndex(
    (section) => section.id === currentScreenId
  );
  const nextSection =
    currentSectionIndex !== -1 ? sections[currentSectionIndex + 1] : undefined;
  const nextSectionPartyData = getPartyByAssociatedPartyFilters(
    clientData,
    nextSection?.stepperConfig?.associatedPartyFilters
  );
  const prevSection =
    currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : undefined;
  const prevSectionPartyData = getPartyByAssociatedPartyFilters(
    clientData,
    prevSection?.stepperConfig?.associatedPartyFilters
  );

  const canNavigateToPrevSection =
    currentSectionIndex > 0 &&
    currentStepNumber === 1 &&
    !checkAnswersMode &&
    !reviewMode &&
    originScreenId === prevSection?.id;

  const handleNext = () => {
    setIsFormSubmitting(false);
    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
      setCurrentStepperStepIdFallback(checkAnswersStepId);
      setCheckAnswersStepId(null);
    } else if (reviewMode) {
      goTo('review-attest-section', {
        reviewScreenOpenedSectionId: currentSection?.id,
      });
    } else if (currentStepNumber < steps.length) {
      stepperNext();
      setCurrentStepperStepIdFallback(steps[currentStepNumber].id);
    } else if (
      currentStep.stepType === 'check-answers' &&
      previouslyCompleted
    ) {
      goTo('overview');
      updateSessionData({
        mockedVerifyingSectionId: currentScreenId,
      });
    } else if (originScreenId === 'owners-section') {
      goTo('owners-section');
    } else if (
      currentScreenId === 'review-attest-section' &&
      currentStep.id === 'documents'
    ) {
      goTo('overview', { resetHistory: true });
    } else {
      goTo(nextSection?.id ?? 'overview', {
        editingPartyId: nextSectionPartyData.id,
      });
      stepperGoTo(steps[0].id);
      setCurrentStepperStepIdFallback(steps[0].id);
    }
  };

  const getNextButtonLabel = () => {
    if (checkAnswersMode || reviewMode) {
      return t('stepperRenderer.buttons.save');
    }
    if (currentStep.stepType === 'check-answers' && previouslyCompleted) {
      return null;
    }
    if (
      currentStep.stepType === 'check-answers' &&
      originScreenId === 'owners-section'
    ) {
      return t('stepperRenderer.buttons.returnToAllOwnersOverview');
    }
    if (currentStep.stepType === 'check-answers') {
      return nextSection
        ? t('stepperRenderer.buttons.continueToSection', {
            sectionLabel: tString(nextSection.sectionConfig.labelKey as any),
          })
        : t('stepperRenderer.buttons.continueToNextSection');
    }
    if (
      currentScreenId === 'review-attest-section' &&
      currentStep.id === 'documents'
    ) {
      return t('stepperRenderer.buttons.agreeAndFinish');
    }
    return t('stepperRenderer.buttons.continue');
  };

  const handlePrev = () => {
    const willInvokeFlowGoBack =
      !checkAnswersMode &&
      !reviewMode &&
      originScreenId === 'owners-section' &&
      currentScreenId !== 'review-attest-section' &&
      (currentStepNumber === 1 || currentStep.stepType === 'check-answers');

    if (
      alertOnPreviousStep &&
      !willInvokeFlowGoBack &&
      !shouldSuppressOnboardingLeaveWarnings(clientData) &&
      unsavedChangesRef.current &&
      // eslint-disable-next-line no-alert -- optional UX parity with native leave warnings; no modal primitive here
      !window.confirm(tString('stepperRenderer.previousStepDataLossWarning'))
    ) {
      return;
    }

    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
      setCurrentStepperStepIdFallback(checkAnswersStepId);
      setCheckAnswersStepId(null);
    } else if (reviewMode) {
      goTo('review-attest-section', {
        reviewScreenOpenedSectionId: currentSection?.id,
      });
    } else if (
      originScreenId === 'owners-section' &&
      currentScreenId !== 'review-attest-section' &&
      (currentStepNumber === 1 || currentStep.stepType === 'check-answers')
    ) {
      goBack();
    } else if (
      currentStep.stepType === 'check-answers' &&
      previouslyCompleted
    ) {
      goTo('overview');
    } else if (canNavigateToPrevSection) {
      goTo(prevSection.id, {
        editingPartyId: prevSectionPartyData.id,
        initialStepperStepId: prevSection.stepperConfig?.steps.at(-1)?.id,
      });
    } else if (currentScreenId === 'review-attest-section') {
      goTo('overview');
    } else {
      stepperPrev();
      setCurrentStepperStepIdFallback(steps[currentStepNumber - 2].id);
    }
  };

  const getPrevButtonLabel = () => {
    if (currentStep.stepType === 'form' && (checkAnswersMode || reviewMode)) {
      return t('stepperRenderer.buttons.cancel');
    }
    if (currentStep.stepType === 'check-answers' && previouslyCompleted) {
      if (originScreenId === 'owners-section') {
        return t('stepperRenderer.buttons.backToAllOwnersOverview');
      }
      return t('stepperRenderer.buttons.returnToOverview');
    }
    if (canNavigateToPrevSection) {
      return t('stepperRenderer.buttons.backToSection', {
        sectionLabel: tString(prevSection?.sectionConfig.labelKey as any),
      });
    }
    return t('stepperRenderer.buttons.previous');
  };

  const prevButtonDisabled =
    currentStepNumber === 1 &&
    !checkAnswersMode &&
    !reviewMode &&
    originScreenId !== 'owners-section' &&
    !canNavigateToPrevSection;

  const { stepValidationMap } = getStepperValidation(
    steps,
    existingPartyData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  // Scroll to top on step change
  const mainRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep.id]);

  const sharedProps: StepperStepProps = {
    handlePrev,
    handleNext,
    getPrevButtonLabel,
    getNextButtonLabel,
    prevButtonDisabled,
  };

  let ownersSectionLabel: ReturnType<typeof t>;
  if (currentSection?.sectionConfig.shortLabelKey) {
    ownersSectionLabel = t(
      currentSection.sectionConfig
        .shortLabelKey as ParseKeys<'onboarding-overview'>
    );
  } else if (currentSection?.sectionConfig.labelKey) {
    ownersSectionLabel = t(
      currentSection.sectionConfig.labelKey as ParseKeys<'onboarding-overview'>
    );
  } else {
    ownersSectionLabel =
      t('onboarding-overview:screens.ownersSection.shortLabel') ??
      t('onboarding-overview:screens.ownersSection.label');
  }

  let currentSectionLabel: ReturnType<typeof t> | undefined;
  if (currentSection?.sectionConfig.shortLabelKey) {
    currentSectionLabel = t(
      currentSection.sectionConfig
        .shortLabelKey as ParseKeys<'onboarding-overview'>
    );
  } else if (currentSection?.sectionConfig.labelKey) {
    currentSectionLabel = t(
      currentSection.sectionConfig.labelKey as ParseKeys<'onboarding-overview'>
    );
  } else {
    currentSectionLabel = undefined;
  }

  return (
    <div
      ref={mainRef}
      className="eb-flex eb-min-h-full eb-scroll-mt-44 eb-flex-col sm:eb-scroll-mt-48"
    >
      <StepLayout
        title={
          isDeltaReviewStep
            ? t(
                'screens.reviewAttestSection.deltaCombined.title',
                'Review & attest'
              )
            : resolveStepTitle(currentStep)
        }
        description={
          isDeltaReviewStep
            ? t(
                'screens.reviewAttestSection.deltaCombined.description',
                'Check your details, review the terms, and submit your application.'
              )
            : resolveStepDescription(currentStep)
        }
        subTitle={
          <div className="eb-flex eb-flex-col">
            <nav className="eb-flex eb-items-center eb-gap-1 eb-text-sm eb-text-muted-foreground">
              <Button
                type="button"
                variant="link"
                onClick={() => goTo('overview')}
                className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
              >
                <ArrowLeftIcon className="eb-size-3.5" />
                {t('stepperRenderer.buttons.overviewHeader')}
              </Button>
              {originScreenId === 'owners-section' && (
                <>
                  <ChevronRightIcon className="eb-size-3.5" />
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => goBack()}
                    className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
                  >
                    {ownersSectionLabel}
                  </Button>
                </>
              )}
              <ChevronRightIcon className="eb-size-3.5" />
              <span className="eb-truncate">
                {shortLabelOverride ?? currentSectionLabel}
              </span>
              {!isCheckAnswersStep && !isDeltaReviewStep && (
                <>
                  <ChevronRightIcon className="eb-size-3.5" />
                  <span className="eb-shrink-0 eb-font-medium eb-text-foreground">
                    {t('stepperRenderer.stepCounter', {
                      currentStepNumber,
                      totalSteps: formStepCount,
                    })}
                  </span>
                </>
              )}
            </nav>
            {originScreenId === 'owners-section' && (
              <div className="eb-mt-4 eb-flex eb-items-center eb-gap-2">
                <span className="eb-truncate eb-text-base eb-font-semibold eb-text-foreground">
                  {getPartyName(existingPartyData) ||
                    t('stepperRenderer.newOwnerLabel')}
                </span>
                {existingPartyData?.roles?.includes('BENEFICIAL_OWNER') && (
                  <Badge
                    variant="outline"
                    className="eb-shrink-0 eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                  >
                    {t('onboarding-overview:screens.owners.badges.owner')}
                  </Badge>
                )}
                {existingPartyData?.roles?.includes('CONTROLLER') && (
                  <Badge
                    variant="outline"
                    className="eb-shrink-0 eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                  >
                    {t('onboarding-overview:screens.owners.badges.controller')}
                  </Badge>
                )}
              </div>
            )}
          </div>
        }
      >
        {currentStep.stepType === 'form' && (
          <StepperFormStep
            key={`${currentStep.id}-${existingPartyData?.id ?? 'new'}`}
            currentStepId={currentStep.id}
            Component={currentStep.Component}
            defaultPartyRequestBody={getDefaultPartyRequestBody?.(
              organizationType
            )}
            existingPartyData={existingPartyData}
            setExistingPartyData={setExistingPartyData}
            {...sharedProps}
          />
        )}
        {currentStep.stepType === 'check-answers' && (
          <CheckAnswersStep
            key={currentStep.id}
            steps={steps}
            stepValidationMap={stepValidationMap}
            onEditClick={(stepId) => {
              setCheckAnswersStepId(currentStep.id);
              stepperGoTo(stepId);
            }}
            existingPartyData={existingPartyData}
            {...sharedProps}
          />
        )}
        {currentStep.stepType === 'static' && currentStep.Component && (
          <currentStep.Component key={currentStep.id} {...sharedProps} />
        )}
      </StepLayout>
    </div>
  );
};

interface StepperFormStepProps extends StepperStepProps {
  currentStepId: string;
  Component: FormStepComponent;
  existingPartyData: PartyResponse | undefined;
  setExistingPartyData: (partyData: PartyResponse | undefined) => void;
  defaultPartyRequestBody?: Partial<CreatePartyRequestInline>;
}

const StepperFormStep: React.FC<StepperFormStepProps> = ({
  currentStepId,
  Component,
  existingPartyData,
  setExistingPartyData,
  defaultPartyRequestBody,
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
  prevButtonDisabled = false,
}) => {
  const queryClient = useQueryClient();
  const { clientData, onPostClientSettled, onPostPartySettled } =
    useOnboardingContext();
  const {
    savedFormValues,
    saveFormValue,
    currentScreenId,
    isFormSubmitting: isFormSubmittingContext,
    setIsFormSubmitting,
  } = useFlowContext();

  const formValuesFromResponse = existingPartyData
    ? convertPartyResponseToFormValues(existingPartyData)
    : {};

  // formValuesFromResponse already has controllerIds.issuer normalised
  // to match countryOfResidence (done in convertPartyResponseToFormValues),
  // so we simply layer saved context underneath the API response.
  const overrideDefaultValues: Partial<OnboardingFormValuesInitial> = {
    ...savedFormValues,
    ...formValuesFromResponse,
  };

  // For adding a new party to the client
  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClientLegacy();

  // For updating an existing party
  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
  } = useUpdatePartyLegacy();

  const isMutationPending =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  // Keep the form disabled while async onSuccess callbacks (e.g.
  // queryClient.invalidateQueries) are still running.  The mutation
  // status flips to 'success' before those awaits finish, so we
  // manually hold the submitting flag until handleNext() clears it.
  useEffect(() => {
    if (isMutationPending) {
      setIsFormSubmitting(true);
    }
  }, [isMutationPending]);

  // Use the context-level flag so the form stays disabled through
  // both the mutation and the subsequent cache refresh.
  const isFormSubmitting = isFormSubmittingContext || isMutationPending;

  const form = useFormWithFilters({
    clientData,
    screenId: currentScreenId,
    schema:
      typeof Component?.schema === 'function'
        ? Component.schema()
        : Component.schema,
    refineSchemaFn: Component.refineSchemaFn,
    overrideDefaultValues,
    disabled: isFormSubmitting,
  });

  const { isDirty } = useFormState({ control: form.control });

  useFlowUnsavedChangesSync(isDirty);

  // Optionally update a second party (e.g. the org) alongside the current one.
  const submitAnotherPartyUpdate = (
    modifiedValues: Partial<OnboardingFormValuesSubmit>
  ) => {
    if (
      !Component.updateAnotherPartyOnSubmit ||
      !clientData ||
      (Component.updateAnotherPartyOnSubmit.getCondition &&
        !Component.updateAnotherPartyOnSubmit.getCondition(clientData))
    ) {
      return;
    }

    const targetParty = getPartyByAssociatedPartyFilters(
      clientData,
      Component.updateAnotherPartyOnSubmit.partyFilters
    );
    if (!targetParty?.id) {
      return;
    }

    const updatedValues =
      Component.updateAnotherPartyOnSubmit.getValues(modifiedValues);
    updateParty(
      {
        partyId: targetParty.id,
        data: generatePartyRequestBody(updatedValues, {}),
      },
      {
        onSettled: (data, error) => {
          onPostPartySettled?.(data, error?.response?.data);
        },
        onSuccess: () => {
          // Refresh the client so client-level fields (e.g.
          // outstanding.questionIds) reflect this party change. The
          // party response can't carry client-level state.
          queryClient.invalidateQueries({
            queryKey: getSmbdoGetClientQueryKey(clientData.id),
          });
        },
      }
    );
  };

  // Country-of-residence change → deactivate + recreate party.
  // The API requires a fresh party when countryOfResidence changes
  // because identity documents are country-specific.  We:
  //   1. PATCH the old party with { active: false }
  //   2. POST addParties with the old party's data minus IDs
  //   3. Update editingPartyId to point to the new party
  const recreatePartyForCountryChange = (
    modifiedValues: Partial<OnboardingFormValuesSubmit>
  ) => {
    if (!clientData || !existingPartyData?.id) {
      return;
    }

    // Step 1: deactivate the old party
    updateParty(
      {
        partyId: existingPartyData.id,
        data: { active: false },
      },
      {
        onSettled: (_data, error) => {
          onPostPartySettled?.(_data, error?.response?.data);
        },
        onSuccess: () => {
          // Step 2: build a new party from the *entire* existing party,
          // overlaid with the current form submission (which carries the
          // new countryOfResidence), but excluding identity documents
          // (the user must re-enter them for the new country).
          const fullPartyFormValues =
            convertPartyResponseToFormValues(existingPartyData);

          // Merge: existing party data as base, current form on top
          const merged = {
            ...fullPartyFormValues,
            ...modifiedValues,
          };

          // Strip identity-related fields — they're country-specific
          // (birthDate is kept because it isn't country-specific)
          const {
            controllerIds: _ids,
            solePropSsn: _ssn,
            ...valuesWithoutIds
          } = merged;

          const clientRequestBody = generateClientRequestBody(
            valuesWithoutIds as Partial<OnboardingFormValuesSubmit>,
            0,
            'addParties',
            {
              // Carry over the existing party's top-level fields
              // (roles, partyType, email) so the recreated party
              // preserves them. generateClientRequestBody only maps
              // form fields into individualDetails/orgDetails, so
              // these must be set explicitly on the base object.
              addParties: [
                {
                  partyType: existingPartyData.partyType,
                  roles: existingPartyData.roles,
                  ...(existingPartyData.email && {
                    email: existingPartyData.email,
                  }),
                },
              ] as AddPartyItem[],
            }
          );

          updateClient(
            {
              id: clientData.id,
              data: clientRequestBody,
            },
            {
              onSettled: (data, err) => {
                onPostClientSettled?.(data, err?.response?.data);
              },
              onSuccess: async (response) => {
                // Find the newly-created party
                const oldPartyIds = clientData.parties?.map((p) => p.id);
                const newParty = response.parties?.find(
                  (p) => !oldPartyIds?.includes(p.id)
                );

                // Clear saved form values so the identity step
                // re-derives defaults from the new party.
                saveFormValue(
                  'controllerIds' as keyof OnboardingFormValuesSubmit,
                  undefined
                );

                // Update the cache BEFORE updating the editing party ID
                // so that when the sidebar re-renders with the new ID,
                // the party already exists in clientData (preventing a
                // brief "New owner" flash).
                const queryKey = getSmbdoGetClientQueryKey(clientData.id);
                queryClient.setQueryData(queryKey, response);

                if (newParty) {
                  setExistingPartyData(newParty);
                }

                await queryClient.invalidateQueries({ queryKey });
                handleNext();
              },
              onError: (err) => {
                setIsFormSubmitting(false);
                if (err.response?.data.context) {
                  const apiFormErrors = mapClientApiErrorsToFormErrors(
                    err.response.data.context,
                    0,
                    'addParties'
                  );
                  setApiFormErrors(form, apiFormErrors);
                }
              },
            }
          );
        },
        onError: (error) => {
          setIsFormSubmitting(false);
          if (error.response?.data.context) {
            const apiFormErrors = mapPartyApiErrorsToFormErrors(
              error.response.data.context
            );
            setApiFormErrors(form, apiFormErrors);
          }
        },
      }
    );
  };

  // Updating an existing party (no country change).
  const updateExistingParty = (
    modifiedValues: Partial<OnboardingFormValuesSubmit>
  ) => {
    if (!clientData || !existingPartyData?.id) {
      return;
    }

    const partyRequestBody = generatePartyRequestBody(modifiedValues, {});

    // Check if the form is dirty - if not, skip the update
    if (!isDirty) {
      handleNext();
      return;
    }

    updateParty(
      {
        partyId: existingPartyData.id,
        data: partyRequestBody,
      },
      {
        onSettled: (data, error) => {
          onPostPartySettled?.(data, error?.response?.data);
        },
        onSuccess: (response) => {
          const queryKey = getSmbdoGetClientQueryKey(clientData.id);

          // Optimistically merge the updated party so the UI updates
          // synchronously without a flash.
          queryClient.setQueryData(
            queryKey,
            (prev: ClientResponse | undefined) => ({
              ...prev,
              parties: prev?.parties?.map((party) => {
                if (party.id === response.id) {
                  return response;
                }
                return party;
              }),
            })
          );
          setExistingPartyData(response);

          // Then invalidate to refresh client-level fields (e.g.
          // outstanding.questionIds) that the party response can't
          // carry. The background refetch returns identical party
          // data, so there's no visible flash.
          queryClient.invalidateQueries({ queryKey });
          handleNext();
        },
        onError: (error) => {
          setIsFormSubmitting(false);
          if (error.response?.data.context) {
            const apiFormErrors = mapPartyApiErrorsToFormErrors(
              error.response.data.context
            );
            setApiFormErrors(form, apiFormErrors);
          }
        },
      }
    );
  };

  // No existing party - create a new party on the client.
  const createNewParty = (
    modifiedValues: Partial<OnboardingFormValuesSubmit>
  ) => {
    if (!clientData) {
      return;
    }

    const clientRequestBody = generateClientRequestBody(
      modifiedValues,
      0,
      'addParties',
      {
        addParties: [defaultPartyRequestBody ?? {}],
      }
    );
    updateClient(
      {
        id: clientData.id,
        data: clientRequestBody,
      },
      {
        onSettled: (data, error) => {
          onPostClientSettled?.(data, error?.response?.data);
        },
        async onSuccess(response) {
          // Find the newly-created party
          const oldPartyIds = clientData.parties?.map((party) => party.id);
          const newParty = response.parties?.find(
            (party) => !oldPartyIds?.includes(party.id)
          );

          // Update the cache BEFORE updating the editing party ID
          // so that when the sidebar re-renders with the new ID,
          // the party already exists in clientData.
          const queryKey = getSmbdoGetClientQueryKey(clientData.id);
          queryClient.setQueryData(queryKey, response);

          if (newParty) {
            setExistingPartyData(newParty);
          }

          await queryClient.invalidateQueries({
            queryKey,
          });

          handleNext();
        },
        onError: (error) => {
          setIsFormSubmitting(false);
          if (error.response?.data.context) {
            const apiFormErrors = mapClientApiErrorsToFormErrors(
              error.response.data.context,
              0,
              'addParties'
            );
            setApiFormErrors(form, apiFormErrors);
          }
        },
      }
    );
  };

  const onSubmit = form.handleSubmit((values) => {
    Object.entries(values).forEach(([key, value]) => {
      const fieldKey = key as keyof OnboardingFormValuesSubmit;
      const fieldConfig = partyFieldMap[fieldKey];
      if (fieldConfig?.saveResponseInContext) {
        saveFormValue(fieldKey, value);
      }
    });

    // Perform step-defined transformations on the form values
    const modifiedValues = Component.modifyFormValuesBeforeSubmit
      ? Component.modifyFormValuesBeforeSubmit(values, existingPartyData)
      : values;

    // Update another party if needed
    submitAnotherPartyUpdate(modifiedValues);

    // Without client data there's nothing to add or update
    if (!clientData) {
      return;
    }

    const submittedCountry = modifiedValues.countryOfResidence as
      | string
      | undefined;
    const previousCountry =
      existingPartyData?.individualDetails?.countryOfResidence;
    const countryChanged =
      !!submittedCountry &&
      !!previousCountry &&
      submittedCountry !== previousCountry;

    if (existingPartyData?.id && countryChanged) {
      recreatePartyForCountryChange(modifiedValues);
      return; // Exit early — the nested callbacks handle navigation
    }

    if (existingPartyData?.id) {
      updateExistingParty(modifiedValues);
      return;
    }

    createNewParty(modifiedValues);
  });

  return (
    <Form {...form} key={currentStepId}>
      <form
        id={currentStepId}
        onSubmit={onSubmit}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-flex-auto">
          <Component currentPartyData={existingPartyData} />
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <ServerErrorAlert error={clientUpdateError || partyUpdateError} />
          <div className="eb-flex eb-flex-col eb-gap-3">
            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={isFormSubmitting}
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getNextButtonLabel() === null,
              })}
            >
              {isFormSubmitting && <Loader2Icon className="eb-animate-spin" />}
              {getNextButtonLabel()}
            </Button>
            <Button
              type="button"
              onClick={handlePrev}
              variant="secondary"
              size="lg"
              disabled={isFormSubmitting || prevButtonDisabled}
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getPrevButtonLabel() === null,
              })}
            >
              {getPrevButtonLabel()}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

interface CheckAnswersStepProps extends StepperStepProps {
  steps: StepConfig[];
  stepValidationMap: StepValidationMap;
  onEditClick: (stepId: string) => void;
  existingPartyData: PartyResponse | undefined;
}

export const CheckAnswersStep: React.FC<CheckAnswersStepProps> = ({
  steps,
  onEditClick,
  existingPartyData,
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  return (
    <div className="eb-flex-auto">
      <div className="eb-mt-6 eb-h-full eb-space-y-6">
        <StepsReviewCards
          steps={steps}
          partyData={existingPartyData}
          onEditClick={onEditClick}
        />
      </div>
      <div className="eb-mt-6 eb-space-y-6">
        <div className="eb-flex eb-flex-col eb-gap-3">
          <Button
            onClick={handleNext}
            variant="default"
            size="lg"
            className={cn('eb-w-full eb-text-lg', {
              'eb-hidden': getNextButtonLabel() === null,
            })}
          >
            {getNextButtonLabel()}
          </Button>
          <Button
            onClick={handlePrev}
            variant="secondary"
            size="lg"
            className={cn('eb-w-full eb-text-lg', {
              'eb-hidden': getPrevButtonLabel() === null,
            })}
          >
            {getPrevButtonLabel()}
          </Button>
        </div>
      </div>
    </div>
  );
};
