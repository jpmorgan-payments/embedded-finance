import { i18n } from '@/i18n/config';
import { z } from 'zod';

const NAME_PATTERN = /^[a-zA-Z0-9()_\\/@&+%#;,.: '-]*$/;
const SUFFIX_PATTERN = /^[A-Za-z.IVX]*$/;

export const PersonalDetailsFormSchema = z.object({
  controllerFirstName: z
    .string()
    .min(
      2,
      i18n.t('onboarding:fields.controllerFirstName.validation.minLength')
    )
    .max(
      30,
      i18n.t('onboarding:fields.controllerFirstName.validation.maxLength')
    )
    .refine(
      (val) => NAME_PATTERN.test(val),
      i18n.t('onboarding:fields.controllerFirstName.validation.pattern')
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
    .max(
      30,
      i18n.t('onboarding:fields.controllerMiddleName.validation.maxLength')
    )
    .refine(
      (val) => NAME_PATTERN.test(val),
      i18n.t('onboarding:fields.controllerMiddleName.validation.pattern')
    ),
  controllerLastName: z
    .string()
    .min(2, i18n.t('onboarding:fields.controllerLastName.validation.minLength'))
    .max(
      30,
      i18n.t('onboarding:fields.controllerLastName.validation.maxLength')
    )
    .refine(
      (val) => NAME_PATTERN.test(val),
      i18n.t('onboarding:fields.controllerLastName.validation.pattern')
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
    .min(
      1,
      i18n.t('onboarding:fields.controllerNameSuffix.validation.minLength')
    )
    .max(
      5,
      i18n.t('onboarding:fields.controllerNameSuffix.validation.maxLength')
    )
    .refine(
      (val) => SUFFIX_PATTERN.test(val),
      i18n.t('onboarding:fields.controllerNameSuffix.validation.pattern')
    ),
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
      i18n.t(
        'onboarding:fields.controllerJobTitleDescription.validation.maxLength'
      )
    )
    .refine(
      (val) => /^[a-zA-Z0-9\s,.&-]+$/.test(val),
      i18n.t(
        'onboarding:fields.controllerJobTitleDescription.validation.pattern'
      )
    )
    .refine(
      (val) => !/(<[^>]*>)/.test(val),
      i18n.t(
        'onboarding:fields.controllerJobTitleDescription.validation.noHtml'
      )
    )
    .refine(
      (val) => !/https?:\/\/[^\s]+/.test(val),
      i18n.t(
        'onboarding:fields.controllerJobTitleDescription.validation.noUrls'
      )
    ),
});

export const refinePersonalDetailsFormSchema = (
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
