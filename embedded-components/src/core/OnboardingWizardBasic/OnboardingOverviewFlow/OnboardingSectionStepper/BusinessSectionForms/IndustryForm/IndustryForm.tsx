import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { SectionStepFormComponent } from '../../../types';
import { IndustryFormSchema } from './IndustryForm.schema';

export const IndustryForm: SectionStepFormComponent = () => {
  // const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof IndustryFormSchema>>();

  return (
    <div className="eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="industry"
        type="industrySelect"
      />
    </div>
  );
};

IndustryForm.schema = IndustryFormSchema;
