import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { CLIENT_PRODUCT_MAPPING } from '../utils/clientProductMapping';
import { COUNTRY_CODE_MAPPING } from '../utils/countryCodeMapping';
import {
  convertClientResponseToFormValues,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_MAPPING } from '../utils/organizationTypeMapping';
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

  const defaultProduct =
    availableProducts.length === 1 ? availableProducts[0] : undefined;
  const defaultJurisdiction =
    availableJurisdictions.length === 1 ? availableJurisdictions[0] : undefined;

  // Create a form with empty default values
  const form = useForm<z.infer<typeof InitialStepFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(InitialStepFormSchema),
    defaultValues: {
      jurisdiction: defaultJurisdiction,
      product: defaultProduct,
      organizationName: '',
      organizationType: undefined,
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
    return <FormLoadingState message="Submitting..." />;
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
                  <FormLabel asterisk>Product</FormLabel>
                  {defaultProduct || clientId ? (
                    <>
                      {defaultProduct && defaultProduct !== field.value && (
                        <FormDescription>
                          DEV WARNING: The client response has a different
                          product than the wizard&apos;s configured default of{' '}
                          <b>{CLIENT_PRODUCT_MAPPING[defaultProduct]}</b>.
                        </FormDescription>
                      )}

                      <Text className="eb-font-bold">
                        {CLIENT_PRODUCT_MAPPING[field.value]}
                      </Text>
                    </>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProducts?.map((product) => (
                          <SelectItem key={product} value={product}>
                            {CLIENT_PRODUCT_MAPPING[product]}
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
                  <FormLabel asterisk>Jurisdiction</FormLabel>
                  {availableJurisdictions.length === 1 ? (
                    <Text className="eb-font-bold">
                      {COUNTRY_CODE_MAPPING[field.value]} ({field.value})
                    </Text>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country of jurisdiction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableJurisdictions?.map((jurisdiction) => (
                          <SelectItem key={jurisdiction} value={jurisdiction}>
                            {COUNTRY_CODE_MAPPING[jurisdiction]} ({jurisdiction}
                            )
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
                  <FormLabel asterisk>Organization type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ORGANIZATION_TYPE_MAPPING).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
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
                  <FormLabel asterisk>Organization name</FormLabel>
                  <FormDescription>
                    The organization&apos;s legal name. It is the official name
                    of the person or entity that owns a company. Must be the
                    name used on the legal party&apos;s government forms and
                    business paperwork.
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
                  <FormLabel asterisk>Organization email</FormLabel>
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
                  <FormLabel asterisk>Country of formation</FormLabel>
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
              <Button>Next</Button>
            </div>
          </div>
          <Card className="hidden md:block">
            <CardHeader>
              <CardDescription>
                The information we request from you will help us complete
                setting up your account.
              </CardDescription>
              <CardDescription>
                Please review and update any information that needs
                confirmation; and provide any additional information requested.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="eb-mb-4" />
              <Text>
                Please select your <b>organization type</b> to preview the
                information you will need to confirm or provide.
              </Text>
              <Separator className="eb-my-4" />
              <Text>
                <b>Information you will have to review during onboarding steps:</b>
              </Text>
              <ul>
                {generateRequiredFieldsList(clientData).map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};
