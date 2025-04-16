import { useEffect, useState } from 'react';
import { DropdownMenuLabel } from '@radix-ui/react-dropdown-menu';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClient,
  useUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button, Form } from '@/components/ui';

import { ServerErrorAlert } from '../../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormUtilsWithClientContext,
  useFormWithFilters,
} from '../../utils/formUtils';
import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';
import { StepperSectionType, StepType } from '../overviewSectionsConfig';
import { StepLayout } from '../StepLayout/StepLayout';
import { CheckAnswersScreen } from './CheckAnswersScreen/CheckAnswersScreen';

export const OnboardingSectionStepper = () => {
  const queryClient = useQueryClient();

  // TODO: Show message if clientData changes upon refetch? (edge case)

  const { clientData, onPostPartyResponse, onPostClientResponse } =
    useOnboardingOverviewContext();

  const { modifySchema, modifyDefaultValues } =
    useFormUtilsWithClientContext(clientData);

  const globalStepper = GlobalStepper.useStepper();

  const { steps = [], correspondingParty } = globalStepper.getMetadata(
    'section-stepper'
  ) as StepperSectionType & { partyId?: string };

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const {
    current: currentStep,
    goTo,
    all: allSteps,
    setMetadata,
    getMetadata,
  } = useStepper();

  const { id: currentStepId, FormComponent: CurrentFormComponent } =
    currentStep;

  // Whether the user came from the check answers screen
  const editModeOriginStepId = getMetadata(currentStepId)?.editModeOriginStepId;

  const currentPartyData = correspondingParty
    ? clientData?.parties?.find(
        (party) =>
          party?.partyType === correspondingParty.partyType &&
          correspondingParty.roles?.every((role) =>
            party?.roles?.includes(role)
          ) &&
          party.active
      )
    : undefined;

  // For adding a new party to the client
  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
    reset: resetClientUpdate,
  } = useSmbdoUpdateClient();

  // For updating an existing party
  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
    reset: resetPartyUpdate,
  } = useUpdateParty();

  const currentStepNumber = stepperUtils.getIndex(currentStepId) + 1;

  const [isFormPopulationPending, setIsFormPopulationPending] = useState(true);

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const isFormDisabled =
    isFormSubmitting || (isFormPopulationPending && !!currentPartyData);

  const form = CurrentFormComponent
    ? useFormWithFilters({
        clientData,
        schema: CurrentFormComponent.schema,
        refineSchemaFn: CurrentFormComponent.refineSchemaFn,
        defaultValues: {},
        disabled: isFormDisabled,
      })
    : useForm();

  const handleStepChange = (destinationStep: StepType) => {
    goTo(destinationStep.id);
    if (destinationStep.type === 'form') {
      form.reset(
        modifyDefaultValues(
          shapeFormValuesBySchema(
            formValues,
            destinationStep.FormComponent?.schema
          )
        )
      );
    }
  };

  const handleNext = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (editModeOriginStepId) {
      setMetadata(currentStepId, {
        editMode: false,
      });
      handleStepChange(stepperUtils.get(editModeOriginStepId));
    } else if (currentStepNumber < steps.length - 1) {
      handleStepChange(stepperUtils.getNext(currentStepId));
    } else {
      globalStepper.goTo('overview');
    }
  };
  const handlePrev = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (editModeOriginStepId) {
      setMetadata(currentStepId, {
        editMode: false,
      });
      handleStepChange(stepperUtils.get(editModeOriginStepId));
    } else if (currentStepNumber > 1) {
      handleStepChange(stepperUtils.getPrev(currentStepId));
    } else {
      globalStepper.goTo('overview');
    }
  };

  const formValues =
    currentPartyData && clientData
      ? convertClientResponseToFormValues(clientData, currentPartyData.id)
      : {};

  useEffect(() => {
    if (form && CurrentFormComponent) {
      form.reset(
        modifyDefaultValues(
          shapeFormValuesBySchema(formValues, CurrentFormComponent.schema)
        )
      );
      setIsFormPopulationPending(false);
    }
  }, [form, CurrentFormComponent]);

  // TODO: skip api call if data is the same
  const onSubmit = form.handleSubmit((values) => {
    // Perform step-defined transformations on the form values
    const modifiedValues =
      CurrentFormComponent?.modifyFormValuesBeforeSubmit?.(
        values,
        currentPartyData
      ) ?? values;

    if (clientData) {
      // TODO: update config to allow for providing a default body using form values
      // Update party if it exists
      if (currentPartyData && currentPartyData.id) {
        const partyRequestBody = generatePartyRequestBody(modifiedValues, {});

        // Check if the form is dirty and skip the API call if not
        if (!form.formState.isDirty) {
          handleNext();
          return;
        }

        updateParty(
          {
            partyId: currentPartyData.id ?? '',
            data: partyRequestBody,
          },
          {
            onSettled: (data, error) => {
              onPostPartyResponse?.(data, error?.response?.data);
            },
            onSuccess: (response) => {
              // Update client cache with party data
              queryClient.setQueryData(
                getSmbdoGetClientQueryKey(clientData.id),
                (oldClientData: ClientResponse | undefined) => ({
                  ...oldClientData,
                  parties: oldClientData?.parties?.map((party) => {
                    if (party.id === response.id) {
                      return {
                        ...party,
                        ...response,
                      };
                    }
                    return party;
                  }),
                })
              );
              handleNext();
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapPartyApiErrorsToFormErrors(context);
                setApiFormErrors(form, apiFormErrors);
              }
            },
          }
        );
      }
      // Create party if it doesn't exist
      else {
        const clientRequestBody = generateClientRequestBody(
          modifiedValues,
          0,
          'addParties',
          {
            addParties: [correspondingParty],
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
            onSuccess: (response) => {
              // Update client cache
              queryClient.setQueryData(
                getSmbdoGetClientQueryKey(clientData.id),
                response
              );
              handleNext();
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapPartyApiErrorsToFormErrors(context);
                setApiFormErrors(form, apiFormErrors);
              }
            },
          }
        );
      }
    }
  });

  const checkStepIsCompleted = (id: string) => {
    const checkedStep = stepperUtils.get(id);

    if (
      checkedStep &&
      checkedStep.FormComponent &&
      clientData &&
      currentPartyData?.id
    ) {
      const modifiedSchema = modifySchema(
        checkedStep.FormComponent.schema,
        checkedStep.FormComponent.refineSchemaFn
      );
      return modifiedSchema.safeParse(formValues).success;
    }
    return false;
  };

  return (
    <StepLayout
      subTitle={
        !editModeOriginStepId ? (
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <p className="eb-font-semibold">
              Step {currentStepNumber} of {steps.length}
            </p>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="eb-h-6 eb-gap-1 eb-rounded-none eb-p-1 eb-text-xs"
                  >
                    Step menu
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="eb-w-54 eb-component"
                  side="bottom"
                  align="end"
                >
                  {form.formState.isDirty && (
                    <DropdownMenuLabel className="eb-p-2 eb-text-xs eb-italic eb-text-red-500">
                      ⓘ You have unconfirmed changes on this step.
                    </DropdownMenuLabel>
                  )}
                  {steps.map((step, index) => (
                    <DropdownMenuItem
                      key={step.id}
                      disabled={
                        !checkStepIsCompleted(step.id) &&
                        index > stepperUtils.getIndex(currentStepId) &&
                        !checkStepIsCompleted(stepperUtils.getPrev(step.id)?.id)
                      }
                      className={cn({
                        'eb-pointer-events-none eb-font-semibold':
                          step.id === currentStepId,
                      })}
                      onClick={() => {
                        if (step.id !== currentStepId) {
                          handleStepChange(step);
                        }
                      }}
                    >
                      <div className="eb-flex eb-items-center eb-gap-2">
                        {checkStepIsCompleted(step.id) ? (
                          <CheckIcon className="eb-size-4 eb-stroke-green-600" />
                        ) : step.id === currentStepId ? (
                          <ArrowRightIcon className="eb-size-4 eb-stroke-primary" />
                        ) : (
                          <div className="eb-size-4"></div>
                        )}
                        <p>
                          {index + 1}. {step.title}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : undefined
      }
      title={currentStep.title}
      description={currentStep.description}
      showSpinner={isFormPopulationPending && !!currentPartyData}
    >
      <div className="eb-mt-6 eb-flex-auto">
        {currentStep.type === 'form' && (
          <Form {...form} key={currentStep.id}>
            <form id={currentStep.id} onSubmit={onSubmit} key={currentStep.id}>
              <currentStep.FormComponent />
            </form>
          </Form>
        )}
        {currentStep.type === 'check-answers' && (
          <form id={currentStep.id} onSubmit={handleNext}>
            <CheckAnswersScreen
              stepId={currentStepId}
              partyId={currentPartyData?.id}
              steps={allSteps}
              goToStep={handleStepChange}
              setMetadata={setMetadata}
            />
          </form>
        )}
      </div>

      <div className="eb-mt-6 eb-flex eb-flex-col eb-gap-y-6">
        <ServerErrorAlert error={clientUpdateError || partyUpdateError} />
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={handlePrev}
            disabled={isFormDisabled}
          >
            {editModeOriginStepId
              ? 'Cancel'
              : currentStepNumber === 1
                ? 'Back to overview'
                : 'Back'}
          </Button>
          <Button
            form={currentStep.id}
            type="submit"
            variant="default"
            size="lg"
            className="eb-w-full eb-text-lg"
            disabled={isFormDisabled}
          >
            {isFormSubmitting && <Loader2Icon className="eb-animate-spin" />}
            {editModeOriginStepId ? 'Save' : 'Next'}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
