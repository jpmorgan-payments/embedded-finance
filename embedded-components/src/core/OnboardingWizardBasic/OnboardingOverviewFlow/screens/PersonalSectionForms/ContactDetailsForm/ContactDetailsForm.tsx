import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';
import { stateOptions } from '@/core/OnboardingWizardBasic/utils/stateOptions';

import { FormStepComponent } from '../../../flow.types';
import { ContactDetailsFormSchema } from './ContactDetailsForm.schema';

export const ContactDetailsForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const form = useFormContext<z.input<typeof ContactDetailsFormSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-8">
      <div className="eb-space-y-4">
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
      <fieldset className="eb-grid eb-gap-4">
        <legend className="eb-mb-4 eb-text-base eb-font-medium">
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
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.postalCode"
          type="text"
          className="eb-max-w-48"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.city"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerAddresses.0.state"
          type="select"
          options={stateOptions}
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
