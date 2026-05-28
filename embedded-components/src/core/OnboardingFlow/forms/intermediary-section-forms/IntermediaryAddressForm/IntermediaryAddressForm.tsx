import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

export const intermediaryAddressSchema = z.object({
  organizationAddressLine1: z
    .string()
    .min(1, 'Address line 1 is required'),
  organizationAddressLine2: z.string().optional(),
  organizationCity: z.string().min(1, 'City is required'),
  organizationState: z.string().min(1, 'State/Province is required'),
  organizationPostalCode: z.string().min(1, 'Postal code is required'),
  organizationCountry: z.string().min(1, 'Country is required'),
});

export const IntermediaryAddressForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);

  const form =
    useFormContext<z.input<typeof intermediaryAddressSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationAddressLine1"
        type="text"
        label="Address Line 1"
        description="Street address of the entity's legal business address"
      />

      <OnboardingFormField
        control={form.control}
        name="organizationAddressLine2"
        type="text"
        label="Address Line 2"
        description="Suite, floor, or unit number (optional)"
      />

      <div className="eb-grid eb-grid-cols-2 eb-gap-4">
        <OnboardingFormField
          control={form.control}
          name="organizationCity"
          type="text"
          label="City"
        />

        <OnboardingFormField
          control={form.control}
          name="organizationState"
          type="text"
          label="State / Province"
        />
      </div>

      <div className="eb-grid eb-grid-cols-2 eb-gap-4">
        <OnboardingFormField
          control={form.control}
          name="organizationPostalCode"
          type="text"
          label="Postal Code"
        />

        <OnboardingFormField
          control={form.control}
          name="organizationCountry"
          type="combobox"
          label="Country"
          options={COUNTRIES_OF_FORMATION.map((code) => ({
            value: code,
            searchValue: `[${code}] ${tString([`common:countries.${code}`] as unknown as TemplateStringsArray)}`,
            label: (
              <span>
                <span className="eb-font-medium">[{code}]</span>{' '}
                {t(
                  [`common:countries.${code}`] as unknown as TemplateStringsArray
                )}
              </span>
            ),
          }))}
        />
      </div>
    </div>
  );
};

IntermediaryAddressForm.schema = intermediaryAddressSchema;
