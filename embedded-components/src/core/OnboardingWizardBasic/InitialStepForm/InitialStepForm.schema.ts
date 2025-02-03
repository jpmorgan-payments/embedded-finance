import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';

export const InitialStepFormSchema = z.object({
  organizationName: z.string().min(1, i18n.t('common:validation.required')),
  organizationType: z.enum([
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
    'S_CORPORATION',
    'PARTNERSHIP',
    'PUBLICLY_TRADED_COMPANY',
    'NON_PROFIT_CORPORATION',
    'GOVERNMENT_ENTITY',
    'SOLE_PROPRIETORSHIP',
    'UNINCORPORATED_ASSOCIATION',
  ]),
  countryOfFormation: z
    .string()
    .min(1, i18n.t('common:validation.required'))
    .length(
      2,
      i18n.t('onboarding:fields.countryOfFormation.validation.exactlyTwoChars')
    )
    .refine(
      (val) => COUNTRIES_OF_FORMATION.includes(val),
      i18n.t('onboarding:fields.countryOfFormation.validation.invalidCountry')
    ),
  jurisdiction: z.enum(['US', 'CA']),
  product: z.enum(['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES']),
  organizationEmail: z
    .string()
    .email(i18n.t('onboarding:fields.organizationEmail.validation.invalid'))
    .max(
      100,
      i18n.t('onboarding:fields.organizationEmail.validation.maxLength')
    )
    .transform((val) => val.trim()),
});
