import { i18n } from '@/i18n/config';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

import { PhoneSmbdoPhoneType } from '@/api/generated/smbdo.schemas';

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

const AddressLineSchema = z
  .string()
  .min(
    1,
    i18n.t('onboarding:fields.addresses.primaryAddressLine.validation.required')
  )
  .max(
    60,
    i18n.t(
      'onboarding:fields.addresses.primaryAddressLine.validation.maxLength'
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
    .regex(
      /^(A[LKSZRAEP]|C[AOT]|D[EC]|FL|GA|HI|I[DLNA]|K[SY]|LA|M[EHDAINSOT]|N[EVHJMYCD]|O[HKR]|P[AW]|RI|S[CD]|T[NX]|UT|V[TA]|W[AVIY])$/,
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
