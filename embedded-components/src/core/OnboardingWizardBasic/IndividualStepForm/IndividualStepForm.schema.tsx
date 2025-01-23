import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { AddressSchema, PhoneSchema } from '../utils/schemas';

// Constants for validation
const NAME_PATTERN = /^[a-zA-Z0-9()_/\\&+%@#;,.: -?]*$/;
const SUFFIX_PATTERN = /^[A-Za-z.IVX]+$/;
const MIN_AGE = 18;
const MAX_AGE = 120;

const individualIdSchema = z
  .object({
    description: z.string().optional(),
    expiryDate: z
      .string()
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: i18n.t(
          'onboarding:fields.individualIds.expiryDate.validation.format'
        ),
      })
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: i18n.t(
          'onboarding:fields.individualIds.expiryDate.validation.invalid'
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
            'onboarding:fields.individualIds.expiryDate.validation.past'
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
          return date <= tenYearsFromNow;
        },
        {
          message: i18n.t(
            'onboarding:fields.individualIds.expiryDate.validation.tooFar'
          ),
        }
      )
      .optional(),
    idType: z.enum([
      'SSN',
      'ITIN',
      'NATIONAL_ID',
      'DRIVERS_LICENSE',
      'PASSPORT',
      'SOCIAL_INSURANCE_NUMBER',
      'OTHER_GOVERNMENT_ID',
    ]),
    issuer: z
      .string()
      .length(
        2,
        i18n.t(
          'onboarding:fields.individualIds.issuer.validation.exactlyTwoChars'
        )
      ),
    value: z
      .string()
      .min(
        1,
        i18n.t('onboarding:fields.individualIds.value.validation.required')
      )
      .refine((val: string) => !/\s/.test(val), {
        message: i18n.t(
          'onboarding:fields.individualIds.value.validation.noSpaces'
        ),
      }),
  })
  .refine(
    (data) => {
      switch (data.idType) {
        case 'SSN':
          // SSN: 9 digits
          return /^\d{9}$/.test(data.value);
        case 'ITIN':
          // ITIN: 9 digits
          return /^\d{9}$/.test(data.value);
        default:
          return true;
      }
    },
    (data) => ({
      message: i18n.t(
        `onboarding:fields.individualIds.value.validation.${data.idType.toLowerCase()}Format`
      ),
      path: ['value'],
    })
  );

export const IndividualStepFormSchema = z.object({
  individualAddresses: z
    .array(AddressSchema)
    .min(1, i18n.t('onboarding:fields.individualAddresses.validation.required'))
    .max(
      5,
      i18n.t('onboarding:fields.individualAddresses.validation.maxAddresses')
    )
    .refine((addresses) => {
      const types = addresses.map((addr) => addr.addressType);
      return new Set(types).size === types.length;
    }, i18n.t('onboarding:fields.individualAddresses.validation.uniqueTypes')),
  birthDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      i18n.t('onboarding:fields.birthDate.validation.format')
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      i18n.t('onboarding:fields.birthDate.validation.invalid')
    )
    .refine((val) => {
      const date = new Date(val);
      return date <= new Date();
    }, i18n.t('onboarding:fields.birthDate.validation.future'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age >= MIN_AGE;
    }, i18n.t('onboarding:fields.birthDate.validation.tooYoung'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age <= MAX_AGE;
    }, i18n.t('onboarding:fields.birthDate.validation.tooOld')),
  countryOfResidence: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfResidence.validation.exactlyTwoChars')
    ),
  firstName: z
    .string()
    .min(2, i18n.t('onboarding:fields.firstName.validation.minLength'))
    .max(30, i18n.t('onboarding:fields.firstName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.firstName.validation.pattern')
    )
    .refine(
      (val) => !val.startsWith(' '),
      i18n.t('onboarding:fields.individualName.validation.noLeadingSpace')
    )
    .refine(
      (val) => !val.endsWith(' '),
      i18n.t('onboarding:fields.individualName.validation.noTrailingSpace')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding:fields.individualName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding:fields.individualName.validation.noConsecutiveHyphens')
    ),
  middleName: z
    .string()
    .max(30, i18n.t('onboarding:fields.middleName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.middleName.validation.pattern')
    )
    .optional(),
  lastName: z
    .string()
    .min(2, i18n.t('onboarding:fields.lastName.validation.minLength'))
    .max(30, i18n.t('onboarding:fields.lastName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.lastName.validation.pattern')
    )
    .refine(
      (val) => !val.startsWith(' '),
      i18n.t('onboarding:fields.individualName.validation.noLeadingSpace')
    )
    .refine(
      (val) => !val.endsWith(' '),
      i18n.t('onboarding:fields.individualName.validation.noTrailingSpace')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding:fields.individualName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding:fields.individualName.validation.noConsecutiveHyphens')
    ),
  nameSuffix: z
    .string()
    .min(1, i18n.t('onboarding:fields.nameSuffix.validation.minLength'))
    .max(5, i18n.t('onboarding:fields.nameSuffix.validation.maxLength'))
    .regex(
      SUFFIX_PATTERN,
      i18n.t('onboarding:fields.nameSuffix.validation.pattern')
    )
    .optional(),
  individualIds: z
    .array(individualIdSchema)
    .min(1, i18n.t('onboarding:fields.individualIds.validation.required'))
    .max(16, i18n.t('onboarding:fields.individualIds.validation.maxIds'))
    .refine((ids) => {
      const types = ids.map((id) => id.idType);
      return new Set(types).size === types.length;
    }, i18n.t('onboarding:fields.individualIds.validation.uniqueTypes')),
  jobTitle: z
    .string()
    .min(2, i18n.t('onboarding:fields.jobTitle.validation.minLength'))
    .max(50, i18n.t('onboarding:fields.jobTitle.validation.maxLength'))
    .regex(
      /^[a-zA-Z0-9\s,.&-]+$/,
      i18n.t('onboarding:fields.jobTitle.validation.pattern')
    )
    .refine(
      (val) => !val.startsWith(' '),
      i18n.t('onboarding:fields.jobTitle.validation.noLeadingSpace')
    )
    .refine(
      (val) => !val.endsWith(' '),
      i18n.t('onboarding:fields.jobTitle.validation.noTrailingSpace')
    ),
  jobTitleDescription: z
    .string()
    .max(
      50,
      i18n.t('onboarding:fields.jobTitleDescription.validation.maxLength')
    )
    .regex(
      /^[a-zA-Z0-9\s,.&-]+$/,
      i18n.t('onboarding:fields.jobTitleDescription.validation.pattern')
    )
    .refine(
      (val) => !/(<[^>]*>)/.test(val),
      i18n.t('onboarding:fields.jobTitleDescription.validation.noHtml')
    )
    .refine(
      (val) => !/https?:\/\/[^\s]+/.test(val),
      i18n.t('onboarding:fields.jobTitleDescription.validation.noUrls')
    )
    .optional(),
  individualPhone: PhoneSchema,
  natureOfOwnership: z.enum(['Direct', 'Indirect']).optional(),
});
