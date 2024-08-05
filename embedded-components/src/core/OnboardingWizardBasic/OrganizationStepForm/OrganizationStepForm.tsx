import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
} from '@/api/generated/embedded-banking';
import { UpdateClientRequestSmbdo } from '@/api/generated/embedded-banking.schemas';
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
import { useStepper } from '@/components/ui/stepper';

import { FormActions } from '../FormActions/FormActions';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { OrganizationStepFormSchema } from './OrganizationStepForm.schema';

export const OrganizationStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId } = useOnboardingContext();

  // Create a form with empty default values
  const form = useForm<z.infer<typeof OrganizationStepFormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(OrganizationStepFormSchema),
    defaultValues: {
      organizationName: '',
      organizationType: 'C_CORPORATION',
      countryOfFormation: '',
    },
  });

  // Fetch client data
  const { data: clientData, status: clientGetStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's partyId
  const partyId = clientData?.parties?.find(
    (party) => party.partyType === 'ORGANIZATION'
  )?.id;

  // Populate form with client data
  useEffect(() => {
    if (clientGetStatus === 'success' && clientData) {
      const formValues = convertClientResponseToFormValues(clientData, partyId);
      form.reset(formValues);
    }
  }, [clientData, clientGetStatus, form, partyId]);

  const { mutate: updateClient, error: updateClientError } =
    useSmbdoUpdateClient({
      mutation: {
        onSuccess: () => {
          nextStep();
          toast.success("Client's organization details updated successfully");
        },
        onError: (error) => {
          if (error.response?.data?.context) {
            const { context } = error.response.data;
            const apiFormErrors = translateApiErrorsToFormErrors(context, 0);
            setApiFormErrors(form, apiFormErrors);
          }
        },
      },
    });

  const onSubmit = form.handleSubmit((values) => {
    if (clientId && partyId) {
      const requestBody = generateRequestBody(values, 0, {
        addParties: [
          {
            id: partyId,
          },
        ],
      }) as UpdateClientRequestSmbdo;

      updateClient({
        id: clientId,
        data: requestBody,
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel asterisk>Organization name</FormLabel>
              <FormDescription>
                The organization&apos;s legal name. It is the official name of
                the person or entity that owns a company. Must be the name used
                on the legal party&apos;s government forms and business
                paperwork.
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
          name="organizationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel asterisk>Organization type</FormLabel>
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
              <FormDescription>Country code in alpha-2 format</FormDescription>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ServerErrorAlert error={updateClientError} />
        <FormActions />
      </form>
    </Form>
  );
};
