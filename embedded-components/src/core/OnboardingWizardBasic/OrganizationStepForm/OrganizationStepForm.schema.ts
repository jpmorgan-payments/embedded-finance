import { z } from 'zod';

import { AddressSchema, PhoneSchema } from '../utils/schemas';

export const OrganizationIdSchema = z.object({
  description: z
    .string()
    .max(100, 'Description must be 100 characters or less')
    .optional(),
  idType: z.enum(['EIN', 'BUSINESS_REGISTRATION_ID']),
  value: z
    .string()
    .min(1, 'ID value is required')
    .max(100, 'ID value must be 100 characters or less'),
  issuer: z
    .string()
    .min(1, 'Issuer is required')
    .max(500, 'Issuer must be 500 characters or less'),
  expiryDate: z
    .string()
    .refine(
      (val) => {
        // Check if the string is in 'YYYY-MM-DD' format
        return /^\d{4}-\d{2}-\d{2}$/.test(val);
      },
      {
        message: "Expiry date must be in 'YYYY-MM-DD' format",
      }
    )
    .refine(
      (val) => {
        // Check if the date is valid
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      {
        message: 'Invalid date',
      }
    )
    .optional(),
});

const associatedCountrySchema = z.object({
  country: z.string().length(2, 'Country code must be exactly 2 characters'),
});

const secondaryMccSchema = z.object({
  mcc: z.string().regex(/^\d{4}$/, 'MCC must be exactly 4 digits'),
});

export const OrganizationStepFormSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  dbaName: z.string().max(100, 'DBA name must be 100 characters or less'),
  countryOfFormation: z
    .string()
    .length(2, 'Country code must be exactly 2 characters'),
  email: z.string().email('Invalid email address'),
  yearOfFormation: z
    .string()
    .regex(/^(19|20)\d{2}$/, 'Invalid year of formation'),
  addresses: z
    .array(AddressSchema)
    .min(1, 'At least one address is required')
    .max(5, 'Maximum 5 addresses allowed'),
  associatedCountries: z
    .array(associatedCountrySchema)
    .max(100, 'Maximum 100 associated countries allowed'),
  entitiesInOwnership: z.enum(['yes', 'no']),
  industryCategory: z
    .string()
    .max(100, 'Industry category must be 100 characters or less'),
  industryType: z
    .string()
    .max(100, 'Industry type must be 100 characters or less'),
  organizationDescription: z
    .string()
    .max(500, 'Organization description must be 500 characters or less'),
  organizationIds: z
    .array(OrganizationIdSchema)
    .max(6, 'Maximum 6 organization IDs allowed'),
  organizationPhone: PhoneSchema,
  tradeOverInternet: z.enum(['yes', 'no']),
  website: z
    .string()
    .url('Invalid URL')
    .max(500, 'Website URL must be 500 characters or less')
    .or(z.literal('')),
  websiteAvailable: z.boolean(),
  mcc: z.string().refine((value) => value === '' || /^\d{4}$/.test(value), {
    message: 'MCC must be empty or exactly 4 digits',
  }),
  secondaryMccList: z
    .array(secondaryMccSchema)
    .max(50, 'Maximum 50 secondary MCCs allowed'),
});

export const refineOrganizationStepFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, context) => {
    if (values.websiteAvailable && !values.website) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Website URL is required',
        path: ['website'],
      });
    }
  });
};
