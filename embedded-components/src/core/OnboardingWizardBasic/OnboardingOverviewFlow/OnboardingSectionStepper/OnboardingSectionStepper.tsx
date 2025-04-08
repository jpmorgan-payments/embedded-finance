import { useEffect, useState } from 'react';
import { defineStepper } from '@stepperize/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClient,
  useUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse } from '@/api/generated/smbdo.schemas';
// import { useTranslation } from 'react-i18next';

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
import {
  onboardingOverviewSections,
  StepType,
} from '../onboardingOverviewSections';
import { StepLayout } from '../StepLayout/StepLayout';

/**
 * Custom hook to manage onboarding form state.
 * @param clientData - The client data.
 * @param currentStepFormConfig - The current step form configuration.
 * @returns form, currentPartyData, and isFormPopulationPending.
 */
const useOnboardingForm = (
  clientData: ClientResponse | undefined,
  currentStep: StepType
) => {
  const formConfig = currentStep.form;
  const form = formConfig
    ? useFormWithFilters({
        clientData,
        schema: formConfig.schema,
        defaultValues: {},
      })
    : undefined;

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

  const [isFormPopulationPending, setIsFormPopulationPending] = useState(
    formConfig !== undefined
  );

  useEffect(() => {
    setIsFormPopulationPending(!!currentStep.form);
  }, [currentStep.id]);

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
          formConfig.schema
        )
      );
      setIsFormPopulationPending(false);
    }
  }, [form, clientData, currentPartyData, isFormPopulationPending, formConfig]);

  return { form, currentPartyData, isFormPopulationPending };
};

export const OnboardingSectionStepper = () => {
  const queryClient = useQueryClient();
  // const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  // TODO: Show message if clientData changes upon refetch? (edge case)

  const { clientData, onPostPartyResponse, onPostClientResponse } =
    useOnboardingOverviewContext();
  const globalStepper = GlobalStepper.useStepper();

  const { steps } = globalStepper.getMetadata(
    'section-stepper'
  ) as (typeof onboardingOverviewSections)[number];

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const { current: currentStep, prev, next } = useStepper();

  const { form, currentPartyData, isFormPopulationPending } = useOnboardingForm(
    clientData,
    currentStep
  );

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

  const currentStepNumber = stepperUtils.getIndex(currentStep.id) + 1;
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

  // TODO: move this to hook
  // TODO: skip api call if data is the same
  const onSubmit = form?.handleSubmit((values) => {
    if (clientData && currentStep.form) {
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
            addParties: [currentStep.form.party],
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

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || partyUpdateStatus === 'pending';

  const isFormDisabled = isFormSubmitting || isFormPopulationPending;

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
      {form ? (
        <Form {...form}>
          <form
            id={currentStep.id}
            onSubmit={onSubmit}
            className="eb-flex-auto"
          >
            <currentStep.content control={form.control} />
          </form>
        </Form>
      ) : (
        <form id={currentStep.id} onSubmit={handleNext}></form>
      )}

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
