import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { sanitizeDescription } from '@/core/OnboardingWizardBasic/OrganizationStepForm/OrganizationStepForm.schema';

const NAME_PATTERN = /^[a-zA-Z0-9()_\\/@&+%#;,.: '-]*$/;

export const CustomerFacingDetailsFormSchema = z.object({
  dbaName: z
    .string()
    .max(100, i18n.t('onboarding:fields.dbaName.validation.maxLength'))
    .refine(
      (val) => NAME_PATTERN.test(val),
      i18n.t('onboarding:fields.dbaName.validation.pattern')
    )
    .refine(
      (val) => !val || !/\s\s/.test(val),
      i18n.t('onboarding:fields.dbaName.validation.noConsecutiveSpaces')
    )
    .refine(
      (val) => !val || val.length >= 2,
      i18n.t('onboarding:fields.dbaName.validation.minLength')
    ),
  dbaNameNotAvailable: z.boolean(),
  organizationDescription: z
    .string()
    .min(10)
    .max(500)
    .transform(sanitizeDescription),
  website: z
    .string()
    .url(i18n.t('onboarding:fields.website.validation.invalid'))
    .max(500, i18n.t('onboarding:fields.website.validation.maxLength'))
    .refine(
      (val) => /^https?:\/\//.test(val),
      i18n.t('onboarding:fields.website.validation.httpsRequired')
    )
    .refine(
      (val) =>
        !val || !/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(val),
      i18n.t('onboarding:fields.website.validation.noIp')
    ),
  websiteNotAvailable: z.boolean(),
});

export const refineCustomerFacingDetailsFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, context) => {
    if (values.websiteNotAvailable === false && !values.website) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('onboarding:fields.website.validation.required'),
        path: ['website'],
      });
    }
    if (values.dbaNameNotAvailable === false && !values.dbaName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['dbaName'],
      });
    }
  });
};
