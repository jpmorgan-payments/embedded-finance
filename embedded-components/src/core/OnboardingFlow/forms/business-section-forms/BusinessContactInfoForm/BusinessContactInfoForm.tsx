import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  getSubdivisionsForCountry,
} from '@/core/OnboardingFlow/consts';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';
import { useGetFieldContentToken } from '@/core/OnboardingFlow/utils/formUtils';

import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

export const BusinessContactInfoForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');
  const getOrgAddressContentToken = useGetFieldContentToken(
    'organizationAddress'
  );

  const { clientData } = useOnboardingContext();
  const countryOfFormation =
    getOrganizationParty(clientData)?.organizationDetails?.countryOfFormation;

  const form =
    useFormContext<
      z.input<ReturnType<typeof useBusinessContactInfoFormSchema>>
    >();

  const orgAddressCountry = form.watch('organizationAddress.country');

  const orgAddressLabel = (field: string) =>
    t([
      `addressFields.${field}.label.${orgAddressCountry}`,
      `addressFields.${field}.label.default`,
    ] as unknown as TemplateStringsArray);

  const orgAddressPlaceholder = (field: string) =>
    tString([
      `addressFields.${field}.placeholder.${orgAddressCountry}`,
      `addressFields.${field}.placeholder.default`,
    ] as unknown as TemplateStringsArray);

  const orgAddressDescription = (field: string) =>
    t([
      `addressFields.${field}.description.${orgAddressCountry}`,
      `addressFields.${field}.description.default`,
    ] as unknown as TemplateStringsArray) || undefined;

  const isInitialCountryRender = useRef(true);

  useEffect(() => {
    if (isInitialCountryRender.current) {
      isInitialCountryRender.current = false;
      return;
    }
    // Clear state and all address validation when country changes
    form.setValue('organizationAddress.state', '');
    form.clearErrors([
      'organizationAddress.city',
      'organizationAddress.state',
      'organizationAddress.postalCode',
    ]);
  }, [orgAddressCountry]);

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
            readonly={!!countryOfFormation}
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
            label={orgAddressLabel('city')}
            placeholder={orgAddressPlaceholder('city')}
            required
          />
          {getSubdivisionsForCountry(orgAddressCountry) ? (
            <OnboardingFormField
              control={form.control}
              name="organizationAddress.state"
              type="combobox"
              options={getSubdivisionsForCountry(orgAddressCountry)!}
              label={orgAddressLabel('state')}
              placeholder={orgAddressPlaceholder('state')}
              required
            />
          ) : (
            <OnboardingFormField
              control={form.control}
              name="organizationAddress.state"
              type="text"
              label={orgAddressLabel('state')}
              placeholder={orgAddressPlaceholder('state')}
              required
            />
          )}
          <OnboardingFormField
            control={form.control}
            name="organizationAddress.postalCode"
            type="text"
            label={orgAddressLabel('postalCode')}
            placeholder={orgAddressPlaceholder('postalCode')}
            description={orgAddressDescription('postalCode')}
            className="eb-max-w-48"
            required
          />
        </div>
      </fieldset>
    </div>
  );
};

BusinessContactInfoForm.schema = useBusinessContactInfoFormSchema;
