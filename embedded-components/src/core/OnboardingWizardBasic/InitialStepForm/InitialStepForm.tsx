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
} from '@/api/generated/smbdo';
import {
  ClientResponse,
  CreateClientRequestSmbdo,
  UpdateClientRequestSmbdo,
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
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui';

import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';
import { InitialStepFormSchema } from './InitialStepForm.schema';

export const InitialStepForm = () => {
  const { nextStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    setClientId,
    availableProducts,
    availableJurisdictions,
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

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's partyId
  const partyId = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  )?.id;

  // If clientId exists, populate form with client data
  useEffect(() => {
    if (clientData && getClientStatus === 'success' && partyId) {
      const formValues = convertClientResponseToFormValues(clientData, partyId);
      const productFromResponse = clientData.products?.[0];
      if (productFromResponse) {
        formValues.product = productFromResponse;
      }
      form.reset(formValues);
    }
  }, [clientData, getClientStatus, form.reset, partyId]);

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

  const onSubmit = form.handleSubmit((values) => {
    // Update client if clientId exists
    if (clientId) {
      const requestBody = generateRequestBody(values, 0, 'addParties', {
        addParties: [
          {
            ...(partyId ? { id: partyId } : {}),
          },
        ],
      }) as UpdateClientRequestSmbdo;

      updateClient(
        {
          id: clientId,
          data: requestBody,
        },
        {
          onSettled: (data, error) => {
            onPostClientResponse?.(data, error?.response?.data);
          },
          onSuccess: () => {
            nextStep();
            toast.success("Client's organization details updated successfully");
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

  if (postClientStatus === 'pending' || updateClientStatus === 'pending') {
    return <FormLoadingState message={t('common:submitting')} />;
  }

  function generateRequiredFieldsList(data: ClientResponse | undefined) {
    if (!data) return [];

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

                      <Text className="eb-font-bold">
                        {t(`clientProducts.${field.value}`)}
                      </Text>
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
                    <Text className="eb-font-bold">
                      {t(`clientJurisdictions.${field.value}`)} ({field.value})
                    </Text>
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ServerErrorAlert error={postClientError || updateClientError} />

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
                  <Text>
                    <Trans
                      t={t}
                      i18nKey="initialStepOrganizationTypeInformation"
                      values={{
                        organizationType: t(
                          `organizationTypes.${form.getValues('organizationType')}`
                        ),
                      }}
                    />
                  </Text>
                  <ul>
                    {generateRequiredFieldsList(clientData).map((field) => (
                      <li key={field}>
                        <Text>- {field}</Text>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Text>
                  <Trans t={t} i18nKey="initialStepNoOrganizationType" />
                </Text>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};
