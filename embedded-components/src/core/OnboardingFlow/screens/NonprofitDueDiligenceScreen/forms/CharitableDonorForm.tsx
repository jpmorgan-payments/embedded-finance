import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  getSubdivisionsForCountry,
} from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import { useCharitableDonorFormSchema } from './CharitableDonorForm.schema';

export const CharitableDonorForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  const form =
    useFormContext<z.input<ReturnType<typeof useCharitableDonorFormSchema>>>();

  const orgAddressCountry = form.watch('organizationAddress.country');

  const isInitialCountryRender = useRef(true);

  useEffect(() => {
    if (isInitialCountryRender.current) {
      isInitialCountryRender.current = false;
      return;
    }
    form.setValue('organizationAddress.state', '');
    form.clearErrors([
      'organizationAddress.city',
      'organizationAddress.state',
      'organizationAddress.postalCode',
    ]);
  }, [orgAddressCountry]);

  const subdivisions = getSubdivisionsForCountry(orgAddressCountry);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
        label="Organization name"
        required
      />
      <OnboardingFormField
        control={form.control}
        name="countryOfFormation"
        type="combobox"
        label="Country of formation"
        options={COUNTRIES_OF_FORMATION.map((code) => ({
          value: code,
          searchValue: `[${code}] ${tString([`common:countries.${code}`] as unknown as TemplateStringsArray)}`,
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
      <fieldset>
        <legend className="eb-font-header eb-text-lg eb-font-medium">
          Address
        </legend>
        <div className="eb-mt-3 eb-space-y-3">
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.country"
            type="combobox"
            label="Country"
            options={COUNTRIES_OF_FORMATION.map((code) => ({
              value: code,
              searchValue: `[${code}] ${tString([`common:countries.${code}`] as unknown as TemplateStringsArray)}`,
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
            label="Address line 1"
            required
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.secondaryAddressLine"
            type="text"
            label="Address line 2"
          />
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.city"
            type="text"
            label="City"
            required
          />
          {subdivisions ? (
            <OnboardingFormField
              control={form.control}
              name="organizationAddress.state"
              type="combobox"
              label="State / Province"
              options={subdivisions.map((sub) => ({
                value: sub.value,
                label: <span>{sub.label}</span>,
              }))}
              required
            />
          ) : (
            <OnboardingFormField
              control={form.control}
              name="organizationAddress.state"
              type="text"
              label="State / Province"
              required
            />
          )}
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.postalCode"
            type="text"
            label="Postal code"
            required
          />
        </div>
      </fieldset>
    </div>
  );
};

CharitableDonorForm.schema = useCharitableDonorFormSchema;
