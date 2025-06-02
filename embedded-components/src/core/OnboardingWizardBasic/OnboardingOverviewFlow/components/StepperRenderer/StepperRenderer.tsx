import { useEffect, useRef, useState } from 'react';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, MenuIcon } from 'lucide-react';
import { useFormState } from 'react-hook-form';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClient,
  useUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { Button, Form } from '@/components/ui';
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';
import {
  convertPartyResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  useFormWithFilters,
} from '@/core/OnboardingWizardBasic/utils/formUtils';

import { useFlowContext } from '../../context/FlowContext';
import {
  FormStepComponent,
  StepConfig,
  StepperConfig,
  StepperStepProps,
  StepValidationMap,
} from '../../flow.types';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getStepperValidation } from '../../utils/flowUtils';
import { StepLayout } from '../StepLayout/StepLayout';
import { StepperReviewCards } from '../StepperReviewCards/StepperReviewCards';

type StepperRendererProps = StepperConfig & {
  buttonsOverride?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary';
  }>;
};

export const StepperRenderer: React.FC<StepperRendererProps> = ({
  steps,
  defaultPartyRequestBody,
}) => {
  const { clientData } = useOnboardingOverviewContext();

  const {
    currentScreenId,
    goTo,
    originScreenId,
    editingPartyIds,
    previouslyCompletedScreens,
    updateSessionData,
    initialStepperStepId,
    sections,
  } = useFlowContext();

  const editingPartyId = editingPartyIds[currentScreenId];

  const [existingPartyData, setExistingPartyData] = useState(
    clientData?.parties?.find((party) => party.id === editingPartyId)
  );

  const [checkAnswersStepId, setCheckAnswersStepId] = useState<string | null>(
    null
  );
  const checkAnswersMode = checkAnswersStepId !== null;
  const reviewMode = originScreenId === 'review-attest-section';
  const previouslyCompleted = previouslyCompletedScreens[currentScreenId];

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

  const handleNext = () => {
    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
      setCheckAnswersStepId(null);
    } else if (reviewMode) {
      goTo('review-attest-section');
    } else if (currentStepNumber < steps.length) {
      stepperNext();
    } else {
      goTo('overview');
      updateSessionData({
        mockedVerifyingSectionId: currentScreenId,
      });
    }
  };

  const getNextButtonLabel = () => {
    if (checkAnswersMode || reviewMode) {
      return 'Save';
    }
    if (currentStep.stepType === 'check-answers' && previouslyCompleted) {
      return null;
    }
    return 'Continue';
  };

  const handlePrev = () => {
    if (checkAnswersMode) {
      stepperGoTo(checkAnswersStepId);
      setCheckAnswersStepId(null);
    } else if (reviewMode) {
      goTo('review-attest-section');
    } else if (
      currentStepNumber === 1 ||
      (currentStep.stepType === 'check-answers' && previouslyCompleted)
    ) {
      goTo('overview');
    } else {
      stepperPrev();
    }
  };

  const getPrevButtonLabel = () => {
    if (currentStep.stepType === 'form' && (checkAnswersMode || reviewMode)) {
      return 'Cancel';
    }
    if (
      (currentStepNumber === 1 ||
        (currentStep.stepType === 'check-answers' && previouslyCompleted)) &&
      originScreenId
    ) {
      if (originScreenId === 'owners-section') {
        return 'Back to all owners';
      }
    }
    return 'Previous';
  };

  const { stepValidationMap } = getStepperValidation(
    steps,
    existingPartyData,
    clientData
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
  };

  return (
    <div
      ref={mainRef}
      className="eb-flex eb-min-h-full eb-scroll-mt-4 eb-flex-col sm:eb-scroll-mt-10"
    >
      <StepLayout
        title={currentStep.title}
        description={currentStep.description}
        subTitle={
          !checkAnswersMode && !previouslyCompleted && !reviewMode ? (
            <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between eb-text-sm">
              <div>
                <span className="eb-mr-2 eb-border-r eb-border-r-foreground eb-pr-2">
                  {currentSection?.sectionConfig.shortLabel}
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
            currentStepNumber={currentStepNumber}
            currentStepId={currentStep.id}
            Component={currentStep.Component}
            defaultPartyRequestBody={defaultPartyRequestBody}
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
  currentStepNumber: number;
  Component: FormStepComponent;
  existingPartyData: PartyResponse | undefined;
  setExistingPartyData: (partyData: PartyResponse | undefined) => void;
  defaultPartyRequestBody?: Partial<PartyResponse>;
}

const StepperFormStep: React.FC<StepperFormStepProps> = ({
  currentStepId,
  currentStepNumber,
  Component,
  existingPartyData,
  setExistingPartyData,
  defaultPartyRequestBody,
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  const queryClient = useQueryClient();
  const { clientData, onPostClientResponse, onPostPartyResponse } =
    useOnboardingOverviewContext();

  const formValuesFromResponse = existingPartyData
    ? convertPartyResponseToFormValues(existingPartyData)
    : {};

  // For adding a new party to the client
  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClient();

  // For updating an existing party
  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
  } = useUpdateParty();

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const form = useFormWithFilters({
    clientData,
    schema: Component.schema,
    refineSchemaFn: Component.refineSchemaFn,
    overrideDefaultValues: formValuesFromResponse,
    disabled: isFormSubmitting,
  });

  const { isDirty } = useFormState({ control: form.control });

  const onSubmit = form.handleSubmit((values) => {
    // Perform step-defined transformations on the form values
    const modifiedValues = Component.modifyFormValuesBeforeSubmit
      ? Component.modifyFormValuesBeforeSubmit(values, existingPartyData)
      : values;

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
              onPostPartyResponse?.(data, error?.response?.data);
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
              onPostClientResponse?.(data, error?.response?.data);
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
        className="eb-flex eb-max-h-[840px] eb-flex-auto eb-flex-col"
      >
        <div className="eb-flex-auto">
          <Component currentPartyData={existingPartyData} />
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <ServerErrorAlert
            error={clientUpdateError || partyUpdateError}
            className="eb-border-[#E52135] eb-bg-[#FFECEA]"
          />
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
              disabled={isFormSubmitting || currentStepNumber === 1}
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
        <StepperReviewCards
          steps={steps}
          partyData={existingPartyData}
          onEditClick={onEditClick}
        />
      </div>
      <div className="eb-mt-6 eb-space-y-6">
        <div className="eb-flex eb-justify-between eb-gap-4">
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
        </div>
      </div>
    </div>
  );
};
