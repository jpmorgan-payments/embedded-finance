import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  US_STATE_OPTIONS,
} from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { useGetFieldContentToken } from '@/core/OnboardingFlow/utils/formUtils';

import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

export const BusinessContactInfoForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const getOrgAddressContentToken = useGetFieldContentToken(
    'organizationAddress'
  );

  const form =
    useFormContext<
      z.input<ReturnType<typeof useBusinessContactInfoFormSchema>>
    >();

  useEffect(() => {
    if (form.watch('organizationPhone.phoneType') !== 'BUSINESS_PHONE') {
      form.setValue('organizationPhone.phoneType', 'BUSINESS_PHONE');
    }
  });

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
          {getOrgAddressContentToken('sectionTitle')}
        </legend>
        <p className="eb-mt-1.5 eb-text-sm">
          {getOrgAddressContentToken('sectionDescription')}
        </p>
        <div className="eb-mt-3 eb-space-y-3">
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.country"
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
            required
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.primaryAddressLine"
            type="text"
            required
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.secondaryAddressLine"
            type="text"
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.tertiaryAddressLine"
            type="text"
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.city"
            type="text"
            required
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.state"
            type="combobox"
            options={US_STATE_OPTIONS}
            required
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.postalCode"
            type="text"
            className="eb-max-w-48"
            required
          />
        </div>
      </fieldset>
    </div>
  );
};

BusinessContactInfoForm.schema = useBusinessContactInfoFormSchema;
