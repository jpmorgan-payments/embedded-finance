import { useTranslationWithTokens } from '@/i18n';
import {
  useFormContext,
  useWatch,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import {
  ProfileSelectField,
  type ProfileSelectOption,
} from '../forms/ProfileSelectField';
import { ProfileTextField } from '../forms/ProfileTextField';
import type { ProfileFieldRestoreAction } from '../forms/ProfileTextField';
import { useAddressCountryReset } from '../hooks/useAddressCountryReset';

export type ProfileAddressFieldContent = {
  country: string;
  primaryAddressLine: string;
  secondaryAddressLine: string;
  tertiaryAddressLine: string;
  city: string;
  state: string;
  postalCode: string;
  optionalLabel?: string;
  countryPlaceholder?: string;
  countrySearchPlaceholder?: string;
  noCountryResults?: string;
  statePlaceholder?: string;
  restoreActions?: Partial<
    Record<
      | 'country'
      | 'primaryAddressLine'
      | 'secondaryAddressLine'
      | 'tertiaryAddressLine'
      | 'city'
      | 'state'
      | 'postalCode',
      ProfileFieldRestoreAction
    >
  >;
  placeholders?: Partial<
    Record<
      | 'primaryAddressLine'
      | 'secondaryAddressLine'
      | 'tertiaryAddressLine'
      | 'city'
      | 'state'
      | 'postalCode',
      string
    >
  >;
  descriptions?: Partial<
    Record<
      | 'country'
      | 'primaryAddressLine'
      | 'secondaryAddressLine'
      | 'tertiaryAddressLine'
      | 'city'
      | 'state'
      | 'postalCode',
      string
    >
  >;
};

type ProfileAddressFieldsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  fieldNames: {
    country: FieldPathByValue<TFieldValues, string>;
    primaryAddressLine: FieldPathByValue<TFieldValues, string>;
    secondaryAddressLine: FieldPathByValue<TFieldValues, string>;
    tertiaryAddressLine: FieldPathByValue<TFieldValues, string>;
    city: FieldPathByValue<TFieldValues, string>;
    state: FieldPathByValue<TFieldValues, string>;
    postalCode: FieldPathByValue<TFieldValues, string>;
  };
  content: ProfileAddressFieldContent;
  countryDisabled?: boolean;
  countryReadonly?: boolean;
  countryOptions?: ProfileSelectOption[];
  getSubdivisionOptions?: (
    country?: string
  ) => ProfileSelectOption[] | undefined;
};

export function ProfileAddressFields<TFieldValues extends FieldValues>({
  control,
  fieldNames,
  content,
  countryDisabled = false,
  countryReadonly = false,
  countryOptions = [],
  getSubdivisionOptions = () => undefined,
}: ProfileAddressFieldsProps<TFieldValues>) {
  const { tString } = useTranslationWithTokens('onboarding-overview');
  const form = useFormContext<TFieldValues>();
  const country = useWatch({ control, name: fieldNames.country });
  const subdivisionOptions = getSubdivisionOptions(country);
  const localizedAddressLabel = (
    field: 'city' | 'state' | 'postalCode',
    fallback: string
  ) =>
    tString(
      [
        `addressFields.${field}.label.${country}`,
        `addressFields.${field}.label.default`,
      ] as unknown as TemplateStringsArray,
      { defaultValue: fallback }
    );
  const localizedAddressContent = (
    field: 'city' | 'state' | 'postalCode',
    contentType: 'placeholder' | 'description',
    fallback?: string
  ) =>
    tString(
      [
        `addressFields.${field}.${contentType}.${country}`,
        `addressFields.${field}.${contentType}.default`,
      ] as unknown as TemplateStringsArray,
      { defaultValue: fallback ?? '' }
    );

  useAddressCountryReset(country, () => {
    form.setValue(fieldNames.state, '' as never, { shouldDirty: true });
    form.clearErrors([
      fieldNames.city,
      fieldNames.state,
      fieldNames.postalCode,
    ]);
  });

  return (
    <div className="eb-space-y-4">
      <ProfileSelectField
        control={control}
        name={fieldNames.country}
        label={content.country}
        options={countryOptions}
        placeholder={content.countryPlaceholder ?? content.country}
        searchPlaceholder={
          content.countrySearchPlaceholder ?? content.countryPlaceholder
        }
        noResultsLabel={content.noCountryResults}
        searchable
        required
        disabled={countryDisabled}
        readonly={countryReadonly}
        className="eb-max-w-md"
        restoreAction={content.restoreActions?.country}
        description={content.descriptions?.country}
      />
      <ProfileTextField
        control={control}
        name={fieldNames.primaryAddressLine}
        label={content.primaryAddressLine}
        placeholder={content.placeholders?.primaryAddressLine}
        description={content.descriptions?.primaryAddressLine}
        required
        restoreAction={content.restoreActions?.primaryAddressLine}
      />
      <ProfileTextField
        control={control}
        name={fieldNames.secondaryAddressLine}
        label={content.secondaryAddressLine}
        placeholder={content.placeholders?.secondaryAddressLine}
        description={content.descriptions?.secondaryAddressLine}
        optionalLabel={content.optionalLabel}
        restoreAction={content.restoreActions?.secondaryAddressLine}
      />
      <ProfileTextField
        control={control}
        name={fieldNames.tertiaryAddressLine}
        label={content.tertiaryAddressLine}
        placeholder={content.placeholders?.tertiaryAddressLine}
        description={content.descriptions?.tertiaryAddressLine}
        optionalLabel={content.optionalLabel}
        restoreAction={content.restoreActions?.tertiaryAddressLine}
      />
      <div className="eb-grid eb-gap-4 @sm:eb-grid-cols-2">
        <ProfileTextField
          control={control}
          name={fieldNames.city}
          label={localizedAddressLabel('city', content.city)}
          placeholder={localizedAddressContent(
            'city',
            'placeholder',
            content.placeholders?.city
          )}
          description={localizedAddressContent(
            'city',
            'description',
            content.descriptions?.city
          )}
          required
          restoreAction={content.restoreActions?.city}
        />
        {subdivisionOptions ? (
          <ProfileSelectField
            control={control}
            name={fieldNames.state}
            label={localizedAddressLabel('state', content.state)}
            options={subdivisionOptions}
            placeholder={content.statePlaceholder ?? content.state}
            searchPlaceholder={localizedAddressContent(
              'state',
              'placeholder',
              content.placeholders?.state ?? content.statePlaceholder
            )}
            noResultsLabel={content.noCountryResults}
            searchable
            required
            restoreAction={content.restoreActions?.state}
            description={localizedAddressContent(
              'state',
              'description',
              content.descriptions?.state
            )}
          />
        ) : (
          <ProfileTextField
            control={control}
            name={fieldNames.state}
            label={localizedAddressLabel('state', content.state)}
            placeholder={localizedAddressContent(
              'state',
              'placeholder',
              content.placeholders?.state
            )}
            description={localizedAddressContent(
              'state',
              'description',
              content.descriptions?.state
            )}
            required
            restoreAction={content.restoreActions?.state}
          />
        )}
        <ProfileTextField
          control={control}
          name={fieldNames.postalCode}
          label={localizedAddressLabel('postalCode', content.postalCode)}
          placeholder={localizedAddressContent(
            'postalCode',
            'placeholder',
            content.placeholders?.postalCode
          )}
          description={localizedAddressContent(
            'postalCode',
            'description',
            content.descriptions?.postalCode
          )}
          required
          className="eb-max-w-48"
          restoreAction={content.restoreActions?.postalCode}
        />
      </div>
    </div>
  );
}
