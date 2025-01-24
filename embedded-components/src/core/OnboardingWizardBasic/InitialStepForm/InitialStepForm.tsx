import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoPostClients,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import {
  CreateClientRequestSmbdo,
  OrganizationType,
  UpdateClientRequestSmbdo,
  UpdatePartyRequest,
} from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useStepper } from '@/components/ui/stepper';

import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import { partyFieldMap } from '../utils/fieldMap';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';
import { InitialStepFormSchema } from './InitialStepForm.schema';

interface RequiredFieldsList {
  fields: Record<string, string[]>;
  notes: string[];
}

export const InitialStepForm = () => {
  const { nextStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    setClientId,
    availableProducts,
    availableJurisdictions,
    availableOrganizationTypes,
    usePartyResource,
    onPostPartyResponse,
  } = useOnboardingContext();
  const { t } = useTranslation(['onboarding', 'common']);

  const defaultProduct =
    availableProducts?.length === 1 ? availableProducts[0] : undefined;
  const defaultJurisdiction =
    availableJurisdictions?.length === 1
      ? availableJurisdictions[0]
      : undefined;

  // Create a form with empty default values
  const form = useForm<z.infer<typeof InitialStepFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(InitialStepFormSchema),
    defaultValues: {
      jurisdiction: defaultJurisdiction,
      product: defaultProduct,
      organizationName: '',
      organizationType: undefined,
      organizationEmail: '',
      countryOfFormation: '',
    },
  });

  // Set default product and jurisdiction if props change
  useEffect(() => {
    if (defaultProduct) {
      form.setValue('product', defaultProduct);
    }
  }, [defaultProduct]);

  useEffect(() => {
    if (defaultJurisdiction) {
      form.setValue('jurisdiction', defaultJurisdiction);
    }
  }, [defaultJurisdiction]);

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's party
  const existingOrgParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  // If clientId exists, populate form with client data
  useEffect(() => {
    if (clientData && getClientStatus === 'success' && existingOrgParty?.id) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty?.id
      );
      const productFromResponse = clientData.products?.[0];
      if (productFromResponse) {
        formValues.product = productFromResponse;
      }
      form.reset(formValues);
    }
  }, [clientData, getClientStatus, form.reset, existingOrgParty?.id]);

  const {
    mutate: postClient,
    error: postClientError,
    status: postClientStatus,
  } = useSmbdoPostClients();

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient();

  const {
    mutate: updateParty,
    error: updatePartyError,
    status: updatePartyStatus,
  } = useSmbdoUpdateParty();

  const onSubmit = form.handleSubmit((values) => {
    // Update client if clientId exists
    if (clientId) {
      const clientRequestBody = generateRequestBody(values, 0, 'addParties', {
        addParties: [
          {
            ...(existingOrgParty?.id
              ? {
                  id: existingOrgParty?.id,
                  partyType: existingOrgParty?.partyType,
                  roles: existingOrgParty?.roles,
                }
              : {
                  partyType: 'ORGANIZATION',
                  roles: ['CLIENT'],
                }),
          },
        ],
      }) as UpdateClientRequestSmbdo;

      const partyRequestBody = generatePartyRequestBody(values, {
        ...(existingOrgParty?.id
          ? {
              id: existingOrgParty?.id,
              partyType: existingOrgParty?.partyType,
              roles: existingOrgParty?.roles,
            }
          : {
              partyType: 'ORGANIZATION',
              roles: ['CLIENT'],
            }),
      }) as UpdatePartyRequest;

      if (usePartyResource && existingOrgParty?.id) {
        updateParty(
          {
            partyId: existingOrgParty?.id,
            data: partyRequestBody,
          },
          {
            onSettled: (data, error) => {
              onPostPartyResponse?.(data, error?.response?.data);
            },
            onSuccess: () => {
              nextStep();
              toast.success(
                "Client's organization details updated successfully"
              );
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = translateApiErrorsToFormErrors(
                  context,
                  0,
                  'addParties'
                );
                setApiFormErrors(form, apiFormErrors);
              }
            },
          }
        );
      } else {
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
              nextStep();
              toast.success(
                "Client's organization details updated successfully"
              );
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = translateApiErrorsToFormErrors(
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

    // Create client if clientId does not exist
    else {
      const requestBody = generateRequestBody(values, 0, 'parties', {
        products: values.product ? [values.product] : [],
        parties: [
          {
            partyType: 'ORGANIZATION',
            roles: ['CLIENT'],
          },
        ],
      }) as CreateClientRequestSmbdo;

      postClient(
        {
          data: requestBody,
        },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: async (response) => {
            await setClientId?.(response.id);
            toast.success(
              `Client created successfully with ID: ${response.id}`,
              {}
            );
            nextStep();
          },
          onError: (error) => {
            if (error.response?.data?.context) {
              const { context } = error.response.data;
              const apiFormErrors = translateApiErrorsToFormErrors(
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
  });

  if (
    updateClientStatus === 'pending' ||
    postClientStatus === 'pending' ||
    (usePartyResource && updatePartyStatus === 'pending')
  ) {
    return <FormLoadingState message="Submitting..." />;
  }

  function generateRequiredFieldsList(
    type?: OrganizationType
  ): RequiredFieldsList {
    if (!type) return { fields: {}, notes: [] };

    const { product, jurisdiction } = form.getValues();

    // Get required fields from fieldMap based on base rules and conditional rules
    const requiredFields = Object.entries(partyFieldMap)
      .filter(([, fieldConfig]) => {
        // Check base rule
        if (!fieldConfig.baseRule.required) return false;

        // Check conditional rules if they exist
        if (fieldConfig.conditionalRules) {
          return !fieldConfig.conditionalRules.some(
            (rule) =>
              (!rule.condition.product ||
                rule.condition.product.includes(product)) &&
              (!rule.condition.jurisdiction ||
                rule.condition.jurisdiction.includes(jurisdiction)) &&
              rule.rule.visibility === 'hidden'
          );
        }

        return true;
      })
      .reduce<Record<string, string[]>>((acc, [fieldName, fieldConfig]) => {
        // If path has no dot, it's a root attribute - put it in generic category
        const step = fieldConfig.path.includes('.')
          ? fieldConfig.path.split('.')[0]
          : 'generic';

        // Ensure generic category appears first
        const sortedStep = step === 'generic' ? '0_generic' : step;

        // Create step if it doesn't exist
        if (!acc[sortedStep]) {
          acc[sortedStep] = [];
        }

        acc[sortedStep].push(`fields.${fieldName}.label`);
        return acc;
      }, {});

    // Remove the '0_' prefix from generic step
    if (requiredFields['0_generic']) {
      requiredFields.generic = requiredFields['0_generic'];
      delete requiredFields['0_generic'];
    }

    return {
      fields: requiredFields,
      notes: [
        'initialStepNotes.additionalQuestions',
        ...(type === 'LIMITED_LIABILITY_COMPANY'
          ? ['initialStepNotes.llcOwners']
          : []),
        'initialStepNotes.attestation',
        'initialStepNotes.kycProcess',
      ],
    };
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="eb-grid eb-grid-cols-1 eb-gap-8 md:eb-grid-cols-2">
          <div className="eb-space-y-6">
            <OnboardingFormField
              control={form.control}
              name="product"
              type="select"
              options={availableProducts.map((product) => ({
                value: product,
                label: t(`clientProducts.${product}`),
              }))}
              visibility={defaultProduct || clientId ? 'readonly' : 'visible'}
            />

            <OnboardingFormField
              control={form.control}
              name="jurisdiction"
              visibility={
                availableJurisdictions?.length === 1 ? 'readonly' : 'visible'
              }
              type="select"
              options={availableJurisdictions.map((jurisdiction) => ({
                value: jurisdiction,
                label: `${t(`clientJurisdictions.${jurisdiction}`)} (${
                  jurisdiction
                })`,
              }))}
            />

            <OnboardingFormField
              control={form.control}
              name="organizationType"
              type="select"
              options={(
                availableOrganizationTypes ?? ORGANIZATION_TYPE_LIST
              ).map((type) => ({
                value: type,
                label: t(`organizationTypes.${type}`),
              }))}
            />

            <OnboardingFormField
              control={form.control}
              name="organizationName"
              type="text"
            />

            <OnboardingFormField
              control={form.control}
              name="organizationEmail"
              type="email"
            />

            <OnboardingFormField
              control={form.control}
              name="countryOfFormation"
              type="combobox"
              options={COUNTRIES_OF_FORMATION.map((code) => ({
                value: code,
                label: (
                  <span>
                    <span className="eb-font-medium">[{code}]</span>{' '}
                    {t([
                      `common:countries.${code}`,
                    ] as unknown as TemplateStringsArray)}
                  </span>
                ),
              }))}
            />

            <ServerErrorAlert
              error={
                usePartyResource
                  ? updatePartyError
                  : updateClientError || postClientError
              }
            />

            <div className="eb-flex eb-w-full eb-justify-end eb-gap-4">
              <Button>{t('common:next')}</Button>
            </div>
          </div>
          <Card className="eb-hidden md:eb-block">
            <CardHeader className="eb-border-l-2 eb-bg-gray-100">
              <CardDescription>{t('initialStepDescription1')}</CardDescription>
              <CardDescription>{t('initialStepDescription2')}</CardDescription>
            </CardHeader>
            <CardContent>
              {form.watch('organizationType') ? (
                <>
                  <p className="eb-my-4 eb-text-sm">
                    <Trans
                      t={t}
                      i18nKey={
                        form.watch('product') && form.watch('jurisdiction')
                          ? 'initialStepOrganizationTypeInformationFull'
                          : 'initialStepOrganizationTypeInformationBasic'
                      }
                      values={{
                        organizationType: form.watch('organizationType'),
                        product: form.watch('product')
                          ? t(`clientProducts.${form.watch('product')}`)
                          : '',
                        jurisdiction: form.watch('jurisdiction')
                          ? t(
                              `clientJurisdictions.${form.watch('jurisdiction')}`
                            )
                          : '',
                      }}
                    />
                  </p>
                  {Object.entries(
                    generateRequiredFieldsList(form.watch('organizationType'))
                      .fields
                  ).map(([step, fields]) => (
                    <div key={step} className="eb-mb-4">
                      <h4 className="eb-mb-2 eb-text-sm eb-font-medium">
                        {t(`stepLabels.${step}`, { defaultValue: step })}
                      </h4>
                      <ul>
                        {fields.map((fieldKey) => (
                          <li key={fieldKey} className="eb-text-sm">
                            - {t(fieldKey, { defaultValue: fieldKey })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="eb-mt-6">
                    <h4 className="eb-mb-2 eb-text-sm eb-font-medium">
                      {t('initialStepNotes.title')}
                    </h4>
                    <ul>
                      {generateRequiredFieldsList(
                        form.watch('organizationType')
                      ).notes.map((noteKey) => (
                        <li key={noteKey} className="eb-text-sm">
                          - {t(noteKey, { defaultValue: noteKey })}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="eb-my-4 eb-text-sm">
                  <Trans t={t} i18nKey="initialStepNoOrganizationType" />
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};
