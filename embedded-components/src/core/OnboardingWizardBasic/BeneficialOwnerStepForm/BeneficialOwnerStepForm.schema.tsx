import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { AddressSchema, PhoneSchema } from '../utils/schemas';

// Constants for validation
const NAME_PATTERN = /^[a-zA-Z0-9()_/\\&+%@#;,.: -?]*$/;
const SUFFIX_PATTERN = /^[A-Za-z.IVX]*$/;
const MIN_AGE = 18;
const MAX_AGE = 120;

const ownerIdSchema = z
  .object({
    description: z.string().optional(),
    expiryDate: z
      .string()
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: i18n.t(
          'onboarding:fields.ownerIds.expiryDate.validation.format'
        ),
      })
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: i18n.t(
          'onboarding:fields.ownerIds.expiryDate.validation.invalid'
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
            'onboarding:fields.ownerIds.expiryDate.validation.past'
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
            'onboarding:fields.ownerIds.expiryDate.validation.tooFar'
          ),
        }
      )
      .or(z.literal(undefined)),
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
          'onboarding-old:fields.ownerIds.issuer.validation.exactlyTwoChars'
        )
      ),
    value: z
      .string()
      .min(
        1,
        i18n.t('onboarding-old:fields.ownerIds.value.validation.required')
      )
      .refine((val: string) => !/\s/.test(val), {
        message: i18n.t(
          'onboarding-old:fields.ownerIds.value.validation.noSpaces'
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
        `onboarding:fields.ownerIds.value.validation.${data.idType.toLowerCase()}Format`
      ),
      path: ['value'],
    })
  );

export const BeneficialOwnerStepFormSchema = z.object({
  ownerExternalId: z.string().optional(),
  ownerAddresses: z.array(AddressSchema).refine((addresses) => {
    const types = addresses.map((addr) => addr.addressType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding-old:fields.ownerAddresses.validation.uniqueTypes')),
  birthDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      i18n.t('onboarding-old:fields.birthDate.validation.format')
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      i18n.t('onboarding-old:fields.birthDate.validation.invalid')
    )
    .refine((val) => {
      const date = new Date(val);
      return date <= new Date();
    }, i18n.t('onboarding-old:fields.birthDate.validation.future'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age >= MIN_AGE;
    }, i18n.t('onboarding-old:fields.birthDate.validation.tooYoung'))
    .refine((val) => {
      const birthDate = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return age <= MAX_AGE;
    }, i18n.t('onboarding-old:fields.birthDate.validation.tooOld')),
  countryOfResidence: z
    .string()
    .length(
      2,
      i18n.t(
        'onboarding-old:fields.countryOfResidence.validation.exactlyTwoChars'
      )
    ),
  ownerFirstName: z
    .string()
    .min(2, i18n.t('onboarding-old:fields.ownerFirstName.validation.minLength'))
    .max(
      30,
      i18n.t('onboarding-old:fields.ownerFirstName.validation.maxLength')
    )
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding-old:fields.ownerFirstName.validation.pattern')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding-old:fields.ownerName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding-old:fields.ownerName.validation.noConsecutiveHyphens')
    ),
  ownerMiddleName: z
    .string()
    .max(
      30,
      i18n.t('onboarding-old:fields.ownerMiddleName.validation.maxLength')
    )
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding-old:fields.ownerMiddleName.validation.pattern')
    ),
  ownerLastName: z
    .string()
    .min(2, i18n.t('onboarding-old:fields.ownerLastName.validation.minLength'))
    .max(30, i18n.t('onboarding-old:fields.ownerLastName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding-old:fields.ownerLastName.validation.pattern')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding-old:fields.ownerName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding-old:fields.ownerName.validation.noConsecutiveHyphens')
    ),
  ownerNameSuffix: z
    .string()
    .min(
      1,
      i18n.t('onboarding-old:fields.ownerNameSuffix.validation.minLength')
    )
    .max(
      5,
      i18n.t('onboarding-old:fields.ownerNameSuffix.validation.maxLength')
    )
    .regex(
      SUFFIX_PATTERN,
      i18n.t('onboarding-old:fields.ownerNameSuffix.validation.pattern')
    ),
  ownerIds: z.array(ownerIdSchema).refine((ids) => {
    const types = ids.map((id) => id.idType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding-old:fields.ownerIds.validation.uniqueTypes')),
  ownerJobTitle: z
    .union([
      z.enum([
        'CEO',
        'CFO',
        'COO',
        'President',
        'Chairman',
        'Senior Branch Manager',
        'Other',
      ]),
      z.literal(''),
    ])
    .refine((val) => val !== '', {
      message: i18n.t('common:validation.required'),
    }),
  ownerJobTitleDescription: z
    .string()
    .max(
      50,
      i18n.t(
        'onboarding-old:fields.ownerJobTitleDescription.validation.maxLength'
      )
    )
    .regex(
      /^[a-zA-Z0-9\s,.&-]+$/,
      i18n.t(
        'onboarding-old:fields.ownerJobTitleDescription.validation.pattern'
      )
    )
    .refine(
      (val) => !/(<[^>]*>)/.test(val),
      i18n.t('onboarding-old:fields.ownerJobTitleDescription.validation.noHtml')
    )
    .refine(
      (val) => !/https?:\/\/[^\s]+/.test(val),
      i18n.t('onboarding-old:fields.ownerJobTitleDescription.validation.noUrls')
    ),
  ownerEmail: z
    .string()
    .email(i18n.t('onboarding-old:fields.organizationEmail.validation.invalid'))
    .max(
      100,
      i18n.t('onboarding-old:fields.organizationEmail.validation.maxLength')
    ),
  ownerPhone: PhoneSchema,
  natureOfOwnership: z
    .union([z.enum(['Direct', 'Indirect']), z.literal('')])
    .refine((val) => val !== '', {
      message: i18n.t('common:validation.required'),
    }),
});

export const refineOwnerStepFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, context) => {
    if (values.ownerJobTitle === 'Other' && !values.ownerJobTitleDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t(
          'onboarding:fields.ownerJobTitleDescription.validation.required'
        ),
        path: ['ownerJobTitleDescription'],
      });
    }
  });
};
