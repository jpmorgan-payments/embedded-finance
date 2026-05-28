import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

/**
 * Schema aligned with Confluence "Intermediary Owner Details" requirements:
 * - organizationName (pre-populated from hierarchy)
 * - ownershipPercentage (1–100, percentage of root client)
 * - countryOfFormation
 *
 * Note: Organization Type and Organization IDs are NOT mandated per API spec:
 * "The rest of the organization information should not be mandated"
 */
export const intermediaryOrgDetailsSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  ownershipPercentage: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be between 1 and 100')
    .max(100, 'Must be between 1 and 100'),
  countryOfFormation: z.string().min(1, 'Country of formation is required'),
});

export const IntermediaryOrgDetailsForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  const form =
    useFormContext<z.input<typeof intermediaryOrgDetailsSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
        label="Organization Name"
        description="Legal name of the intermediary entity"
        disabled
      />

      <OnboardingFormField
        control={form.control}
        name="ownershipPercentage"
        type="text"
        label="Ownership Percentage"
        description="Percentage of the root client owned by this intermediary (1–100)"
        inputProps={{ type: 'number', min: 1, max: 100 }}
      />

      <OnboardingFormField
        control={form.control}
        name="countryOfFormation"
        type="combobox"
        label="Country of Formation"
        description="Country where this entity was legally formed"
        options={COUNTRIES_OF_FORMATION.map((code) => ({
          value: code,
          searchValue: `[${code}] ${tString([`common:countries.${code}`] as unknown as TemplateStringsArray)}`,
          label: (
            <span>
              <span className="eb-font-medium">[{code}]</span>{' '}
              {t([`common:countries.${code}`] as unknown as TemplateStringsArray)}
            </span>
          ),
        }))}
      />
    </div>
  );
};

IntermediaryOrgDetailsForm.schema = intermediaryOrgDetailsSchema;
