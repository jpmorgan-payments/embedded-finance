import { FC } from 'react';
import { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { PersonalDetailsFormSchema } from './PersonalDetailsForm.schema';

type D = z.input<typeof PersonalDetailsFormSchema>;

export type SectionStepFormProps<T extends object> = {
  disabled?: boolean;
  control: Control<T>;
};

export const PersonalDetailsForm: FC<SectionStepFormProps<D>> = ({
  control,
  disabled,
}) => {
  const { t } = useTranslation('onboarding');

  return (
    <>
      <OnboardingFormField
        control={control}
        name="controllerFirstName"
        type="text"
        disabled={disabled}
      />
    </>
  );
};
