import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { PhoneSchema } from '../utils/schemas';

// Constants for validation
const NAME_PATTERN = /^[a-zA-Z\s'-]+$/;
const SUFFIX_PATTERN = /^[A-Z]+\.?$|^[IVX]+$/;
const MIN_AGE = 18;
const MAX_AGE = 120;

const addressSchema = z.object({
  addressType: z.enum([
    'LEGAL_ADDRESS',
    'MAILING_ADDRESS',
    'BUSINESS_ADDRESS',
    'RESIDENTIAL_ADDRESS',
  ]),
  addressLines: z
    .array(
      z
        .string()
        .max(
          60,
          i18n.t(
            'onboarding:fields.individualAddresses.addressLines.validation.maxLength'
          )
        )
        .regex(
          /^[a-zA-Z0-9\s,.#'-]+$/,
          i18n.t(
            'onboarding:fields.individualAddresses.addressLines.validation.pattern'
          )
        )
    )
    .min(
      1,
      i18n.t(
        'onboarding:fields.individualAddresses.addressLines.validation.minLines'
      )
    )
    .max(
      5,
      i18n.t(
        'onboarding:fields.individualAddresses.addressLines.validation.maxLines'
      )
    )
    .refine(
      (lines) =>
        lines[0] && !lines[0].startsWith('PO Box') && /^\d/.test(lines[0]),
      i18n.t(
        'onboarding:fields.individualAddresses.addressLines.validation.firstLine'
      )
    ),
  city: z
    .string()
    .max(
      34,
      i18n.t('onboarding:fields.individualAddresses.city.validation.maxLength')
    )
    .regex(
      /^[a-zA-Z\s.-]+$/,
      i18n.t('onboarding:fields.individualAddresses.city.validation.pattern')
    ),
  state: z
    .string()
    .max(
      30,
      i18n.t('onboarding:fields.individualAddresses.state.validation.maxLength')
    )
    .regex(
      /^[a-zA-Z\s.-]+$/,
      i18n.t('onboarding:fields.individualAddresses.state.validation.pattern')
    )
    .optional(),
  postalCode: z
    .string()
    .max(
      10,
      i18n.t(
        'onboarding:fields.individualAddresses.postalCode.validation.maxLength'
      )
    )
    .refine(
      (val) => {
        if (val.length === 5 || val.length === 9) {
          return /^\d+$/.test(val);
        }
        return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(val);
      },
      {
        message: i18n.t(
          'onboarding:fields.individualAddresses.postalCode.validation.pattern'
        ),
      }
    ),
  country: z
    .string()
    .length(
      2,
      i18n.t('onboarding:fields.countryOfResidence.validation.exactlyTwoChars')
    ),
});

const individualIdSchema = z.object({
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
  idType: z.enum(['SSN', 'ITIN']),
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
    .min(1, i18n.t('onboarding:fields.individualIds.value.validation.required'))
    .refine((val: string) => !/\s/.test(val), {
      message: i18n.t(
        'onboarding:fields.individualIds.value.validation.noSpaces'
      ),
    })
    .superRefine((val, ctx) => {
      const { parent } = ctx as any;
      if (!parent) return true;

      const idType = parent.idType as 'SSN' | 'ITIN';
      if (!idType) return true;

      if (idType === 'SSN' && !/^\d{9}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t(
            'onboarding:fields.individualIds.value.validation.ssnFormat'
          ),
        });
        return false;
      }

      if (idType === 'ITIN' && !/^9\d{8}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t(
            'onboarding:fields.individualIds.value.validation.itinFormat'
          ),
        });
        return false;
      }

      return true;
    }),
});

export const IndividualStepFormSchema = z.object({
  individualAddresses: z
    .array(addressSchema)
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
  soleOwner: z.boolean().optional(),
});
