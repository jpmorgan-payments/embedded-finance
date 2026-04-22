import { z } from 'zod';

import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

const TICKER_PATTERN = /^[A-Z0-9]*$/;

export const usePubliclyTradedFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    isPTCOrSubsidiary: z.string(),
    isSubsidiary: z.string(),
    tickerSymbol: z.string(),
    stockExchange: z.string(),
    stockExchangeName: z.string(),
  });
};

/**
 * Refinement: when isPTCOrSubsidiary is 'yes', all trading fields become required.
 * When stockExchange is 'Other', stockExchangeName becomes required.
 */
export const refinePubliclyTradedFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((data, ctx) => {
    if (data.isPTCOrSubsidiary !== 'yes') {
      // Not a PTC — no further validation needed
      return;
    }

    if (!data.isSubsidiary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Please indicate whether your organization is publicly traded or a subsidiary.',
        path: ['isSubsidiary'],
      });
    }

    if (!data.tickerSymbol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ticker symbol is required.',
        path: ['tickerSymbol'],
      });
    } else {
      if (!TICKER_PATTERN.test(data.tickerSymbol)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Ticker symbol must contain only uppercase letters and numbers.',
          path: ['tickerSymbol'],
        });
      }
      if (data.tickerSymbol.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ticker symbol must be at most 10 characters.',
          path: ['tickerSymbol'],
        });
      }
    }

    if (!data.stockExchange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a stock exchange.',
        path: ['stockExchange'],
      });
    }

    if (data.stockExchange === 'Other' && !data.stockExchangeName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the name of the stock exchange.',
        path: ['stockExchangeName'],
      });
    }

    if (data.stockExchangeName && data.stockExchange !== 'Other') {
      // Clear stockExchangeName if not using "Other"
    }
  });
};
