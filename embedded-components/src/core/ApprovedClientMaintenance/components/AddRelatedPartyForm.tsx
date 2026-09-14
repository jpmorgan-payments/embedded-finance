import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  Button,
  Checkbox,
  Form,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
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
  MaintenanceParty,
  MaintenancePartyCreateRequest,
} from '../models/maintenanceApi.types';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenanceFormSection } from './MaintenanceFormSection';

type RelatedPartyRole = 'CONTROLLER' | 'BENEFICIAL_OWNER';

type AddRelatedPartyValues = {
  role: RelatedPartyRole;
  alsoBeneficialOwner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  nameSuffix: string;
  birthDate: string;
  countryOfResidence: string;
  jobTitle: string;
  jobTitleDescription: string;
  email: string;
  phone: {
    phoneType: string;
    countryCode: string;
    phoneNumber: string;
  };
  individualId: {
    idType: string;
    value: string;
  };
  residentialAddress: {
    country: string;
    primaryAddressLine: string;
    secondaryAddressLine: string;
    tertiaryAddressLine: string;
    city: string;
    state: string;
    postalCode: string;
  };
};

const createSchema = (
  getValidationMessage: (
    field: string,
    messageKey: string,
    params?: Record<string, string>
  ) => string,
  invalidIdMessage: string
) =>
  z
    .object({
      role: z.enum(['CONTROLLER', 'BENEFICIAL_OWNER']),
      alsoBeneficialOwner: z.boolean(),
      ...createIndividualLegalNameSchemaShape(
        {
          firstName: 'firstName',
          middleName: 'middleName',
          lastName: 'lastName',
        },
        (fieldName, messageKey) =>
          getValidationMessage(
            {
              firstName: 'controllerFirstName',
              middleName: 'controllerMiddleName',
              lastName: 'controllerLastName',
            }[fieldName] ?? fieldName,
            messageKey
          )
      ),
      birthDate: z.string(),
      nameSuffix: z
        .string()
        .max(5, getValidationMessage('controllerNameSuffix', 'maxLength'))
        .refine(
          (value) => value === '' || SUFFIX_PATTERN.test(value),
          getValidationMessage('controllerNameSuffix', 'pattern')
        ),
      countryOfResidence: z
        .string()
        .min(1, getValidationMessage('countryOfResidence', 'required'))
        .length(
          2,
          getValidationMessage('countryOfResidence', 'exactlyTwoChars')
        ),
      individualId: z.object({
        idType: z.string().min(1, invalidIdMessage),
        value: z.string().min(1, invalidIdMessage).max(20, invalidIdMessage),
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
      const hasPhone = Boolean(
        values.phone.countryCode || values.phone.phoneNumber
      );
      if (
        hasPhone &&
        (!values.phone.phoneType ||
          !isValidPhoneNumber(
            `${values.phone.countryCode}${values.phone.phoneNumber}`
          ))
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
    });

const ADD_PARTY_API_FIELD_PATHS: ApiFieldPathMap<AddRelatedPartyValues> = {
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

const emptyAddress = {
  country: 'US',
  primaryAddressLine: '',
  secondaryAddressLine: '',
  tertiaryAddressLine: '',
  city: '',
  state: '',
  postalCode: '',
};

type AddRelatedPartyFormProps = {
  parentPartyId: string;
  natureOfOwnership?: 'Direct' | 'Indirect';
  allowedRoles: RelatedPartyRole[];
  isControllerReplacement?: boolean;
  isOwnershipPathReplacement?: boolean;
  initialParty?: MaintenanceParty;
  isBeneficialOwnerOnly?: boolean;
  canAlsoBeBeneficialOwner?: boolean;
  isSubmitting: boolean;
  mutationError?: unknown;
  lockedCountry?: string;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel: () => void;
  onSave: (request: MaintenancePartyCreateRequest) => Promise<void>;
};

export function AddRelatedPartyForm({
  parentPartyId,
  natureOfOwnership = 'Direct',
  allowedRoles,
  isControllerReplacement = false,
  isOwnershipPathReplacement = false,
  initialParty,
  isBeneficialOwnerOnly = false,
  canAlsoBeBeneficialOwner = false,
  isSubmitting,
  mutationError,
  lockedCountry,
  onDirtyChange,
  onCancel,
  onSave,
}: AddRelatedPartyFormProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const [submitError, setSubmitError] = useState<unknown>();
  const getValidationMessage = (
    field: string,
    messageKey: string,
    params?: Record<string, string>
  ) => getProfileValidationMessage(i18n, field, messageKey, params);
  const schema = createSchema(
    getValidationMessage,
    tString('addParty.idInvalid')
  );
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
  const form = useForm<AddRelatedPartyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: allowedRoles[0] ?? 'BENEFICIAL_OWNER',
      alsoBeneficialOwner: false,
      firstName: initialParty?.individualDetails?.firstName ?? '',
      middleName: initialParty?.individualDetails?.middleName ?? '',
      lastName: initialParty?.individualDetails?.lastName ?? '',
      nameSuffix: initialParty?.individualDetails?.nameSuffix ?? '',
      birthDate: initialParty?.individualDetails?.birthDate ?? '',
      countryOfResidence:
        initialParty?.individualDetails?.countryOfResidence ?? 'US',
      individualId: {
        idType:
          initialParty?.individualDetails?.individualIds?.[0]?.idType ?? 'SSN',
        value: initialParty?.individualDetails?.individualIds?.[0]?.value ?? '',
      },
      jobTitle: initialParty?.individualDetails?.jobTitle ?? '',
      jobTitleDescription:
        initialParty?.individualDetails?.jobTitleDescription ?? '',
      email: initialParty?.email ?? '',
      phone: {
        phoneType:
          initialParty?.individualDetails?.phone?.phoneType ?? 'MOBILE_PHONE',
        countryCode: initialParty?.individualDetails?.phone?.countryCode ?? '',
        phoneNumber: initialParty?.individualDetails?.phone?.phoneNumber ?? '',
      },
      residentialAddress: initialParty?.individualDetails?.addresses?.[0]
        ? {
            country:
              initialParty.individualDetails.addresses[0].country ?? 'US',
            primaryAddressLine:
              initialParty.individualDetails.addresses[0].addressLines?.[0] ??
              '',
            secondaryAddressLine:
              initialParty.individualDetails.addresses[0].addressLines?.[1] ??
              '',
            tertiaryAddressLine:
              initialParty.individualDetails.addresses[0].addressLines?.[2] ??
              '',
            city: initialParty.individualDetails.addresses[0].city ?? '',
            state: initialParty.individualDetails.addresses[0].state ?? '',
            postalCode:
              initialParty.individualDetails.addresses[0].postalCode ?? '',
          }
        : emptyAddress,
    },
  });
  useEffect(() => {
    if (!lockedCountry) return;
    form.setValue('countryOfResidence', lockedCountry);
    form.setValue('residentialAddress.country', lockedCountry);
  }, [form, lockedCountry]);
  useEffect(() => {
    if (mutationError) {
      applyApiFieldErrors(form, mutationError, ADD_PARTY_API_FIELD_PATHS);
    }
  }, [form, mutationError]);
  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(undefined);
    const addressLines = [
      values.residentialAddress.primaryAddressLine,
      values.residentialAddress.secondaryAddressLine,
      values.residentialAddress.tertiaryAddressLine,
    ].filter(Boolean);
    try {
      await onSave({
        partyType: 'INDIVIDUAL',
        parentPartyId,
        email: values.email,
        roles:
          values.role === 'CONTROLLER' && values.alsoBeneficialOwner
            ? ['CONTROLLER', 'BENEFICIAL_OWNER']
            : [values.role],
        individualDetails: {
          firstName: values.firstName,
          middleName: values.middleName || undefined,
          lastName: values.lastName,
          nameSuffix: values.nameSuffix || undefined,
          birthDate: values.birthDate,
          countryOfResidence: values.countryOfResidence,
          natureOfOwnership,
          jobTitle: values.jobTitle,
          jobTitleDescription:
            values.jobTitle === 'Other'
              ? values.jobTitleDescription
              : undefined,
          phone: values.phone.phoneNumber
            ? {
                phoneType: values.phone.phoneType,
                countryCode: values.phone.countryCode,
                phoneNumber: values.phone.phoneNumber,
              }
            : undefined,
          addresses: [
            {
              addressType: 'RESIDENTIAL_ADDRESS',
              addressLines,
              city: values.residentialAddress.city,
              state: values.residentialAddress.state,
              postalCode: values.residentialAddress.postalCode,
              country: values.residentialAddress.country,
            },
          ],
          individualIds: [
            {
              idType: values.individualId.idType,
              value: values.individualId.value,
              issuer: values.countryOfResidence,
            },
          ],
        },
      });
    } catch (error) {
      applyApiFieldErrors(form, error, ADD_PARTY_API_FIELD_PATHS);
      setSubmitError(error);
    }
  });

  return (
    <div className="eb-px-4 eb-pt-4">
      {(mutationError || submitError) &&
      hasUnmappedApiErrors(
        mutationError ?? submitError,
        ADD_PARTY_API_FIELD_PATHS
      ) ? (
        <div className="eb-mb-4">
          <ServerErrorAlert error={(mutationError ?? submitError) as never} />
        </div>
      ) : null}
      <Form {...form}>
        <form onSubmit={submit} className="eb-space-y-6">
          <div className="eb-mx-auto eb-w-full eb-max-w-3xl">
            {isControllerReplacement || allowedRoles.length > 1 ? (
              <fieldset className="eb-space-y-3">
                <legend className="eb-font-header eb-text-base eb-font-semibold">
                  {t('addParty.role')}
                </legend>
                <p className="eb-text-sm eb-text-muted-foreground">
                  {t('addParty.roleDescription')}
                </p>
                {isControllerReplacement ? (
                  <div className="eb-rounded-md eb-border eb-bg-muted/20 eb-p-4">
                    <p className="eb-text-sm eb-font-medium">
                      {t(
                        `addParty.roles.${
                          isControllerReplacement
                            ? 'CONTROLLER'
                            : allowedRoles[0]
                        }`
                      )}
                    </p>
                    <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                      {t(
                        `addParty.roleDescriptions.${
                          isControllerReplacement
                            ? 'CONTROLLER'
                            : allowedRoles[0]
                        }`
                      )}
                    </p>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="eb-grid eb-gap-2 @[40rem]:eb-grid-cols-2"
                          >
                            {allowedRoles.map((role) => (
                              <label
                                key={role}
                                htmlFor={`related-party-role-${role}`}
                                className="eb-flex eb-cursor-pointer eb-items-start eb-gap-3 eb-rounded-md eb-border eb-bg-background eb-p-4 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/40"
                              >
                                <RadioGroupItem
                                  id={`related-party-role-${role}`}
                                  value={role}
                                  className="eb-mt-0.5"
                                />
                                <span>
                                  <span className="eb-block eb-text-sm eb-font-medium">
                                    {t(`addParty.roles.${role}`)}
                                  </span>
                                  <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                                    {t(`addParty.roleDescriptions.${role}`)}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {isControllerReplacement && canAlsoBeBeneficialOwner ? (
                  <FormField
                    control={form.control}
                    name="alsoBeneficialOwner"
                    render={({ field }) => (
                      <FormItem>
                        <label
                          htmlFor="replacement-also-beneficial-owner"
                          className="eb-flex eb-cursor-pointer eb-items-start eb-gap-3 eb-rounded-md eb-border eb-p-4"
                        >
                          <FormControl>
                            <Checkbox
                              id="replacement-also-beneficial-owner"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <span>
                            <span className="eb-block eb-text-sm eb-font-medium">
                              {t('addParty.alsoBeneficialOwner')}
                            </span>
                            <span className="eb-mt-1 eb-block eb-text-xs eb-text-muted-foreground">
                              {t('addParty.alsoBeneficialOwnerDescription')}
                            </span>
                          </span>
                        </label>
                      </FormItem>
                    )}
                  />
                ) : null}
              </fieldset>
            ) : null}
            <MaintenanceFormSection
              title={t('individualDetails.identityGroup')}
              description={t('addParty.identityDescription')}
              divided
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
              />
              <ProfileSelectField
                control={form.control}
                name="countryOfResidence"
                label={t('onboarding-overview:fields.countryOfResidence.label')}
                options={countryOptions}
                placeholder={tString('form.selectCountry')}
                searchPlaceholder={tString('form.searchCountries')}
                noResultsLabel={tString('form.noResults')}
                searchable
                required
                readonly={Boolean(lockedCountry)}
                description={t(
                  'onboarding-overview:fields.countryOfResidence.description.owner'
                )}
              />
              <ProfileIdentityFields
                control={form.control}
                countryName="countryOfResidence"
                idTypeName="individualId.idType"
                idValueName="individualId.value"
                content={identityContent}
              />
            </MaintenanceFormSection>
            <MaintenanceFormSection
              title={t('individualDetails.responsibilityGroup')}
              description={t('editor.responsibilityDescription')}
              divided
            >
              <ProfileSelectField
                control={form.control}
                name="jobTitle"
                label={t('onboarding-overview:fields.controllerJobTitle.label')}
                options={jobTitleOptions}
                placeholder={tString(
                  'onboarding-overview:fields.controllerJobTitle.placeholder'
                )}
                description={t(
                  'onboarding-overview:fields.controllerJobTitle.description.owner'
                )}
                required
              />
              {form.watch('jobTitle') === 'Other' ? (
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
                    'onboarding-overview:fields.controllerJobTitleDescription.description.owner'
                  )}
                  required
                />
              ) : null}
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
                      country: tString(
                        'onboarding-overview:fields.individualAddress.country.description'
                      ),
                      primaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.primaryAddressLine.description'
                      ),
                      secondaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.secondaryAddressLine.description'
                      ),
                      tertiaryAddressLine: tString(
                        'onboarding-overview:fields.individualAddress.tertiaryAddressLine.description'
                      ),
                    },
                  }}
                  countryOptions={countryOptions}
                  getSubdivisionOptions={getSubdivisionOptions}
                  countryReadonly={Boolean(lockedCountry)}
                />
              </div>
            </MaintenanceFormSection>
          </div>
          <MaintenanceFormFooter
            sticky
            leading={
              <Button
                type="button"
                variant="outlineSurface"
                size="sm"
                onClick={onCancel}
              >
                <ArrowLeftIcon />
                {t('form.back')}
              </Button>
            }
            trailing={
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : null}
                {t(
                  isControllerReplacement
                    ? 'addParty.saveReplacement'
                    : isOwnershipPathReplacement
                      ? 'addParty.saveOwnershipPath'
                      : isBeneficialOwnerOnly
                        ? 'addParty.saveBeneficialOwner'
                        : 'addParty.save'
                )}
              </Button>
            }
          />
        </form>
      </Form>
    </div>
  );
}
