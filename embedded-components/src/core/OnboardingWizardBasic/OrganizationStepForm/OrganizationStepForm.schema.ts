import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import { AddressSchema, PhoneSchema } from '../utils/schemas';

const CURRENT_YEAR = new Date().getFullYear();

// Regex pattern from OAS for organization and DBA names
const NAME_PATTERN = /^[a-zA-Z0-9()_/&+%@#;,.: -?]*$/;
const SPECIAL_CHARS_PATTERN = /[()_/&+%@#;,.: -?]/;

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
      )
      .regex(
        /^[A-Za-z0-9-]+$/,
        i18n.t('onboarding:fields.organizationIds.value.validation.format')
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
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: i18n.t(
          'onboarding:fields.organizationIds.expiryDate.validation.invalid'
        ),
      })
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
      switch (data.idType) {
        case 'EIN':
          // EIN: 9 digits
          return /^\d{9}$/.test(data.value);
        case 'BUSINESS_REGISTRATION_ID':
          // Business Registration ID: Alphanumeric, 5-15 chars
          return /^[A-Za-z0-9]{5,15}$/.test(data.value);
        case 'BUSINESS_NUMBER':
          // Business Number: 9-12 digits
          return /^\d{9,12}$/.test(data.value);
        case 'BUSINESS_REGISTRATION_NUMBER':
          // Business Registration Number: Alphanumeric with optional dashes, 6-15 chars
          return /^[A-Za-z0-9-]{6,15}$/.test(data.value);
        default:
          return true;
      }
    },
    (data) => ({
      message: i18n.t(
        `onboarding:fields.organizationIds.value.validation.${data.idType.toLowerCase()}Format`
      ),
      path: ['value'],
    })
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
    .min(2, i18n.t('onboarding:fields.organizationName.validation.minLength'))
    .max(100, i18n.t('onboarding:fields.organizationName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.organizationName.validation.pattern')
    )
    .refine(
      (val) => !val.startsWith(' '),
      i18n.t('onboarding:fields.organizationName.validation.noLeadingSpace')
    )
    .refine(
      (val) => !val.endsWith(' '),
      i18n.t('onboarding:fields.organizationName.validation.noTrailingSpace')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t(
        'onboarding:fields.organizationName.validation.noConsecutiveSpaces'
      )
    )
    .refine(
      (val) => !SPECIAL_CHARS_PATTERN.test(val.charAt(0)),
      i18n.t('onboarding:fields.organizationName.validation.noSpecialAtStart')
    ),
  dbaName: z
    .string()
    .max(100, i18n.t('onboarding:fields.dbaName.validation.maxLength'))
    .regex(NAME_PATTERN, i18n.t('onboarding:fields.dbaName.validation.pattern'))
    .refine(
      (val) => !val || !val.startsWith(' '),
      i18n.t('onboarding:fields.dbaName.validation.noLeadingSpace')
    )
    .refine(
      (val) => !val || !val.endsWith(' '),
      i18n.t('onboarding:fields.dbaName.validation.noTrailingSpace')
    )
    .refine(
      (val) => !val || !/\s\s/.test(val),
      i18n.t('onboarding:fields.dbaName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !val || val.length >= 2,
      i18n.t('onboarding:fields.dbaName.validation.minLength')
    )
    .optional(),
  countryOfFormation: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfFormation.validation.exactlyTwoChars')
    )
    .refine(
      (val) => COUNTRIES_OF_FORMATION.includes(val),
      i18n.t('onboarding:fields.countryOfFormation.validation.invalidCountry')
    ),
  organizationEmail: z
    .string()
    .email(i18n.t('onboarding:fields.organizationEmail.validation.invalid'))
    .max(
      100,
      i18n.t('onboarding:fields.organizationEmail.validation.maxLength')
    ),
  yearOfFormation: z
    .string()
    .regex(
      /^(19|20)\d{2}$/,
      i18n.t('onboarding:fields.yearOfFormation.validation.format')
    )
    .refine((val) => {
      const year = parseInt(val, 10);
      return year >= 1800;
    }, i18n.t('onboarding:fields.yearOfFormation.validation.min'))
    .refine((val) => {
      const year = parseInt(val, 10);
      return year <= CURRENT_YEAR;
    }, i18n.t('onboarding:fields.yearOfFormation.validation.max')),
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
    .min(3, i18n.t('onboarding:fields.industryCategory.validation.minLength'))
    .max(100, i18n.t('onboarding:fields.industryCategory.validation.maxLength'))
    .regex(
      /^[a-zA-Z0-9\s,.&-]+$/,
      i18n.t('onboarding:fields.industryCategory.validation.format')
    ),
  industryType: z
    .string()
    .min(3, i18n.t('onboarding:fields.industryType.validation.minLength'))
    .max(100, i18n.t('onboarding:fields.industryType.validation.maxLength')),
  organizationDescription: z
    .string()
    .min(
      10,
      i18n.t('onboarding:fields.organizationDescription.validation.minLength')
    )
    .max(
      500,
      i18n.t('onboarding:fields.organizationDescription.validation.maxLength')
    )
    .refine(
      (val) => !/(<[^>]*>)/.test(val),
      i18n.t('onboarding:fields.organizationDescription.validation.noHtml')
    )
    .refine(
      (val) => !/https?:\/\/[^\s]+/.test(val),
      i18n.t('onboarding:fields.organizationDescription.validation.noUrls')
    ),
  organizationIds: z
    .array(OrganizationIdSchema)
    .max(6, i18n.t('onboarding:fields.organizationIds.validation.maxIds'))
    .refine((ids) => {
      const types = ids.map((id) => id.idType);
      return new Set(types).size === types.length;
    }, i18n.t('onboarding:fields.organizationIds.validation.uniqueTypes')),
  organizationPhone: PhoneSchema,
  website: z
    .string()
    .url(i18n.t('onboarding:fields.website.validation.invalid'))
    .max(500, i18n.t('onboarding:fields.website.validation.maxLength'))
    .refine(
      (val) => !val || val.startsWith('https://'),
      i18n.t('onboarding:fields.website.validation.httpsRequired')
    )
    .refine(
      (val) =>
        !val || !/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(val),
      i18n.t('onboarding:fields.website.validation.noIp')
    )
    .or(z.literal('')),
  websiteAvailable: z.boolean(),
  mcc: z
    .string()
    .refine(
      (value) => value === '' || /^\d{4}$/.test(value),
      i18n.t('onboarding:fields.mcc.validation.format')
    )
    .refine((value) => {
      if (!value) return true;
      const code = parseInt(value, 10);
      return code >= 1 && code <= 9999;
    }, i18n.t('onboarding:fields.mcc.validation.range')),
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
