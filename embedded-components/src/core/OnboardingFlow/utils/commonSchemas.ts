import { i18n } from '@/i18n/config';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import { PhoneSmbdoPhoneType } from '@/api/generated/smbdo.schemas';
import { getSubdivisionsForCountry } from '@/core/OnboardingFlow/consts';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

/**
 * Creates phone schemas with customized validation messages
 */
export const usePhoneSchemas = (
  type: 'controllerPhone' | 'organizationPhone'
) => {
  const v = useGetValidationMessage();

  const PhoneTypeSchema: z.ZodType<PhoneSmbdoPhoneType> = z.enum([
    'BUSINESS_PHONE',
    'MOBILE_PHONE',
    'ALTERNATE_PHONE',
  ]);

  const PhoneNumberSchema = z
    .string()
    .min(1, v(`${type}.phoneNumber`, 'required'))
    .refine(isValidPhoneNumber, {
      message: v(`${type}.phoneNumber`, 'format'),
    });

  const PhoneSchema = z.object({
    phoneType: PhoneTypeSchema,
    phoneNumber: PhoneNumberSchema,
  });

  return {
    PhoneTypeSchema,
    PhoneNumberSchema,
    PhoneSchema,
  };
};

// For backward compatibility and direct use in non-hook contexts
const PhoneTypeSchema: z.ZodType<PhoneSmbdoPhoneType> = z.enum([
  'BUSINESS_PHONE',
  'MOBILE_PHONE',
  'ALTERNATE_PHONE',
]);

const PhoneNumberSchema = z.string().refine(isValidPhoneNumber, {
  message: 'Invalid phone number',
});

export const PhoneSchema = z.object({
  phoneType: PhoneTypeSchema,
  phoneNumber: PhoneNumberSchema,
});

/**
 * Country-specific postal code format definitions.
 * Maps country codes to their regex pattern and the i18n validation message key.
 * Countries that share the same digit-length format reuse a common message key.
 */
const POSTAL_CODE_FORMATS: Record<
  string,
  { regex: RegExp; messageKey: string }
> = {
  // Unique formats
  US: { regex: /^\d{5}(-\d{4})?$/, messageKey: 'invalidUS' },
  CA: {
    regex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    messageKey: 'invalidCA',
  },
  GB: {
    regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/i,
    messageKey: 'invalidGB',
  },
  BR: { regex: /^\d{5}-?\d{3}$/, messageKey: 'invalidBR' },
  JP: { regex: /^\d{3}-?\d{4}$/, messageKey: 'invalidJP' },
  PL: { regex: /^\d{2}-?\d{3}$/, messageKey: 'invalidPL' },
  // 4-digit countries
  AU: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  NZ: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  ZA: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  CH: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  AT: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  AR: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  DK: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  HU: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  NO: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  // 5-digit countries
  DE: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  FR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  IT: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  ES: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  MX: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  KR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  FI: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  PE: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  SA: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  TR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  // 5-digit with optional space (e.g., "123 45")
  CZ: { regex: /^\d{3}\s?\d{2}$/, messageKey: 'invalidFiveDigit' },
  SE: { regex: /^\d{3}\s?\d{2}$/, messageKey: 'invalidFiveDigit' },
  // 6-digit countries
  IN: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  CN: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  CO: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  RU: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  SG: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  // 7-digit countries
  CL: { regex: /^\d{7}$/, messageKey: 'invalidSevenDigit' },
  IL: { regex: /^\d{7}$/, messageKey: 'invalidSevenDigit' },
  // Unique formats
  IE: {
    regex: /^[A-Za-z]\d[\dWw]\s?[A-Za-z\d]{4}$/,
    messageKey: 'invalidIE',
  },
  NL: { regex: /^\d{4}\s?[A-Za-z]{2}$/, messageKey: 'invalidNL' },
  PT: { regex: /^\d{4}-?\d{3}$/, messageKey: 'invalidPT' },
};

/**
 * Creates address schemas with customized validation messages
 */
export const useAddressSchemas = (
  type: 'individualAddress' | 'organizationAddress'
) => {
  const v = useGetValidationMessage();

  const PrimaryAddressLineSchema = z
    .string()
    .min(1, v(`${type}.primaryAddressLine`, 'required'))
    .max(60, v(`${type}.primaryAddressLine`, 'maxLength'));

  const SecondaryAddressLineSchema = z
    .string()
    .max(60, v(`${type}.secondaryAddressLine`, 'maxLength'));

  const TertiaryAddressLineSchema = z
    .string()
    .max(60, v(`${type}.tertiaryAddressLine`, 'maxLength'));

  const AddressTypeSchema = z.enum([
    'LEGAL_ADDRESS',
    'MAILING_ADDRESS',
    'BUSINESS_ADDRESS',
    'RESIDENTIAL_ADDRESS',
  ]);

  // City, state, postalCode use base schemas without required validation
  // Required validation is handled in superRefine with country-specific messages
  const CitySchema = z.string().max(34, v(`${type}.city`, 'maxLength'));

  const StateSchema = z.string();

  const PostalCodeSchema = z
    .string()
    .max(10, v(`${type}.postalCode`, 'maxLength'));

  const CountrySchema = z
    .string()
    .min(1, v(`${type}.country`, 'required'))
    .length(2, v(`${type}.country`, 'exactlyTwoChars'));

  const AddressSchema = z
    .object({
      addressType: AddressTypeSchema,
      primaryAddressLine: PrimaryAddressLineSchema,
      secondaryAddressLine: SecondaryAddressLineSchema,
      tertiaryAddressLine: TertiaryAddressLineSchema,
      city: CitySchema,
      state: StateSchema,
      postalCode: PostalCodeSchema,
      country: CountrySchema,
    })
    .superRefine((data, ctx) => {
      // Required validation with country-specific messages
      if (!data.city) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v(`${type}.city`, 'required', { country: data.country }),
          path: ['city'],
        });
      }
      if (!data.state) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v(`${type}.state`, 'required', { country: data.country }),
          path: ['state'],
        });
      }
      if (!data.postalCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v(`${type}.postalCode`, 'required', {
            country: data.country,
          }),
          path: ['postalCode'],
        });
      }

      // Validate state against known subdivisions for the selected country
      const subdivisions = getSubdivisionsForCountry(data.country);
      if (subdivisions && data.state) {
        const validCodes = subdivisions.map((s) => s.value);
        if (!validCodes.includes(data.state)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v(`${type}.state`, 'invalid', {
              country: data.country,
            }),
            path: ['state'],
          });
        }
      }

      // Apply country-specific postal code format validation
      const postalCodeFormat = POSTAL_CODE_FORMATS[data.country];
      if (
        postalCodeFormat &&
        data.postalCode &&
        !postalCodeFormat.regex.test(data.postalCode)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v(
            `${type}.postalCode`,
            postalCodeFormat.messageKey as 'invalid',
            { country: data.country }
          ),
          path: ['postalCode'],
        });
      }
    });

  return {
    PrimaryAddressLineSchema,
    SecondaryAddressLineSchema,
    TertiaryAddressLineSchema,
    AddressTypeSchema,
    CitySchema,
    StateSchema,
    PostalCodeSchema,
    CountrySchema,
    AddressSchema,
  };
};

// For backward compatibility and direct use in non-hook contexts
const AddressLineSchema = z
  .string()
  .min(
    1,
    i18n.t(
      'onboarding-overview:fields.addresses.primaryAddressLine.validation.required'
    )
  )
  .max(
    60,
    i18n.t(
      'onboarding-overview:fields.addresses.primaryAddressLine.validation.maxLength'
    )
  );

export const AddressSchema = z.object({
  addressType: z.enum([
    'LEGAL_ADDRESS',
    'MAILING_ADDRESS',
    'BUSINESS_ADDRESS',
    'RESIDENTIAL_ADDRESS',
  ]),

  primaryAddressLine: AddressLineSchema,
  additionalAddressLines: z.array(z.object({ value: AddressLineSchema })),

  city: z
    .string()
    .min(1, 'City name is required')
    .max(34, 'City name must be 34 characters or less'),

  state: z
    .string()
    .min(2, 'State name is required')
    .refine(
      (val) =>
        /^(A[LKSZRAEP]|C[AOT]|D[EC]|FL|GA|HI|I[DLNA]|K[SY]|LA|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[AW]|RI|S[CD]|T[NX]|UT|V[TA]|W[AVIY])$/.test(
          val
        ),
      'Invalid US state'
    ),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(10, 'Postal code must be 10 characters or less')
    .refine((val) => /^\d{5}(-\d{4})?$/.test(val), {
      message: 'Invalid US postal code format',
    }),
  country: z.string().length(2, 'Country code must be exactly 2 characters'),
});
