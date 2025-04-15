import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

import { SectionStepFormComponent } from '../../../types';
import { ContactDetailsFormSchema } from './ContactDetailsForm.schema';

export const ContactDetailsForm: SectionStepFormComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const form = useFormContext<z.input<typeof ContactDetailsFormSchema>>();

  return (
    <div className="eb-flex eb-flex-col eb-gap-y-9">
      <div className="eb-flex eb-flex-col eb-gap-y-6">
        <OnboardingFormField
          control={form.control}
          name="controllerEmail"
          type="email"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerPhone.phoneNumber"
          type="phone"
        />
      </div>
      <fieldset className="eb-flex eb-flex-col eb-gap-y-6">
        <legend className="eb-mb-6 eb-text-base eb-font-medium">
          Personal address
        </legend>
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.country"
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
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.primaryAddressLine"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.additionalAddressLines.0.value"
          type="text"
          description="Flat, Apt, Suite, Floor, Building, etc."
        />
      </fieldset>
    </div>
  );
};

ContactDetailsForm.schema = ContactDetailsFormSchema;
ContactDetailsForm.modifyFormValuesBeforeSubmit = (
  values: Partial<z.output<typeof ContactDetailsFormSchema>>
) => {
  return {
    ...values,
    controllerPhone: {
      ...values.controllerPhone,
      phoneType: 'MOBILE_PHONE',
    },
  };
};
