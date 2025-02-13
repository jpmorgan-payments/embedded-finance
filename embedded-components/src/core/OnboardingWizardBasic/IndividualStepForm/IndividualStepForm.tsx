/**
 * IndividualStepForm Component
 * ===========================
 * Form component for collecting individual's information during onboarding.
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
 *   <IndividualStepForm />
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
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useStepper } from '@/components/ui/stepper';

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
  shapeFormValuesBySchema,
  translateClientApiErrorsToFormErrors,
  translatePartyApiErrorsToFormErrors,
  useFilterFunctionsByClientContext,
  useStepFormWithFilters,
} from '../utils/formUtils';
import { stateOptions } from '../utils/stateOptions';
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

  const { isFieldVisible, getArrayFieldRule } =
    useFilterFunctionsByClientContext(clientData);

  const form = useStepFormWithFilters<z.infer<typeof IndividualStepFormSchema>>(
    {
      clientData,
      schema: IndividualStepFormSchema,
      defaultValues: {
        individualAddresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: [''],
            state: '',
            city: '',
            postalCode: '',
            country: '',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            value: '',
            issuer: '',
          },
        ],
        individualPhone: {
          phoneType: 'MOBILE_PHONE',
          phoneNumber: '',
        },
      },
    }
  );

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
      existingIndividualParty?.id &&
      !isFormPopulated
    ) {
      const formValues = convertClientResponseToFormValues(
        clientData,
        existingIndividualParty.id
      );
      form.reset(
        shapeFormValuesBySchema(
          { ...form.getValues(), ...formValues },
          IndividualStepFormSchema
        )
      );
      setIsFormPopulated(true);
    }
  }, [
    clientData,
    getClientStatus,
    form.reset,
    existingIndividualParty?.id,
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
      // Update party if it exists
      if (usePartyResource && existingIndividualParty?.id) {
        const partyRequestBody = generatePartyRequestBody(values, {});

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
        const clientRequestBody = generateRequestBody(values, 0, 'addParties', {
          addParties: [
            {
              partyType: 'INDIVIDUAL',
              roles: ['CONTROLLER'],
            },
          ],
        });
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
    return t(`idValueLabels.individual.${idType}`);
  };

  // Reset value of ID value field when ID type changes
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name?.startsWith('individualIds') && name.endsWith('idType')) {
        const index = parseInt(name.split('.')[1], 10);
        form.setValue(`individualIds.${index}.value`, '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  if (existingIndividualParty && !isFormPopulated) {
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
      <form onSubmit={onSubmit} className="eb-space-y-6">
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            General
          </legend>
          <OnboardingFormField
            control={form.control}
            name="firstName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="middleName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="lastName"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="nameSuffix"
            type="text"
          />

          <OnboardingFormField
            control={form.control}
            name="individualEmail"
            type="email"
          />

          <OnboardingFormField
            control={form.control}
            name="birthDate"
            type="date"
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
            name="jobTitle"
            type="select"
            required
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
            name="jobTitleDescription"
            type="text"
          />
        </fieldset>

        {/* Phone Information */}
        <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
          <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
            Individual Phone Information
          </legend>
          <OnboardingFormField
            control={form.control}
            name="individualPhone.phoneType"
            type="select"
            options={[
              { value: 'BUSINESS_PHONE', label: 'Business Phone' },
              { value: 'MOBILE_PHONE', label: 'Mobile Phone' },
              { value: 'ALTERNATE_PHONE', label: 'Alternate Phone' },
            ]}
          />

          <OnboardingFormField
            control={form.control}
            name="individualPhone.phoneNumber"
            type="phone"
          />
        </fieldset>

        {/* Addresses */}
        {isFieldVisible('individualAddresses') && (
          <>
            {addressFields.map((fieldName, index) => (
              <fieldset
                key={fieldName.id}
                className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
              >
                <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                  Individual Address{' '}
                  {Number(getArrayFieldRule('individualAddresses')?.maxItems) >
                  1
                    ? index + 1
                    : ''}
                </legend>
                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.addressType`}
                  type="select"
                  required
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
                  name={`individualAddresses.${index}.addressLines.0`}
                  label="Address Line 1"
                  type="text"
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  label="Address Line 2"
                  name={`individualAddresses.${index}.addressLines.1`}
                  type="text"
                />

                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.city`}
                  type="text"
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.state`}
                  type="select"
                  options={stateOptions}
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.postalCode`}
                  type="text"
                  required
                />

                <OnboardingFormField
                  control={form.control}
                  name={`individualAddresses.${index}.country`}
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

                {addressFields.length >
                  Number(
                    getArrayFieldRule('individualAddresses')?.minItems
                  ) && (
                  <div className="eb-col-span-full">
                    <Button
                      type="button"
                      onClick={() => removeAddress(index)}
                      variant="outline"
                      size="sm"
                      className="eb-mt-2"
                      disabled={
                        addressFields.length <=
                        (getArrayFieldRule('individualAddresses')?.minItems ??
                          1)
                      }
                    >
                      Remove Address
                    </Button>
                  </div>
                )}
              </fieldset>
            ))}
          </>
        )}
        <Button
          type="button"
          onClick={() =>
            appendAddress(
              {
                addressType: 'RESIDENTIAL_ADDRESS',
                addressLines: [''],
                state: '',
                city: '',
                postalCode: '',
                country: '',
              },
              {
                focusName: `individualAddresses.${addressFields.length}.addressLines.0`,
              }
            )
          }
          disabled={
            idFields.length >=
            (getArrayFieldRule('individualAddresses')?.maxItems ?? 50)
          }
          variant="outline"
          size="sm"
        >
          Add Address
        </Button>

        {/* Individual IDs */}
        {isFieldVisible('individualIds') && (
          <>
            {idFields.map((fieldItem, index) => {
              const idType = form.watch(`individualIds.${index}.idType`);
              return (
                <fieldset
                  key={fieldItem.id}
                  className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
                >
                  <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                    Individual Identification Document{' '}
                    {Number(getArrayFieldRule('individualIds')?.maxItems) > 1
                      ? index + 1
                      : ''}
                  </legend>
                  <OnboardingFormField
                    control={form.control}
                    name={`individualIds.${index}.idType`}
                    type="select"
                    options={[
                      { value: 'SSN', label: 'SSN' },
                      { value: 'ITIN', label: 'ITIN' },
                    ]}
                    required
                  />

                  <OnboardingFormField
                    key={`individual-id-value-${index}-${idType}`}
                    control={form.control}
                    name={`individualIds.${index}.value`}
                    type="text"
                    label={getValueLabel(idType)}
                    maskFormat={getMaskFormat(idType)}
                    maskChar="_"
                    required
                  />

                  <OnboardingFormField
                    control={form.control}
                    name={`individualIds.${index}.issuer`}
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
                    name={`individualIds.${index}.expiryDate`}
                    type="date"
                    label="Expiry Date"
                  />

                  <OnboardingFormField
                    control={form.control}
                    name={`individualIds.${index}.description`}
                    type="textarea"
                  />

                  {idFields.length >
                    Number(getArrayFieldRule('individualIds')?.minItems) && (
                    <div className="eb-col-span-full">
                      <Button
                        type="button"
                        disabled={
                          idFields.length <=
                          (getArrayFieldRule('individualIds')?.minItems ?? 0)
                        }
                        onClick={() => removeId(index)}
                        variant="outline"
                        size="sm"
                        className="eb-mt-2"
                      >
                        Remove Individual Identification Document
                      </Button>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </>
        )}
        {Number(getArrayFieldRule('individualIds')?.maxItems) >
          idFields.length && (
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
              idFields.length >=
              (getArrayFieldRule('individualIds')?.maxItems ?? 50)
            }
            variant="outline"
            size="sm"
          >
            Add Individual Identification Document
          </Button>
        )}

        <ServerErrorAlert
          error={usePartyResource ? updatePartyError : updateClientError}
        />
        <FormActions />
      </form>
    </Form>
  );
};
