/* eslint-disable react/no-unescaped-entities */
import { FC, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient, useSmbdoUpdateClient } from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  FieldContext,
  generateRequestBody,
  isFieldDisabled,
  isFieldVisible,
  setApiFormErrors,
  translateApiErrorsToFormErrors,
} from '../utils/formUtils';
import { Jurisdiction, LegalEntityType, Product } from '../utils/types';
import naicsCodes from './naics-codes.json';
import { OrganizationStepFormSchema } from './OrganizationStepForm.schema';

type AddressLinesProps = {
  control: any;
  addressIndex: number;
};

const AddressLines: FC<AddressLinesProps> = ({ control, addressIndex }) => {
  const {
    fields: addressLineFields,
    append: appendAddressLine,
    remove: removeAddressLine,
  } = useFieldArray({
    control,
    name: `addresses.${addressIndex}.addressLines`,
    rules: {
      maxLength: 5,
      minLength: 1,
    },
  });

  return (
    <>
      <FormField
        control={control}
        name={`addresses.${addressIndex}.addressLines.0`}
        render={({ field }) => (
          <FormItem>
            <div className="eb-flex eb-items-center eb-space-x-2">
              <FormLabel asterisk>Address Line 1</FormLabel>
              <InfoPopover>
                The first line must not be a PO Box and must begin with a
                number.
              </InfoPopover>
            </div>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {addressLineFields.map((addressLineField, index) => {
        if (index === 0) return null;
        return (
          <FormField
            key={addressLineField.id}
            control={control}
            name={`addresses.${addressIndex}.addressLines.${index}`}
            render={({ field }) => (
              <FormItem>
                <div className="eb-flex eb-items-center eb-space-x-2">
                  <FormLabel>Address Line {index + 1}</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
      <div className="eb-grid eb-grid-cols-2 eb-gap-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendAddressLine('')}
          disabled={addressLineFields.length >= 5}
        >
          Add Line
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeAddressLine(addressLineFields.length - 1)}
          disabled={addressLineFields.length <= 1}
        >
          Remove Line
        </Button>
      </div>
    </>
  );
};

export const OrganizationStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId, onPostClientResponse, useCase } = useOnboardingContext();

  const form = useForm<z.infer<typeof OrganizationStepFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(
      filterSchemaByUseCase(OrganizationStepFormSchema, useCase)
    ),
    defaultValues: filterDefaultValuesByUseCase(
      {
        organizationName: '',
        dbaName: '',
        organizationDescription: '',
        organizationType: undefined,
        jurisdiction: '',
        countryOfFormation: '',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: [],
            city: '',
            postalCode: '',
            country: '',
          },
        ],
        organizationIds: [],
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
      },
      useCase
    ),
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

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's partyId
  const partyId = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  )?.id;

  const context: FieldContext = {
    product: (clientData?.products?.[0] ?? 'UNKNOWN') as Product,
    jurisdiction: (clientData?.parties?.[0]?.organizationDetails
      ?.countryOfFormation ?? 'US') as Jurisdiction,
    entityType: (clientData?.parties?.[0]?.organizationDetails
      ?.organizationType ?? 'UNKNOWN') as unknown as LegalEntityType,
  };

  // Populate form with client data
  useEffect(() => {
    if (getClientStatus === 'success' && clientData && partyId) {
      const formValues = convertClientResponseToFormValues(clientData, partyId);
      form.reset(formValues);
    }
  }, [clientData, getClientStatus, form.reset, partyId]);

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient();

  const onSubmit = form.handleSubmit((values) => {
    if (clientId) {
      const requestBody = generateRequestBody(
        values,
        0,
        'addParties',
        {
          addParties: [
            {
              ...(partyId ? { id: partyId } : {}),
            },
          ],
        },
        context
      ) as UpdateClientRequestSmbdo;

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
              const { context: errorContext } = error.response.data;
              const apiFormErrors = translateApiErrorsToFormErrors(
                errorContext,
                0,
                'addParties'
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

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
      >
        <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          {isFieldVisible('organizationName', context) && (
            <FormField
              control={form.control}
              name="organizationName"
              disabled={isFieldDisabled('organizationName', context)}
              render={({ field }) => (
                <FormItem>
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel asterisk>Organization name</FormLabel>
                    <InfoPopover>
                      The organization's legal name. It is the official name of
                      the person or entity that owns a company. Must be the name
                      used on the legal party's government forms and business
                      paperwork.
                    </InfoPopover>
                  </div>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('organizationDescription', context) && (
            <FormField
              control={form.control}
              name="organizationDescription"
              disabled={isFieldDisabled('organizationDescription', context)}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('dbaName', context) && (
            <FormField
              control={form.control}
              name="dbaName"
              disabled={isFieldDisabled('dbaName', context)}
              render={({ field }) => (
                <FormItem>
                  <div className="eb-items-center eb-space-x-2">
                    <FormLabel>
                      DBA (Doing Business As) name (optional)
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('email', context) && (
            <FormField
              control={form.control}
              name="email"
              disabled={isFieldDisabled('email', context)}
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>Organization email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('organizationType', context) && (
            <FormField
              control={form.control}
              name="organizationType"
              disabled={isFieldDisabled('organizationType', context)}
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
                      <SelectItem value="LIMITED_LIABILITY_COMPANY">
                        Limited Liability Company
                      </SelectItem>
                      <SelectItem value="C_CORPORATION">
                        C Corporation
                      </SelectItem>
                      <SelectItem value="S_CORPORATION">
                        S Corporation
                      </SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="PUBLICLY_TRADED_COMPANY">
                        Publicly Traded Company
                      </SelectItem>
                      <SelectItem value="NON_PROFIT_CORPORATION">
                        Non-Profit Corporation
                      </SelectItem>
                      <SelectItem value="GOVERNMENT_ENTITY">
                        Government Entity
                      </SelectItem>
                      <SelectItem value="SOLE_PROPRIETORSHIP">
                        Sole Proprietorship
                      </SelectItem>
                      <SelectItem value="UNINCORPORATED_ASSOCIATION">
                        Unincorporated Association
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="eb-flex eb-flex-wrap eb-gap-6 md:eb-flex-nowrap">
          {isFieldVisible('jurisdiction', context) && (
            <FormField
              control={form.control}
              name="jurisdiction"
              disabled={isFieldDisabled('jurisdiction', context)}
              render={({ field }) => (
                <FormItem className="eb-grow md:eb-grow-0">
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel asterisk>Jurisdiction</FormLabel>
                    <InfoPopover>
                      Country code in ISO alpha-2 format.
                    </InfoPopover>
                  </div>
                  <FormControl>
                    <Input {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('countryOfFormation', context) && (
            <FormField
              control={form.control}
              name="countryOfFormation"
              disabled={isFieldDisabled('countryOfFormation', context)}
              render={({ field }) => (
                <FormItem className="eb-grow md:eb-grow-0">
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel asterisk>Country of formation</FormLabel>
                    <InfoPopover>
                      Country code in ISO alpha-2 format.
                    </InfoPopover>
                  </div>
                  <FormControl>
                    <Input {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isFieldVisible('yearOfFormation', context) && (
            <FormField
              control={form.control}
              name="yearOfFormation"
              disabled={isFieldDisabled('yearOfFormation', context)}
              render={({ field }) => (
                <FormItem className="eb-grow md:eb-grow-0">
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel asterisk>Year of formation</FormLabel>
                    <InfoPopover>Year of company formation.</InfoPopover>
                  </div>
                  <FormControl>
                    <Input {...field} maxLength={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <fieldset className="eb-grid eb-gap-6 eb-rounded-lg eb-border eb-p-4">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Organization Phone Information
          </legend>

          <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2">
            {isFieldVisible('organizationPhone', context) && (
              <FormField
                control={form.control}
                name="organizationPhone.phoneType"
                disabled={isFieldDisabled('organizationPhone', context)}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select phone type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BUSINESS_PHONE">
                          Business Phone
                        </SelectItem>
                        <SelectItem value="MOBILE_PHONE">
                          Mobile Phone
                        </SelectItem>
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

            {isFieldVisible('organizationPhone', context) && (
              <FormField
                control={form.control}
                name="organizationPhone.phoneNumber"
                disabled={isFieldDisabled('organizationPhone', context)}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl key={useCase}>
                      <PhoneInput
                        {...field}
                        countries={['CA', 'US']}
                        placeholder="Enter phone number"
                        international={false}
                        defaultCountry={useCase === 'CanadaMS' ? 'CA' : 'US'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </fieldset>

        <div className="eb-grid eb-grid-cols-2 eb-gap-6">
          {isFieldVisible('industryCategory', context) && (
            <FormField
              control={form.control}
              name="industryType"
              disabled={isFieldDisabled('industryCategory', context)}
              render={({ field }) => {
                const [open, setOpen] = useState(false);
                return (
                  <FormItem className="eb-flex eb-flex-col">
                    <FormLabel>Industry Type</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'eb-max-w-[400px] eb-justify-between eb-font-normal',
                              !field.value && 'eb-text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              <div className="eb-flex eb-w-[calc(100%-1rem)]">
                                <span className="eb-overflow-hidden eb-text-ellipsis">
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
                      <PopoverContent className="eb-w-[400px] eb-p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search industry type..."
                            className="eb-h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No results found</CommandEmpty>
                            {industryCategories.map((category) => (
                              <CommandGroup heading={category}>
                                {naicsCodes
                                  .filter(
                                    (code) =>
                                      code.sectorDescription === category
                                  )
                                  .map(({ description: industryType, id }) => (
                                    <CommandItem
                                      key={industryType}
                                      value={industryType}
                                      className="eb-cursor-pointer"
                                      onSelect={(value) => {
                                        field.onChange(value);
                                        form.setValue(
                                          'industryCategory',
                                          category
                                        );
                                        setOpen(false);
                                      }}
                                    >
                                      <span className="eb-flex eb-w-full eb-justify-between">
                                        {industryType}
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
                              </CommandGroup>
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
        </div>

        <div className="eb-flex">
          {isFieldVisible('mcc', context) && (
            <FormField
              control={form.control}
              name="mcc"
              disabled={isFieldDisabled('mcc', context)}
              render={({ field }) => (
                <FormItem className="eb-grow sm:eb-grow-0">
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormLabel>Merchant Category Code (MCC)</FormLabel>
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
        </div>

        {isFieldVisible('entitiesInOwnership', context) && (
          <FormField
            control={form.control}
            name="entitiesInOwnership"
            disabled={isFieldDisabled('entitiesInOwnership', context)}
            render={({ field }) => (
              <FormItem className="eb-space-y-3">
                <FormLabel asterisk>
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

        {isFieldVisible('tradeOverInternet', context) && (
          <FormField
            control={form.control}
            name="tradeOverInternet"
            disabled={isFieldDisabled('tradeOverInternet', context)}
            render={({ field }) => (
              <FormItem className="eb-space-y-3">
                <FormLabel asterisk>
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

        {/* Addresses */}
        <Card className="eb-mt-6">
          <CardHeader>
            <CardTitle className="eb-text-lg eb-font-medium">
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            {addressFields.map((fieldItem, index) => (
              <fieldset
                key={fieldItem.id}
                className="eb-grid eb-gap-6 eb-rounded-lg eb-border eb-p-4"
              >
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Address {index + 1}
                </legend>
                <FormField
                  control={form.control}
                  name={`addresses.${index}.addressType`}
                  disabled={isFieldDisabled('addresses', context)}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Type</FormLabel>
                      <Select
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value}
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

                <AddressLines control={form.control} addressIndex={index} />

                <div className="eb-grid eb-grid-cols-1 eb-gap-6 sm:eb-grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`addresses.${index}.city`}
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
                    name={`addresses.${index}.state`}
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
                    name={`addresses.${index}.postalCode`}
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
                    name={`addresses.${index}.country`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
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
              </fieldset>
            ))}
            <Button
              type="button"
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
          </CardContent>
        </Card>

        {/* Organization IDs */}
        <div className="eb-space-y-4">
          <h3 className="eb-text-lg eb-font-medium">Organization IDs</h3>
          {organizationIdFields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="eb-space-y-4 eb-rounded-md eb-border eb-p-4"
            >
              <h4 className="eb-font-medium">Organization ID {index + 1}</h4>
              <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <FormField
                  control={form.control}
                  name={`organizationIds.${index}.idType`}
                  disabled={isFieldDisabled('organizationIds', context)}
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
              </div>
              <Button
                type="button"
                onClick={() => removeOrganizationId(index)}
                variant="outline"
                size="sm"
                className="eb-mt-2"
              >
                Remove Organization ID
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() =>
              appendOrganizationId({ idType: 'EIN', value: '', issuer: '' })
            }
            variant="outline"
            size="sm"
          >
            Add Organization ID
          </Button>
        </div>

        {/* Associated Countries */}
        <div className="eb-space-y-4">
          <h3 className="eb-text-lg eb-font-medium">Associated Countries</h3>
          {associatedCountriesFields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="eb-flex eb-items-center eb-space-x-2"
            >
              <FormField
                control={form.control}
                name={`associatedCountries.${index}.country`}
                disabled={isFieldDisabled('associatedCountries', context)}
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
            onClick={() => appendAssociatedCountry({ country: '' })}
            variant="outline"
            size="sm"
          >
            Add Associated Country
          </Button>
        </div>

        {/* Secondary MCC */}
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
                disabled={isFieldDisabled('secondaryMccList', context)}
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
            onClick={() => appendSecondaryMcc({ mcc: '' })}
            variant="outline"
            size="sm"
          >
            Add Secondary MCC
          </Button>
        </div>

        {/* Additional Fields */}
        <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          {isFieldVisible('websiteAvailable', context) && (
            <FormField
              control={form.control}
              name="websiteAvailable"
              disabled={isFieldDisabled('websiteAvailable', context)}
              render={({ field }) => (
                <FormItem className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0 eb-rounded-md eb-border eb-p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="eb-space-y-1 eb-leading-none">
                    <FormLabel>Website Available</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          )}
          {isFieldVisible('website', context) && (
            <FormField
              control={form.control}
              name="website"
              disabled={isFieldDisabled('website', context)}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <ServerErrorAlert error={updateClientError} />
        <FormActions />
      </form>
    </Form>
  );
};
