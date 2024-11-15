import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSmbdoGetClient, useSmbdoUpdateClient } from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStepper } from '@/components/ui/stepper';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
  useFilterFunctionsByClientContext,
} from '../utils/formUtils';
import { IndividualStepFormSchema } from './IndividualStepForm.schema';

export const IndividualStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId, onPostClientResponse } = useOnboardingContext();

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const { clientContext } = useFilterFunctionsByClientContext(clientData);

  const form = useForm<z.infer<typeof IndividualStepFormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(IndividualStepFormSchema),
    defaultValues: {
      individualAddresses: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          addressLines: [''],
          city: '',
          postalCode: '',
          country: '',
        },
      ],
      individualIds: [],
      individualPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '',
      },
      soleOwner: false,
    },
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: 'individualAddresses',
  });

  const {
    fields: idFields,
    append: appendId,
    remove: removeId,
  } = useFieldArray({
    control: form.control,
    name: 'individualIds',
  });

  // Get INDIVIDUAL's partyId
  const partyId = clientData?.parties?.find(
    (party) => party?.partyType === 'INDIVIDUAL'
  )?.id;

  // Populate form with client data
  useEffect(() => {
    if (getClientStatus === 'success' && clientData) {
      const formValues = convertClientResponseToFormValues(clientData, partyId);
      form.reset(formValues);
    }
  }, [clientData, getClientStatus, form, partyId]);

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient({
    mutation: {
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
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (clientId) {
      const requestBody = generateRequestBody(values, 0, 'addParties', {
        addParties: [
          {
            ...(partyId ? { id: partyId } : {}),
          },
        ],
      }) as UpdateClientRequestSmbdo;

      updateClient({
        id: clientId,
        data: requestBody,
      });
    }
  });

  if (updateClientStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter middle name (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nameSuffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name Suffix</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Jr., Sr., III" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryOfResidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of Residence</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., US" maxLength={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="CFO">CFO</SelectItem>
                    <SelectItem value="COO">COO</SelectItem>
                    <SelectItem value="President">President</SelectItem>
                    <SelectItem value="Chairman">Chairman</SelectItem>
                    <SelectItem value="Senior Branch Manager">
                      Senior Branch Manager
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch('jobTitle') === 'Other' && (
            <FormField
              control={form.control}
              name="jobTitleDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Describe your job title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="natureOfOwnership"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nature of Ownership</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nature of ownership" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Indirect">Indirect</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="soleOwner"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Sole Owner</FormLabel>
                  <FormDescription>
                    Check if this individual is the sole owner of the business.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        {/* Phone Information */}
        <Card className="eb-mt-6">
          <CardHeader>
            <CardTitle className="eb-text-lg eb-font-medium">
              Phone Information
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-3">
            <FormField
              control={form.control}
              name="individualPhone.phoneType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUSINESS_PHONE">
                        Business Phone
                      </SelectItem>
                      <SelectItem value="MOBILE_PHONE">Mobile Phone</SelectItem>
                      <SelectItem value="ALTERNATE_PHONE">
                        Alternate Phone
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="individualPhone.phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl key={clientContext.jurisdiction}>
                    <PhoneInput
                      {...field}
                      countries={['CA', 'US']}
                      placeholder="Enter phone number"
                      international={false}
                      defaultCountry={
                        clientContext.jurisdiction === 'CanadaMS' ? 'CA' : 'US'
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card className="eb-mt-6">
          <CardHeader>
            <CardTitle className="eb-text-lg eb-font-medium">
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            {addressFields.map((fieldName, index) => (
              <div
                key={fieldName.id}
                className="eb-space-y-4 eb-rounded-md eb-border eb-p-4"
              >
                <h4 className="eb-font-medium">Address {index + 1}</h4>
                <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.addressType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LEGAL_ADDRESS">
                              Legal Address
                            </SelectItem>
                            <SelectItem value="MAILING_ADDRESS">
                              Mailing Address
                            </SelectItem>
                            <SelectItem value="BUSINESS_ADDRESS">
                              Business Address
                            </SelectItem>
                            <SelectItem value="RESIDENTIAL_ADDRESS">
                              Residential Address
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.addressLines.0`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter address line 1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.city`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.state`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.postalCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter postal code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualAddresses.${index}.country`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter country code"
                            maxLength={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeAddress(index)}
                  variant="outline"
                  size="sm"
                  className="eb-mt-2"
                >
                  Remove Address
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                appendAddress({
                  addressType: 'RESIDENTIAL_ADDRESS',
                  addressLines: [''],
                  city: '',
                  postalCode: '',
                  country: '',
                })
              }
              variant="outline"
              size="sm"
            >
              Add Address
            </Button>
          </CardContent>
        </Card>
        {/* Individual IDs */}
        <Card className="eb-mt-6">
          <CardHeader>
            <CardTitle className="eb-text-lg eb-font-medium">
              Individual IDs
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            {idFields.map((fieldName, index) => (
              <div
                key={fieldName.id}
                className="eb-space-y-4 eb-rounded-md eb-border eb-p-4"
              >
                <h4 className="eb-font-medium">ID {index + 1}</h4>
                <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`individualIds.${index}.idType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SSN">SSN</SelectItem>
                            <SelectItem value="ITIN">ITIN</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualIds.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Value</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter ID value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualIds.${index}.issuer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter issuer country code"
                            maxLength={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualIds.${index}.expiryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`individualIds.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter description (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeId(index)}
                  variant="outline"
                  size="sm"
                  className="eb-mt-2"
                >
                  Remove ID
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                appendId({
                  idType: 'SSN',
                  value: '',
                  issuer: '',
                })
              }
              variant="outline"
              size="sm"
            >
              Add ID
            </Button>
          </CardContent>
        </Card>
        <ServerErrorAlert error={updateClientError} />
        <FormActions />
      </form>
    </Form>
  );
};
