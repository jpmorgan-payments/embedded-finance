import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { ProfileAddressFields } from '@/core/ClientProfile/fields/ProfileAddressFields';
import {
  applyApiFieldErrors,
  hasUnmappedApiErrors,
  type ApiFieldPathMap,
} from '@/core/ClientProfile/forms/apiFieldErrors';
import { getProfileValidationMessage } from '@/core/ClientProfile/forms/getProfileValidationMessage';
import { ProfileSelectField } from '@/core/ClientProfile/forms/ProfileSelectField';
import { ProfileTextField } from '@/core/ClientProfile/forms/ProfileTextField';
import { createProfileAddressSchema } from '@/core/ClientProfile/schemas/createProfileAddressSchema';
import { getEinValidationIssue } from '@/core/ClientProfile/schemas/isValidEin';
import { NAME_PATTERN } from '@/core/OnboardingFlow/utils/validationPatterns';

import { useMaintenanceFormOptions } from '../hooks/useMaintenanceFormOptions';
import type { MaintenancePartyCreateRequest } from '../models/maintenanceApi.types';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenanceFormSection } from './MaintenanceFormSection';

type Values = {
  organizationName: string;
  organizationType: string;
  countryOfFormation: string;
  ein: string;
  legalAddress: {
    country: string;
    primaryAddressLine: string;
    secondaryAddressLine: string;
    tertiaryAddressLine: string;
    city: string;
    state: string;
    postalCode: string;
  };
};

const INTERMEDIARY_API_FIELD_PATHS: ApiFieldPathMap<Values> = {
  'organizationDetails.organizationName': 'organizationName',
  'organizationDetails.organizationType': 'organizationType',
  'organizationDetails.countryOfFormation': 'countryOfFormation',
  'organizationDetails.organizationIds.0.value': 'ein',
  'organizationDetails.addresses.0.country': 'legalAddress.country',
  'organizationDetails.addresses.0.addressLines.0':
    'legalAddress.primaryAddressLine',
  'organizationDetails.addresses.0.addressLines.1':
    'legalAddress.secondaryAddressLine',
  'organizationDetails.addresses.0.addressLines.2':
    'legalAddress.tertiaryAddressLine',
  'organizationDetails.addresses.0.city': 'legalAddress.city',
  'organizationDetails.addresses.0.state': 'legalAddress.state',
  'organizationDetails.addresses.0.postalCode': 'legalAddress.postalCode',
};

export function AddIntermediaryOwnerForm({
  parentPartyId,
  parentIsClient,
  isSubmitting,
  error,
  onDirtyChange,
  onCancel,
  onSave,
}: {
  parentPartyId: string;
  parentIsClient: boolean;
  isSubmitting: boolean;
  error?: unknown;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel: () => void;
  onSave: (request: MaintenancePartyCreateRequest) => Promise<void>;
}) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const [submitError, setSubmitError] = useState<unknown>();
  const { countryOptions, getSubdivisionOptions, organizationTypeOptions } =
    useMaintenanceFormOptions();
  const getValidationMessage = (
    field: string,
    messageKey: string,
    params?: Record<string, string>
  ) => getProfileValidationMessage(i18n, field, messageKey, params);
  const schema = z.object({
    organizationName: z
      .string()
      .min(1, getValidationMessage('organizationName', 'required'))
      .min(2, getValidationMessage('organizationName', 'minLength'))
      .max(100, getValidationMessage('organizationName', 'maxLength'))
      .refine(
        (value) => NAME_PATTERN.test(value),
        getValidationMessage('organizationName', 'pattern')
      ),
    organizationType: z
      .string()
      .min(1, getValidationMessage('organizationType', 'required')),
    countryOfFormation: z
      .string()
      .min(1, getValidationMessage('countryOfFormation', 'required'))
      .length(2, getValidationMessage('countryOfFormation', 'exactlyTwoChars')),
    ein: z.string().superRefine((value, context) => {
      const validationIssue = getEinValidationIssue(value);
      if (validationIssue) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: getValidationMessage('organizationIdEin', validationIssue),
        });
      }
    }),
    legalAddress: createProfileAddressSchema((field, messageKey, params) =>
      getValidationMessage(`organizationAddress.${field}`, messageKey, params)
    ),
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: '',
      organizationType: '',
      countryOfFormation: 'US',
      ein: '',
      legalAddress: {
        country: 'US',
        primaryAddressLine: '',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: '',
        state: '',
        postalCode: '',
      },
    },
  });
  const effectiveError = error ?? submitError;
  const countryOfFormation = form.watch('countryOfFormation');
  useEffect(() => {
    if (
      countryOfFormation &&
      form.getValues('legalAddress.country') !== countryOfFormation
    ) {
      form.setValue('legalAddress.country', countryOfFormation, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (countryOfFormation !== 'US' && form.getValues('ein')) {
      form.setValue('ein', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors('ein');
    }
  }, [countryOfFormation, form]);
  useEffect(() => {
    if (effectiveError) {
      applyApiFieldErrors(form, effectiveError, INTERMEDIARY_API_FIELD_PATHS);
    }
  }, [effectiveError, form]);
  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      await onSave({
        partyType: 'ORGANIZATION',
        parentPartyId,
        roles: ['INTERMEDIARY_OWNER'],
        organizationDetails: {
          organizationName: values.organizationName,
          organizationType: values.organizationType,
          countryOfFormation: values.countryOfFormation,
          natureOfOwnership: parentIsClient ? 'Direct' : 'Indirect',
          addresses: [
            {
              addressType: 'LEGAL_ADDRESS',
              addressLines: [
                values.legalAddress.primaryAddressLine,
                values.legalAddress.secondaryAddressLine,
                values.legalAddress.tertiaryAddressLine,
              ].filter(Boolean),
              city: values.legalAddress.city,
              state: values.legalAddress.state,
              postalCode: values.legalAddress.postalCode,
              country: values.legalAddress.country,
            },
          ],
          organizationIds: [
            {
              idType: 'EIN',
              value: values.ein.replace(/\s/g, ''),
              issuer: 'US',
            },
          ],
        },
      });
    } catch (submitError) {
      setSubmitError(submitError);
      window.setTimeout(() => {
        applyApiFieldErrors(form, submitError, INTERMEDIARY_API_FIELD_PATHS);
      }, 0);
    }
  });

  return (
    <div className="eb-px-4 eb-pt-4">
      {effectiveError &&
      hasUnmappedApiErrors(effectiveError, INTERMEDIARY_API_FIELD_PATHS) ? (
        <ServerErrorAlert error={effectiveError as never} />
      ) : null}
      <Form {...form}>
        <form onSubmit={submit} className="eb-space-y-6">
          <div className="eb-mx-auto eb-w-full eb-max-w-3xl">
            <MaintenanceFormSection
              title={t('ownership.businessIdentity')}
              description={t('ownership.businessIdentityDescription')}
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
                required
              />
              <ProfileSelectField
                control={form.control}
                name="organizationType"
                label={t('onboarding-overview:fields.organizationType.label')}
                description={t(
                  'onboarding-overview:fields.organizationType.description'
                )}
                options={organizationTypeOptions}
                placeholder={tString(
                  'onboarding-overview:fields.organizationType.placeholder'
                )}
                required
              />
              <ProfileSelectField
                control={form.control}
                name="countryOfFormation"
                label={t('onboarding-overview:fields.countryOfFormation.label')}
                options={countryOptions}
                placeholder={tString('form.selectCountry')}
                searchPlaceholder={tString('form.searchCountries')}
                noResultsLabel={tString('form.noResults')}
                searchable
                required
                description={t(
                  'onboarding-overview:fields.countryOfFormation.description'
                )}
              />
              {form.watch('countryOfFormation') === 'US' ? (
                <ProfileTextField
                  control={form.control}
                  name="ein"
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
              ) : (
                <p className="eb-rounded-md eb-border eb-border-warning/50 eb-bg-warning-accent eb-p-3 eb-text-sm">
                  {t('ownership.unsupportedOrganizationId')}
                </p>
              )}
            </MaintenanceFormSection>
            <MaintenanceFormSection
              title={t('ownership.legalAddress')}
              description={t('ownership.legalAddressDescription')}
              divided
            >
              <ProfileAddressFields
                control={form.control}
                fieldNames={{
                  country: 'legalAddress.country',
                  primaryAddressLine: 'legalAddress.primaryAddressLine',
                  secondaryAddressLine: 'legalAddress.secondaryAddressLine',
                  tertiaryAddressLine: 'legalAddress.tertiaryAddressLine',
                  city: 'legalAddress.city',
                  state: 'legalAddress.state',
                  postalCode: 'legalAddress.postalCode',
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
                }}
                countryOptions={countryOptions}
                getSubdivisionOptions={getSubdivisionOptions}
                countryReadonly
              />
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
              <Button
                type="submit"
                size="sm"
                disabled={
                  isSubmitting || form.watch('countryOfFormation') !== 'US'
                }
              >
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : null}
                {t('ownership.saveIntermediary')}
              </Button>
            }
          />
        </form>
      </Form>
    </div>
  );
}
