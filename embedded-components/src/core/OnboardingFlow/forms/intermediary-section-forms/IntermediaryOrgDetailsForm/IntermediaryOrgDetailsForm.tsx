import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  ORGANIZATION_TYPE_LIST,
} from '@/core/OnboardingFlow/consts';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

export const intermediaryOrgDetailsSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.string().min(1, 'Organization type is required'),
  organizationIdEin: z.string().min(1, 'EIN is required'),
  countryOfFormation: z.string().min(1, 'Country of formation is required'),
});

export const IntermediaryOrgDetailsForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);
  const { clientData } = useOnboardingContext();

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
        name="organizationType"
        type="select"
        label="Organization Type"
        description="Legal classification of this entity"
        options={ORGANIZATION_TYPE_LIST.map((type) => ({
          value: type,
          label: tString(
            [`common:organizationTypes.${type}`] as unknown as TemplateStringsArray,
            { defaultValue: type.replace(/_/g, ' ') }
          ),
        }))}
      />

      <OnboardingFormField
        control={form.control}
        name="organizationIdEin"
        type="text"
        label="EIN (Employer Identification Number)"
        description="Federal tax identification number"
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
