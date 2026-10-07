import { useEffect } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangleIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { usesPlaceholderPostalCode } from '@/lib/addressCountryRules';
import { useAddressCountryReset } from '@/core/ClientProfile/hooks/useAddressCountryReset';
import { OnboardingFormField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField';
import {
  COUNTRIES_OF_FORMATION,
  getReferenceSubdivisionsForCountry,
} from '@/core/OnboardingFlow/consts';
import type { ScreenId } from '@/core/OnboardingFlow/types';
import { useGetFieldContentToken } from '@/core/OnboardingFlow/utils/formUtils';

/**
 * Shared address editor: country + address lines + city + state + postal code.
 * Rendered by BOTH the onboarding contact steps (ContactDetailsForm,
 * BusinessContactInfoForm) and the delta-mode review panel, so the composite
 * lives in ONE place instead of being duplicated (or rendered as a single
 * broken text input) per surface.
 *
 * - `addressName` is the base field: `'individualAddress'` | `'organizationAddress'`.
 * - `namePrefix` scopes the react-hook-form path: `''` for the controller / org
 *   step form, or `owners.{partyId}.` for a beneficial owner in delta. When
 *   prefixed the paths are not in `partyFieldMap`, so field-rule / content-token
 *   mapping is disabled and labels are supplied explicitly.
 * - `countryReadonly` locks the country (callers own the business rule).
 * - `mismatchCountry`, when set and different from the entered country, shows a
 *   non-blocking warning (used by the individual contact step).
 * - `contentScreenId` overrides the screen used to resolve the section-title
 *   content token. Delta mode renders owner addresses on the `overview` screen,
 *   but the "Owner's personal address" legend is gated on `owner-stepper` in the
 *   field config, so the delta panel passes it here for owner addresses.
 */
export function AddressFields({
  addressName,
  namePrefix = '',
  countryReadonly = false,
  mismatchCountry,
  contentScreenId,
}: {
  addressName: string;
  namePrefix?: string;
  countryReadonly?: boolean;
  mismatchCountry?: string;
  contentScreenId?: ScreenId;
}) {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');
  const form = useFormContext();
  const control = form.control;
  const { setValue, getValues, clearErrors } = form;
  const getAddressContentToken = useGetFieldContentToken(
    addressName as Parameters<typeof useGetFieldContentToken>[0],
    contentScreenId
  );

  const base = `${namePrefix}${addressName}`;
  const fieldName = (sub: string) => `${base}.${sub}`;
  // The field's config (rule + content tokens) is keyed by the logical field
  // name; the RHF path may be owner-prefixed. Passing `logicalName` lets each
  // field resolve its own tokens/rule naturally — no manual key construction.
  const logical = (sub: string) => `${addressName}.${sub}`;

  // Scoped subscription so a country change re-renders only this editor — not
  // the form host, which in delta mode would re-run pending-fields validation.
  const addressCountry = useWatch({
    control: form.control,
    name: fieldName('country') as never,
  }) as unknown as string | undefined;
  const currentState = useWatch({
    control: form.control,
    name: fieldName('state') as never,
  }) as unknown as string | undefined;
  const subdivisions = getReferenceSubdivisionsForCountry(addressCountry);
  const soleCountryCode =
    subdivisions?.length === 1 && subdivisions[0].value === addressCountry
      ? addressCountry
      : undefined;
  const hasUnlistedState =
    !!currentState &&
    !!subdivisions?.length &&
    !subdivisions.some(
      (option) => option.value.toUpperCase() === currentState.toUpperCase()
    );

  // City / state / postal-code labels are country-specific, so they come from
  // the shared `addressFields` tokens rather than each field's own label token.
  const addressLabel = (sub: string) =>
    t([
      `addressFields.${sub}.label.${addressCountry}`,
      `addressFields.${sub}.label.default`,
    ] as unknown as TemplateStringsArray);
  const addressPlaceholder = (sub: string) =>
    tString([
      `addressFields.${sub}.placeholder.${addressCountry}`,
      `addressFields.${sub}.placeholder.default`,
    ] as unknown as TemplateStringsArray);
  const addressDescription = (sub: string) =>
    t([
      `addressFields.${sub}.description.${addressCountry}`,
      `addressFields.${sub}.description.default`,
    ] as unknown as TemplateStringsArray) || undefined;

  // Reset state + clear address validation when the country changes.
  const stateFieldName = fieldName('state');
  const cityFieldName = fieldName('city');
  const postalCodeFieldName = fieldName('postalCode');
  useAddressCountryReset(addressCountry, () => {
    setValue(stateFieldName, '');
    if (getValues(postalCodeFieldName) === 'n/a') {
      setValue(postalCodeFieldName, '');
    }
    clearErrors([cityFieldName, stateFieldName, postalCodeFieldName]);
  });

  useEffect(() => {
    if (usesPlaceholderPostalCode(addressCountry)) {
      setValue(postalCodeFieldName, 'n/a');
    }
  }, [addressCountry, setValue, postalCodeFieldName]);

  useEffect(() => {
    if (soleCountryCode && currentState !== soleCountryCode) {
      setValue(stateFieldName, soleCountryCode);
    }
  }, [soleCountryCode, currentState, setValue, stateFieldName]);

  const hasCountryMismatch =
    !!mismatchCountry && !!addressCountry && addressCountry !== mismatchCountry;

  const sectionDescription =
    addressName === 'organizationAddress'
      ? getAddressContentToken('sectionDescription')
      : undefined;

  return (
    <fieldset className="eb-grid eb-gap-3">
      <legend className="eb-font-header eb-text-lg eb-font-medium">
        {getAddressContentToken('sectionTitle')}
      </legend>
      {sectionDescription && (
        <p className="-eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {sectionDescription}
        </p>
      )}
      <OnboardingFormField
        control={control}
        name={fieldName('country')}
        logicalName={logical('country')}
        type="combobox"
        options={COUNTRIES_OF_FORMATION.map((code) => ({
          value: code,
          searchValue:
            `[${code}] ` +
            tString([
              `common:countries.${code}`,
            ] as unknown as TemplateStringsArray),
          label: (
            <span>
              <span className="eb-font-medium">[{code}]</span>{' '}
              {t([
                `common:countries.${code}`,
              ] as unknown as TemplateStringsArray)}
            </span>
          ),
        }))}
        readonly={countryReadonly}
        required
      />
      {hasCountryMismatch && (
        <p className="-eb-mt-1 eb-flex eb-items-start eb-gap-1.5 eb-text-[0.8rem] eb-font-medium eb-text-warning">
          <AlertTriangleIcon className="eb-mt-0.5 eb-size-3.5 eb-shrink-0" />
          {t(
            'screens.personalSection.steps.contactDetails.countryMismatchWarning',
            { country: mismatchCountry }
          )}
        </p>
      )}
      <OnboardingFormField
        control={control}
        name={fieldName('primaryAddressLine')}
        logicalName={logical('primaryAddressLine')}
        type="text"
        required
      />
      <OnboardingFormField
        control={control}
        name={fieldName('secondaryAddressLine')}
        logicalName={logical('secondaryAddressLine')}
        type="text"
        required={false}
      />
      <OnboardingFormField
        control={control}
        name={fieldName('tertiaryAddressLine')}
        logicalName={logical('tertiaryAddressLine')}
        type="text"
        required={false}
      />
      <OnboardingFormField
        control={control}
        name={fieldName('city')}
        logicalName={logical('city')}
        type="text"
        label={addressLabel('city')}
        placeholder={addressPlaceholder('city')}
        required
      />
      {soleCountryCode ? null : subdivisions?.length && !hasUnlistedState ? (
        <OnboardingFormField
          control={control}
          name={fieldName('state')}
          logicalName={logical('state')}
          type="combobox"
          options={subdivisions}
          label={addressLabel('state')}
          placeholder={addressPlaceholder('state')}
          required
        />
      ) : (
        <OnboardingFormField
          control={control}
          name={fieldName('state')}
          logicalName={logical('state')}
          type="text"
          label={addressLabel('state')}
          placeholder={addressPlaceholder('state')}
          required
        />
      )}
      {!usesPlaceholderPostalCode(addressCountry) && (
        <OnboardingFormField
          control={control}
          name={fieldName('postalCode')}
          logicalName={logical('postalCode')}
          type="text"
          label={addressLabel('postalCode')}
          placeholder={addressPlaceholder('postalCode')}
          description={addressDescription('postalCode')}
          className="eb-max-w-48"
          required
        />
      )}
    </fieldset>
  );
}
