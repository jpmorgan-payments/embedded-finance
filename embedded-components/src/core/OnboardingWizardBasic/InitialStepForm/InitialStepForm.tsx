import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useStepper } from '@/components/ui/stepper';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  setApiFormErrors,
  translateClientApiErrorsToFormErrors,
  translatePartyApiErrorsToFormErrors,
  useFilterFunctionsByClientContext,
  useStepForm,
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
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const { filterDefaultValues, filterSchema } =
    useFilterFunctionsByClientContext(clientData);

  const defaultProduct =
    availableProducts?.length === 1 ? availableProducts[0] : undefined;
  const defaultJurisdiction =
    availableJurisdictions?.length === 1
      ? availableJurisdictions[0]
      : undefined;

  // Create a form with empty default values
  const form = useStepForm<z.infer<typeof InitialStepFormSchema>>({
    resolver: zodResolver(filterSchema(InitialStepFormSchema)),
    defaultValues: filterDefaultValues({
      jurisdiction: defaultJurisdiction,
      product: defaultProduct,
    }),
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
    if (
      clientData &&
      getClientStatus === 'success' &&
      existingOrgParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );

      // Get product from response since it's not in the party object
      formValues.product = clientData.products?.[0] ?? defaultProduct;
      formValues.jurisdiction = formValues.jurisdiction ?? defaultJurisdiction;

      form.reset({ ...form.getValues(), ...formValues });
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    getClientStatus,
    form.reset,
    existingOrgParty?.id,
    isFormPopulated,
    defaultProduct,
    defaultJurisdiction,
  ]);

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
                const apiFormErrors =
                  translatePartyApiErrorsToFormErrors(context);
                setApiFormErrors(form, apiFormErrors);
              }
            },
          }
        );
      }
      // Create party if it doesn't exist
      else {
        const clientRequestBody = generateRequestBody(values, 0, 'addParties', {
          addParties: [
            {
              partyType: 'ORGANIZATION',
              roles: ['CLIENT'],
            },
          ],
        });
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
                const apiFormErrors = translateClientApiErrorsToFormErrors(
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
              const apiFormErrors = translateClientApiErrorsToFormErrors(
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

  if (clientData && !isFormPopulated) {
    return <FormLoadingState message="Loading..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="eb-grid eb-grid-cols-1 eb-gap-8 md:eb-grid-cols-2">
          <fieldset className="eb-space-y-6">
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

            <FormActions />
          </fieldset>
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
                    generateRequiredFieldsList(
                      form.watch('organizationType'),
                      form.watch('product'),
                      form.watch('jurisdiction')
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
                        form.watch('organizationType'),
                        form.watch('product'),
                        form.watch('jurisdiction')
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
