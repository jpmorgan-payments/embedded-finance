import { i18n } from '@/i18n/config';
import { z } from 'zod';

export const InitialStepFormSchema = z.object({
  organizationName: z.string().min(1, i18n.t('common:validation.required')),
  organizationType: z.enum(
    [
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
    ],
    {
      errorMap: (issue, ctx) => {
        if (issue.code === 'invalid_enum_value') {
          return {
            message: i18n.t('common:validation.required'),
          };
        }
        return { message: ctx.defaultError };
      },
    }
  ),
  countryOfFormation: z
    .string()
    .min(1, i18n.t('common:validation.required'))
    .length(
      2,
      i18n.t('onboarding:fields.countryOfFormation.validation.exactlyTwoChars')
    ),
  jurisdiction: z.enum(['US', 'CA']),
  product: z.enum(['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES']),
  organizationEmail: z.string().email(),
});
