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

import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

export const ContactDetailsForm: FormStepComponent = () => {
  const { t } = useTranslation('onboarding-overview');
  const getIndividualAddressContentToken =
    useGetFieldContentToken('individualAddress');

  const form =
    useFormContext<z.input<ReturnType<typeof useContactDetailsFormSchema>>>();

  useEffect(() => {
    if (form.watch('controllerPhone.phoneType') !== 'MOBILE_PHONE') {
      form.setValue('controllerPhone.phoneType', 'MOBILE_PHONE');
    }
  }, [form.watch('controllerPhone.phoneType')]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
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
      <fieldset className="eb-grid eb-gap-3">
        <legend className="eb-mb-3 eb-font-header eb-text-lg eb-font-medium">
          {getIndividualAddressContentToken('sectionTitle')}
        </legend>
        <OnboardingFormField
          control={form.control}
          name="individualAddress.country"
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
          name="individualAddress.primaryAddressLine"
          type="text"
          required
        />
        <OnboardingFormField
          control={form.control}
          name="individualAddress.secondaryAddressLine"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="individualAddress.tertiaryAddressLine"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="individualAddress.city"
          type="text"
          required
        />
        <OnboardingFormField
          control={form.control}
          name="individualAddress.state"
          type="combobox"
          options={US_STATE_OPTIONS}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="individualAddress.postalCode"
          type="text"
          className="eb-max-w-48"
          required
        />
      </fieldset>
    </div>
  );
};

ContactDetailsForm.schema = useContactDetailsFormSchema;
