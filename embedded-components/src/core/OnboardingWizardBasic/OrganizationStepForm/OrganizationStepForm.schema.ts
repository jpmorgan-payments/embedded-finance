import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { AddressSchema, PhoneSchema } from '../utils/schemas';

export const OrganizationIdSchema = z
  .object({
    description: z
      .string()
      .max(
        100,
        i18n.t(
          'onboarding:fields.organizationIds.description.validation.maxLength'
        )
      )
      .optional(),
    idType: z.enum([
      'EIN',
      'BUSINESS_REGISTRATION_ID',
      'BUSINESS_NUMBER',
      'BUSINESS_REGISTRATION_NUMBER',
    ]),
    value: z
      .string()
      .min(
        1,
        i18n.t('onboarding:fields.organizationIds.value.validation.required')
      )
      .max(
        100,
        i18n.t('onboarding:fields.organizationIds.value.validation.maxLength')
      ),
    issuer: z
      .string()
      .min(
        1,
        i18n.t('onboarding:fields.organizationIds.issuer.validation.required')
      )
      .max(
        500,
        i18n.t('onboarding:fields.organizationIds.issuer.validation.maxLength')
      ),
    expiryDate: z
      .string()
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: i18n.t(
          'onboarding:fields.organizationIds.expiryDate.validation.format'
        ),
      })
      .refine(
        (val) => {
          const date = new Date(val);
          return !Number.isNaN(date.getTime());
        },
        {
          message: i18n.t(
            'onboarding:fields.organizationIds.expiryDate.validation.invalid'
          ),
        }
      )
      .refine(
        (val) => {
          const date = new Date(val);
          const now = new Date();
          return date > now;
        },
        {
          message: i18n.t(
            'onboarding:fields.organizationIds.expiryDate.validation.future'
          ),
        }
      )
      .refine(
        (val) => {
          const date = new Date(val);
          const now = new Date();
          const tenYearsFromNow = new Date(
            now.setFullYear(now.getFullYear() + 10)
          );
          return date < tenYearsFromNow;
        },
        {
          message: i18n.t(
            'onboarding:fields.organizationIds.expiryDate.validation.maxYears'
          ),
        }
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.idType === 'EIN') {
        return /^\d{9}$/.test(data.value);
      }
      return true;
    },
    {
      message: i18n.t(
        'onboarding:fields.organizationIds.value.validation.einFormat'
      ),
      path: ['value'],
    }
  );

const associatedCountrySchema = z.object({
  country: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfFormation.validation.exactlyTwoChars')
    ),
});

const secondaryMccSchema = z.object({
  mcc: z
    .string()
    .regex(
      /^\d{4}$/,
      i18n.t('onboarding:fields.secondaryMccList.mcc.validation.format')
    ),
});

export const OrganizationStepFormSchema = z.object({
  organizationName: z
    .string()
    .min(1, i18n.t('onboarding:fields.organizationName.validation.required'))
    .regex(
      /^[a-zA-Z0-9()_/&+%@#;,.: -?]*$/,
      i18n.t('onboarding:fields.organizationName.validation.format')
    ),
  dbaName: z
    .string()
    .max(100, i18n.t('onboarding:fields.dbaName.validation.maxLength')),
  countryOfFormation: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfFormation.validation.exactlyTwoChars')
    ),
  organizationEmail: z
    .string()
    .email(i18n.t('onboarding:fields.organizationEmail.validation.invalid')),
  yearOfFormation: z
    .string()
    .regex(
      /^(19|20)\d{2}$/,
      i18n.t('onboarding:fields.yearOfFormation.validation.format')
    ),
  addresses: z
    .array(AddressSchema)
    .min(1, i18n.t('onboarding:fields.addresses.validation.minAddresses'))
    .max(5, i18n.t('onboarding:fields.addresses.validation.maxAddresses')),
  associatedCountries: z
    .array(associatedCountrySchema)
    .max(
      100,
      i18n.t('onboarding:fields.associatedCountries.validation.maxCountries')
    ),
  entitiesInOwnership: z.enum(['yes', 'no']),
  industryCategory: z
    .string()
    .max(
      100,
      i18n.t('onboarding:fields.industryCategory.validation.maxLength')
    ),
  industryType: z
    .string()
    .max(100, i18n.t('onboarding:fields.industryType.validation.maxLength')),
  organizationDescription: z
    .string()
    .max(
      500,
      i18n.t('onboarding:fields.organizationDescription.validation.maxLength')
    ),
  organizationIds: z
    .array(OrganizationIdSchema)
    .min(1, i18n.t('onboarding:fields.organizationIds.validation.minIds'))
    .max(6, i18n.t('onboarding:fields.organizationIds.validation.maxIds')),
  organizationPhone: PhoneSchema,
  tradeOverInternet: z.enum(['yes', 'no']),
  website: z
    .string()
    .url(i18n.t('onboarding:fields.website.validation.invalid'))
    .max(500, i18n.t('onboarding:fields.website.validation.maxLength'))
    .or(z.literal('')),
  websiteAvailable: z.boolean(),
  mcc: z.string().refine((value) => value === '' || /^\d{4}$/.test(value), {
    message: i18n.t('onboarding:fields.mcc.validation.format'),
  }),
  secondaryMccList: z
    .array(secondaryMccSchema)
    .max(50, i18n.t('onboarding:fields.secondaryMccList.validation.maxMcc')),
});

export const refineOrganizationStepFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, context) => {
    if (values.websiteAvailable && !values.website) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('onboarding:fields.website.validation.required'),
        path: ['website'],
      });
    }
  });
};
