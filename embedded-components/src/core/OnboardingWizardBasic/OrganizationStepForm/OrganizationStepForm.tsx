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
import { useStepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingArrayField } from '../OnboardingFormField/OnboardingFormArrayField';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  setApiFormErrors,
  shapeFormValuesBySchema,
  translateClientApiErrorsToFormErrors,
  translatePartyApiErrorsToFormErrors,
  useFilterFunctionsByClientContext,
  useStepFormWithFilters,
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
  const { data: clientData, status: clientDataGetStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const legalEntityType = clientData?.parties?.find(
    (p) => p.partyType === 'ORGANIZATION'
  )?.organizationDetails?.organizationType;

  const {
    isFieldDisabled,
    isFieldRequired,
    isFieldVisible,
    getArrayFieldRule,
  } = useFilterFunctionsByClientContext(clientData);

  const form = useStepFormWithFilters<
    z.infer<typeof OrganizationStepFormSchema>
  >({
    clientData,
    schema: OrganizationStepFormSchema,
    refineSchemaFn: refineOrganizationStepFormSchema,
    defaultValues: {
      addresses: [
        {
          addressType: 'BUSINESS_ADDRESS',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          // addressLines: [''],
        },
      ],
      ...(legalEntityType !== 'SOLE_PROPRIETORSHIP' && {
        organizationIds: [
          {
            value: '',
            idType: 'EIN',
            issuer: '',
          },
        ],
      }),
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '',
      },
    },
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
      clientDataGetStatus === 'success' &&
      clientData &&
      existingOrgParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingOrgParty.id
      );
      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          OrganizationStepFormSchema
        )
      );
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    clientDataGetStatus,
    form.reset,
    existingOrgParty?.id,
    isFormPopulated,
  ]);

  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClient();

  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
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

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    (usePartyResource && partyUpdateStatus === 'pending');

  const isPopulatingForm = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isPopulatingForm;

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
      >
        <fieldset
          className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
          disabled={isFormDisabled}
        >
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

        <fieldset
          className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
          disabled={isFormDisabled}
        >
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Organization Phone Information
          </legend>

          <OnboardingFormField
            control={form.control}
            name="organizationPhone.phoneType"
            type="select"
            options={[
              { value: 'BUSINESS_PHONE', label: 'Business Phone' },
              { value: 'MOBILE_PHONE', label: 'Mobile Phone' },
              { value: 'ALTERNATE_PHONE', label: 'Alternate Phone' },
            ]}
          />

          <OnboardingFormField
            control={form.control}
            name="organizationPhone.phoneNumber"
            type="phone"
          />
        </fieldset>

        <fieldset
          className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 lg:eb-grid-cols-2 xl:eb-grid-cols-3"
          disabled={isFormDisabled}
        >
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
        </fieldset>

        {/* ADDRESSES */}
        <OnboardingArrayField
          control={form.control}
          name="addresses"
          defaultAppendValue={{
            addressType: 'BUSINESS_ADDRESS',
            addressLines: [''],
            city: '',
            state: '',
            postalCode: '',
            country: '',
          }}
          renderItem={({ index, label }) => (
            <fieldset
              key={`address-${index}`}
              className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
              disabled={isFormDisabled}
            >
              <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                {label}
              </legend>
              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressType`}
                type="select"
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
                type="text"
              />
              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressLines.1`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.city`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.state`}
                type="select"
                options={stateOptions}
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
            </fieldset>
          )}
        />

        {/* Organization IDs */}
        {isFieldVisible('organizationIds') && (
          <>
            {organizationIdFields.length === 0 &&
              legalEntityType === 'SOLE_PROPRIETORSHIP' && (
                <div className="eb-rounded-md eb-bg-blue-50 eb-p-4">
                  <div className="eb-flex">
                    <div className="eb-shrink-0">
                      <svg
                        className="eb-h-5 eb-w-5 eb-text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="eb-ml-3">
                      <p className="eb-text-sm eb-text-blue-700">
                        As a sole proprietor, an EIN is optional unless you have
                        employees or file certain tax returns. However, having
                        an EIN can help establish business credit and simplify
                        tax filing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            {organizationIdFields.map((fieldItem, index) => {
              const idType = form.watch(`organizationIds.${index}.idType`);
              return (
                <fieldset
                  key={`organization-id-${index}`}
                  className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
                >
                  <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                    Business Identification{' '}
                    {Number(getArrayFieldRule('organizationIds')?.maxItems) > 1
                      ? index + 1
                      : ''}
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

                  {organizationIdFields.length >
                    Number(getArrayFieldRule('organizationIds')?.minItems) && (
                    <div className="eb-col-span-full">
                      <Button
                        type="button"
                        disabled={
                          organizationIdFields.length <
                          (getArrayFieldRule('organizationIds')?.minItems ?? 0)
                        }
                        onClick={() => removeOrganizationId(index)}
                        variant="outline"
                        size="sm"
                        className="eb-mt-2"
                      >
                        Remove Business Identification
                      </Button>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </>
        )}
        {Number(getArrayFieldRule('organizationIds')?.maxItems) >
          organizationIdFields.length && (
          <Button
            type="button"
            disabled={
              organizationIdFields.length >=
              (getArrayFieldRule('organizationIds')?.maxItems ?? 6)
            }
            onClick={() =>
              appendOrganizationId(
                { idType: 'EIN', value: '', issuer: '' },
                {
                  shouldFocus: true,
                  focusName: `organizationIds.${organizationIdFields.length}.value`,
                }
              )
            }
            variant="outline"
            size="sm"
          >
            Add Business Identification
          </Button>
        )}

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
                      (getArrayFieldRule('associatedCountries')?.minItems ?? 0)
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
                  (getArrayFieldRule('associatedCountries')?.maxItems ?? 100)
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
                      (getArrayFieldRule('secondaryMccList')?.minItems ?? 0)
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
                  (getArrayFieldRule('secondaryMccList')?.maxItems ?? 50)
                }
                onClick={() => appendSecondaryMcc({ mcc: '' })}
                variant="outline"
                size="sm"
              >
                Add Secondary MCC
              </Button>
            </div>
          )}

          {isFieldVisible('website') && (
            <>
              <FormField
                control={form.control}
                name="website"
                disabled={
                  isFieldDisabled('website') ||
                  form.getValues('websiteAvailable')
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
                          !form.getValues('websiteAvailable')
                            ? field.value
                            : 'N/A'
                        }
                        type="url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <OnboardingFormField
                control={form.control}
                name="websiteAvailable"
                type="checkbox"
              />
            </>
          )}
        </fieldset>
        <ServerErrorAlert
          error={usePartyResource ? partyUpdateError : clientUpdateError}
        />
        <FormActions disabled={isFormDisabled} isLoading={isFormSubmitting} />
      </form>
    </Form>
  );
};
