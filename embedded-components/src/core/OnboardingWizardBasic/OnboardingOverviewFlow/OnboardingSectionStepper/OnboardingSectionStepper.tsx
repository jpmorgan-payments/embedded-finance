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
import { onboardingOverviewSections } from '../onboardingOverviewSections';
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

  const { steps } = globalStepper.getMetadata(
    'section-stepper'
  ) as (typeof onboardingOverviewSections)[number];

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const {
    current: currentStep,
    prev,
    next,
    all: allSteps,
    goTo,
    setMetadata,
    getMetadata,
  } = useStepper();

  const { id: stepId, formConfig: currentFormConfig } = currentStep;

  // Whether the user came from the check answers screen
  const editModeOriginStepId = getMetadata(stepId)?.editModeOriginStepId;

  const currentPartyData = currentFormConfig
    ? clientData?.parties?.find(
        (party) =>
          party?.partyType === currentFormConfig.party.partyType &&
          currentFormConfig.party.roles?.every((role) =>
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

  const currentStepNumber = stepperUtils.getIndex(stepId) + 1;

  const [isFormPopulationPending, setIsFormPopulationPending] = useState(true);

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const isFormDisabled =
    isFormSubmitting || (isFormPopulationPending && !!currentPartyData);

  useEffect(() => {
    setIsFormPopulationPending(!!currentFormConfig);
  }, [stepId]);

  const handleNext = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (editModeOriginStepId) {
      setMetadata(stepId, {
        editMode: false,
      });
      goTo(editModeOriginStepId);
    } else if (currentStepNumber < steps.length) {
      setIsFormPopulationPending(true);
      next();
    } else {
      globalStepper.goTo('overview');
    }
  };
  const handlePrev = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (editModeOriginStepId) {
      setMetadata(stepId, {
        editMode: false,
      });
      goTo(editModeOriginStepId);
    } else if (currentStepNumber > 1) {
      setIsFormPopulationPending(true);
      prev();
    } else {
      globalStepper.goTo('overview');
    }
  };

  const form = currentFormConfig
    ? useFormWithFilters({
        clientData,
        schema: currentFormConfig.FormComponent.schema,
        refineSchemaFn: currentFormConfig.FormComponent.refineSchemaFn,
        defaultValues: {},
        disabled: isFormDisabled,
      })
    : useForm();

  useEffect(() => {
    if (form && clientData && currentFormConfig && isFormPopulationPending) {
      const formValues = currentPartyData
        ? convertClientResponseToFormValues(clientData, currentPartyData.id)
        : {};
      form.reset(
        modifyDefaultValues(
          shapeFormValuesBySchema(
            formValues,
            currentFormConfig.FormComponent.schema
          )
        )
      );
      setIsFormPopulationPending(false);
    }
  }, [
    form,
    clientData,
    currentPartyData,
    isFormPopulationPending,
    currentFormConfig,
  ]);

  // TODO: skip api call if data is the same
  const onSubmit = form.handleSubmit((values) => {
    // Perform step-defined transformations on the form values
    const modifiedValues =
      currentFormConfig?.FormComponent.modifyFormValuesBeforeSubmit?.(
        values,
        currentPartyData
      ) ?? values;

    if (clientData && currentStep.formConfig) {
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
            addParties: [currentStep.formConfig.party],
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
    const stepPartyData = checkedStep.formConfig
      ? clientData?.parties?.find(
          (party) =>
            party?.partyType === checkedStep.formConfig.party.partyType &&
            checkedStep.formConfig.party.roles?.every((role) =>
              party?.roles?.includes(role)
            ) &&
            party.active
        )
      : undefined;

    if (checkedStep && checkedStep.formConfig && clientData && stepPartyData) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        stepPartyData.id
      );
      const modifiedSchema = modifySchema(
        checkedStep.formConfig.FormComponent.schema,
        checkedStep.formConfig.FormComponent.refineSchemaFn
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
                        index > stepperUtils.getIndex(stepId) &&
                        !checkStepIsCompleted(stepperUtils.getPrev(step.id)?.id)
                      }
                      className={cn({
                        'eb-pointer-events-none eb-font-semibold':
                          step.id === stepId,
                      })}
                      onClick={() => {
                        if (step.id !== stepId) {
                          goTo(step.id);
                          setIsFormPopulationPending(true);
                        }
                      }}
                    >
                      <div className="eb-flex eb-items-center eb-gap-2">
                        {checkStepIsCompleted(step.id) ? (
                          <CheckIcon className="eb-size-4 eb-stroke-green-600" />
                        ) : step.id === stepId ? (
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
              <currentStep.formConfig.FormComponent />
            </form>
          </Form>
        )}
        {currentStep.type === 'non-form' && (
          <form id={currentStep.id} onSubmit={handleNext}>
            {currentStep.Component && <currentStep.Component />}
          </form>
        )}
        {currentStep.type === 'check-answers' && (
          <form id={currentStep.id} onSubmit={handleNext}>
            <CheckAnswersScreen
              stepId={stepId}
              steps={allSteps}
              goToStep={goTo}
              setMetadata={setMetadata}
            />
          </form>
        )}
      </div>

      <div className="eb-flex eb-flex-col eb-gap-y-6">
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
