import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import { PhoneSmbdoPhoneType } from '@/api/generated/smbdo.schemas';
import { getAddressValidationIssues } from '@/core/ClientProfile/schemas/getAddressValidationIssues';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

/**
 * Creates phone schemas with customized validation messages
 */
export const usePhoneSchemas = (
  type: 'controllerPhone' | 'organizationPhone'
) => {
  const v = useGetValidationMessage();

  const PhoneTypeSchema: z.ZodType<PhoneSmbdoPhoneType, PhoneSmbdoPhoneType> =
    z.enum(['BUSINESS_PHONE', 'MOBILE_PHONE', 'ALTERNATE_PHONE']);

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
      getAddressValidationIssues(data, {
        subdivisionSource: 'reference',
      }).forEach((issue) => {
        ctx.addIssue({
          code: 'custom',
          message: v(
            `${type}.${issue.field}`,
            issue.messageKey as 'invalid',
            issue.params
          ),
          path: [issue.field],
        });
      });
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
