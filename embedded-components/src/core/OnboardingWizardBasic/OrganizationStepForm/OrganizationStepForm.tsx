/**
 * OrganizationStepForm Component
 * =============================
 * Form component for collecting and managing organization details during onboarding.
 *
 * Table of Contents:
 * -----------------
 * 1. Imports & Dependencies (1-30)
 * 2. Types & Schemas (30-70)
 * 3. Main Component (73-1134)
 *    - Hook Initialization (75-90)
 *    - Data Fetching & Client Context (90-120)
 *    - Form Configuration (120-200)
 *    - Event Handlers (200-300)
 *    - Form Fields & UI (300+)
 *      + General Information Fieldset
 *        - Organization Name
 *        - Organization Description
 *        - DBA Name
 *        - Organization Email
 *        - Country of Formation
 *        - Year of Formation
 *      + Phone Information Fieldset
 *        - Phone Type
 *        - Phone Number
 *      + Industry Information Fieldset
 *        - Industry Type (with NAICS codes)
 *        - Merchant Category Code (MCC)
 *        - Entities in Ownership
 *        - Trade Over Internet
 *      + Address Information Fieldset(s)
 *        - Address Type
 *        - Street Address
 *        - City
 *        - State/Province
 *        - Postal Code
 *        - Country
 *      + Website Information
 *        - Website Availability
 *        - Website URL
 *      + Organization Identifiers
 *        - ID Type
 *        - ID Value
 *
 * @component
 * @example
 * return (
 *   <OrganizationStepForm />
 * )
 */

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui';

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
import { stateOptions } from '../utils/stateOptions';
import {
  OrganizationStepFormSchema,
  refineOrganizationStepFormSchema,
} from './OrganizationStepForm.schema';

export const OrganizationStepForm = () => {
  const { nextStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    onPostPartyResponse,
    usePartyResource,
  } = useOnboardingContext();
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

  const form = useStepForm<z.infer<typeof OrganizationStepFormSchema>>({
    resolver: zodResolver(
      filterSchema(OrganizationStepFormSchema, refineOrganizationStepFormSchema)
    ),
    defaultValues: filterDefaultValues({
      addresses: [
        {
          addressType: 'BUSINESS_ADDRESS',
          city: '',
          state: '',
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
    }),
  });

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
    (party) =>
      party?.partyType === 'ORGANIZATION' &&
      (party.active || party.status === 'ACTIVE')
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
        existingOrgParty.id
      );
      form.reset({ ...form.getValues(), ...formValues });
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

      // Update party if it exists
      if (usePartyResource && existingOrgParty?.id) {
        const partyRequestBody = generatePartyRequestBody(modifiedValues, {});
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
        const clientRequestBody = generateRequestBody(
          modifiedValues,
          0,
          'addParties',
          {
            addParties: [
              {
                partyType: 'ORGANIZATION',
                roles: ['CLIENT'],
              },
            ],
          }
        );
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
  });

  // Get mask format based on ID type
  const getMaskFormat = (idType: string) => {
    switch (idType) {
      case 'EIN':
        return '## - #######';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (
    idType:
      | 'EIN'
      | 'BUSINESS_REGISTRATION_ID'
      | 'BUSINESS_NUMBER'
      | 'BUSINESS_REGISTRATION_NUMBER'
  ) => {
    if (!idType) return t('idValueLabels.placeholder');
    return t(`idValueLabels.organization.${idType}`);
  };

  // Reset value of ID value field when ID type changes
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name?.startsWith('organizationIds') && name.endsWith('idType')) {
        const index = parseInt(name.split('.')[1], 10);
        form.setValue(`organizationIds.${index}.value`, '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  if (clientData && !isFormPopulated) {
    return <FormLoadingState message="Loading..." />;
  }

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
            name="dbaName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="organizationDescription"
            type="textarea"
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

          <OnboardingFormField
            form={form}
            control={form.control}
            name="industryType"
            type="industrySelect"
          />

          <OnboardingFormField
            control={form.control}
            name="mcc"
            type="text"
            inputProps={{
              pattern: '[0-9]{4}',
              maxLength: 4,
              inputMode: 'numeric',
            }}
          />

          <OnboardingFormField
            control={form.control}
            name="entitiesInOwnership"
            type="radio-group"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </fieldset>

        {/* ADDRESSES */}
        {isFieldVisible('addresses') && (
          <>
            {addressFields.map((fieldName, index) => (
              <fieldset
                key={`address-${index}`}
                className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
              >
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

                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.addressLines.0`}
                  label="Address Line 1"
                  type="text"
                  required
                />
                <OnboardingFormField
                  control={form.control}
                  label="Address Line 2"
                  name={`addresses.${index}.addressLines.1`}
                  type="text"
                />

                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.city`}
                  type="text"
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.state`}
                  type="select"
                  options={stateOptions}
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.postalCode`}
                  type="text"
                  inputProps={{
                    pattern: '[0-9]{5}',
                    maxLength: 5,
                    inputMode: 'numeric',
                  }}
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`addresses.${index}.country`}
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
                city: '',
                state: '',
                postalCode: '',
                country: '',
                addressLines: [''],
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
            {organizationIdFields.map((fieldItem, index) => {
              const idType = form.watch(`organizationIds.${index}.idType`);
              return (
                <fieldset
                  key={`organization-id-${index}`}
                  className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
                >
                  <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                    Organization ID {index + 1}
                  </legend>

                  <OnboardingFormField
                    control={form.control}
                    name={`organizationIds.${index}.idType`}
                    type="select"
                    options={[
                      { value: 'EIN', label: 'EIN' },
                      {
                        value: 'BUSINESS_REGISTRATION_ID',
                        label: 'Business Registration ID',
                      },
                      { value: 'BUSINESS_NUMBER', label: 'Business Number' },
                      {
                        value: 'BUSINESS_REGISTRATION_NUMBER',
                        label: 'Business Registration Number',
                      },
                    ]}
                    required
                  />

                  <OnboardingFormField
                    key={`organization-id-value-${index}-${idType}`}
                    control={form.control}
                    name={`organizationIds.${index}.value`}
                    type="text"
                    label={getValueLabel(idType)}
                    maskFormat={getMaskFormat(idType)}
                    maskChar="_"
                    required
                  />

                  <OnboardingFormField
                    control={form.control}
                    name={`organizationIds.${index}.issuer`}
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
                    required
                  />
                  <OnboardingFormField
                    control={form.control}
                    name={`organizationIds.${index}.expiryDate`}
                    type="date"
                  />
                  <OnboardingFormField
                    control={form.control}
                    name={`organizationIds.${index}.description`}
                    type="text"
                  />

                  <div className="eb-col-span-full">
                    <Button
                      type="button"
                      disabled={
                        organizationIdFields.length <
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
              );
            })}
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
                  key={`associated-country-${index}`}
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
                  key={`secondary-mcc-${index}`}
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

          <OnboardingFormField
            control={form.control}
            name="websiteAvailable"
            type="checkbox"
          />
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
        <ServerErrorAlert
          error={usePartyResource ? updatePartyError : updateClientError}
        />
        <FormActions />
      </form>
    </Form>
  );
};
