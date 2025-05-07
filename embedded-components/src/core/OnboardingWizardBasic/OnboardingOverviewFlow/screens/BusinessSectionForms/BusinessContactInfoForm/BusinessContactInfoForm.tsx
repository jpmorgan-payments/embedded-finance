import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';
import { stateOptions } from '@/core/OnboardingWizardBasic/utils/stateOptions';

import { FormStepComponent } from '../../../flow.types';
import { BusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

export const BusinessContactInfoForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const form = useFormContext<z.input<typeof BusinessContactInfoFormSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-8">
      <div className="eb-space-y-4">
        <OnboardingFormField
          control={form.control}
          name="organizationEmail"
          type="email"
        />
        <OnboardingFormField
          control={form.control}
          name="organizationPhone.phoneNumber"
          type="phone"
        />
      </div>
      <fieldset>
        <legend className="eb-text-base eb-font-medium">
          Registered address
        </legend>
        <p className="eb-mt-1 eb-text-sm">
          Please provide the address registered to your company with your local
          authority
        </p>
        <div className="eb-mt-4 eb-space-y-4">
          <OnboardingFormField
            control={form.control}
            name="addresses.0.country"
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
            name="addresses.0.primaryAddressLine"
            type="text"
          />
          <OnboardingFormField
            control={form.control}
            name="addresses.0.additionalAddressLines.0.value"
            type="text"
            description="Flat, Apt, Suite, Floor, Building, etc."
          />
          <OnboardingFormField
            control={form.control}
            name="addresses.0.postalCode"
            type="text"
            className="eb-max-w-48"
          />
          <OnboardingFormField
            control={form.control}
            name="addresses.0.city"
            type="text"
          />
          <OnboardingFormField
            control={form.control}
            name="addresses.0.state"
            type="select"
            options={stateOptions}
          />
        </div>
      </fieldset>
    </div>
  );
};

BusinessContactInfoForm.schema = BusinessContactInfoFormSchema;
BusinessContactInfoForm.modifyFormValuesBeforeSubmit = (
  values: Partial<z.output<typeof BusinessContactInfoFormSchema>>
) => {
  return {
    ...values,
    organizationPhone: {
      ...values.organizationPhone,
      phoneType: 'BUSINESS_PHONE',
    },
  };
};
