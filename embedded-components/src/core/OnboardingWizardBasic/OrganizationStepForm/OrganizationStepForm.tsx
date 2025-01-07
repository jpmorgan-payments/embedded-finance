/* eslint-disable react/no-unescaped-entities */
import { Fragment, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { useSmbdoUpdateParty } from '@/api/generated/embedded-banking';
import { useSmbdoGetClient, useSmbdoUpdateClient } from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { UpdatePartyRequest } from '@/api/generated/embedded-banking.schemas';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStepper } from '@/components/ui/stepper';
import { RadioGroup, RadioGroupItem } from '@/components/ui';
import { InfoPopover } from '@/components/ux/InfoPopover';

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
import naicsCodes from './naics-codes.json';
import {
  OrganizationStepFormSchema,
  refineOrganizationStepFormSchema,
} from './OrganizationStepForm.schema';

export const OrganizationStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId, onPostClientResponse, onPostPartyResponse, usePartyResource } =
    useOnboardingContext();
  const { t } = useTranslation('onboarding');

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const {
    filterDefaultValues,
    filterSchema,
    getFieldRule,
    isFieldDisabled,
    isFieldRequired,
    isFieldVisible,
    clientContext,
  } = useFilterFunctionsByClientContext(clientData);

  const form = useForm<z.infer<typeof OrganizationStepFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(
      filterSchema(OrganizationStepFormSchema, refineOrganizationStepFormSchema)
    ),
    defaultValues: filterDefaultValues({
      organizationName: '',
      dbaName: '',
      organizationDescription: '',
      email: '',
      countryOfFormation: '',
      yearOfFormation: '',
      addresses: [
        {
          addressType: 'BUSINESS_ADDRESS',
          city: '',
          postalCode: '',
          country: '',
          addressLines: [''],
        },
      ],
      organizationIds: [
        {
          value: '',
          idType: 'BUSINESS_REGISTRATION_ID',
          issuer: '',
        },
      ],
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '',
      },
      entitiesInOwnership: undefined,
      tradeOverInternet: undefined,
      websiteAvailable: false,
      secondaryMccList: [],
      mcc: '',
      associatedCountries: [],
    }),
  });

  const industryCategories = Array.from(
    new Set(naicsCodes?.map((code) => code?.sectorDescription) || [])
  ).sort((a, b) => a.localeCompare(b));

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  const {
    fields: organizationIdFields,
    append: appendOrganizationId,
    remove: removeOrganizationId,
  } = useFieldArray({
    control: form.control,
    name: 'organizationIds',
  });

  const {
    fields: associatedCountriesFields,
    append: appendAssociatedCountry,
    remove: removeAssociatedCountry,
  } = useFieldArray({
    control: form.control,
    name: 'associatedCountries',
  });

  const {
    fields: secondaryMccFields,
    append: appendSecondaryMcc,
    remove: removeSecondaryMcc,
  } = useFieldArray({
    control: form.control,
    name: 'secondaryMccList',
  });

  // Get organization's party
  const existingOrgParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  // Populate form with client data
  useEffect(() => {
    if (
      getClientStatus === 'success' &&
      clientData &&
      existingOrgParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty?.id
      );

      form.reset(formValues);
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    getClientStatus,
    form.reset,
    existingOrgParty?.id,
    isFormPopulated,
  ]);

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
      // Remove website field if website is not available
      const modifiedValues = {
        ...values,
        website: values.websiteAvailable ? values.website : '',
      };

      const clientRequestBody = generateRequestBody(
        modifiedValues,
        0,
        'addParties',
        {
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
        }
      ) as UpdateClientRequestSmbdo;

      const partyRequestBody = generatePartyRequestBody(modifiedValues, {
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
            id: existingOrgParty?.id,
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
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
      >
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            General
          </legend>
          <OnboardingFormField
            control={form.control}
            name="organizationName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="organizationDescription"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="dbaName"
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
            type="text"
            inputProps={{ maxLength: 2 }}
          />

          <OnboardingFormField
            control={form.control}
            name="yearOfFormation"
            type="text"
            inputProps={{ maxLength: 4 }}
          />
        </fieldset>

        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Organization Phone Information
          </legend>
          {isFieldVisible('organizationPhone') && (
            <FormField
              control={form.control}
              name="organizationPhone.phoneType"
              disabled={isFieldDisabled('organizationPhone')}
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk={isFieldRequired('organizationPhone')}>
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
          )}

          {isFieldVisible('organizationPhone') && (
            <FormField
              control={form.control}
              name="organizationPhone.phoneNumber"
              disabled={isFieldDisabled('organizationPhone')}
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk={isFieldRequired('organizationPhone')}>
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
          )}
        </fieldset>

        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Industry Info
          </legend>

          {isFieldVisible('industryType') && (
            <FormField
              control={form.control}
              name="industryType"
              disabled={isFieldDisabled('industryType')}
              render={({ field }) => {
                const [open, setOpen] = useState(false);
                return (
                  <FormItem className="eb-flex eb-flex-col">
                    <div className="eb-flex eb-items-center eb-space-x-2">
                      <FormLabel asterisk={isFieldRequired('industryType')}>
                        Industry Type
                      </FormLabel>
                      <InfoPopover>
                        Your business industry - search for the relevant
                        industry type or the NAICS code.
                      </InfoPopover>
                    </div>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'eb-justify-between eb-font-normal',
                              !field.value && 'eb-text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              <div className="eb-flex eb-w-[calc(100%-1rem)]">
                                <span className="eb-overflow-hidden eb-text-ellipsis">
                                  [{form.getValues('industryCategory')}]{' '}
                                  {field.value}
                                </span>
                                <span className="eb-pl-2 eb-text-muted-foreground">
                                  {
                                    naicsCodes.find(
                                      (code) => code.description === field.value
                                    )?.id
                                  }
                                </span>
                              </div>
                            ) : (
                              'Select industry type'
                            )}
                            <CaretSortIcon className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="eb-w-[--radix-popover-trigger-width] eb-p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search industry type..."
                            className="eb-h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No results found</CommandEmpty>
                            {industryCategories.map((category) => (
                              <Fragment key={category}>
                                {naicsCodes
                                  .filter(
                                    (code) =>
                                      code.sectorDescription === category
                                  )
                                  .map(({ description: industryType, id }) => (
                                    <CommandItem
                                      key={industryType}
                                      value={`${category} ${industryType} ${id}`}
                                      className="eb-cursor-pointer"
                                      onSelect={() => {
                                        field.onChange(industryType);
                                        form.setValue(
                                          'industryCategory',
                                          category
                                        );
                                        setOpen(false);
                                      }}
                                    >
                                      <span className="eb-flex eb-w-full eb-items-center eb-justify-between">
                                        [{category}] {industryType}
                                        <span className="eb-pl-2 eb-text-muted-foreground">
                                          {id}
                                        </span>
                                      </span>
                                      <CheckIcon
                                        className={cn(
                                          'eb-ml-2 eb-h-4 eb-w-4',
                                          field.value === industryType
                                            ? 'eb-opacity-100'
                                            : 'eb-opacity-0'
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </Fragment>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {isFieldVisible('mcc') && (
            <FormField
              control={form.control}
              name="mcc"
              disabled={isFieldDisabled('mcc')}
              render={({ field }) => (
                <FormItem className="eb-grow sm:eb-grow-0">
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel asterisk={isFieldRequired('mcc')}>
                      Merchant Category Code (MCC)
                    </FormLabel>
                    <InfoPopover>
                      Leave empty or enter exactly 4 digits for the MCC.
                    </InfoPopover>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={4}
                      placeholder="Enter 4-digit MCC (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {isFieldVisible('entitiesInOwnership') && (
            <FormField
              control={form.control}
              name="entitiesInOwnership"
              disabled={isFieldDisabled('entitiesInOwnership')}
              render={({ field }) => (
                <FormItem className="eb-space-y-3">
                  <FormLabel asterisk={isFieldRequired('entitiesInOwnership')}>
                    Are there one or more entities that own part of the business
                    connected to the client?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      {...field}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="eb-flex eb-flex-col eb-space-y-1"
                    >
                      <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="eb-font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="eb-font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('tradeOverInternet') && (
            <FormField
              control={form.control}
              name="tradeOverInternet"
              disabled={isFieldDisabled('tradeOverInternet')}
              render={({ field }) => (
                <FormItem className="eb-space-y-3">
                  <FormLabel asterisk={isFieldRequired('tradeOverInternet')}>
                    Does the business conduct trade over the internet?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      {...field}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="eb-flex eb-flex-col eb-space-y-1"
                    >
                      <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="eb-font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="eb-font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </fieldset>

        {/* ADDRESSES */}
        {isFieldVisible('addresses') && (
          <>
            {addressFields.map((fieldName, index) => (
              <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Organization Address {index + 1}
                </legend>
                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.addressType`}
                  type="select"
                  required
                  options={[
                    {
                      value: 'LEGAL_ADDRESS',
                      label: t('addressTypes.LEGAL_ADDRESS'),
                    },
                    {
                      value: 'MAILING_ADDRESS',
                      label: t('addressTypes.MAILING_ADDRESS'),
                    },
                    {
                      value: 'BUSINESS_ADDRESS',
                      label: t('addressTypes.BUSINESS_ADDRESS'),
                    },
                    {
                      value: 'RESIDENTIAL_ADDRESS',
                      label: t('addressTypes.RESIDENTIAL_ADDRESS'),
                    },
                  ]}
                />

                <FormField
                  control={form.control}
                  name={`addresses.${index}.addressLines.0`}
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
                  name={`addresses.${index}.addressLines.1`}
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
                  name={`addresses.${index}.city`}
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
                  name={`addresses.${index}.state`}
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
                  name={`addresses.${index}.postalCode`}
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
                  name={`addresses.${index}.country`}
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
                      (getFieldRule('addresses').minItems ?? 1)
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
          disabled={
            addressFields.length >= (getFieldRule('addresses').maxItems ?? 5)
          }
          onClick={() =>
            appendAddress(
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: [''],
                city: '',
                postalCode: '',
                country: '',
              },
              {
                shouldFocus: false,
              }
            )
          }
          variant="outline"
          size="sm"
          className="eb-mt-2"
        >
          Add Address
        </Button>

        {/* Organization IDs */}
        {isFieldVisible('organizationIds') && (
          <>
            {organizationIdFields.map((fieldItem, index) => (
              <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Organization ID {index + 1}
                </legend>
                <FormField
                  control={form.control}
                  name={`organizationIds.${index}.idType`}
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
                          <SelectItem value="EIN">EIN</SelectItem>
                          <SelectItem value="BUSINESS_REGISTRATION_ID">
                            Business Registration ID
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`organizationIds.${index}.value`}
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
                  name={`organizationIds.${index}.issuer`}
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
                  name={`organizationIds.${index}.expiryDate`}
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
                  name={`organizationIds.${index}.description`}
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
                      organizationIdFields.length <=
                      (getFieldRule('organizationIds').minItems ?? 0)
                    }
                    onClick={() => removeOrganizationId(index)}
                    variant="outline"
                    size="sm"
                    className="eb-mt-2"
                  >
                    Remove Organization ID
                  </Button>
                </div>
              </fieldset>
            ))}
          </>
        )}
        <Button
          type="button"
          disabled={
            organizationIdFields.length >=
            (getFieldRule('organizationIds').maxItems ?? 6)
          }
          onClick={() =>
            appendOrganizationId({ idType: 'EIN', value: '', issuer: '' })
          }
          variant="outline"
          size="sm"
        >
          Add Organization ID
        </Button>

        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Additional Fields
          </legend>
          {/* Associated Countries */}
          {isFieldVisible('associatedCountries') && (
            <div className="eb-space-y-4">
              <h3 className="eb-text-lg eb-font-medium">
                Associated Countries
              </h3>
              {associatedCountriesFields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="eb-flex eb-items-center eb-space-x-2"
                >
                  <FormField
                    control={form.control}
                    name={`associatedCountries.${index}.country`}
                    render={({ field }) => (
                      <FormItem className="eb-grow">
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={2}
                            placeholder="Country code (e.g., US)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    disabled={
                      associatedCountriesFields.length <=
                      (getFieldRule('associatedCountries').minItems ?? 0)
                    }
                    onClick={() => removeAssociatedCountry(index)}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                disabled={
                  associatedCountriesFields.length >=
                  (getFieldRule('associatedCountries').maxItems ?? 100)
                }
                onClick={() => appendAssociatedCountry({ country: '' })}
                variant="outline"
                size="sm"
              >
                Add Associated Country
              </Button>
            </div>
          )}

          {/* Secondary MCC */}
          {isFieldVisible('secondaryMccList') && (
            <div className="eb-space-y-4">
              <h3 className="eb-text-lg eb-font-medium">Secondary MCC</h3>
              {secondaryMccFields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="eb-flex eb-items-center eb-space-x-2"
                >
                  <FormField
                    control={form.control}
                    name={`secondaryMccList.${index}.mcc`}
                    render={({ field }) => (
                      <FormItem className="eb-grow">
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={4}
                            placeholder="Secondary MCC"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    disabled={
                      secondaryMccFields.length <=
                      (getFieldRule('secondaryMccList').minItems ?? 0)
                    }
                    onClick={() => removeSecondaryMcc(index)}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                disabled={
                  secondaryMccFields.length >=
                  (getFieldRule('secondaryMccList').maxItems ?? 50)
                }
                onClick={() => appendSecondaryMcc({ mcc: '' })}
                variant="outline"
                size="sm"
              >
                Add Secondary MCC
              </Button>
            </div>
          )}
          {isFieldVisible('websiteAvailable') && (
            <FormField
              control={form.control}
              name="websiteAvailable"
              disabled={isFieldDisabled('websiteAvailable')}
              render={({ field }) => (
                <FormItem className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0 eb-p-4">
                  <FormControl>
                    <Checkbox
                      disabled={field.disabled}
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        form.clearErrors('website');
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                  <FormLabel asterisk={isFieldRequired('websiteAvailable')}>
                    Website Available
                  </FormLabel>
                </FormItem>
              )}
            />
          )}
          {isFieldVisible('website') && (
            <FormField
              control={form.control}
              name="website"
              disabled={
                isFieldDisabled('website') ||
                !form.getValues('websiteAvailable')
              }
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk={isFieldRequired('website')}>
                    Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={
                        form.getValues('websiteAvailable') ? field.value : 'N/A'
                      }
                      type="url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </fieldset>
        <ServerErrorAlert error={usePartyResource ? updatePartyError : updateClientError} />
        <FormActions />
      </form>
    </Form>
  );
};
