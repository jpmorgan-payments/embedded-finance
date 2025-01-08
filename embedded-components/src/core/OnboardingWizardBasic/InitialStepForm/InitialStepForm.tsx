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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStepper } from '@/components/ui/stepper';
import { Separator } from '@/components/ui';

import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';
import { COUNTRIES_OF_FORMATION } from '../utils/countriesOfFormationList';
import { InitialStepFormSchema } from './InitialStepForm.schema';

export const InitialStepForm = () => {
  const { nextStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    setClientId,
    availableProducts,
    availableJurisdictions,
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
      email: '',
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
          onSuccess: (response) => {
            setClientId?.(response.id);
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

  if (updateClientStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  if (postClientStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  if (usePartyResource && updatePartyStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  function generateRequiredFieldsList(type?: OrganizationType) {
    if (!type) return [];

    const requiredFields = [
      'Organization Name',
      'Organization Type',
      'Country of Formation',
      'Email',
    ];

    // Add more fields based on the data if necessary
    // Example: if (data.someCondition) requiredFields.push('Some Other Field');

    return requiredFields;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="eb-grid eb-grid-cols-1 eb-gap-8 md:eb-grid-cols-2">
          <div className="eb-space-y-6">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('product')}</FormLabel>
                  {defaultProduct || clientId ? (
                    <>
                      {defaultProduct && defaultProduct !== field.value && (
                        <FormDescription>
                          DEV WARNING: The client response has a different
                          product than the wizard&apos;s configured default of{' '}
                          <b>{t(`clientProducts.${defaultProduct}`)}</b>.
                        </FormDescription>
                      )}

                      <p className="eb-font-bold">
                        {t(`clientProducts.${field.value}`)}
                      </p>
                    </>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProducts?.map((product) => (
                          <SelectItem key={product} value={product}>
                            {t(`clientProducts.${product}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jurisdiction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('jurisdiction')}</FormLabel>
                  {availableJurisdictions?.length === 1 ? (
                    <p className="eb-font-bold">
                      {t(`clientJurisdictions.${field.value}`)} ({field.value})
                    </p>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder="Select country of jurisdiction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableJurisdictions?.map((jurisdiction) => (
                          <SelectItem key={jurisdiction} value={jurisdiction}>
                            {t(`clientJurisdictions.${jurisdiction}`)} (
                            {jurisdiction})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('organizationType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORGANIZATION_TYPE_LIST.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`organizationTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('organizationName')}</FormLabel>
                  <FormDescription>
                    {t('organizationNameDescription')}
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('organizationEmail')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryOfFormation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>{t('countryOfFormation')}</FormLabel>
                  <FormDescription>
                    Country code in alpha-2 format
                  </FormDescription>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder="Select country of formation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES_OF_FORMATION.map((country) => (
                        <SelectItem key={country} value={country} defaultValue="US">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
            <CardHeader>
              <CardDescription>{t('initialStepDescription1')}</CardDescription>
              <CardDescription>{t('initialStepDescription2')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="eb-mb-4" />
              {form.getValues('organizationType') ? (
                <>
                  <p className="eb-text-sm">
                    <Trans
                      t={t}
                      i18nKey="initialStepOrganizationTypeInformation"
                      values={{
                        organizationType: t(
                          `organizationTypes.${form.getValues('organizationType')}`
                        ),
                      }}
                    />
                  </p>
                  <ul>
                    {generateRequiredFieldsList(
                      form.getValues('organizationType')
                    ).map((field) => (
                      <li key={field} className="eb-text-sm">
                        - {field}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="eb-text-sm">
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
