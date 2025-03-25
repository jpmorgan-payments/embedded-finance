import { useEffect, useState } from 'react';
import { InfoIcon, Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Alert, Button, Separator } from '@/components/ui';

import { useOnboardingContext } from '../../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingFormField } from '../../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormWithFilters,
} from '../../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../../utils/organizationTypeList';
import { OnboardingGatewayScreenFormSchema } from './OnboardingGatewayScreenForm.schema';

export const OnboardingGatewayScreen = () => {
  const {
    clientId,
    setClientId,
    onPostClientResponse,
    onPostPartyResponse,
    availableOrganizationTypes,
  } = useOnboardingContext();

  const { t } = useTranslation(['onboarding', 'common']);

  // Fetch client data
  const { data: clientData, status: getClientStatus } =
    useSmbdoGetClient(clientId);

  const form = useFormWithFilters({
    clientData,
    schema: OnboardingGatewayScreenFormSchema,
    defaultValues: {},
  });

  const existingOrgParty = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  useEffect(() => {
    if (clientData && existingOrgParty && !isFormPopulated) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );

      form.reset(
        shapeFormValuesBySchema(formValues, OnboardingGatewayScreenFormSchema)
      );
      setIsFormPopulated(true);
    }
  }, [clientData, existingOrgParty, isFormPopulated, form]);

  const {
    mutate: postClient,
    error: clientPostError,
    status: clientPostStatus,
  } = useSmbdoPostClients();

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
    // Create client if it doesn't exist
    if (!clientId) {
      const requestBody = generateClientRequestBody(values, 0, 'parties', {
        parties: [
          {
            roles: ['CLIENT'],
            organizationDetails: {
              jurisdiction: 'US',
            },
            partyType: 'ORGANIZATION',
          },
        ],
      });

      postClient(
        { data: { products: ['EMBEDDED_PAYMENTS'], ...requestBody } },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: async (response) => {
            await setClientId?.(response.id);
            // TODO: add prop to toggle toasts
            toast.success(
              `Client created successfully with ID: ${response.id}`
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

    // Update the organization party if it exists
    else if (clientId && existingOrgParty?.id) {
      const partyRequestBody = generatePartyRequestBody(values, {});
      updateParty(
        { partyId: existingOrgParty.id, data: partyRequestBody },
        {
          onSettled: (data, error) => {
            onPostPartyResponse?.(data, error?.response?.data);
          },
          onSuccess: () => {
            toast.success('Organization party details updated successfully');
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

    // Create organization party if it doesn't exist already
    else {
      const clientRequestBody = generateClientRequestBody(
        values,
        0,
        'addParties',
        {
          addParties: [
            {
              partyType: 'ORGANIZATION',
              roles: ['CLIENT'],
              organizationDetails: {
                jurisdiction: 'US',
              },
            },
          ],
        }
      );
      updateClient(
        { id: clientId, data: clientRequestBody },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: () => {
            toast.success('Organization party created successfully');
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
  });

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    clientPostStatus === 'pending' ||
    partyUpdateStatus === 'pending';
  const isFormPopulating = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <div className="eb-flex-1 md:eb-max-w-2xl">
      <div className="eb-space-y-6">
        <div className="eb-space-y-1.5">
          <p className="eb-text-muted-foreground">Welcome!</p>
          <h2 className="eb-text-2xl eb-font-bold eb-tracking-tight">
            Let&apos;s help you get started
          </h2>
          <p className="eb-text-sm eb-font-semibold">
            Select your company's business type and we&apos;ll explain what
            information you&apos;ll need to complete the application.
          </p>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={onSubmit} className="eb-space-y-8">
            <OnboardingFormField
              control={form.control}
              name="organizationType"
              type="radio-group-blocks"
              options={ORGANIZATION_TYPE_LIST.map((type) => ({
                value: type,
                label: t(`organizationTypes.${type}`),
                description: 'Winning help text goes here',
              }))}
              disabled={true}
            />

            <Alert variant="informative">
              <InfoIcon className="eb-h-4 eb-w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Please make sure you make the correct selection. If you come
                back and edit this later, you may lose saved progress.
              </AlertDescription>
            </Alert>

            <ServerErrorAlert
              error={partyUpdateError || clientUpdateError || clientPostError}
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="eb-w-full eb-text-lg"
              disabled={isFormDisabled}
            >
              {isFormSubmitting ? (
                <Loader2Icon className="eb-animate-spin" />
              ) : null}
              Show me what's needed
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
