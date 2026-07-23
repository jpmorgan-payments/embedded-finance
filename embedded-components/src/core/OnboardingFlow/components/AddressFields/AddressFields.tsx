import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangleIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { OnboardingFormField } from '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField';
import {
  COUNTRIES_OF_FORMATION,
  getSubdivisionsForCountry,
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
  const control = form.control as any;
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
  const isInitialCountryRender = useRef(true);
  useEffect(() => {
    if (isInitialCountryRender.current) {
      isInitialCountryRender.current = false;
      return;
    }
    form.setValue(fieldName('state') as any, '');
    form.clearErrors([
      fieldName('city'),
      fieldName('state'),
      fieldName('postalCode'),
    ] as any);
  }, [addressCountry]);

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
      {getSubdivisionsForCountry(addressCountry) ? (
        <OnboardingFormField
          control={control}
          name={fieldName('state')}
          logicalName={logical('state')}
          type="combobox"
          options={getSubdivisionsForCountry(addressCountry)!}
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
    </fieldset>
  );
}
