import { useEffect, useState } from 'react';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClient,
  useUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Button, Form } from '@/components/ui';

import { ServerErrorAlert } from '../../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
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
  const globalStepper = GlobalStepper.useStepper();

  const { steps } = globalStepper.getMetadata(
    'section-stepper'
  ) as (typeof onboardingOverviewSections)[number];

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const { current: currentStep, prev, next, all: allSteps } = useStepper();

  const { id: stepId, formConfig } = currentStep;

  const currentPartyData = formConfig
    ? clientData?.parties?.find(
        (party) =>
          party?.partyType === formConfig.party.partyType &&
          formConfig.party.roles?.every((role) =>
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
  const handleNext = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (currentStepNumber < steps.length) {
      next();
    } else {
      globalStepper.goTo('overview');
    }
  };
  const handlePrev = () => {
    resetClientUpdate();
    resetPartyUpdate();
    if (currentStepNumber > 1) {
      prev();
    } else {
      globalStepper.goTo('overview');
    }
  };

  const [isFormPopulationPending, setIsFormPopulationPending] = useState(true);

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const isFormDisabled = isFormSubmitting || isFormPopulationPending;

  const form = formConfig
    ? useFormWithFilters({
        clientData,
        schema: formConfig.FormComponent.schema,
        refineSchemaFn: formConfig.FormComponent.refineSchemaFn,
        defaultValues: {},
        disabled: isFormDisabled,
      })
    : useForm();

  useEffect(() => {
    setIsFormPopulationPending(!!formConfig);
  }, [stepId]);

  useEffect(() => {
    if (
      form &&
      clientData &&
      currentPartyData &&
      formConfig &&
      isFormPopulationPending
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        currentPartyData.id
      );
      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          formConfig.FormComponent.schema
        )
      );
      setIsFormPopulationPending(false);
    }
  }, [form, clientData, currentPartyData, isFormPopulationPending, formConfig]);

  // TODO: move this to hook
  // TODO: skip api call if data is the same
  const onSubmit = form.handleSubmit((values) => {
    if (clientData && currentStep.formConfig) {
      // TODO: update config to allow for providing a default body using form values
      // Update party if it exists
      if (currentPartyData && currentPartyData.id) {
        const partyRequestBody = generatePartyRequestBody(values, {});
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
          values,
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

  return (
    <StepLayout
      subTitle={
        <p className="eb-font-semibold">
          Step {currentStepNumber} of {steps.length}
        </p>
      }
      title={currentStep.title}
      description={currentStep.description}
    >
      <div className="eb-flex-auto">
        {currentStep.type === 'form' && (
          <Form {...form}>
            <form id={currentStep.id} onSubmit={onSubmit}>
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
            <CheckAnswersScreen steps={allSteps} />
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
            {currentStepNumber === 1 ? 'Back to overview' : 'Back'}
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
            Next
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
