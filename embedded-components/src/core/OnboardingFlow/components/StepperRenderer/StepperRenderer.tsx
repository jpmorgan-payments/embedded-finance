import { useEffect, useRef, useState } from 'react';
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
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { Button, Form } from '@/components/ui';
import {
  ServerErrorAlert,
  StepLayout,
  StepsReviewCards,
} from '@/core/OnboardingFlow/components';
import { partyFieldMap } from '@/core/OnboardingFlow/config';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types';
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
    sections,
    shortLabelOverride,
    savedFormValues,
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
  const {
    current: currentStep,
    goTo: stepperGoTo,
    next: stepperNext,
    prev: stepperPrev,
  } = useStepper({
    initialStep: previouslyCompleted
      ? steps[steps.length - 1].id
      : (initialStepperStepId ?? steps[0].id),
  });

  if (!currentStep) {
    return <div>No steps found</div>;
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
    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
      setCheckAnswersStepId(null);
    } else if (reviewMode) {
      goTo('review-attest-section', {
        reviewScreenOpenedSectionId: currentSection?.id,
      });
    } else if (currentStepNumber < steps.length) {
      stepperNext();
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
    }
  };

  const getNextButtonLabel = () => {
    if (checkAnswersMode || reviewMode) {
      return 'Save';
    }
    if (currentStep.stepType === 'check-answers' && previouslyCompleted) {
      return null;
    }
    if (
      currentStep.stepType === 'check-answers' &&
      originScreenId === 'owners-section'
    ) {
      return 'Return to all owners overview';
    }
    if (currentStep.stepType === 'check-answers') {
      return nextSection
        ? `Continue to ${nextSection.sectionConfig.label}`
        : 'Continue to next section';
    }
    if (
      currentScreenId === 'review-attest-section' &&
      currentStep.id === 'documents'
    ) {
      return 'Agree and finish';
    }
    return 'Continue';
  };

  const handlePrev = () => {
    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
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
      });
    } else if (currentScreenId === 'review-attest-section') {
      goTo('overview');
    } else {
      stepperPrev();
    }
  };

  const getPrevButtonLabel = () => {
    if (currentStep.stepType === 'form' && (checkAnswersMode || reviewMode)) {
      return 'Cancel';
    }
    if (currentStep.stepType === 'check-answers' && previouslyCompleted) {
      if (originScreenId === 'owners-section') {
        return 'Back to all owners overview';
      }
      return 'Return to overview';
    }
    if (canNavigateToPrevSection) {
      return `Back to ${prevSection?.sectionConfig.label}`;
    }
    return 'Previous';
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
                  Step {currentStepNumber} of {steps.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goTo('overview')}
              >
                Overview
                <MenuIcon />
              </Button>
            </div>
          ) : undefined
        }
      >
        {currentStep.stepType === 'form' && (
          <StepperFormStep
            key={currentStep.id}
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
  defaultPartyRequestBody?: Partial<PartyResponse>;
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
  const { savedFormValues, saveFormValue, currentScreenId } = useFlowContext();

  const formValuesFromResponse = existingPartyData
    ? convertPartyResponseToFormValues(existingPartyData)
    : {};

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

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const form = useFormWithFilters({
    clientData,
    screenId: currentScreenId,
    schema:
      typeof Component?.schema === 'function'
        ? Component.schema()
        : Component.schema,
    refineSchemaFn: Component.refineSchemaFn,
    overrideDefaultValues: { ...savedFormValues, ...formValuesFromResponse },
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
    if (Component.updateAnotherPartyOnSubmit && clientData) {
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
      // Updating an existing party
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
            onSuccess: (response) => {
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
              queryClient.invalidateQueries({
                queryKey,
              });
              setExistingPartyData(response);
              handleNext();
            },
            onError: (error) => {
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
            onSuccess(response) {
              // Find the newly-created party
              const oldPartyIds = clientData.parties?.map((party) => party.id);
              const newParty = response.parties?.find(
                (party) => !oldPartyIds?.includes(party.id)
              );
              if (newParty) {
                setExistingPartyData(newParty);
              }

              // Set query data
              const queryKey = getSmbdoGetClientQueryKey(clientData.id);
              queryClient.setQueryData(queryKey, response);
              queryClient.invalidateQueries({
                queryKey,
              });

              handleNext();
            },
            onError: (error) => {
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
