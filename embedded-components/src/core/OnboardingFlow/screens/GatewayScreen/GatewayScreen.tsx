import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useFormState } from 'react-hook-form';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoPostClients,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  CreatePartyRequestInlineRequired,
  OrganizationType,
  PartyType,
  Role,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Alert, Button } from '@/components/ui';
import {
  OnboardingFormField,
  StepLayout,
} from '@/core/OnboardingFlow/components';
import { ORGANIZATION_TYPE_LIST } from '@/core/OnboardingFlow/consts';
import {
  PTC_ELIGIBLE_ORG_TYPES,
  PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES,
  useStockExchangeOptions,
} from '@/core/OnboardingFlow/consts/stockExchanges';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import {
  getControllerParty,
  getOrganizationParty,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormWithFilters,
} from '@/core/OnboardingFlow/utils/formUtils';

import {
  GatewayScreenFormSchema,
  refineGatewaySchema,
} from './GatewayScreen.schema';

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
    enablePubliclyTradedCompanies,
  } = useOnboardingContext();
  const { goTo, sessionData, updateSessionData, setIsFormSubmitting } =
    useFlowContext();

  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  const stockExchangeOptions = useStockExchangeOptions().flatMap((group) =>
    group.options.map((opt) => ({ ...opt, group: group.label }))
  );

  const form = useFormWithFilters({
    clientData,
    screenId: 'gateway',
    schema: GatewayScreenFormSchema,
    refineSchemaFn: enablePubliclyTradedCompanies
      ? refineGatewaySchema
      : undefined,
    defaultValues: {},
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  const existingOrgParty = getOrganizationParty(clientData);

  // PTC status cannot be reverted once set (API cannot remove publiclyTraded)
  const isPTCLocked = !!existingOrgParty?.organizationDetails?.publiclyTraded;

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  const handleNext = () => {
    setIsFormSubmitting(false);
    goTo('overview');
  };

  useEffect(() => {
    if (clientData && existingOrgParty && !isFormPopulated) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );

      // If PTC question was already answered this session but the API has no
      // publiclyTraded data, the answer was "none" — restore it so the radio
      // shows the user's previous selection instead of appearing blank.
      if (
        sessionData.isPTCQuestionAnswered &&
        !existingOrgParty.organizationDetails?.publiclyTraded &&
        !formValues.isPTCOrSubsidiary
      ) {
        formValues.isPTCOrSubsidiary = 'none';
      }

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
  } = useSmbdoUpdateClientLegacy();

  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
  } = useSmbdoUpdateParty();

  const onSubmit = form.handleSubmit((values) => {
    // Mark PTC question as answered so sidebar unlocks after gateway
    if (enablePubliclyTradedCompanies && values.isPTCOrSubsidiary) {
      updateSessionData({ isPTCQuestionAnswered: true });
    }

    // Derive PTC request values
    const ptcStatus = values.isPTCOrSubsidiary;
    const hasPTC = ptcStatus === 'ptc' || ptcStatus === 'subsidiary';

    // Prepare values with derived isSubsidiary and without PTC fields if not applicable
    const submittableValues = {
      ...values,
      isSubsidiary: hasPTC
        ? ptcStatus === 'subsidiary'
          ? 'true'
          : 'false'
        : '',
      tickerSymbol: hasPTC ? values.tickerSymbol : '',
      stockExchange: hasPTC ? values.stockExchange : '',
      stockExchangeName: hasPTC ? values.stockExchangeName : '',
    };

    const defaultPartyData = {
      roles: [Role.CLIENT],
      partyType: PartyType.ORGANIZATION,
      organizationDetails: {
        // TODO: Temporary workaround
        organizationName: 'PLACEHOLDER_ORG_NAME',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
    } as CreatePartyRequestInlineRequired;

    // Create client if it doesn't exist
    if (!clientData) {
      const requestBody = generateClientRequestBody(
        submittableValues,
        0,
        'parties',
        {
          parties: [defaultPartyData],
        }
      );

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
      // If org type and PTC data are both unchanged, move to the next step
      const orgTypeUnchanged =
        submittableValues.organizationTypeHierarchy.specificOrganizationType ===
        existingOrgParty.organizationDetails?.organizationType;
      const existingPTC = existingOrgParty.organizationDetails?.publiclyTraded;
      const existingIsSubsidiary =
        existingOrgParty.organizationDetails?.isSubsidiary;
      const ptcUnchanged =
        (!hasPTC && !existingPTC) ||
        (hasPTC &&
          existingPTC?.tickerSymbol === submittableValues.tickerSymbol &&
          existingPTC?.stockExchange === submittableValues.stockExchange &&
          String(existingIsSubsidiary ?? false) ===
            submittableValues.isSubsidiary);

      if (orgTypeUnchanged && ptcUnchanged) {
        handleNext();
        return;
      }

      // Else update the party
      const partyRequestBody = generatePartyRequestBody(submittableValues, {});

      // HANDLE ORG TYPE CHANGES - Special handling for SOLE_PROPRIETORSHIP
      if (
        partyRequestBody.organizationDetails?.organizationType ===
        'SOLE_PROPRIETORSHIP'
      ) {
        const controllerParty = getControllerParty(clientData);
        // Set organization name to controller's name for sole proprietorship
        if (controllerParty) {
          partyRequestBody.organizationDetails.organizationName =
            getPartyName(controllerParty);

          // Update controller party to include beneficial owner role if needed
          if (
            controllerParty &&
            !controllerParty.roles?.includes('BENEFICIAL_OWNER') &&
            controllerParty.id
          ) {
            updateParty(
              {
                partyId: controllerParty.id,
                data: {
                  roles: [...(controllerParty.roles || []), 'BENEFICIAL_OWNER'],
                },
              },
              {
                onSuccess: () => {
                  // Refresh the client so client-level fields (e.g.
                  // outstanding.questionIds) reflect the role change.
                  queryClient.invalidateQueries({
                    queryKey: getSmbdoGetClientQueryKey(clientData.id),
                  });
                },
                onError: (error) => {
                  console.error('Failed to update controller roles:', error);
                },
              }
            );
          }
        }

        // Ensure country of formation is set to US for sole proprietorship
        partyRequestBody.organizationDetails.countryOfFormation = 'US';
      }

      updateParty(
        { partyId: existingOrgParty.id, data: partyRequestBody },
        {
          onSettled: (data, error) => {
            onPostPartySettled?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            const queryKey = getSmbdoGetClientQueryKey(clientData.id);
            // Update the client data in the cache while it fetches the new data
            queryClient.setQueryData(
              queryKey,
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
            // Invalidate to refresh client-level fields (e.g.
            // outstanding.questionIds) that the party response can't carry.
            queryClient.invalidateQueries({ queryKey });
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
        submittableValues,
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

  const selectedSpecificOrganizationType = form.watch(
    'organizationTypeHierarchy.specificOrganizationType'
  );

  const isPTCOrSubsidiary = form.watch('isPTCOrSubsidiary');
  const stockExchange = form.watch('stockExchange');

  // Determine if the PTC question should be shown
  const showPTCQuestion =
    enablePubliclyTradedCompanies &&
    !!selectedSpecificOrganizationType &&
    PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES.includes(
      selectedSpecificOrganizationType as OrganizationType
    );

  // Can this org type be directly publicly traded (vs subsidiary-only)?
  const canBePTCDirectly =
    showPTCQuestion &&
    PTC_ELIGIBLE_ORG_TYPES.includes(
      selectedSpecificOrganizationType as OrganizationType
    );

  const handleGeneralOrganizationTypeChange = (value: string) => {
    // Handle SOLE_PROPRIETORSHIP special case
    if (value === 'SOLE_PROPRIETORSHIP') {
      form.setValue(
        'organizationTypeHierarchy.specificOrganizationType',
        'SOLE_PROPRIETORSHIP'
      );
      // Clear PTC fields since sole props can't be PTCs (unless locked)
      if (!isPTCLocked) {
        form.setValue('isPTCOrSubsidiary', '');
        form.setValue('isSubsidiary', '');
        form.setValue('tickerSymbol', '');
        form.setValue('stockExchange', '');
        form.setValue('stockExchangeName', '');
      }
      return;
    }

    // Otherwise, clear the specific organization type and PTC fields
    form.setValue('organizationTypeHierarchy.specificOrganizationType', '');
    if (!isPTCLocked) {
      form.setValue('isPTCOrSubsidiary', '');
      form.setValue('isSubsidiary', '');
      form.setValue('tickerSymbol', '');
      form.setValue('stockExchange', '');
      form.setValue('stockExchangeName', '');
    }
  };

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    clientPostStatus === 'pending' ||
    partyUpdateStatus === 'pending';

  // Clear stale PTC selection when "ptc" option is no longer available
  useEffect(() => {
    if (isPTCOrSubsidiary === 'ptc' && !canBePTCDirectly && !isPTCLocked) {
      form.setValue('isPTCOrSubsidiary', '');
      form.setValue('tickerSymbol', '');
      form.setValue('stockExchange', '');
      form.setValue('stockExchangeName', '');
    }
  }, [canBePTCDirectly, isPTCOrSubsidiary, isPTCLocked, form]);

  useEffect(() => {
    setIsFormSubmitting(isFormSubmitting);
  }, [isFormSubmitting]);

  const isFormPopulating = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-flex eb-min-h-full eb-flex-col">
        {!sessionData.hideGatewayInfoAlert && (
          <Alert variant="informative" density="sm" className="eb-mb-4">
            <InfoIcon className="eb-h-4 eb-w-4" />
            <AlertTitle className="eb-text-sm eb-font-semibold">
              {t('screens.gateway.infoAlert.title')}
            </AlertTitle>
            <AlertDescription>
              {t('screens.gateway.infoAlert.description')}
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
            {isPTCLocked && (
              <Alert variant="informative" density="sm" noTitle>
                <InfoIcon className="eb-h-4 eb-w-4" />
                <AlertDescription className="eb-text-sm">
                  {t('screens.gateway.ptcLockedAlert')}
                </AlertDescription>
              </Alert>
            )}
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              name="organizationTypeHierarchy.generalOrganizationType"
              type="radio-group-blocks"
              options={getAvailableGeneralOrgTypes().map((type) => ({
                value: type,
                label: t([`generalOrganizationTypes.${type}`]),
                description: t([`generalOrganizationTypeDescriptions.${type}`]),
                disabled: isPTCLocked && type === 'SOLE_PROPRIETORSHIP',
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
                    label: t(`organizationTypes.${type}`),
                    description: t(`organizationTypeDescriptions.${type}`),
                  }))}
                required
                disabled={isFormDisabled}
              />
            )}

            {showPTCQuestion && (
              <div className="eb-space-y-6 eb-rounded-lg eb-border eb-border-border eb-p-4">
                <OnboardingFormField
                  control={form.control}
                  disableFieldRuleMapping
                  name="isPTCOrSubsidiary"
                  type="radio-group"
                  label={
                    canBePTCDirectly
                      ? t('fields.isPTCOrSubsidiary.label')
                      : t('fields.isPTCOrSubsidiary.labelSubsidiaryOnly')
                  }
                  options={[
                    {
                      value: 'none',
                      label: t('fields.isPTCOrSubsidiary.options.none'),
                      disabled: isPTCLocked,
                    },
                    ...(canBePTCDirectly
                      ? [
                          {
                            value: 'ptc',
                            label: t('fields.isPTCOrSubsidiary.options.ptc'),
                          },
                        ]
                      : []),
                    {
                      value: 'subsidiary',
                      label: t('fields.isPTCOrSubsidiary.options.subsidiary'),
                    },
                  ]}
                  required
                  disabled={isFormDisabled}
                />

                {isPTCOrSubsidiary && isPTCOrSubsidiary !== 'none' && (
                  <div className="eb-space-y-6 eb-border-l-2 eb-border-l-muted eb-pl-4">
                    <OnboardingFormField
                      control={form.control}
                      disableFieldRuleMapping
                      name="tickerSymbol"
                      type="text"
                      label={
                        isPTCOrSubsidiary === 'subsidiary'
                          ? t('fields.tickerSymbol.labelSubsidiary')
                          : t('fields.tickerSymbol.label')
                      }
                      description={
                        isPTCOrSubsidiary === 'subsidiary'
                          ? t('fields.tickerSymbol.descriptionSubsidiary')
                          : t('fields.tickerSymbol.description')
                      }
                      inputProps={{ maxLength: 10 }}
                      required
                      disabled={isFormDisabled}
                    />

                    <OnboardingFormField
                      control={form.control}
                      disableFieldRuleMapping
                      name="stockExchange"
                      type="combobox"
                      label={
                        isPTCOrSubsidiary === 'subsidiary'
                          ? t('fields.stockExchange.labelSubsidiary')
                          : t('fields.stockExchange.label')
                      }
                      description={
                        isPTCOrSubsidiary === 'subsidiary'
                          ? t('fields.stockExchange.descriptionSubsidiary')
                          : t('fields.stockExchange.description')
                      }
                      options={stockExchangeOptions}
                      required
                      disabled={isFormDisabled}
                    />

                    {stockExchange === 'Other' && (
                      <OnboardingFormField
                        control={form.control}
                        disableFieldRuleMapping
                        name="stockExchangeName"
                        type="text"
                        inputProps={{ maxLength: 100 }}
                        required
                        disabled={isFormDisabled}
                      />
                    )}
                  </div>
                )}
              </div>
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
