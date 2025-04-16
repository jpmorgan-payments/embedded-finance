import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse, PartyType, Role } from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Alert, Button } from '@/components/ui';

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
import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';
import { StepLayout } from '../StepLayout/StepLayout';
import { OnboardingGatewayScreenFormSchema } from './OnboardingGatewayScreenForm.schema';

export const OnboardingGatewayScreen = () => {
  const queryClient = useQueryClient();
  const {
    clientData,
    setClientId,
    onPostClientResponse,
    onPostPartyResponse,
    availableOrganizationTypes,
  } = useOnboardingOverviewContext();

  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

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
    const defaultPartyData = {
      roles: [Role.CLIENT],
      partyType: PartyType.ORGANIZATION,
      organizationDetails: {
        // TODO: Temporary workaround
        organizationName: 'PLACEHOLDER_ORG_NAME',
        countryOfFormation: 'US',
      },
    };

    // Create client if it doesn't exist
    if (!clientData) {
      const requestBody = generateClientRequestBody(values, 0, 'parties', {
        parties: [defaultPartyData],
      });

      postClient(
        {
          data: {
            products: ['EMBEDDED_PAYMENTS'],
            ...requestBody,
          },
        },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            globalStepper.beforeNext(() => {
              setClientId(response.id);
              // Update the query cache with the new client data
              queryClient.setQueryData(
                getSmbdoGetClientQueryKey(response.id),
                response
              );
              return true;
            });
          },
          onError: (error) => {
            if (error.response?.data?.context) {
              const { context } = error.response.data;
              const apiFormErrors = mapClientApiErrorsToFormErrors(
                context,
                0,
                'parties'
              );
              setApiFormErrors(form, apiFormErrors);
            }
          },
        }
      );
    }

    // Update the organization party if it exists
    else if (clientData && existingOrgParty?.id) {
      // If the organization type is the same, move to the next step
      if (
        values.organizationType ===
        existingOrgParty.organizationDetails?.organizationType
      ) {
        globalStepper.next();
        return;
      }

      // Else update the party
      const partyRequestBody = generatePartyRequestBody(values, {});
      updateParty(
        { partyId: existingOrgParty.id, data: partyRequestBody },
        {
          onSettled: (data, error) => {
            onPostPartyResponse?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            // Update the client data in the cache while it fetches the new data
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
            globalStepper.next();
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

    // If client exists but organization party does not exist, create it
    else {
      const clientRequestBody = generateClientRequestBody(
        values,
        0,
        'addParties',
        {
          addParties: [defaultPartyData],
        }
      );
      updateClient(
        { id: clientData.id, data: clientRequestBody },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: () => {
            globalStepper.next();
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
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Alert variant="informative" className="eb-mb-4">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertTitle>Is this you?</AlertTitle>
          <AlertDescription>
            To keep your account details safe, we expect that the person
            completing this application holds primary control over financial and
            business operations for the business. If this is not you, please
            don&apos;t proceed below.
          </AlertDescription>
        </Alert>
        <StepLayout
          subTitle={t('welcomeText')}
          title={t('steps.gateway.title')}
          description={t('steps.gateway.description')}
        >
          <div className="eb-mt-6 eb-flex-auto">
            <OnboardingFormField
              control={form.control}
              name="organizationType"
              type="radio-group-blocks"
              options={(
                availableOrganizationTypes ?? ORGANIZATION_TYPE_LIST
              ).map((type) => ({
                value: type,
                label: t(`onboarding:organizationTypes.${type}`),
                description: t(
                  `onboarding:organizationTypeDescriptions.${type}`
                ),
              }))}
              disabled={isFormDisabled}
            />
          </div>

          <div className="eb-mt-6 eb-space-y-6">
            {t('steps.gateway.alerts', { returnObjects: true }).map(
              (alert, index) => (
                <Alert variant="informative" key={index}>
                  <InfoIcon className="eb-h-4 eb-w-4" />
                  {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
                  {alert.description && (
                    <AlertDescription>{alert.description}</AlertDescription>
                  )}
                </Alert>
              )
            )}

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
              {t('steps.gateway.nextButton')}
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
