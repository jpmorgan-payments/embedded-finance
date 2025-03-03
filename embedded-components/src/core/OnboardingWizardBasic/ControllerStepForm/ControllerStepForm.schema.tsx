import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { AddressSchema, PhoneSchema } from '../utils/schemas';

// Constants for validation
const NAME_PATTERN = /^[a-zA-Z0-9()_/\\&+%@#;,.: -?]*$/;
const SUFFIX_PATTERN = /^[A-Za-z.IVX]*$/;
const MIN_AGE = 18;
const MAX_AGE = 120;

const controllerIdSchema = z
  .object({
    description: z.string().optional(),
    expiryDate: z
      .string()
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: i18n.t(
          'onboarding:fields.controllerIds.expiryDate.validation.format'
        ),
      })
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: i18n.t(
          'onboarding:fields.controllerIds.expiryDate.validation.invalid'
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
            'onboarding:fields.controllerIds.expiryDate.validation.past'
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
            'onboarding:fields.controllerIds.expiryDate.validation.tooFar'
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
          'onboarding:fields.controllerIds.issuer.validation.exactlyTwoChars'
        )
      ),
    value: z
      .string()
      .min(
        1,
        i18n.t('onboarding:fields.controllerIds.value.validation.required')
      )
      .refine((val: string) => !/\s/.test(val), {
        message: i18n.t(
          'onboarding:fields.controllerIds.value.validation.noSpaces'
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
        `onboarding:fields.controllerIds.value.validation.${data.idType.toLowerCase()}Format`
      ),
      path: ['value'],
    })
  );

export const ControllerStepFormSchema = z.object({
  controllerAddresses: z.array(AddressSchema).refine((addresses) => {
    const types = addresses.map((addr) => addr.addressType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding:fields.controllerAddresses.validation.uniqueTypes')),
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
  controllerFirstName: z
    .string()
    .min(2, i18n.t('onboarding:fields.firstName.validation.minLength'))
    .max(30, i18n.t('onboarding:fields.firstName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.firstName.validation.pattern')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding:fields.controllerName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding:fields.controllerName.validation.noConsecutiveHyphens')
    ),
  controllerMiddleName: z
    .string()
    .max(30, i18n.t('onboarding:fields.middleName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.middleName.validation.pattern')
    ),
  controllerLastName: z
    .string()
    .min(2, i18n.t('onboarding:fields.lastName.validation.minLength'))
    .max(30, i18n.t('onboarding:fields.lastName.validation.maxLength'))
    .regex(
      NAME_PATTERN,
      i18n.t('onboarding:fields.lastName.validation.pattern')
    )
    .refine(
      (val) => !/\s\s/.test(val),
      i18n.t('onboarding:fields.controllerName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !/-{2,}/.test(val),
      i18n.t('onboarding:fields.controllerName.validation.noConsecutiveHyphens')
    ),
  controllerNameSuffix: z
    .string()
    .min(1, i18n.t('onboarding:fields.nameSuffix.validation.minLength'))
    .max(5, i18n.t('onboarding:fields.nameSuffix.validation.maxLength'))
    .regex(
      SUFFIX_PATTERN,
      i18n.t('onboarding:fields.nameSuffix.validation.pattern')
    ),
  controllerIds: z.array(controllerIdSchema).refine((ids) => {
    const types = ids.map((id) => id.idType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding:fields.controllerIds.validation.uniqueTypes')),
  controllerJobTitle: z
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
  controllerJobTitleDescription: z
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
    ),
  controllerEmail: z
    .string()
    .email(i18n.t('onboarding:fields.organizationEmail.validation.invalid'))
    .max(
      100,
      i18n.t('onboarding:fields.organizationEmail.validation.maxLength')
    ),
  controllerPhone: PhoneSchema,
  natureOfOwnership: z
    .union([z.enum(['Direct', 'Indirect']), z.literal('')])
    .refine((val) => val !== '', {
      message: i18n.t('common:validation.required'),
    }),
});

export const refineControllerStepFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, context) => {
    if (
      values.controllerJobTitle === 'Other' &&
      !values.controllerJobTitleDescription
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t(
          'onboarding:fields.controllerJobTitleDescription.validation.required'
        ),
        path: ['controllerJobTitleDescription'],
      });
    }
  });
};
