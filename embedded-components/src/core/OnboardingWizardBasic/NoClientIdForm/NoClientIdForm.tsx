import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSmbdoPostClients } from '@/api/generated/smbdo';
import { CreateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
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
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { ORGANIZATION_TYPE_MAPPING } from '../utils/organizationTypeMapping';
import { NoClientIdFormSchema } from './NoClientIdForm.schema';

export const NoClientIdForm = () => {
  const { nextStep } = useStepper();
  const {
    onPostClientResponse,
    setClientId,
    availableProducts,
    availableJurisdictions,
  } = useOnboardingContext();

  // Create a form with empty default values
  const form = useForm<z.infer<typeof NoClientIdFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(NoClientIdFormSchema),
    defaultValues: {
      product:
        availableProducts.length === 1 ? availableProducts[0] : undefined,
      jurisdiction:
        availableJurisdictions.length === 1
          ? availableJurisdictions[0]
          : undefined,
      organizationName: '',
      organizationType: undefined,
      countryOfFormation: '',
    },
  });

  const {
    mutate: postClient,
    error: postClientError,
    status: postClientStatus,
  } = useSmbdoPostClients({
    mutation: {
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
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const requestBody = generateRequestBody(values, 0, 'parties', {
      products: ['EMBEDDED_PAYMENTS'],
      parties: [
        {
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
        },
      ],
    }) as CreateClientRequestSmbdo;

    postClient({
      data: requestBody,
    });
  });

  if (postClientStatus === 'pending') {
    return <FormLoadingState message="Creating client..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="eb-grid eb-grid-cols-2 eb-gap-8">
          <div className="eb-space-y-6">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>Product</FormLabel>
                  {availableProducts.length === 1 ? (
                    <Text className="eb-font-bold">
                      {CLIENT_PRODUCT_MAPPING[field.value]}
                    </Text>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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

            <ServerErrorAlert error={postClientError} />

            <div className="eb-flex eb-w-full eb-justify-end eb-gap-4">
              <Button>Submit</Button>
            </div>
          </div>
          <Card>
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
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};