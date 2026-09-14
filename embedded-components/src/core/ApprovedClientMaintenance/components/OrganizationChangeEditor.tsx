import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sanitizeInput } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form, RadioGroup, RadioGroupItem } from '@/components/ui';
import { ProfileAddressFields } from '@/core/ClientProfile/fields/ProfileAddressFields';
import { ProfilePhoneFields } from '@/core/ClientProfile/fields/ProfilePhoneFields';
import {
  applyApiFieldErrors,
  hasUnmappedApiErrors,
  type ApiFieldPathMap,
} from '@/core/ClientProfile/forms/apiFieldErrors';
import { getProfileValidationMessage } from '@/core/ClientProfile/forms/getProfileValidationMessage';
import { ProfileSelectField } from '@/core/ClientProfile/forms/ProfileSelectField';
import { ProfileTextareaField } from '@/core/ClientProfile/forms/ProfileTextareaField';
import { ProfileTextField } from '@/core/ClientProfile/forms/ProfileTextField';
import { createProfileAddressSchema } from '@/core/ClientProfile/schemas/createProfileAddressSchema';
import { getEinValidationIssue } from '@/core/ClientProfile/schemas/isValidEin';
import {
  containsHtmlLikeTag,
  NAME_PATTERN,
} from '@/core/OnboardingFlow/utils/validationPatterns';

import { useMaintenanceFormOptions } from '../hooks/useMaintenanceFormOptions';
import type { MaintenancePartyUpdateRequest } from '../models/maintenanceApi.types';
import {
  buildOrganizationPartyUpdate,
  type OrganizationMaintenanceField,
  type OrganizationMaintenanceValues,
} from '../utils/buildOrganizationPartyUpdate';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenanceFormSection } from './MaintenanceFormSection';

type OrganizationChangeEditorProps = {
  variant: 'client' | 'intermediary';
  initialValues: OrganizationMaintenanceValues;
  approvedValues: OrganizationMaintenanceValues;
  isSubmitting: boolean;
  mutationError?: unknown;
  onCancel: () => void;
  onSave: (request: MaintenancePartyUpdateRequest) => Promise<void>;
};

const ORGANIZATION_API_FIELD_PATHS: ApiFieldPathMap<OrganizationMaintenanceValues> =
  {
    'organizationDetails.organizationName': 'organizationName',
    'organizationDetails.dbaName': 'dbaName',
    'organizationDetails.organizationType': 'organizationType',
    'organizationDetails.countryOfFormation': 'countryOfFormation',
    'organizationDetails.yearOfFormation': 'yearOfFormation',
    'organizationDetails.organizationIds.0.idType': 'organizationId.idType',
    'organizationDetails.organizationIds.0.value': 'organizationId.value',
    'organizationDetails.organizationIds.0.issuer': 'organizationId.issuer',
    'organizationDetails.organizationDescription': 'organizationDescription',
    email: 'email',
    'organizationDetails.phone.phoneType': 'phone.phoneType',
    'organizationDetails.phone.countryCode': 'phone.countryCode',
    'organizationDetails.phone.phoneNumber': 'phone.phoneNumber',
    'organizationDetails.addresses.0.country': 'organizationAddress.country',
    'organizationDetails.addresses.0.addressLines.0':
      'organizationAddress.primaryAddressLine',
    'organizationDetails.addresses.0.addressLines.1':
      'organizationAddress.secondaryAddressLine',
    'organizationDetails.addresses.0.addressLines.2':
      'organizationAddress.tertiaryAddressLine',
    'organizationDetails.addresses.0.city': 'organizationAddress.city',
    'organizationDetails.addresses.0.state': 'organizationAddress.state',
    'organizationDetails.addresses.0.postalCode':
      'organizationAddress.postalCode',
  };

export function OrganizationChangeEditor({
  variant,
  initialValues,
  approvedValues,
  isSubmitting,
  mutationError,
  onCancel,
  onSave,
}: OrganizationChangeEditorProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const [formError, setFormError] = useState<string>();
  const { countryOptions, getSubdivisionOptions, organizationTypeOptions } =
    useMaintenanceFormOptions();
  const fieldValidationMessage = (
    field: string,
    messageKey: string,
    params?: Record<string, string>
  ) => getProfileValidationMessage(i18n, field, messageKey, params);
  const currentYear = new Date().getFullYear();
  const organizationSchema = z
    .object({
      organizationName: z
        .string()
        .min(1, fieldValidationMessage('organizationName', 'required'))
        .min(2, fieldValidationMessage('organizationName', 'minLength'))
        .max(100, fieldValidationMessage('organizationName', 'maxLength'))
        .refine(
          (value) => NAME_PATTERN.test(value),
          fieldValidationMessage('organizationName', 'pattern')
        )
        .refine(
          (value) => !/\s\s/.test(value),
          fieldValidationMessage('organizationName', 'noConsecutiveSpaces')
        ),
      dbaName: z
        .string()
        .max(100, fieldValidationMessage('dbaName', 'maxLength'))
        .refine(
          (value) => value === '' || NAME_PATTERN.test(value),
          fieldValidationMessage('dbaName', 'pattern')
        )
        .refine(
          (value) => value === '' || value.length >= 2,
          fieldValidationMessage('dbaName', 'minLength')
        )
        .refine(
          (value) => !/\s\s/.test(value),
          fieldValidationMessage('dbaName', 'noConsecutiveSpaces')
        ),
      organizationType: z
        .string()
        .min(1, fieldValidationMessage('organizationType', 'required')),
      countryOfFormation: z
        .string()
        .min(1, fieldValidationMessage('countryOfFormation', 'required'))
        .length(
          2,
          fieldValidationMessage('countryOfFormation', 'exactlyTwoChars')
        ),
      yearOfFormation: z.string(),
      solePropHasEin: z.enum(['yes', 'no']),
      organizationId: z.object({
        idType: z.string(),
        value: z.string(),
        issuer: z.string(),
      }),
      organizationDescription: z.string(),
      email: z.string(),
      phone: z.object({
        phoneType: z.string(),
        countryCode: z.string(),
        phoneNumber: z.string(),
      }),
      organizationAddress: createProfileAddressSchema(
        (field, messageKey, params) =>
          fieldValidationMessage(
            `organizationAddress.${field}`,
            messageKey,
            params
          )
      ),
    })
    .superRefine((values, context) => {
      if (variant === 'client') {
        if (!/^(19|20)\d{2}$/.test(values.yearOfFormation)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['yearOfFormation'],
            message: fieldValidationMessage('yearOfFormation', 'format'),
          });
        } else if (Number(values.yearOfFormation) < 1800) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['yearOfFormation'],
            message: fieldValidationMessage('yearOfFormation', 'min'),
          });
        } else if (Number(values.yearOfFormation) > currentYear) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['yearOfFormation'],
            message: fieldValidationMessage('yearOfFormation', 'future'),
          });
        }
        if (values.countryOfFormation !== 'US') {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['countryOfFormation'],
            message: fieldValidationMessage('countryOfFormation', 'usOnly'),
          });
        }
        if (!values.organizationDescription) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['organizationDescription'],
            message: fieldValidationMessage(
              'organizationDescription',
              'required'
            ),
          });
        } else if (values.organizationDescription.length < 10) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['organizationDescription'],
            message: fieldValidationMessage(
              'organizationDescription',
              'minLength'
            ),
          });
        } else if (values.organizationDescription.length > 1000) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['organizationDescription'],
            message: fieldValidationMessage(
              'organizationDescription',
              'maxLength'
            ),
          });
        } else if (containsHtmlLikeTag(values.organizationDescription)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['organizationDescription'],
            message: fieldValidationMessage(
              'organizationDescription',
              'noHtml'
            ),
          });
        } else if (/https?:\/\/[^\s]+/.test(values.organizationDescription)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['organizationDescription'],
            message: fieldValidationMessage(
              'organizationDescription',
              'noUrls'
            ),
          });
        }
        if (!values.email) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['email'],
            message: fieldValidationMessage('organizationEmail', 'required'),
          });
        } else if (!z.string().email().safeParse(values.email).success) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['email'],
            message: fieldValidationMessage('organizationEmail', 'invalid'),
          });
        } else if (values.email.length > 100) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['email'],
            message: fieldValidationMessage('organizationEmail', 'maxLength'),
          });
        }
      }
      const requiresEin =
        variant === 'intermediary' ||
        values.organizationType !== 'SOLE_PROPRIETORSHIP' ||
        values.solePropHasEin === 'yes';
      const einValidationIssue = getEinValidationIssue(
        values.organizationId.value
      );
      if (requiresEin && einValidationIssue) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['organizationId', 'value'],
          message: fieldValidationMessage(
            'organizationIdEin',
            einValidationIssue
          ),
        });
      }
      const hasPhone = Boolean(
        values.phone.countryCode || values.phone.phoneNumber
      );
      if (
        hasPhone &&
        (!/^\+\d{1,4}$/.test(values.phone.countryCode) ||
          !/^\d{7,15}$/.test(values.phone.phoneNumber))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone', 'phoneNumber'],
          message: fieldValidationMessage(
            'organizationPhone.phoneNumber',
            'format'
          ),
        });
      }
    });
  const form = useForm<OrganizationMaintenanceValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: initialValues,
  });
  const countryOfFormation = form.watch('countryOfFormation');
  const organizationType = form.watch('organizationType');
  const solePropHasEin = form.watch('solePropHasEin');
  useEffect(() => {
    if (
      countryOfFormation &&
      form.getValues('organizationAddress.country') !== countryOfFormation
    ) {
      form.setValue('organizationAddress.country', countryOfFormation, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (form.getValues('organizationId.issuer') !== countryOfFormation) {
      form.setValue('organizationId.issuer', countryOfFormation, {
        shouldDirty: true,
      });
    }
  }, [countryOfFormation, form]);
  useEffect(() => {
    if (
      organizationType !== 'SOLE_PROPRIETORSHIP' &&
      solePropHasEin !== 'yes'
    ) {
      form.setValue('solePropHasEin', 'yes', { shouldDirty: true });
      return;
    }
    if (
      organizationType === 'SOLE_PROPRIETORSHIP' &&
      solePropHasEin === 'no' &&
      !approvedValues.organizationId.value &&
      form.getValues('organizationId.value')
    ) {
      form.setValue('organizationId.value', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors('organizationId.value');
    }
  }, [
    approvedValues.organizationId.value,
    form,
    organizationType,
    solePropHasEin,
  ]);
  useEffect(() => {
    if (mutationError) {
      applyApiFieldErrors(form, mutationError, ORGANIZATION_API_FIELD_PATHS);
    }
  }, [form, mutationError]);
  const currentValues = form.watch();
  const update = buildOrganizationPartyUpdate(initialValues, currentValues);

  const getScalarRestoreAction = (
    field:
      | 'organizationName'
      | 'dbaName'
      | 'organizationType'
      | 'countryOfFormation'
      | 'yearOfFormation'
      | 'organizationDescription'
      | 'email'
  ) => {
    if (currentValues[field] === approvedValues[field]) return undefined;
    return {
      originalValue: t('editor.originalValue', {
        value: approvedValues[field] || tString('notProvided'),
      }),
      label: t('editor.restoreValue'),
      onClick: () => {
        form.setValue(field, approvedValues[field], {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.clearErrors(field);
      },
    };
  };
  const getAddressRestoreAction = (
    field: keyof OrganizationMaintenanceValues['organizationAddress']
  ) => {
    const currentValue = currentValues.organizationAddress[field];
    const approvedValue = approvedValues.organizationAddress[field];
    if (currentValue === approvedValue) return undefined;
    return {
      originalValue: t('editor.originalValue', {
        value: approvedValue || tString('notProvided'),
      }),
      label: t('editor.restoreValue'),
      onClick: () => {
        form.setValue(`organizationAddress.${field}`, approvedValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.clearErrors(`organizationAddress.${field}`);
      },
    };
  };
  const getUnsupportedClearLabel = (field: OrganizationMaintenanceField) => {
    const token = {
      organizationName: 'onboarding-overview:fields.organizationName.label',
      dbaName: 'onboarding-overview:fields.dbaName.label',
      organizationType: 'onboarding-overview:fields.organizationType.label',
      countryOfFormation: 'onboarding-overview:fields.countryOfFormation.label',
      yearOfFormation: 'onboarding-overview:fields.yearOfFormation.label',
      'organizationId.value':
        'onboarding-overview:fields.organizationIdEin.label',
      organizationDescription:
        'onboarding-overview:fields.organizationDescription.label',
      email: 'organizationDetails.email',
      'phone.phoneNumber': 'organizationDetails.phone',
      'organizationAddress.secondaryAddressLine':
        'onboarding-overview:fields.organizationAddress.secondaryAddressLine.label',
      'organizationAddress.tertiaryAddressLine':
        'onboarding-overview:fields.organizationAddress.tertiaryAddressLine.label',
    }[field];
    return token
      ? tString([token] as unknown as TemplateStringsArray)
      : String(field);
  };

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const submittedValues =
      variant === 'client'
        ? {
            ...values,
            organizationDescription: sanitizeInput(
              values.organizationDescription
            ),
          }
        : values;
    const nextUpdate = buildOrganizationPartyUpdate(
      initialValues,
      submittedValues
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
            field: getUnsupportedClearLabel(field),
          }),
        });
      });
      form.setFocus(nextUpdate.fields[0]);
      return;
    }
    try {
      await onSave(nextUpdate.request);
    } catch (error) {
      applyApiFieldErrors(form, error, ORGANIZATION_API_FIELD_PATHS);
    }
  });

  return (
    <div className="eb-px-4 eb-pt-4">
      {mutationError &&
      hasUnmappedApiErrors(mutationError, ORGANIZATION_API_FIELD_PATHS) ? (
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
        <form onSubmit={submit} className="eb-space-y-6">
          <fieldset
            disabled={isSubmitting}
            className="eb-mx-auto eb-w-full eb-max-w-3xl eb-space-y-6 eb-px-4"
          >
            <MaintenanceFormSection
              title={t('organizationDetails.identityGroup')}
              description={t('organizationForm.identityDescription')}
            >
              <ProfileTextField
                control={form.control}
                name="organizationName"
                label={t('onboarding-overview:fields.organizationName.label')}
                placeholder={tString(
                  'onboarding-overview:fields.organizationName.placeholder'
                )}
                description={t(
                  'onboarding-overview:fields.organizationName.description.default'
                )}
                restoreAction={getScalarRestoreAction('organizationName')}
                readonly={
                  variant === 'client' &&
                  form.watch('organizationType') === 'SOLE_PROPRIETORSHIP'
                }
                required
              />
              {variant === 'client' ? (
                <ProfileTextField
                  control={form.control}
                  name="dbaName"
                  label={t('onboarding-overview:fields.dbaName.label')}
                  placeholder={tString(
                    'onboarding-overview:fields.dbaName.placeholder'
                  )}
                  description={t(
                    'onboarding-overview:fields.dbaName.description'
                  )}
                  restoreAction={getScalarRestoreAction('dbaName')}
                  optionalLabel={t('common:optional')}
                />
              ) : null}
            </MaintenanceFormSection>
            <MaintenanceFormSection
              title={t('organizationDetails.registrationGroup')}
              description={t('ownership.businessIdentityDescription')}
              divided
            >
              <div className="eb-grid eb-gap-4 @[40rem]:eb-grid-cols-2">
                <ProfileSelectField
                  control={form.control}
                  name="organizationType"
                  label={t('onboarding-overview:fields.organizationType.label')}
                  options={organizationTypeOptions}
                  placeholder={tString(
                    'onboarding-overview:fields.organizationType.placeholder'
                  )}
                  restoreAction={getScalarRestoreAction('organizationType')}
                  required
                />
                {variant === 'client' ? (
                  <ProfileTextField
                    control={form.control}
                    name="yearOfFormation"
                    label={t(
                      'onboarding-overview:fields.yearOfFormation.label'
                    )}
                    placeholder={tString(
                      'onboarding-overview:fields.yearOfFormation.placeholder'
                    )}
                    description={t(
                      'onboarding-overview:fields.yearOfFormation.description'
                    )}
                    inputProps={{ maxLength: 4, inputMode: 'numeric' }}
                    restoreAction={getScalarRestoreAction('yearOfFormation')}
                    required
                  />
                ) : null}
                <ProfileSelectField
                  control={form.control}
                  name="countryOfFormation"
                  label={t(
                    'onboarding-overview:fields.countryOfFormation.label'
                  )}
                  options={countryOptions}
                  placeholder={tString('form.selectCountry')}
                  searchPlaceholder={tString('form.searchCountries')}
                  noResultsLabel={tString('form.noResults')}
                  searchable
                  readonly
                  required
                />
              </div>
              {variant === 'client' &&
              form.watch('organizationType') === 'SOLE_PROPRIETORSHIP' ? (
                <FormField
                  control={form.control}
                  name="solePropHasEin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('onboarding-overview:fields.solePropHasEin.label')}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="eb-grid eb-gap-2 @[40rem]:eb-grid-cols-2"
                        >
                          <label className="eb-flex eb-items-start eb-gap-3 eb-rounded-md eb-border eb-p-3">
                            <RadioGroupItem value="yes" className="eb-mt-0.5" />
                            <span className="eb-text-sm">
                              {t(
                                'onboarding-overview:fields.solePropHasEin.options.yes'
                              )}
                            </span>
                          </label>
                          <label className="eb-flex eb-items-start eb-gap-3 eb-rounded-md eb-border eb-p-3">
                            <RadioGroupItem
                              value="no"
                              className="eb-mt-0.5"
                              disabled={Boolean(
                                approvedValues.organizationId.value
                              )}
                            />
                            <span className="eb-text-sm">
                              {t(
                                'onboarding-overview:fields.solePropHasEin.options.no'
                              )}
                            </span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {variant === 'intermediary' ||
              form.watch('organizationType') !== 'SOLE_PROPRIETORSHIP' ||
              form.watch('solePropHasEin') === 'yes' ? (
                <ProfileTextField
                  control={form.control}
                  name="organizationId.value"
                  label={t(
                    'onboarding-overview:fields.organizationIdEin.label'
                  )}
                  description={t(
                    'onboarding-overview:fields.organizationIdEin.description.default'
                  )}
                  placeholder="XX-XXXXXXX"
                  maskFormat="## - #######"
                  maskChar="_"
                  required
                />
              ) : null}
            </MaintenanceFormSection>
            {variant === 'client' ? (
              <MaintenanceFormSection
                title={t('organizationDetails.operationsGroup')}
                divided
              >
                <ProfileTextareaField
                  control={form.control}
                  name="organizationDescription"
                  label={t(
                    'onboarding-overview:fields.organizationDescription.label'
                  )}
                  description={t(
                    'onboarding-overview:fields.organizationDescription.description'
                  )}
                  maxLength={1000}
                  restoreAction={getScalarRestoreAction(
                    'organizationDescription'
                  )}
                  required
                />
              </MaintenanceFormSection>
            ) : null}
            {variant === 'client' ? (
              <MaintenanceFormSection
                title={t('organizationDetails.contactGroup')}
                divided
              >
                <ProfileTextField
                  control={form.control}
                  name="email"
                  label={tString([
                    `onboarding-overview:fields.organizationEmail.label.${
                      form.watch('organizationType') === 'SOLE_PROPRIETORSHIP'
                        ? 'soleProp'
                        : 'default'
                    }`,
                  ] as unknown as TemplateStringsArray)}
                  inputType="email"
                  restoreAction={getScalarRestoreAction('email')}
                  required
                />
                <ProfilePhoneFields
                  control={form.control}
                  phoneTypeName="phone.phoneType"
                  countryCodeName="phone.countryCode"
                  phoneNumberName="phone.phoneNumber"
                  phoneTypeLabel={t(
                    'onboarding-overview:fields.organizationPhone.phoneType.label'
                  )}
                  phoneTypePlaceholder={tString(
                    'onboarding-overview:fields.organizationPhone.phoneType.placeholder'
                  )}
                  phoneTypeOptions={[]}
                  phoneNumberLabel={t('organizationDetails.phone')}
                  optionalLabel={t('common:optional')}
                  showPhoneType={false}
                  defaultPhoneType="BUSINESS_PHONE"
                />
              </MaintenanceFormSection>
            ) : null}
            <MaintenanceFormSection
              title={
                variant === 'intermediary'
                  ? t('ownership.legalAddress')
                  : t('editor.addresses')
              }
              divided
            >
              <ProfileAddressFields
                control={form.control}
                fieldNames={{
                  country: 'organizationAddress.country',
                  primaryAddressLine: 'organizationAddress.primaryAddressLine',
                  secondaryAddressLine:
                    'organizationAddress.secondaryAddressLine',
                  tertiaryAddressLine:
                    'organizationAddress.tertiaryAddressLine',
                  city: 'organizationAddress.city',
                  state: 'organizationAddress.state',
                  postalCode: 'organizationAddress.postalCode',
                }}
                content={{
                  country: tString(
                    'onboarding-overview:fields.organizationAddress.country.label'
                  ),
                  primaryAddressLine: tString(
                    'onboarding-overview:fields.organizationAddress.primaryAddressLine.label'
                  ),
                  secondaryAddressLine: tString(
                    'onboarding-overview:fields.organizationAddress.secondaryAddressLine.label'
                  ),
                  tertiaryAddressLine: tString(
                    'onboarding-overview:fields.organizationAddress.tertiaryAddressLine.label'
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
                  placeholders: {
                    primaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.primaryAddressLine.placeholder'
                    ),
                    secondaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.secondaryAddressLine.placeholder'
                    ),
                    tertiaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.tertiaryAddressLine.placeholder'
                    ),
                  },
                  descriptions: {
                    country: tString(
                      'onboarding-overview:fields.organizationAddress.country.description'
                    ),
                    primaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.primaryAddressLine.description'
                    ),
                    secondaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.secondaryAddressLine.description'
                    ),
                    tertiaryAddressLine: tString(
                      'onboarding-overview:fields.organizationAddress.tertiaryAddressLine.description'
                    ),
                  },
                  restoreActions: {
                    country: getAddressRestoreAction('country'),
                    primaryAddressLine:
                      getAddressRestoreAction('primaryAddressLine'),
                    secondaryAddressLine: getAddressRestoreAction(
                      'secondaryAddressLine'
                    ),
                    tertiaryAddressLine: getAddressRestoreAction(
                      'tertiaryAddressLine'
                    ),
                    city: getAddressRestoreAction('city'),
                    state: getAddressRestoreAction('state'),
                    postalCode: getAddressRestoreAction('postalCode'),
                  },
                }}
                countryOptions={countryOptions}
                getSubdivisionOptions={getSubdivisionOptions}
                countryReadonly
              />
            </MaintenanceFormSection>
          </fieldset>
          <MaintenanceFormFooter
            sticky
            leading={
              <Button
                type="button"
                variant="outlineSurface"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t('editor.cancelEditing')}
              </Button>
            }
            trailing={
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || update.kind === 'unchanged'}
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
