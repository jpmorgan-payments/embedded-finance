import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSmbdoGetClient, useSmbdoUpdateClient, useUpdateParty as useSmbdoUpdateParty } from '@/api/generated/smbdo';
import {
  UpdateClientRequestSmbdo,
  UpdatePartyRequest,
} from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
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
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
  useFilterFunctionsByClientContext,
} from '../utils/formUtils';
import { IndividualStepFormSchema } from './IndividualStepForm.schema';

export const IndividualStepForm = () => {
  const { nextStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    usePartyResource,
    onPostPartyResponse,
  } = useOnboardingContext();
  const { t } = useTranslation('onboarding');

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const {
    getFieldRule,
    isFieldDisabled,
    isFieldRequired,
    isFieldVisible,
    clientContext,
  } = useFilterFunctionsByClientContext(clientData);

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
      individualIds: [{}],
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
  const existingIndividualParty = clientData?.parties?.find(
    (party) => party?.partyType === 'INDIVIDUAL'
  );

  // Populate form with client data
  useEffect(() => {
    if (getClientStatus === 'success' && clientData) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingIndividualParty?.id
      );
      form.reset(formValues);
    }
  }, [clientData, getClientStatus, form, existingIndividualParty?.id]);

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
    if (clientId) {
      const clientRequestBody = generateRequestBody(values, 0, 'addParties', {
        addParties: [
          {
            ...(existingIndividualParty?.id
              ? {
                  id: existingIndividualParty?.id,
                  partyType: existingIndividualParty?.partyType,
                  roles: existingIndividualParty?.roles,
                }
              : {
                  partyType: 'INDIVIDUAL',
                  roles: ['CONTROLLER'],
                }),
          },
        ],
      }) as UpdateClientRequestSmbdo;

      const partyRequestBody = generatePartyRequestBody(values, {
        ...(existingIndividualParty?.id
          ? {
              partyType: existingIndividualParty?.partyType,
              roles: existingIndividualParty?.roles,
            }
          : {
              partyType: 'INDIVIDUAL',
              roles: ['CONTROLLER'],
            }),
      }) as UpdatePartyRequest;

      if (usePartyResource && existingIndividualParty?.id) {
        updateParty(
          {
            partyId: existingIndividualParty?.id,
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
  });

  if (updateClientStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  if (usePartyResource && updatePartyStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            General
          </legend>
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
        </fieldset>

        {/* Phone Information */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Individual Phone Information
          </legend>
          <FormField
            control={form.control}
            name="individualPhone.phoneType"
            disabled={isFieldDisabled('individualPhone')}
            render={({ field }) => (
              <FormItem>
                <FormLabel asterisk={isFieldRequired('individualPhone')}>
                  Phone Type
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger ref={field.ref}>
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
            disabled={isFieldDisabled('individualPhone')}
            render={({ field }) => (
              <FormItem>
                <FormLabel asterisk={isFieldRequired('individualPhone')}>
                  Phone Number
                </FormLabel>
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
        </fieldset>

        {/* Addresses */}
        {isFieldVisible('individualAddresses') && (
          <>
            {addressFields.map((fieldName, index) => (
              <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Individual Address {index + 1}
                </legend>
                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.addressType`}
                  type="select"
                  required
                  options={[
                    {
                      value: 'RESIDENTIAL_ADDRESS',
                      label: t('addressTypes.RESIDENTIAL_ADDRESS'),
                    },
                  ]}
                />

                <FormField
                  control={form.control}
                  name={`individualAddresses.${index}.addressLines.0`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel asterisk>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter address line 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`individualAddresses.${index}.addressLines.1`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter address line 2" />
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
                      <FormLabel asterisk>City</FormLabel>
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
                      <FormLabel asterisk>State</FormLabel>
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
                      <FormLabel asterisk>Postal Code</FormLabel>
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
                      <FormLabel asterisk>Country</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={2}
                          placeholder="e.g., US"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="eb-col-span-full">
                  <Button
                    type="button"
                    onClick={() => removeAddress(index)}
                    variant="outline"
                    size="sm"
                    className="eb-mt-2"
                    disabled={
                      addressFields.length <=
                      (getFieldRule('individualAddresses').minItems ?? 1)
                    }
                  >
                    Remove Address
                  </Button>
                </div>
              </fieldset>
            ))}
          </>
        )}
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
          disabled={
            idFields.length >= (getFieldRule('addresses').maxItems ?? 50)
          }
          variant="outline"
          size="sm"
        >
          Add Address
        </Button>

        {/* Individual IDs */}

        {isFieldVisible('individualIds') && (
          <>
            {idFields.map((fieldItem, index) => (
              <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Individual ID {index + 1}
                </legend>
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
                          <SelectTrigger ref={field.ref}>
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
                        <Input {...field} placeholder="Enter issuer" />
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
                        <Input {...field} type="date" className="eb-w-full" />
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

                <div className="eb-col-span-full">
                  <Button
                    type="button"
                    disabled={
                      idFields.length <=
                      (getFieldRule('organizationIds').minItems ?? 0)
                    }
                    onClick={() => removeId(index)}
                    variant="outline"
                    size="sm"
                    className="eb-mt-2"
                  >
                    Remove Individual ID
                  </Button>
                </div>
              </fieldset>
            ))}
          </>
        )}
        <Button
          type="button"
          onClick={() =>
            appendId({
              idType: 'SSN',
              value: '',
              issuer: '',
            })
          }
          disabled={
            idFields.length >= (getFieldRule('individualIds').maxItems ?? 50)
          }
          variant="outline"
          size="sm"
        >
          Add Individual ID
        </Button>

        <ServerErrorAlert
          error={usePartyResource ? updatePartyError : updateClientError}
        />
        <FormActions />
      </form>
    </Form>
  );
};
