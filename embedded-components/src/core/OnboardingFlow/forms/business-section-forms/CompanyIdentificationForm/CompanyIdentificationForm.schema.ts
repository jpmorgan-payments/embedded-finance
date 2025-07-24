import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';

const CURRENT_YEAR = new Date().getFullYear();
const NAME_PATTERN = /^[a-zA-Z0-9()_\\/@&+%#;,.: '-]*$/;
const SPECIAL_CHARS_PATTERN = /[()_\\/&+%@#;,.: '-]/;

const OrganizationIdSchema = z
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
      .refine(
        (val) => /^[A-Za-z0-9-]+$/.test(val),
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

export const CompanyIdentificationFormSchema = z.object({
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
  organizationName: z
    .string()
    .min(2, i18n.t('onboarding:fields.organizationName.validation.minLength'))
    .max(100, i18n.t('onboarding:fields.organizationName.validation.maxLength'))
    .refine(
      (val) => NAME_PATTERN.test(val),
      i18n.t('onboarding:fields.organizationName.validation.pattern')
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
  yearOfFormation: z
    .string()
    .refine(
      (val) => /^(19|20)\d{2}$/.test(val),
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
  organizationIds: z
    .array(OrganizationIdSchema)
    .max(6, i18n.t('onboarding:fields.organizationIds.validation.maxIds'))
    .refine((ids) => {
      const types = ids.map((id) => id.idType);
      return new Set(types).size === types.length;
    }, i18n.t('onboarding:fields.organizationIds.validation.uniqueTypes')),
});
