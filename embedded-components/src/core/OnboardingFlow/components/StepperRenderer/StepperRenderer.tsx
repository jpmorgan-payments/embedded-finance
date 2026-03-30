import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, MenuIcon } from 'lucide-react';
import { useFormState } from 'react-hook-form';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  PartyResponse,
  UpdateClientRequestSmbdoAddPartiesItem,
} from '@/api/generated/smbdo.schemas';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { StepLayout, StepsReviewCards } from '@/core/OnboardingFlow/components';
import { partyFieldMap } from '@/core/OnboardingFlow/config';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
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
import { getPartyByAssociatedPartyFilters } from '@/core/OnboardingFlow/utils/dataUtils';
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

type StepperRendererProps = StepperConfig & {
  buttonsOverride?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary';
  }>;
};

export const StepperRenderer: React.FC<StepperRendererProps> = ({
  steps,
  getDefaultPartyRequestBody,
}) => {
  const { clientData, organizationType } = useOnboardingContext();
  const { t } = useTranslationWithTokens('onboarding-overview');

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
  } = useFlowContext();

  const editingPartyId = editingPartyIds[currentScreenId];

  const existingPartyData = clientData?.parties?.find(
    (party) => party.id === editingPartyId
  );

  const setExistingPartyData = (partyData: PartyResponse | undefined) => {
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
      goTo('overview');
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
            sectionLabel: nextSection.sectionConfig.label,
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
        sectionLabel: prevSection?.sectionConfig.label,
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

  return (
    <div
      ref={mainRef}
      className="eb-flex eb-min-h-full eb-scroll-mt-44 eb-flex-col sm:eb-scroll-mt-48"
    >
      <StepLayout
        title={currentStep.title}
        description={currentStep.description}
        subTitle={
          !checkAnswersMode && !previouslyCompleted && !reviewMode ? (
            <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between eb-text-sm">
              <div>
                <span className="eb-mr-2 eb-border-r eb-border-r-foreground eb-pr-2">
                  {shortLabelOverride ??
                    currentSection?.sectionConfig.shortLabel ??
                    currentSection?.sectionConfig.label}
                </span>
                <span className="eb-font-medium">
                  {t('stepperRenderer.stepCounter', {
                    currentStepNumber,
                    totalSteps: steps.length,
                  })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goTo('overview')}
              >
                {t('stepperRenderer.buttons.overviewHeader')}
                <MenuIcon />
              </Button>
            </div>
          ) : undefined
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
  defaultPartyRequestBody?: Partial<UpdateClientRequestSmbdoAddPartiesItem>;
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
    if (
      Component.updateAnotherPartyOnSubmit &&
      clientData &&
      !(
        Component.updateAnotherPartyOnSubmit.getCondition &&
        !Component.updateAnotherPartyOnSubmit.getCondition(clientData)
      )
    ) {
      const targetParty = getPartyByAssociatedPartyFilters(
        clientData,
        Component.updateAnotherPartyOnSubmit.partyFilters
      );
      if (targetParty && targetParty.id) {
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
          }
        );
      }
    }

    // Client data exists - therefore we are adding or updating a party
    if (clientData) {
      // ---------------------------------------------------------------
      // Country-of-residence change → deactivate + recreate party
      // ---------------------------------------------------------------
      // The API requires a fresh party when countryOfResidence changes
      // because identity documents are country-specific.  We:
      //   1. PATCH the old party with { active: false }
      //   2. POST addParties with the old party's data minus IDs
      //   3. Update editingPartyId to point to the new party
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
                  addParties: [defaultPartyRequestBody ?? {}],
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

                    if (newParty) {
                      setExistingPartyData(newParty);
                    }

                    // Clear saved form values so the identity step
                    // re-derives defaults from the new party.
                    saveFormValue(
                      'controllerIds' as keyof OnboardingFormValuesSubmit,
                      undefined
                    );

                    // Wait for the query cache to settle so that
                    // clientData (and therefore existingPartyData)
                    // reflects the new party before the next step mounts.
                    const queryKey = getSmbdoGetClientQueryKey(clientData.id);
                    queryClient.setQueryData(queryKey, response);
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
        return; // Exit early — the nested callbacks handle navigation
      }

      // Updating an existing party (no country change)
      if (existingPartyData && existingPartyData.id) {
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
            onSuccess: async (response) => {
              const queryKey = getSmbdoGetClientQueryKey(clientData.id);

              // Update client cache with party data
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
              // Wait for the query cache to settle so that
              // clientData reflects the update before the next step mounts.
              await queryClient.invalidateQueries({
                queryKey,
              });
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
      }
      // No existing party - Create a new party
      else {
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
              if (newParty) {
                setExistingPartyData(newParty);
              }

              // Wait for the query cache to settle so that
              // clientData reflects the new party before the next step mounts.
              const queryKey = getSmbdoGetClientQueryKey(clientData.id);
              queryClient.setQueryData(queryKey, response);
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
      }
    }
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
