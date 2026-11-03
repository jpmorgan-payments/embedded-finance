import { tActive } from '@/i18n/activeI18n';
import { z } from 'zod';

import { PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES } from '@/core/OnboardingFlow/consts/stockExchanges';

const TICKER_PATTERN = /^[A-Z0-9]*$/;

// Lazy errors resolve at validation time, so module-level schemas follow the
// active provider's locale and content tokens.
const requiredError = { error: () => tActive('common:validation.required') };
const invalidOptionError = {
  error: () => tActive('validation:common.invalidOption'),
};

export const GatewayScreenFormSchema = z.object({
  organizationTypeHierarchy: z.object({
    generalOrganizationType: z
      .union([
        z.enum(
          ['SOLE_PROPRIETORSHIP', 'REGISTERED_BUSINESS', 'OTHER'],
          invalidOptionError
        ),
        z.literal(''),
      ])
      .refine((val) => val !== '', requiredError),
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
          invalidOptionError
        ),
        z.literal(''),
      ])
      .refine((val) => val !== '', requiredError),
  }),
  // Offered only when OnboardingFlow `experimental_availableCountriesOfFormation` includes a non-US country.
  countryOfFormation: z.string().default(''),
  // PTC fields — conditionally validated via refineGatewaySchema
  isPTCOrSubsidiary: z.string().default(''),
  isSubsidiary: z.string().default(''),
  tickerSymbol: z.string().default(''),
  stockExchange: z.string().default(''),
  stockExchangeName: z.string().default(''),
});

/**
 * Accepts host-defined organization types from
 * `experimental_organizationTypesByCountryOfFormation`, which may not be API enum values.
 */
export const GatewayScreenFormSchemaWithHostOrganizationTypes =
  GatewayScreenFormSchema.extend({
    organizationTypeHierarchy:
      GatewayScreenFormSchema.shape.organizationTypeHierarchy.extend({
        specificOrganizationType: z
          .string()
          .refine((val) => val !== '', requiredError),
      }),
  });

/**
 * Refinement for PTC fields:
 * - isPTCOrSubsidiary required when org type is eligible
 * - ticker and exchange required when PTC/subsidiary selected
 */
export const refineGatewaySchema = (
  schema: z.ZodObject<Record<string, z.ZodType>>
) => {
  return schema.superRefine((rawData, ctx) => {
    const data = rawData as Partial<z.output<typeof GatewayScreenFormSchema>>;
    const orgType =
      data.organizationTypeHierarchy?.specificOrganizationType ?? '';
    const isPTCEligibleOrg = (
      PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES as readonly string[]
    ).includes(orgType);

    // Require the radio selection when the org type is PTC-eligible
    if (isPTCEligibleOrg && !data.isPTCOrSubsidiary) {
      ctx.addIssue({
        code: 'custom',
        message: tActive('common:validation.required'),
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
        code: 'custom',
        message: tActive('common:validation.required'),
        path: ['tickerSymbol'],
      });
    } else if (!TICKER_PATTERN.test(data.tickerSymbol)) {
      ctx.addIssue({
        code: 'custom',
        message: tActive(
          'onboarding-overview:fields.tickerSymbol.validation.pattern'
        ),
        path: ['tickerSymbol'],
      });
    }

    if (!data.stockExchange) {
      ctx.addIssue({
        code: 'custom',
        message: tActive('common:validation.required'),
        path: ['stockExchange'],
      });
    }

    if (data.stockExchange === 'Other' && !data.stockExchangeName) {
      ctx.addIssue({
        code: 'custom',
        message: tActive('common:validation.required'),
        path: ['stockExchangeName'],
      });
    }
  });
};
