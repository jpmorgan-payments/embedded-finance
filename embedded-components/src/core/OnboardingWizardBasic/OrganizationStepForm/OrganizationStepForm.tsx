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
import { InfoIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
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

import { FormActions } from '../FormActions/FormActions';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingArrayField } from '../OnboardingFormField/OnboardingArrayField';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useFormUtilsWithClientContext,
  useStepFormWithFilters,
} from '../utils/formUtils';
import { stateOptions } from '../utils/stateOptions';
import {
  OrganizationStepFormSchema,
  refineOrganizationStepFormSchema,
} from './OrganizationStepForm.schema';

export const OrganizationStepForm = () => {
  const {
    clientId,
    onPostClientResponse,
    onPostPartyResponse,
    usePartyResource,
    useSingleColumnLayout,
    processStep,
  } = useOnboardingContext();
  const { t } = useTranslation(['onboarding', 'common']);

  // Fetch client data
  const { data: clientData, status: clientDataGetStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  const legalEntityType = clientData?.parties?.find(
    (p) => p.partyType === 'ORGANIZATION'
  )?.organizationDetails?.organizationType;

  const { isFieldDisabled, isFieldRequired, isFieldVisible } =
    useFormUtilsWithClientContext(clientData);

  const form = useStepFormWithFilters({
    clientData,
    schema: OrganizationStepFormSchema,
    refineSchemaFn: refineOrganizationStepFormSchema,
    defaultValues: {},
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
              processStep();
              toast.success(
                "Client's organization details updated successfully"
              );
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapPartyApiErrorsToFormErrors(context);
                setApiFormErrors(form, apiFormErrors);
              }
            },
          }
        );
      }
      // Create party if it doesn't exist
      else {
        const clientRequestBody = generateClientRequestBody(
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
              processStep();
              toast.success(
                "Client's organization details updated successfully"
              );
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapClientApiErrorsToFormErrors(
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
    return t(`idValueLabels.${idType}`);
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

  const isFormPopulating = existingOrgParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={cn(
          'eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto',
          {
            'eb-opacity-50': isFormDisabled,
          }
        )}
      >
        <fieldset
          className={cn(
            'eb-grid eb-grid-cols-1 eb-items-start eb-gap-6 eb-rounded-lg eb-border eb-p-4',
            {
              'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
            }
          )}
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
            className={cn({
              'eb-max-w-xs': useSingleColumnLayout,
            })}
          />
        </fieldset>

        <fieldset
          className={cn(
            'eb-grid eb-grid-cols-1 eb-items-start eb-gap-6 eb-rounded-lg eb-border eb-p-4',
            {
              'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
            }
          )}
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
          className={cn(
            'eb-grid eb-grid-cols-1 eb-items-start eb-gap-6 eb-rounded-lg eb-border eb-p-4',
            {
              'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
            }
          )}
          disabled={isFormDisabled}
        >
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Industry Info
          </legend>

          <OnboardingFormField
            form={form}
            control={form.control}
            name="industry"
            type="industrySelect"
            className="eb-col-span-1 lg:eb-col-span-2"
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
          disabled={isFormDisabled}
          renderItem={({
            itemLabel,
            index,
            field,
            disabled,
            renderRemoveButton,
          }) => (
            <fieldset
              key={field.id}
              className={cn(
                'eb-grid eb-grid-cols-1 eb-items-start eb-gap-6 eb-rounded-lg eb-border eb-p-4',
                {
                  'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
                }
              )}
              disabled={disabled}
            >
              <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                {itemLabel}
              </legend>
              <OnboardingFormField
                control={form.control}
                name={`addresses.${index}.addressType`}
                type="select"
                // Dropdown fields need to be explicitly passed whether it's disabled rather than relying on the fieldset
                disabled={disabled}
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
                name={`addresses.${index}.primaryAddressLine`}
                type="text"
              />

              <OnboardingArrayField
                control={form.control}
                name={`addresses.${index}.additionalAddressLines`}
                renderItem={({
                  index: lineIndex,
                  field: lineField,
                  renderRemoveButton: renderLineRemoveButton,
                }) => (
                  <OnboardingFormField
                    key={lineField.id}
                    control={form.control}
                    name={`addresses.${index}.additionalAddressLines.${lineIndex}.value`}
                    type="text"
                    inputButton={renderLineRemoveButton({
                      className: 'eb-align-end',
                      children: <XIcon />,
                    })}
                  />
                )}
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

              {renderRemoveButton() && (
                <div className="eb-mt-4 eb-flex eb-justify-start">
                  {renderRemoveButton()}
                </div>
              )}
            </fieldset>
          )}
        />

        {/* Organization IDs */}
        <OnboardingArrayField
          control={form.control}
          name="organizationIds"
          disabled={isFormDisabled}
          renderHeader={({ fields }) =>
            fields.length === 0 &&
            legalEntityType === 'SOLE_PROPRIETORSHIP' && (
              <div className="eb-rounded-md eb-bg-blue-50 eb-p-4">
                <div className="eb-flex">
                  <div className="eb-shrink-0">
                    <InfoIcon className="eb-h-5 eb-w-5 eb-text-blue-400" />
                  </div>
                  <div className="eb-ml-3">
                    <p className="eb-text-sm eb-text-blue-700">
                      {t('onboarding:messages.solePropEinOptional')}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          renderItem={({
            field,
            index,
            disabled,
            itemLabel,
            renderRemoveButton,
          }) => (
            <fieldset
              key={field.id}
              className="eb-rounded-lg eb-border eb-p-4"
              disabled={disabled}
            >
              <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                {itemLabel}
              </legend>

              <div
                className={cn('eb-grid eb-grid-cols-1 eb-gap-6', {
                  'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
                })}
              >
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
                  disabled={disabled}
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
                />

                <OnboardingFormField
                  key={`organization-id-value-${index}-${field.idType}`}
                  control={form.control}
                  name={`organizationIds.${index}.value`}
                  type="text"
                  label={getValueLabel(field.idType)}
                  maskFormat={getMaskFormat(field.idType)}
                  maskChar="_"
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
              </div>

              {renderRemoveButton() && (
                <div className="eb-mt-4 eb-flex eb-justify-start">
                  {renderRemoveButton()}
                </div>
              )}
            </fieldset>
          )}
        />

        <fieldset className="eb-grid eb-gap-4 eb-rounded-lg eb-border eb-p-4">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Additional Fields
          </legend>

          {/* Associated Countries */}
          <OnboardingArrayField
            control={form.control}
            name="associatedCountries"
            renderHeader={() => (
              <div className="eb-text-md eb-font-medium">
                {t('onboarding:fields.associatedCountries.headerLabel')}
              </div>
            )}
            renderWrapper={(children) => (
              <div
                className={cn('eb-grid eb-grid-cols-1 eb-gap-6', {
                  'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
                })}
              >
                {children}
              </div>
            )}
            renderItem={({ field, index, renderRemoveButton }) => (
              <OnboardingFormField
                key={field.id}
                control={form.control}
                name={`associatedCountries.${index}.country`}
                type="text"
                inputButton={renderRemoveButton({
                  children: <XIcon />,
                })}
              />
            )}
          />

          {/* Secondary MCC */}
          <OnboardingArrayField
            control={form.control}
            name="secondaryMccList"
            renderHeader={() => (
              <div className="eb-text-md eb-font-medium">
                {t('onboarding:fields.secondaryMccList.headerLabel')}
              </div>
            )}
            renderWrapper={(children) => (
              <div className="eb-my-2 eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                {children}
              </div>
            )}
            renderItem={({ field, index, renderRemoveButton }) => (
              <OnboardingFormField
                key={field.id}
                control={form.control}
                name={`secondaryMccList.${index}.mcc`}
                type="text"
                inputButton={renderRemoveButton({
                  children: <XIcon />,
                })}
              />
            )}
          />

          <div
            className={cn('eb-grid eb-grid-cols-1 eb-gap-6', {
              'md:eb-grid-cols-2 lg:eb-grid-cols-3': !useSingleColumnLayout,
            })}
          >
            {isFieldVisible('website') && (
              <>
                <FormField
                  control={form.control}
                  name="website"
                  disabled={
                    isFieldDisabled('website') || form.watch('websiteAvailable')
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
                            !form.watch('websiteAvailable')
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
          </div>
        </fieldset>
        <ServerErrorAlert
          error={usePartyResource ? partyUpdateError : clientUpdateError}
        />
        <FormActions disabled={isFormDisabled} isLoading={isFormSubmitting} />
      </form>
    </Form>
  );
};
