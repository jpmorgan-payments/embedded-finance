import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { IndividualLegalNameFields } from '@/core/ClientProfile/fields/IndividualLegalNameFields';
import { ProfileAddressFields } from '@/core/ClientProfile/fields/ProfileAddressFields';
import { ProfileIdentityFields } from '@/core/ClientProfile/fields/ProfileIdentityFields';
import { ProfilePhoneFields } from '@/core/ClientProfile/fields/ProfilePhoneFields';
import {
  applyApiFieldErrors,
  hasUnmappedApiErrors,
  type ApiFieldPathMap,
} from '@/core/ClientProfile/forms/apiFieldErrors';
import { getProfileValidationMessage } from '@/core/ClientProfile/forms/getProfileValidationMessage';
import { ProfileImportantDateField } from '@/core/ClientProfile/forms/ProfileImportantDateField';
import { ProfileSelectField } from '@/core/ClientProfile/forms/ProfileSelectField';
import { ProfileTextField } from '@/core/ClientProfile/forms/ProfileTextField';
import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';
import { createProfileAddressSchema } from '@/core/ClientProfile/schemas/createProfileAddressSchema';
import { createIndividualLegalNameSchemaShape } from '@/core/ClientProfile/schemas/individualLegalNameSchema';
import { getBirthDateValidationIssue } from '@/core/ClientProfile/schemas/isValidBirthDate';
import { getIndividualTaxIdValidationIssue } from '@/core/ClientProfile/schemas/isValidIndividualTaxId';
import { JOB_TITLES } from '@/core/OnboardingFlow/consts';
import {
  containsHtmlLikeTag,
  JOB_TITLE_DESCRIPTION_PATTERN,
  SUFFIX_PATTERN,
} from '@/core/OnboardingFlow/utils/validationPatterns';

import { useMaintenanceFormOptions } from '../hooks/useMaintenanceFormOptions';
import type {
  MaintenanceAddress,
  MaintenanceIndividualId,
} from '../models/maintenanceApi.types';
import {
  buildIndividualPartyUpdate,
  type IndividualMaintenanceValues,
  type PartyNameUpdateRequest,
} from '../utils/buildPartyNameUpdate';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenanceFormSection } from './MaintenanceFormSection';

type PartyChangeEditorProps = {
  initialValues: IndividualMaintenanceValues;
  approvedValues: IndividualMaintenanceValues;
  approvedAddresses: MaintenanceAddress[];
  approvedIndividualIds: MaintenanceIndividualId[];
  isSubmitting: boolean;
  mutationError?: unknown;
  lockedCountry?: string;
  onDiscard: () => void;
  onSave: (
    values: IndividualMaintenanceValues,
    request: PartyNameUpdateRequest
  ) => Promise<void>;
};

const PARTY_API_FIELD_PATHS: ApiFieldPathMap<IndividualMaintenanceValues> = {
  'individualDetails.firstName': 'firstName',
  'individualDetails.middleName': 'middleName',
  'individualDetails.lastName': 'lastName',
  'individualDetails.nameSuffix': 'nameSuffix',
  'individualDetails.birthDate': 'birthDate',
  'individualDetails.countryOfResidence': 'countryOfResidence',
  'individualDetails.individualIds.0.idType': 'individualId.idType',
  'individualDetails.individualIds.0.value': 'individualId.value',
  'individualDetails.jobTitle': 'jobTitle',
  'individualDetails.jobTitleDescription': 'jobTitleDescription',
  email: 'email',
  'individualDetails.phone.phoneType': 'phone.phoneType',
  'individualDetails.phone.countryCode': 'phone.countryCode',
  'individualDetails.phone.phoneNumber': 'phone.phoneNumber',
  'individualDetails.addresses.0.country': 'residentialAddress.country',
  'individualDetails.addresses.0.addressLines.0':
    'residentialAddress.primaryAddressLine',
  'individualDetails.addresses.0.addressLines.1':
    'residentialAddress.secondaryAddressLine',
  'individualDetails.addresses.0.addressLines.2':
    'residentialAddress.tertiaryAddressLine',
  'individualDetails.addresses.0.city': 'residentialAddress.city',
  'individualDetails.addresses.0.state': 'residentialAddress.state',
  'individualDetails.addresses.0.postalCode': 'residentialAddress.postalCode',
};

const VALIDATION_FIELD_NAMES: Record<keyof IndividualLegalNameValues, string> =
  {
    firstName: 'controllerFirstName',
    middleName: 'controllerMiddleName',
    lastName: 'controllerLastName',
  };

export function PartyChangeEditor({
  initialValues,
  approvedValues,
  approvedAddresses,
  approvedIndividualIds,
  isSubmitting,
  mutationError,
  lockedCountry,
  onDiscard,
  onSave,
}: PartyChangeEditorProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const [formError, setFormError] = useState<string>();
  const getValidationMessage = (
    field: string,
    messageKey: string,
    params?: Record<string, string>
  ) => getProfileValidationMessage(i18n, field, messageKey, params);
  const schema = z
    .object({
      ...createIndividualLegalNameSchemaShape(
        {
          firstName: 'firstName',
          middleName: 'middleName',
          lastName: 'lastName',
        },
        (fieldName, messageKey) => {
          const validationFieldName =
            VALIDATION_FIELD_NAMES[
              fieldName as keyof IndividualLegalNameValues
            ];
          return getProfileValidationMessage(
            i18n,
            validationFieldName,
            messageKey
          );
        }
      ),
      nameSuffix: z
        .string()
        .max(5, getValidationMessage('controllerNameSuffix', 'maxLength'))
        .refine(
          (value) => value === '' || SUFFIX_PATTERN.test(value),
          getValidationMessage('controllerNameSuffix', 'pattern')
        ),
      birthDate: z.string(),
      countryOfResidence: z
        .string()
        .min(1, getValidationMessage('countryOfResidence', 'required'))
        .length(
          2,
          getValidationMessage('countryOfResidence', 'exactlyTwoChars')
        ),
      individualId: z.object({
        idType: z
          .string()
          .min(1, getValidationMessage('controllerIds.idType', 'required')),
        value: z
          .string()
          .min(1, getValidationMessage('controllerIds.value', 'required')),
      }),
      jobTitle: z
        .string()
        .min(1, getValidationMessage('controllerJobTitle', 'required')),
      jobTitleDescription: z
        .string()
        .max(
          50,
          getValidationMessage('controllerJobTitleDescription', 'maxLength')
        )
        .refine(
          (value) => value === '' || JOB_TITLE_DESCRIPTION_PATTERN.test(value),
          getValidationMessage('controllerJobTitleDescription', 'pattern')
        )
        .refine(
          (value) => !containsHtmlLikeTag(value),
          getValidationMessage('controllerJobTitleDescription', 'noHtml')
        )
        .refine(
          (value) => !/https?:\/\/[^\s]+/.test(value),
          getValidationMessage('controllerJobTitleDescription', 'noUrls')
        ),
      email: z
        .string()
        .min(1, getValidationMessage('controllerEmail', 'required'))
        .email(getValidationMessage('controllerEmail', 'invalid'))
        .max(100, getValidationMessage('controllerEmail', 'maxLength')),
      phone: z.object({
        phoneType: z.string(),
        countryCode: z.string(),
        phoneNumber: z.string(),
      }),
      residentialAddress: createProfileAddressSchema(
        (field, messageKey, params) =>
          getValidationMessage(`individualAddress.${field}`, messageKey, params)
      ),
    })
    .superRefine((values, context) => {
      const birthDateIssue = getBirthDateValidationIssue(values.birthDate);
      if (birthDateIssue) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: getValidationMessage('birthDate', birthDateIssue),
        });
      }
      if (values.jobTitle === 'Other' && !values.jobTitleDescription) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['jobTitleDescription'],
          message: getValidationMessage(
            'controllerJobTitleDescription',
            'required'
          ),
        });
      }
      const taxIdIssue = getIndividualTaxIdValidationIssue(
        values.individualId.idType,
        values.individualId.value
      );
      if (taxIdIssue) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['individualId', 'value'],
          message: getValidationMessage('controllerIds.value', taxIdIssue),
        });
      }
      const hasPhone = Boolean(
        values.phone.countryCode || values.phone.phoneNumber
      );
      if (hasPhone) {
        if (!values.phone.phoneType) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone', 'phoneType'],
            message: tString('editor.phoneIncomplete'),
          });
        }
        if (
          !isValidPhoneNumber(
            `${values.phone.countryCode}${values.phone.phoneNumber}`
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone', 'phoneNumber'],
            message: getValidationMessage(
              'controllerPhone.phoneNumber',
              'format'
            ),
          });
        }
      }
    });
  const form = useForm<IndividualMaintenanceValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });
  useEffect(() => {
    if (!lockedCountry) return;
    if (form.getValues('countryOfResidence') !== lockedCountry) {
      form.setValue('countryOfResidence', lockedCountry, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (form.getValues('residentialAddress.country') !== lockedCountry) {
      form.setValue('residentialAddress.country', lockedCountry, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, lockedCountry]);
  useEffect(() => {
    if (mutationError) {
      applyApiFieldErrors(form, mutationError, PARTY_API_FIELD_PATHS);
    }
  }, [form, mutationError]);
  const currentValues = form.watch();
  const { countryOptions, getSubdivisionOptions, identityContent } =
    useMaintenanceFormOptions();
  const jobTitleOptions = JOB_TITLES.map((jobTitle) => ({
    value: jobTitle,
    label: tString([
      `onboarding-overview:jobTitles.${jobTitle}`,
    ] as unknown as TemplateStringsArray),
  }));
  const phoneTypeOptions = [
    'BUSINESS_PHONE',
    'MOBILE_PHONE',
    'ALTERNATE_PHONE',
  ].map((phoneType) => ({
    value: phoneType,
    label: tString(
      [`common:phoneTypes.${phoneType}`] as unknown as TemplateStringsArray,
      { defaultValue: phoneType }
    ),
  }));
  const update = buildIndividualPartyUpdate(
    initialValues,
    currentValues as IndividualMaintenanceValues,
    approvedAddresses,
    approvedIndividualIds
  );
  const hasChanges = update.kind !== 'unchanged';

  const getRestoreAction = (
    field: Exclude<
      keyof IndividualMaintenanceValues,
      'individualId' | 'phone' | 'residentialAddress'
    >
  ) => {
    const currentValue = currentValues[field] ?? '';
    const approvedValue = approvedValues[field];
    if (currentValue === approvedValue) return undefined;
    return {
      originalValue: t('editor.originalValue', {
        value: approvedValue || tString('notProvided'),
      }),
      label: t('editor.restoreValue'),
      onClick: () => {
        form.setValue(field, approvedValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.clearErrors(field);
      },
    };
  };
  const getNestedRestoreAction = (
    name:
      | `individualId.${'idType' | 'value'}`
      | `phone.${'phoneType' | 'countryCode' | 'phoneNumber'}`
      | `residentialAddress.${
          | 'country'
          | 'primaryAddressLine'
          | 'secondaryAddressLine'
          | 'tertiaryAddressLine'
          | 'city'
          | 'state'
          | 'postalCode'}`,
    currentValue: string,
    approvedValue: string,
    displayValue = approvedValue
  ) => {
    if (currentValue === approvedValue) return undefined;
    return {
      originalValue: t('editor.originalValue', {
        value: displayValue || tString('notProvided'),
      }),
      label: t('editor.restoreValue'),
      onClick: () => {
        form.setValue(name, approvedValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.clearErrors(name);
      },
    };
  };
  const hasChangedIdentity =
    currentValues.individualId?.idType !== approvedValues.individualId.idType ||
    currentValues.individualId?.value !== approvedValues.individualId.value;
  const restoreApprovedIdentity = () => {
    form.setValue('individualId.idType', approvedValues.individualId.idType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('individualId.value', approvedValues.individualId.value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.clearErrors(['individualId.idType', 'individualId.value']);
  };
  const identityRestoreAction =
    currentValues.countryOfResidence === approvedValues.countryOfResidence &&
    hasChangedIdentity
      ? {
          originalValue: t('editor.originalValue', {
            value: approvedValues.individualId.value
              ? `${identityContent.idValue[approvedValues.individualId.idType] ?? approvedValues.individualId.idType} ••••${approvedValues.individualId.value.slice(-4)}`
              : tString('notProvided'),
          }),
          label: t('editor.restoreIdentification'),
          onClick: restoreApprovedIdentity,
        }
      : undefined;
  const countryRestoreAction =
    currentValues.countryOfResidence !== approvedValues.countryOfResidence
      ? {
          originalValue: t('editor.originalValue', {
            value: tString(
              [
                `common:countries.${approvedValues.countryOfResidence}`,
              ] as unknown as TemplateStringsArray,
              { defaultValue: approvedValues.countryOfResidence }
            ),
          }),
          label: t('editor.restoreCountryAndIdentification'),
          onClick: () => {
            form.setValue(
              'countryOfResidence',
              approvedValues.countryOfResidence,
              { shouldDirty: true, shouldValidate: true }
            );
            restoreApprovedIdentity();
            form.clearErrors('countryOfResidence');
          },
        }
      : undefined;

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const nextUpdate = buildIndividualPartyUpdate(
      initialValues,
      values,
      approvedAddresses,
      approvedIndividualIds
    );
    if (nextUpdate.kind === 'unchanged') {
      setFormError(tString('editor.noChanges'));
      return;
    }
    if (nextUpdate.kind === 'unsupported-clear') {
      nextUpdate.fields.forEach((field) => {
        form.setError(field, {
          type: 'manual',
          message: tString('editor.unsupportedClear', {
            field: tString([
              `editor.${field}`,
            ] as unknown as TemplateStringsArray),
          }),
        });
      });
      form.setFocus(nextUpdate.fields[0]);
      return;
    }

    try {
      await onSave(values, nextUpdate.request);
    } catch (error) {
      applyApiFieldErrors(form, error, PARTY_API_FIELD_PATHS);
      // The mutation exposes its API error while preserving entered values.
    }
  });

  return (
    <div className="eb-px-4 eb-pt-4">
      {mutationError &&
      hasUnmappedApiErrors(mutationError, PARTY_API_FIELD_PATHS) ? (
        <div className="eb-mb-4">
          <ServerErrorAlert error={mutationError as never} />
        </div>
      ) : null}
      {formError ? (
        <Alert variant="warning" noTitle className="eb-mb-4">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={submit}>
          <fieldset
            className="eb-mx-auto eb-w-full eb-max-w-3xl eb-px-4"
            disabled={isSubmitting}
          >
            <MaintenanceFormSection
              title={t('individualDetails.identityGroup')}
              description={t('editor.legalIdentityDescription')}
            >
              <IndividualLegalNameFields
                control={form.control}
                fieldNames={{
                  firstName: 'firstName',
                  middleName: 'middleName',
                  lastName: 'lastName',
                }}
                content={{
                  firstName: {
                    label: t(
                      'onboarding-overview:fields.controllerFirstName.label'
                    ),
                    placeholder: tString(
                      'onboarding-overview:fields.controllerFirstName.placeholder'
                    ),
                    description: t(
                      'onboarding-overview:fields.controllerFirstName.description'
                    ),
                    restoreAction: getRestoreAction('firstName'),
                  },
                  middleName: {
                    label: t(
                      'onboarding-overview:fields.controllerMiddleName.label'
                    ),
                    placeholder: tString(
                      'onboarding-overview:fields.controllerMiddleName.placeholder'
                    ),
                    description: t(
                      'onboarding-overview:fields.controllerMiddleName.description'
                    ),
                    restoreAction: getRestoreAction('middleName'),
                  },
                  lastName: {
                    label: t(
                      'onboarding-overview:fields.controllerLastName.label'
                    ),
                    placeholder: tString(
                      'onboarding-overview:fields.controllerLastName.placeholder'
                    ),
                    description: t(
                      'onboarding-overview:fields.controllerLastName.description'
                    ),
                    restoreAction: getRestoreAction('lastName'),
                  },
                  optionalLabel: t('common:optional'),
                }}
              />
              <ProfileTextField
                control={form.control}
                name="nameSuffix"
                label={t(
                  'onboarding-overview:fields.controllerNameSuffix.label'
                )}
                placeholder={tString(
                  'onboarding-overview:fields.controllerNameSuffix.placeholder'
                )}
                description={t(
                  'onboarding-overview:fields.controllerNameSuffix.description'
                )}
                optionalLabel={t('common:optional')}
                restoreAction={getRestoreAction('nameSuffix')}
                className="eb-max-w-48"
              />
              <ProfileImportantDateField
                control={form.control}
                name="birthDate"
                label={t('onboarding-overview:fields.birthDate.label')}
                description={t(
                  'onboarding-overview:fields.birthDate.description'
                )}
                required
                restoreAction={getRestoreAction('birthDate')}
              />
              <ProfileSelectField
                control={form.control}
                name="countryOfResidence"
                label={t('onboarding-overview:fields.countryOfResidence.label')}
                options={countryOptions}
                placeholder={tString(
                  'onboarding-overview:fields.countryOfResidence.placeholder'
                )}
                searchPlaceholder={tString('form.searchCountries')}
                noResultsLabel={tString('form.noResults')}
                searchable
                required
                readonly={Boolean(lockedCountry)}
                description={t(
                  'onboarding-overview:fields.countryOfResidence.description.owner'
                )}
                restoreAction={countryRestoreAction}
              />
              <ProfileIdentityFields
                control={form.control}
                countryName="countryOfResidence"
                idTypeName="individualId.idType"
                idValueName="individualId.value"
                content={identityContent}
                restoreAction={identityRestoreAction}
              />
            </MaintenanceFormSection>

            <MaintenanceFormSection
              title={t('individualDetails.responsibilityGroup')}
              description={t('editor.responsibilityDescription')}
              divided
            >
              <div className="eb-grid eb-gap-4 @[40rem]:eb-grid-cols-2">
                <ProfileSelectField
                  control={form.control}
                  name="jobTitle"
                  label={t(
                    'onboarding-overview:fields.controllerJobTitle.label'
                  )}
                  options={jobTitleOptions}
                  placeholder={tString(
                    'onboarding-overview:fields.controllerJobTitle.placeholder'
                  )}
                  description={t(
                    'onboarding-overview:fields.controllerJobTitle.description.default'
                  )}
                  required
                  restoreAction={getRestoreAction('jobTitle')}
                />
                {currentValues.jobTitle === 'Other' ? (
                  <ProfileTextField
                    control={form.control}
                    name="jobTitleDescription"
                    label={t(
                      'onboarding-overview:fields.controllerJobTitleDescription.label'
                    )}
                    placeholder={tString(
                      'onboarding-overview:fields.controllerJobTitleDescription.placeholder'
                    )}
                    description={t(
                      'onboarding-overview:fields.controllerJobTitleDescription.description.default'
                    )}
                    required
                    restoreAction={getRestoreAction('jobTitleDescription')}
                  />
                ) : null}
              </div>
            </MaintenanceFormSection>

            <MaintenanceFormSection
              title={t('individualDetails.contactGroup')}
              description={t('editor.contactDescription')}
              divided
            >
              <ProfileTextField
                control={form.control}
                name="email"
                label={t('onboarding-overview:fields.controllerEmail.label')}
                placeholder={tString(
                  'onboarding-overview:fields.controllerEmail.placeholder'
                )}
                description={t(
                  'onboarding-overview:fields.controllerEmail.description'
                )}
                inputType="email"
                required
                restoreAction={getRestoreAction('email')}
              />
              <ProfilePhoneFields
                control={form.control}
                phoneTypeName="phone.phoneType"
                countryCodeName="phone.countryCode"
                phoneNumberName="phone.phoneNumber"
                phoneTypeLabel={t(
                  'onboarding-overview:fields.controllerPhone.phoneType.label'
                )}
                phoneTypePlaceholder={tString(
                  'onboarding-overview:fields.controllerPhone.phoneType.placeholder'
                )}
                phoneTypeOptions={phoneTypeOptions}
                phoneNumberLabel={t(
                  'onboarding-overview:fields.controllerPhone.phoneNumber.label'
                )}
                phoneNumberPlaceholder={tString(
                  'onboarding-overview:fields.controllerPhone.phoneNumber.placeholder'
                )}
                optionalLabel={t('common:optional')}
                showPhoneType={false}
                defaultPhoneType="MOBILE_PHONE"
                restoreActions={{
                  phoneType: getNestedRestoreAction(
                    'phone.phoneType',
                    currentValues.phone?.phoneType ?? '',
                    approvedValues.phone.phoneType
                  ),
                  phoneNumber: getNestedRestoreAction(
                    'phone.phoneNumber',
                    currentValues.phone?.phoneNumber ?? '',
                    approvedValues.phone.phoneNumber,
                    approvedValues.phone.phoneNumber
                      ? `••••${approvedValues.phone.phoneNumber.slice(-4)}`
                      : ''
                  ),
                }}
              />
              <div className="eb-border-t eb-pt-4">
                <ProfileAddressFields
                  control={form.control}
                  fieldNames={{
                    country: 'residentialAddress.country',
                    primaryAddressLine: 'residentialAddress.primaryAddressLine',
                    secondaryAddressLine:
                      'residentialAddress.secondaryAddressLine',
                    tertiaryAddressLine:
                      'residentialAddress.tertiaryAddressLine',
                    city: 'residentialAddress.city',
                    state: 'residentialAddress.state',
                    postalCode: 'residentialAddress.postalCode',
                  }}
                  content={{
                    country: tString(
                      'onboarding-overview:fields.individualAddress.country.label'
                    ),
                    primaryAddressLine: tString(
                      'onboarding-overview:fields.individualAddress.primaryAddressLine.label'
                    ),
                    secondaryAddressLine: tString(
                      'onboarding-overview:fields.individualAddress.secondaryAddressLine.label'
                    ),
                    tertiaryAddressLine: tString(
                      'onboarding-overview:fields.individualAddress.tertiaryAddressLine.label'
                    ),
                    city: tString(
                      'onboarding-overview:addressFields.city.label.default'
                    ),
                    state: tString(
                      'onboarding-overview:addressFields.state.label.default'
                    ),
                    postalCode: tString(
                      'onboarding-overview:addressFields.postalCode.label.default'
                    ),
                    optionalLabel: tString('common:optional'),
                    countryPlaceholder: tString('form.selectCountry'),
                    countrySearchPlaceholder: tString('form.searchCountries'),
                    noCountryResults: tString('form.noResults'),
                    statePlaceholder: tString('form.selectRegion'),
                    restoreActions: {
                      country: getNestedRestoreAction(
                        'residentialAddress.country',
                        currentValues.residentialAddress?.country ?? '',
                        approvedValues.residentialAddress.country
                      ),
                      primaryAddressLine: getNestedRestoreAction(
                        'residentialAddress.primaryAddressLine',
                        currentValues.residentialAddress?.primaryAddressLine ??
                          '',
                        approvedValues.residentialAddress.primaryAddressLine
                      ),
                      secondaryAddressLine: getNestedRestoreAction(
                        'residentialAddress.secondaryAddressLine',
                        currentValues.residentialAddress
                          ?.secondaryAddressLine ?? '',
                        approvedValues.residentialAddress.secondaryAddressLine
                      ),
                      tertiaryAddressLine: getNestedRestoreAction(
                        'residentialAddress.tertiaryAddressLine',
                        currentValues.residentialAddress?.tertiaryAddressLine ??
                          '',
                        approvedValues.residentialAddress.tertiaryAddressLine
                      ),
                      city: getNestedRestoreAction(
                        'residentialAddress.city',
                        currentValues.residentialAddress?.city ?? '',
                        approvedValues.residentialAddress.city
                      ),
                      state: getNestedRestoreAction(
                        'residentialAddress.state',
                        currentValues.residentialAddress?.state ?? '',
                        approvedValues.residentialAddress.state
                      ),
                      postalCode: getNestedRestoreAction(
                        'residentialAddress.postalCode',
                        currentValues.residentialAddress?.postalCode ?? '',
                        approvedValues.residentialAddress.postalCode
                      ),
                    },
                    placeholders: {
                      primaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.primaryAddressLine.placeholder'
                      ),
                      secondaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.secondaryAddressLine.placeholder'
                      ),
                      tertiaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.tertiaryAddressLine.placeholder'
                      ),
                    },
                    descriptions: {
                      primaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.primaryAddressLine.description'
                      ),
                      secondaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.secondaryAddressLine.description'
                      ),
                    },
                  }}
                  countryOptions={countryOptions}
                  getSubdivisionOptions={getSubdivisionOptions}
                  countryReadonly={Boolean(lockedCountry)}
                />
              </div>
            </MaintenanceFormSection>
          </fieldset>

          <MaintenanceFormFooter
            sticky
            leading={
              <Button
                type="button"
                variant="outlineSurface"
                size="sm"
                onClick={onDiscard}
                disabled={isSubmitting}
              >
                {t('editor.cancelEditing')}
              </Button>
            }
            trailing={
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : null}
                {t('editor.save')}
              </Button>
            }
          />
        </form>
      </Form>
    </div>
  );
}
