import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  US_STATE_OPTIONS,
} from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import { BusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

export const BusinessContactInfoForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const form = useFormContext<z.input<typeof BusinessContactInfoFormSchema>>();

  return (
    <div className="eb-mt-6 eb-space-y-6">
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
      <fieldset>
        <legend className="eb-font-header eb-text-lg eb-font-medium">
          {t('fields.addresses.sectionTitle')}
        </legend>
        <p className="eb-mt-1.5 eb-text-sm">
          {t('fields.addresses.sectionDescription')}
        </p>
        <div className="eb-mt-3 eb-space-y-3">
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
            description={t(
              'fields.addresses.additionalAddressLines.line1Description'
            )}
          />
          <OnboardingFormField
            control={form.control}
            name="addresses.0.additionalAddressLines.1.value"
            type="text"
            description={t(
              'fields.addresses.additionalAddressLines.line2Description'
            )}
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
            options={US_STATE_OPTIONS}
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
