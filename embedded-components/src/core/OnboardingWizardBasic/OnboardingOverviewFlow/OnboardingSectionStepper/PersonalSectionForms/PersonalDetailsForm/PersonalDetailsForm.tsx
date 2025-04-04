import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { Form } from '@/components/ui/form';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useStepFormWithFilters,
} from '@/core/OnboardingWizardBasic/utils/formUtils';

export const ControllerStepForm = () => {
  const { t } = useTranslation('onboarding');

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's party
  const existingOrgParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'ORGANIZATION' &&
      (party.active || party.status === 'ACTIVE')
  );

  const form = useStepFormWithFilters({
    clientData,
    schema: ControllerStepFormSchema,
    refineSchemaFn: refineControllerStepFormSchema,
    defaultValues: {},
  });

  // Get CONTROLLER's partyId
  const existingControllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      (party.active || party.status === 'ACTIVE')
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  // Populate form with client data
  useEffect(() => {
    if (
      getClientStatus === 'success' &&
      clientData &&
      existingControllerParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingControllerParty.id
      );
      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          ControllerStepFormSchema
        )
      );
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    getClientStatus,
    form.reset,
    existingControllerParty?.id,
    isFormPopulated,
  ]);

  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClient();

  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
  } = useSmbdoUpdateParty();

  const onSubmit = form.handleSubmit((values) => {
    if (clientId) {
      // Update party if it exists
      if (usePartyResource && existingControllerParty?.id) {
        const partyRequestBody = generatePartyRequestBody(values, {});

        updateParty(
          {
            partyId: existingControllerParty?.id,
            data: partyRequestBody,
          },
          {
            onSettled: (data, error) => {
              onPostPartyResponse?.(data, error?.response?.data);
            },
            onSuccess: () => {
              processStep();
              toast.success(
                "Client's organization details updated successfully"
              );
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
            addParties: [
              {
                partyType: 'INDIVIDUAL',
                roles: ['CONTROLLER'],
              },
            ],
          }
        );
        updateClient(
          {
            id: clientId,
            data: clientRequestBody,
          },
          {
            onSettled: (data, error) => {
              onPostClientResponse?.(data, error?.response?.data);
            },
            onSuccess: () => {
              processStep();
              toast.success(
                "Client's organization details updated successfully"
              );
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapClientApiErrorsToFormErrors(
                  context,
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

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    (usePartyResource && partyUpdateStatus === 'pending');
  const isFormPopulating = existingControllerParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <OnboardingFormField
          control={form.control}
          name="controllerName"
          type="text"
          disabled={isFormDisabled}
        />

        <ServerErrorAlert
          error={usePartyResource ? partyUpdateError : clientUpdateError}
        />
      </form>
    </Form>
  );
};
