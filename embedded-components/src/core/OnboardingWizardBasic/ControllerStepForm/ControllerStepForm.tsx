/**
 * ControllerStepForm Component
 * ===========================
 * Form component for collecting controller's information during onboarding.
 *
 * Table of Contents:
 * -----------------
 * 1. Imports & Dependencies (1-50)
 * 2. Main Component (53-759)
 *    - Hook Initialization (55-80)
 *    - Data Fetching & Context (80-120)
 *    - Form Configuration (120-150)
 *    - Field Arrays Setup (150-180)
 *    - Event Handlers (180-250)
 *    - Form Fields & UI (250+)
 *      + Personal Information Fieldset
 *        - First Name
 *        - Middle Name
 *        - Last Name
 *        - Date of Birth
 *        - Country of Residence
 *        - Job Title
 *        - Nature of Ownership
 *        - Sole Owner
 *      + Phone Information Fieldset
 *        - Phone Type
 *        - Phone Number
 *      + Address Information Fieldset(s)
 *        - Multiple Addresses Support
 *        - Address Type
 *        - Address Line 1
 *        - Address Line 2
 *        - City
 *        - State
 *        - Postal Code
 *        - Country
 *      + Identification Fieldset
 *        - Multiple IDs Support
 *        - ID Type Selection
 *        - ID Value Input
 *        - Issuer
 *        - Expiry Date
 *        - Description
 *
 * @component
 * @example
 * return (
 *   <ControllerStepForm />
 * )
 */

import { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

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
  useStepFormWithFilters,
} from '../utils/formUtils';
import { stateOptions } from '../utils/stateOptions';
import {
  ControllerStepFormSchema,
  refineControllerStepFormSchema,
} from './ControllerStepForm.schema';

export const ControllerStepForm = () => {
  const {
    clientId,
    onPostClientResponse,
    usePartyResource,
    onPostPartyResponse,
    processStep,
  } = useOnboardingContext();
  const { t } = useTranslation('onboarding');

  // Fetch client data
  const { data: clientData, status: getClientStatus } = useSmbdoGetClient(
    clientId ?? ''
  );

  // Get organization's party
  const existingOrgParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'ORGANIZATION' &&
      (party.active || party.status === 'ACTIVE')
  );

  const form = useStepFormWithFilters({
    clientData,
    schema: ControllerStepFormSchema,
    refineSchemaFn: refineControllerStepFormSchema,
    defaultValues: {},
  });

  // Get CONTROLLER's partyId
  const existingControllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      (party.active || party.status === 'ACTIVE')
  );

  const [isFormPopulated, setIsFormPopulated] = useState(false);

  // Populate form with client data
  useEffect(() => {
    if (
      getClientStatus === 'success' &&
      clientData &&
      existingControllerParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingControllerParty.id
      );
      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          ControllerStepFormSchema
        )
      );
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    getClientStatus,
    form.reset,
    existingControllerParty?.id,
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
      // Update party if it exists
      if (usePartyResource && existingControllerParty?.id) {
        const partyRequestBody = generatePartyRequestBody(values, {});

        updateParty(
          {
            partyId: existingControllerParty?.id,
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
          values,
          0,
          'addParties',
          {
            addParties: [
              {
                partyType: 'INDIVIDUAL',
                roles: ['CONTROLLER'],
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
      case 'SSN':
        return '### - ## - ####';
      case 'ITIN':
        return '### - ## - ####';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (
    idType:
      | 'SSN'
      | 'ITIN'
      | 'NATIONAL_ID'
      | 'DRIVERS_LICENSE'
      | 'PASSPORT'
      | 'SOCIAL_INSURANCE_NUMBER'
      | 'OTHER_GOVERNMENT_ID'
  ) => {
    if (!idType) return t('idValueLabels.placeholder');
    return t(`idValueLabels.${idType}`);
  };

  // Reset value of ID value field when ID type changes
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name?.startsWith('controllerIds') && name.endsWith('idType')) {
        const index = parseInt(name.split('.')[1], 10);
        form.setValue(`controllerIds.${index}.value`, '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const isFormSubmitting =
    clientUpdateStatus === 'pending' ||
    (usePartyResource && partyUpdateStatus === 'pending');
  const isFormPopulating = existingControllerParty && !isFormPopulated;

  const isFormDisabled = isFormSubmitting || isFormPopulating;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <fieldset
          disabled={isFormDisabled}
          className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
        >
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            General
          </legend>

          <OnboardingFormField
            control={form.control}
            name="controllerFirstName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="controllerMiddleName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="controllerLastName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="controllerNameSuffix"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="controllerEmail"
            type="email"
          />

          <OnboardingFormField
            control={form.control}
            name="birthDate"
            type="importantDate"
            form={form}
          />

          <OnboardingFormField
            control={form.control}
            name="countryOfResidence"
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
            name="controllerJobTitle"
            type="select"
            options={[
              { value: 'CEO', label: 'CEO' },
              { value: 'CFO', label: 'CFO' },
              { value: 'COO', label: 'COO' },
              { value: 'President', label: 'President' },
              { value: 'Chairman', label: 'Chairman' },
              {
                value: 'Senior Branch Manager',
                label: 'Senior Branch Manager',
              },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <OnboardingFormField
            control={form.control}
            name="controllerJobTitleDescription"
            type="text"
            required={form.watch('controllerJobTitle') === 'Other'}
          />
        </fieldset>

        {/* Phone Information */}
        <fieldset
          disabled={isFormDisabled}
          className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
        >
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Controller Phone Information
          </legend>
          <OnboardingFormField
            control={form.control}
            name="controllerPhone.phoneType"
            type="select"
            options={[
              { value: 'BUSINESS_PHONE', label: 'Business Phone' },
              { value: 'MOBILE_PHONE', label: 'Mobile Phone' },
              { value: 'ALTERNATE_PHONE', label: 'Alternate Phone' },
            ]}
            disabled={isFormDisabled}
          />

          <OnboardingFormField
            control={form.control}
            name="controllerPhone.phoneNumber"
            type="phone"
          />
        </fieldset>

        {/* Addresses */}
        <OnboardingArrayField
          control={form.control}
          name="controllerAddresses"
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
              className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
              disabled={disabled}
            >
              <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                {itemLabel}
              </legend>

              {/* Address Copy Checkbox */}
              {existingOrgParty?.organizationDetails?.organizationType ===
                'SOLE_PROPRIETORSHIP' && (
                <div className="eb-flex eb-items-center eb-space-x-2 eb-py-4 md:eb-col-span-2 lg:eb-col-span-3">
                  <Checkbox
                    id="copy-business-address"
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Find business address from organization
                        const businessAddress = clientData?.parties
                          ?.find((party) => party.partyType === 'ORGANIZATION')
                          ?.organizationDetails?.addresses?.find(
                            (addr) =>
                              addr.addressType === 'BUSINESS_ADDRESS' ||
                              addr.addressType === 'LEGAL_ADDRESS'
                          );

                        if (businessAddress) {
                          // Create a complete address object with all necessary fields
                          const newAddress = {
                            addressType: 'RESIDENTIAL_ADDRESS' as const,
                            primaryAddressLine:
                              businessAddress.addressLines?.[0] || '',
                            city: businessAddress.city || '',
                            state: businessAddress.state || '',
                            postalCode: businessAddress.postalCode || '',
                            country: businessAddress.country || '',
                            additionalAddressLines:
                              businessAddress.addressLines?.length > 1
                                ? businessAddress.addressLines
                                    .slice(1)
                                    .map((line) => ({ value: line }))
                                : [],
                          };

                          // Update form with the new address in a single operation
                          const currentAddresses =
                            form.getValues('controllerAddresses') || [];
                          if (currentAddresses.length === 0) {
                            form.setValue('controllerAddresses', [newAddress]);
                          } else {
                            form.setValue('controllerAddresses.0', newAddress);
                          }
                        }
                      } else {
                        // Clear address fields in a single operation if unchecked
                        const emptyAddress = {
                          addressType: 'RESIDENTIAL_ADDRESS' as const,
                          primaryAddressLine: '',
                          city: '',
                          state: '',
                          postalCode: '',
                          country: '',
                          additionalAddressLines: [],
                        };

                        const currentAddresses = form.getValues(
                          'controllerAddresses'
                        );
                        if (currentAddresses?.length > 0) {
                          form.setValue('controllerAddresses.0', emptyAddress);
                        }
                      }
                    }}
                  />
                  <Label
                    htmlFor="copy-business-address"
                    className="eb-w-full eb-cursor-pointer eb-text-sm eb-font-medium eb-leading-none"
                  >
                    {t('copyBusinessAddressLabel')}
                  </Label>
                </div>
              )}

              <OnboardingFormField
                control={form.control}
                name={`controllerAddresses.${index}.addressType`}
                type="select"
                // Dropdown fields need to be explicitly passed whether it's disabled rather than relying on the fieldset
                disabled={disabled}
                options={[
                  {
                    value: 'MAILING_ADDRESS',
                    label: t('addressTypes.MAILING_ADDRESS'),
                  },
                  {
                    value: 'RESIDENTIAL_ADDRESS',
                    label: t('addressTypes.RESIDENTIAL_ADDRESS'),
                  },
                ]}
              />
              <OnboardingFormField
                control={form.control}
                name={`controllerAddresses.${index}.primaryAddressLine`}
                type="text"
              />

              <OnboardingArrayField
                control={form.control}
                name={`controllerAddresses.${index}.additionalAddressLines`}
                renderItem={({
                  index: lineIndex,
                  field: lineField,
                  renderRemoveButton: renderLineRemoveButton,
                }) => (
                  <OnboardingFormField
                    key={lineField.id}
                    control={form.control}
                    name={`controllerAddresses.${index}.additionalAddressLines.${lineIndex}.value`}
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
                name={`controllerAddresses.${index}.city`}
                type="text"
              />

              <OnboardingFormField
                control={form.control}
                name={`controllerAddresses.${index}.state`}
                type="select"
                options={stateOptions}
              />

              <OnboardingFormField
                control={form.control}
                name={`controllerAddresses.${index}.postalCode`}
                type="text"
                inputProps={{
                  pattern: '[0-9]{5}',
                  maxLength: 5,
                  inputMode: 'numeric',
                }}
              />

              <OnboardingFormField
                control={form.control}
                name={`controllerAddresses.${index}.country`}
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

        {/* Controller IDs */}
        <OnboardingArrayField
          control={form.control}
          name="controllerIds"
          disabled={isFormDisabled}
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

              <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <OnboardingFormField
                  control={form.control}
                  name={`controllerIds.${index}.idType`}
                  type="select"
                  options={[
                    { value: 'SSN', label: 'SSN' },
                    { value: 'ITIN', label: 'ITIN' },
                  ]}
                  disabled={disabled}
                />

                <OnboardingFormField
                  control={form.control}
                  name={`controllerIds.${index}.issuer`}
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
                  key={`controller-id-value-${index}-${field.idType}`}
                  control={form.control}
                  name={`controllerIds.${index}.value`}
                  type="text"
                  label={getValueLabel(field.idType)}
                  maskFormat={getMaskFormat(field.idType)}
                  maskChar="_"
                />

                <OnboardingFormField
                  control={form.control}
                  name={`controllerIds.${index}.expiryDate`}
                  type="date"
                />
                <OnboardingFormField
                  control={form.control}
                  name={`controllerIds.${index}.description`}
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

        <ServerErrorAlert
          error={usePartyResource ? partyUpdateError : clientUpdateError}
        />
        <FormActions disabled={isFormDisabled} isLoading={isFormSubmitting} />
      </form>
    </Form>
  );
};
