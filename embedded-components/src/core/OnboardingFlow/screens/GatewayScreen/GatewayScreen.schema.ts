import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES } from '@/core/OnboardingFlow/consts/stockExchanges';

const TICKER_PATTERN = /^[A-Z0-9]*$/;

export const GatewayScreenFormSchema = z.object({
  organizationTypeHierarchy: z.object({
    generalOrganizationType: z
      .union([
        z.enum(['SOLE_PROPRIETORSHIP', 'REGISTERED_BUSINESS', 'OTHER'], {
          message: i18n.t('validation:common.invalidOption'),
        }),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: i18n.t('common:validation.required'),
      }),
    specificOrganizationType: z
      .union([
        z.enum(
          [
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
          ],
          {
            message: i18n.t('validation:common.invalidOption'),
          }
        ),
        z.literal(''),
      ])
      .refine((val) => val !== '', {
        message: i18n.t('common:validation.required'),
      }),
  }),
  // PTC fields — conditionally validated via refineGatewaySchema
  isPTCOrSubsidiary: z.string().default(''),
  isSubsidiary: z.string().default(''),
  tickerSymbol: z.string().default(''),
  stockExchange: z.string().default(''),
  stockExchangeName: z.string().default(''),
});

/**
 * Refinement for PTC fields:
 * - isPTCOrSubsidiary required when org type is eligible
 * - ticker and exchange required when PTC/subsidiary selected
 */
export const refineGatewaySchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((data, ctx) => {
    const orgType =
      data.organizationTypeHierarchy?.specificOrganizationType ?? '';
    const isPTCEligibleOrg = PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES.includes(
      orgType as any
    );

    // Require the radio selection when the org type is PTC-eligible
    if (isPTCEligibleOrg && !data.isPTCOrSubsidiary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('common:validation.required'),
        path: ['isPTCOrSubsidiary'],
      });
      return;
    }

    const ptcStatus = data.isPTCOrSubsidiary;
    if (ptcStatus !== 'ptc' && ptcStatus !== 'subsidiary') {
      return;
    }

    if (!data.tickerSymbol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('common:validation.required'),
        path: ['tickerSymbol'],
      });
    } else if (!TICKER_PATTERN.test(data.tickerSymbol)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t(
          'onboarding-overview:fields.tickerSymbol.validation.pattern'
        ),
        path: ['tickerSymbol'],
      });
    }

    if (!data.stockExchange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('common:validation.required'),
        path: ['stockExchange'],
      });
    }

    if (data.stockExchange === 'Other' && !data.stockExchangeName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('common:validation.required'),
        path: ['stockExchangeName'],
      });
    }
  });
};
