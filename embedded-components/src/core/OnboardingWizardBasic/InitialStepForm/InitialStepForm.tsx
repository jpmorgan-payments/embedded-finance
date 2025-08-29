import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoPostClients,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useStepper } from '@/components/ui/stepper';

import { FormActions } from '../FormActions/FormActions';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useStepFormWithFilters,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';
import { InitialStepFormSchema } from './InitialStepForm.schema';
import { generateRequiredFieldsList } from './requiredFields';

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

  // Fetch client data
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  const defaultProduct =
    availableProducts?.length === 1 ? availableProducts[0] : undefined;
  const defaultJurisdiction =
    availableJurisdictions?.length === 1
      ? availableJurisdictions[0]
      : undefined;

  // Create a form with empty default values
  const form = useStepFormWithFilters({
    clientData,
    schema: InitialStepFormSchema,
    defaultValues: {
      jurisdiction: defaultJurisdiction,
      product: defaultProduct,
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

  // Get organization's party
  const existingOrgParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  // If clientId exists, populate form with client data
  useEffect(() => {
    if (clientData && existingOrgParty?.id && !isFormPopulated) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );

      // Get product from response since it's not in the party object
      formValues.product = clientData.products?.[0] ?? defaultProduct;
      formValues.jurisdiction = formValues.jurisdiction ?? defaultJurisdiction;

      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          InitialStepFormSchema
        )
      );
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    form.reset,
    existingOrgParty?.id,
    isFormPopulated,
    defaultProduct,
    defaultJurisdiction,
  ]);

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
    // Update client if clientId exists
    if (clientId) {
      // Update party if it exists
      if (usePartyResource && existingOrgParty?.id) {
        const partyRequestBody = generatePartyRequestBody(values, {});
        updateParty(
          {
            partyId: existingOrgParty.id,
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
                partyType: 'ORGANIZATION',
                roles: ['CLIENT'],
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
              nextStep();
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

    // Create client if clientId does not exist
    else {
      const requestBody = generateClientRequestBody(values, 0, 'parties', {
        parties: [
          {
            partyType: 'ORGANIZATION',
            roles: ['CLIENT'],
          },
        ],
      });

      postClient(
        {
          data: {
            products: values.product ? [values.product] : [],
            ...requestBody,
          },
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
  });

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    clientPostStatus === 'pending' ||
    (usePartyResource && partyUpdateStatus === 'pending');

  const isPopulatingForm = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isPopulatingForm;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="eb-grid eb-grid-cols-1 eb-gap-8 md:eb-grid-cols-2">
          <fieldset className="eb-space-y-6" disabled={isFormDisabled}>
            <OnboardingFormField
              control={form.control}
              name="product"
              type="select"
              options={availableProducts.map((product) => ({
                value: product,
                label: t(`clientProducts.${product}`),
              }))}
              readonly={Boolean(defaultProduct || clientId)}
              disabled={isFormDisabled}
            />

            <OnboardingFormField
              control={form.control}
              name="jurisdiction"
              type="select"
              options={availableJurisdictions.map((jurisdiction) => ({
                value: jurisdiction,
                label: `${t(`clientJurisdictions.${jurisdiction}`)} (${
                  jurisdiction
                })`,
              }))}
              readonly={Boolean(defaultJurisdiction)}
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
                (usePartyResource ? partyUpdateError : clientUpdateError) ||
                clientPostError
              }
            />

            <FormActions
              disabled={isFormDisabled}
              isLoading={isFormSubmitting}
            />
          </fieldset>
          <Card className="eb-hidden md:eb-block">
            <CardHeader className="eb-border-l-2 eb-bg-gray-100">
              <CardDescription>{t('initialStepDescription1')}</CardDescription>
              <CardDescription>{t('initialStepDescription2')}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const organizationType = form.watch('organizationType');
                const product = form.watch('product');
                const jurisdiction = form.watch('jurisdiction');
                return organizationType ? (
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
                          product: product
                            ? t(`clientProducts.${product}`)
                            : '',
                          jurisdiction: jurisdiction
                            ? t(`clientJurisdictions.${jurisdiction}`)
                            : '',
                        }}
                      />
                    </p>
                    {Object.entries(
                      generateRequiredFieldsList(
                        organizationType,
                        product || defaultProduct,
                        jurisdiction || defaultJurisdiction
                      ).fields
                    ).map(([step, fields]) => (
                      <div key={step} className="eb-mb-4">
                        <h4 className="eb-mb-2 eb-text-sm eb-font-medium">
                          {t(`stepLabels.${step}`, {
                            defaultValue: step,
                          }).toUpperCase()}
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
                          organizationType,
                          product || defaultProduct,
                          jurisdiction || defaultJurisdiction
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
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};
