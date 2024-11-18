import { z } from 'zod';

import { PhoneSchema } from '../utils/schemas';

const addressSchema = z.object({
  addressType: z.enum([
    'LEGAL_ADDRESS',
    'MAILING_ADDRESS',
    'BUSINESS_ADDRESS',
    'RESIDENTIAL_ADDRESS',
  ]),
  addressLines: z
    .array(z.string().max(60, 'Address line must be 60 characters or less'))
    .min(1, 'At least one address line is required')
    .max(5, 'Maximum 5 address lines allowed')
    .refine(
      (lines) =>
        lines[0] && !lines[0].startsWith('PO Box') && /^\d/.test(lines[0]),
      'First line must not be a PO Box and must begin with a number'
    ),
  city: z.string().max(34, 'City name must be 34 characters or less'),
  state: z
    .string()
    .max(30, 'State name must be 30 characters or less')
    .optional(),
  postalCode: z.string().max(10, 'Postal code must be 10 characters or less'),
  country: z.string().length(2, 'Country code must be exactly 2 characters'),
});

const individualIdSchema = z.object({
  description: z.string().optional(),
  expiryDate: z
    .string()
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Expiry date must be in 'YYYY-MM-DD' format",
    })
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: 'Invalid date',
    })
    .optional(),
  idType: z.enum(['SSN', 'ITIN']),
  issuer: z.string().length(2, 'Issuer must be a 2-letter country code'),
  value: z
    .string()
    .min(1)
    .max(20)
    .refine((val) => /^\d{9}$/.test(val), {
      message: 'SSN/ITIN must be 9 digits',
    }),
});

export const IndividualStepFormSchema = z.object({
  individualAddresses: z.array(addressSchema).min(1).max(5),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be in 'YYYY-MM-DD' format"),
  countryOfResidence: z
    .string()
    .length(2, 'Country code must be exactly 2 characters'),
  firstName: z.string().min(2).max(30),
  middleName: z.string().max(30).optional(),
  lastName: z.string().min(2).max(30),
  nameSuffix: z.string().min(1).max(5).optional(),
  individualIds: z.array(individualIdSchema).max(16),
  jobTitle: z.string(),
  jobTitleDescription: z.string().max(50).optional(),
  individualPhone: PhoneSchema,
  natureOfOwnership: z.enum(['Direct', 'Indirect']).optional(),
  soleOwner: z.boolean().optional(),
});
