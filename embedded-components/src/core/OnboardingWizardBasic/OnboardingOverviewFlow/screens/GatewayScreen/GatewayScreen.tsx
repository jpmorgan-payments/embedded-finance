import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  OrganizationType,
  PartyType,
  Role,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Alert, Button } from '@/components/ui';

import { OnboardingFormField } from '../../../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../../../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormWithFilters,
} from '../../../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../../../utils/organizationTypeList';
import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { GatewayScreenFormSchema } from './GatewayScreen.schema';

type GeneralOrganizationType =
  | 'SOLE_PROPRIETORSHIP'
  | 'REGISTERED_BUSINESS'
  | 'OTHER';

const ORG_TYPE_MAPPING: Record<GeneralOrganizationType, OrganizationType[]> = {
  SOLE_PROPRIETORSHIP: ['SOLE_PROPRIETORSHIP'],
  REGISTERED_BUSINESS: [
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
    'S_CORPORATION',
    'PARTNERSHIP',
  ],
  OTHER: [
    'NON_PROFIT_CORPORATION',
    'GOVERNMENT_ENTITY',
    'UNINCORPORATED_ASSOCIATION',
  ],
};

export const GatewayScreen = () => {
  const queryClient = useQueryClient();
  const {
    clientData,
    setClientId,
    onPostClientSettled,
    onPostPartySettled,
    availableOrganizationTypes,
  } = useOnboardingOverviewContext();
  const { goTo, sessionData, updateSessionData } = useFlowContext();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  const form = useFormWithFilters({
    clientData,
    schema: GatewayScreenFormSchema,
    defaultValues: {},
  });

  const existingOrgParty = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  const handleNext = () => {
    goTo('overview');
  };

  useEffect(() => {
    if (clientData && existingOrgParty && !isFormPopulated) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );

      form.reset(shapeFormValuesBySchema(formValues, GatewayScreenFormSchema));
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
            onPostClientSettled?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            setClientId(response.id);
            // Update the query cache with the new client data
            queryClient.setQueryData(
              getSmbdoGetClientQueryKey(response.id),
              response
            );
            handleNext();
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
        values.organizationTypeHierarchy.specificOrganizationType ===
        existingOrgParty.organizationDetails?.organizationType
      ) {
        handleNext();
        return;
      }

      // Else update the party
      const partyRequestBody = generatePartyRequestBody(values, {});
      updateParty(
        { partyId: existingOrgParty.id, data: partyRequestBody },
        {
          onSettled: (data, error) => {
            onPostPartySettled?.(data, error?.response?.data);
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
            onPostClientSettled?.(data, error?.response?.data);
          },
          onSuccess: () => {
            handleNext();
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

  // Calculate available general organization types based on available specific types
  const getAvailableGeneralOrgTypes = (): GeneralOrganizationType[] => {
    const availableGeneralTypes: GeneralOrganizationType[] = [];

    // Iterate through each general organization type
    Object.entries(ORG_TYPE_MAPPING).forEach(([generalType, specificTypes]) => {
      const generalTypeCast = generalType as GeneralOrganizationType;

      // Check if any specific types for this general type are available
      const hasAvailableTypes = availableOrganizationTypes
        ? specificTypes.some((type) =>
            availableOrganizationTypes.includes(type)
          )
        : specificTypes.some((type) => ORGANIZATION_TYPE_LIST.includes(type));

      if (hasAvailableTypes) {
        availableGeneralTypes.push(generalTypeCast);
      }
    });

    // Return available types or all types as fallback
    return availableGeneralTypes.length
      ? availableGeneralTypes
      : (Object.keys(ORG_TYPE_MAPPING) as GeneralOrganizationType[]);
  };

  const selectedGeneralOrganizationType = form.watch(
    'organizationTypeHierarchy.generalOrganizationType'
  );

  const handleGeneralOrganizationTypeChange = (value: string) => {
    // Handle SOLE_PROPRIETORSHIP special case
    if (value === 'SOLE_PROPRIETORSHIP') {
      form.setValue(
        'organizationTypeHierarchy.specificOrganizationType',
        'SOLE_PROPRIETORSHIP'
      );
      return;
    }

    // Otherwise, clear the specific organization type
    form.setValue('organizationTypeHierarchy.specificOrganizationType', '');
  };

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    clientPostStatus === 'pending' ||
    partyUpdateStatus === 'pending';
  const isFormPopulating = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-flex eb-min-h-full eb-flex-col">
        {!sessionData.hideGatewayInfoAlert && (
          <Alert variant="informative" density="sm" className="eb-mb-4">
            <InfoIcon className="eb-h-4 eb-w-4" />
            <AlertTitle className="eb-text-sm eb-font-semibold">
              Is this you?
            </AlertTitle>
            <AlertDescription>
              To keep your account details safe, we expect that the person
              completing this application holds primary control over financial
              and business operations for the business. If this is not you,
              please don&apos;t proceed below.
            </AlertDescription>
            <button
              type="button"
              className="eb-hover:eb-opacity-100 eb-focus:eb-outline-none eb-focus:eb-ring-2 eb-focus:eb-ring-ring eb-focus:eb-ring-offset-2 eb-disabled:eb-pointer-events-none eb-absolute eb-right-4 eb-top-3 eb-rounded-sm eb-opacity-70 eb-ring-offset-background eb-transition-opacity data-[state=open]:eb-bg-accent data-[state=open]:eb-text-muted-foreground [&&]:eb-pl-0"
              onClick={() => {
                updateSessionData({
                  hideGatewayInfoAlert: true,
                });
              }}
            >
              <XIcon className="eb-h-4 eb-w-4 eb-pl-0 eb-text-foreground" />
              <span className="eb-sr-only">Close</span>
            </button>
          </Alert>
        )}
        <StepLayout
          subTitle={t('welcomeText')}
          title={t('screens.gateway.title')}
          description={t('screens.gateway.description')}
        >
          <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              name="organizationTypeHierarchy.generalOrganizationType"
              type="radio-group-blocks"
              options={getAvailableGeneralOrgTypes().map((type) => ({
                value: type,
                label: t([`generalOrganizationTypes.${type}`]),
                description: t([`generalOrganizationTypeDescriptions.${type}`]),
              }))}
              onChange={handleGeneralOrganizationTypeChange}
              required
              disabled={isFormDisabled}
            />

            {(selectedGeneralOrganizationType === 'REGISTERED_BUSINESS' ||
              selectedGeneralOrganizationType === 'OTHER') && (
              <OnboardingFormField
                control={form.control}
                disableFieldRuleMapping
                name="organizationTypeHierarchy.specificOrganizationType"
                type="combobox"
                label={t([
                  `fields.organizationTypeHierarchy.specificOrganizationType.label.${selectedGeneralOrganizationType}`,
                ])}
                description={t([
                  `fields.organizationTypeHierarchy.specificOrganizationType.description.${selectedGeneralOrganizationType}`,
                ])}
                options={(availableOrganizationTypes ?? ORGANIZATION_TYPE_LIST)
                  .filter((type) =>
                    ORG_TYPE_MAPPING[selectedGeneralOrganizationType].includes(
                      type
                    )
                  )
                  .map((type) => ({
                    value: type,
                    label: t([
                      `organizationTypes.${type}`,
                      `onboarding:organizationTypes.${type}`,
                    ]),
                    description: t(
                      `onboarding:organizationTypeDescriptions.${type}`
                    ),
                  }))}
                required
                disabled={isFormDisabled}
              />
            )}
          </div>

          <div className="eb-mt-6 eb-space-y-6">
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
              {t('screens.gateway.nextButton')}
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
