import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

import { SectionStepFormComponent } from '../../../types';
import { IndividualIdentityFormSchema } from './IndividualIdentityForm.schema';

export const IndividualIdentityForm: SectionStepFormComponent = () => {
  const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof IndividualIdentityFormSchema>>();

  return (
    <div className="eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="birthDate"
        type="importantDate"
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
    </div>
  );
};

IndividualIdentityForm.schema = IndividualIdentityFormSchema;
