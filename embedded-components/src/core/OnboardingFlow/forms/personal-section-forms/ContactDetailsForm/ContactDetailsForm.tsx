import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangleIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  getSubdivisionsForCountry,
} from '@/core/OnboardingFlow/consts';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import {
  getControllerParty,
  getOrganizationParty,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { useGetFieldContentToken } from '@/core/OnboardingFlow/utils/formUtils';

import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

export const ContactDetailsForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');
  const getIndividualAddressContentToken =
    useGetFieldContentToken('individualAddress');

  const { clientData } = useOnboardingContext();
  const orgParty = getOrganizationParty(clientData);
  const isSoleProp =
    orgParty?.organizationDetails?.organizationType === 'SOLE_PROPRIETORSHIP';
  const countryOfFormation = orgParty?.organizationDetails?.countryOfFormation;
  const countryOfResidence =
    getControllerParty(clientData)?.individualDetails?.countryOfResidence;

  const form =
    useFormContext<z.input<ReturnType<typeof useContactDetailsFormSchema>>>();

  const addressCountry = form.watch('individualAddress.country');
  const isInitialCountryRender = useRef(true);

  // Detect mismatch between countryOfResidence and address country.
  // For sole props the address country is normally locked to
  // countryOfFormation, but API data may diverge. Show a non-blocking
  // warning so the user can still submit.
  const hasCountryMismatch =
    !!countryOfResidence &&
    !!addressCountry &&
    addressCountry !== countryOfResidence;

  const addressLabel = (field: string) =>
    t([
      `addressFields.${field}.label.${addressCountry}`,
      `addressFields.${field}.label.default`,
    ] as unknown as TemplateStringsArray);

  const addressPlaceholder = (field: string) =>
    tString([
      `addressFields.${field}.placeholder.${addressCountry}`,
      `addressFields.${field}.placeholder.default`,
    ] as unknown as TemplateStringsArray);

  const addressDescription = (field: string) =>
    t([
      `addressFields.${field}.description.${addressCountry}`,
      `addressFields.${field}.description.default`,
    ] as unknown as TemplateStringsArray) || undefined;

  useEffect(() => {
    if (isInitialCountryRender.current) {
      isInitialCountryRender.current = false;
      return;
    }
    // Clear state and all address validation when country changes
    form.setValue('individualAddress.state', '');
    form.clearErrors([
      'individualAddress.city',
      'individualAddress.state',
      'individualAddress.postalCode',
    ]);
  }, [addressCountry]);

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
          readonly={isSoleProp && !!countryOfFormation && !hasCountryMismatch}
          required
        />
        {hasCountryMismatch && (
          <p className="-eb-mt-1 eb-flex eb-items-start eb-gap-1.5 eb-text-[0.8rem] eb-font-medium eb-text-warning">
            <AlertTriangleIcon className="eb-mt-0.5 eb-size-3.5 eb-shrink-0" />
            {t(
              'screens.personalSection.steps.contactDetails.countryMismatchWarning',
              { country: countryOfResidence }
            )}
          </p>
        )}
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
          label={addressLabel('city')}
          placeholder={addressPlaceholder('city')}
          required
        />
        {getSubdivisionsForCountry(addressCountry) ? (
          <OnboardingFormField
            control={form.control}
            name="individualAddress.state"
            type="combobox"
            options={getSubdivisionsForCountry(addressCountry)!}
            label={addressLabel('state')}
            placeholder={addressPlaceholder('state')}
            required
          />
        ) : (
          <OnboardingFormField
            control={form.control}
            name="individualAddress.state"
            type="text"
            label={addressLabel('state')}
            placeholder={addressPlaceholder('state')}
            required
          />
        )}
        <OnboardingFormField
          control={form.control}
          name="individualAddress.postalCode"
          type="text"
          label={addressLabel('postalCode')}
          placeholder={addressPlaceholder('postalCode')}
          description={addressDescription('postalCode')}
          className="eb-max-w-48"
          required
        />
      </fieldset>
    </div>
  );
};

ContactDetailsForm.schema = useContactDetailsFormSchema;
