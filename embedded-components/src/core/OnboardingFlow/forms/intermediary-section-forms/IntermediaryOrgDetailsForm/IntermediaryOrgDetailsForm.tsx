import { useTranslationWithTokens } from '@/i18n';
import { tActive } from '@/i18n/activeI18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

const FIELDS_KEY =
  'onboarding-overview:screens.intermediarySteps.orgDetails.fields';

type IntermediaryOrgDetailsField =
  | 'organizationName'
  | 'organizationType'
  | 'organizationIdEin'
  | 'countryOfFormation';

// Lazy so the module-level schema follows the active provider's locale.
const requiredError = (field: IntermediaryOrgDetailsField) => ({
  error: () => tActive(`${FIELDS_KEY}.${field}.required`),
});

/**
 * Schema aligned with API spec for Intermediary Owner:
 * Required: organizationType, organizationName, organizationIds, countryOfFormation, addresses
 * See: https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/indirect-ownership
 */
export const intermediaryOrgDetailsSchema = z.object({
  organizationName: z.string().min(1, requiredError('organizationName')),
  organizationType: z.string().min(1, requiredError('organizationType')),
  organizationIdEin: z.string().min(1, requiredError('organizationIdEin')),
  countryOfFormation: z.string().min(1, requiredError('countryOfFormation')),
});

// Labels come from `onboarding-overview:organizationTypes`.
const ORG_TYPE_VALUES = [
  'C_CORPORATION',
  'S_CORPORATION',
  'LIMITED_LIABILITY_COMPANY',
  'LIMITED_PARTNERSHIP',
  'LIMITED_LIABILITY_PARTNERSHIP',
  'GENERAL_PARTNERSHIP',
  'PARTNERSHIP',
  'PUBLICLY_TRADED_COMPANY',
  'NON_PROFIT_CORPORATION',
  'GOVERNMENT_ENTITY',
  'UNINCORPORATED_ASSOCIATION',
] as const;

export const IntermediaryOrgDetailsForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  const form = useFormContext<z.input<typeof intermediaryOrgDetailsSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
        label={t(`${FIELDS_KEY}.organizationName.label`)}
        description={t(`${FIELDS_KEY}.organizationName.description`)}
        disabled
      />

      <OnboardingFormField
        control={form.control}
        name="organizationType"
        type="select"
        label={t(`${FIELDS_KEY}.organizationType.label`)}
        description={t(`${FIELDS_KEY}.organizationType.description`)}
        options={ORG_TYPE_VALUES.map((value) => ({
          value,
          label: t(`onboarding-overview:organizationTypes.${value}`),
        }))}
      />

      <OnboardingFormField
        control={form.control}
        name="organizationIdEin"
        type="text"
        label={t(`${FIELDS_KEY}.organizationIdEin.label`)}
        description={t(`${FIELDS_KEY}.organizationIdEin.description`)}
      />

      <OnboardingFormField
        control={form.control}
        name="countryOfFormation"
        type="combobox"
        label={t(`${FIELDS_KEY}.countryOfFormation.label`)}
        description={t(`${FIELDS_KEY}.countryOfFormation.description`)}
        options={COUNTRIES_OF_FORMATION.map((code) => ({
          value: code,
          searchValue:
            `[${code}] ` +
            tString([
              `common:countries.${code}`,
            ] as unknown as TemplateStringsArray),
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
    </div>
  );
};

IntermediaryOrgDetailsForm.schema = intermediaryOrgDetailsSchema;
