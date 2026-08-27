import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

/**
 * Schema aligned with API spec for Intermediary Owner:
 * Required: organizationType, organizationName, organizationIds, countryOfFormation, addresses
 * See: https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/indirect-ownership
 */
export const intermediaryOrgDetailsSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.string().min(1, 'Organization type is required'),
  organizationIdEin: z.string().min(1, 'EIN is required'),
  countryOfFormation: z.string().min(1, 'Country of formation is required'),
});

const ORG_TYPE_OPTIONS = [
  { value: 'C_CORPORATION', label: 'C Corporation' },
  { value: 'S_CORPORATION', label: 'S Corporation' },
  {
    value: 'LIMITED_LIABILITY_COMPANY',
    label: 'Limited Liability Company (LLC)',
  },
  { value: 'LIMITED_PARTNERSHIP', label: 'Limited Partnership' },
  {
    value: 'LIMITED_LIABILITY_PARTNERSHIP',
    label: 'Limited Liability Partnership',
  },
  { value: 'GENERAL_PARTNERSHIP', label: 'General Partnership' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PUBLICLY_TRADED_COMPANY', label: 'Publicly Traded Company' },
  { value: 'NON_PROFIT_CORPORATION', label: 'Non-Profit Corporation' },
  { value: 'GOVERNMENT_ENTITY', label: 'Government Entity' },
  { value: 'UNINCORPORATED_ASSOCIATION', label: 'Unincorporated Association' },
];

export const IntermediaryOrgDetailsForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  const form = useFormContext<z.input<typeof intermediaryOrgDetailsSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
        label="Legal Business Name"
        description="Enter this exactly as it appears on your business registration documents"
        disabled
      />

      <OnboardingFormField
        control={form.control}
        name="organizationType"
        type="select"
        label="Organization Type"
        description="The legal classification of the entity"
        options={ORG_TYPE_OPTIONS}
      />

      <OnboardingFormField
        control={form.control}
        name="organizationIdEin"
        type="text"
        label="EIN (Employer Identification Number)"
        description="Government-issued identification number"
        placeholder="XX-XXXXXXX"
      />

      <OnboardingFormField
        control={form.control}
        name="countryOfFormation"
        type="combobox"
        label="Country of Formation"
        description="Country where this entity was legally formed"
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
