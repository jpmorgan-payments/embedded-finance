import { i18n } from '@/i18n/config';
import { z } from 'zod';

// import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

export const GatewayScreenFormSchema = z.object({
  organizationTypeHierarchy: z.object({
    generalOrganizationType: z
      .union([
        z.enum(['SOLE_PROPRIETORSHIP', 'REGISTERED_BUSINESS', 'OTHER']),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: i18n.t('common:validation.required'),
      }),
    specificOrganizationType: z
      .union([
        z.enum([
          'LIMITED_LIABILITY_COMPANY',
          'LIMITED_LIABILITY_PARTNERSHIP',
          'GENERAL_PARTNERSHIP',
          'LIMITED_PARTNERSHIP',
          'C_CORPORATION',
          'S_CORPORATION',
          'PARTNERSHIP',
          'NON_PROFIT_CORPORATION',
          'GOVERNMENT_ENTITY',
          'SOLE_PROPRIETORSHIP',
          'UNINCORPORATED_ASSOCIATION',
          'PUBLICLY_TRADED_COMPANY',
        ]),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: i18n.t('common:validation.required'),
      }),
  }),
});
