import { z } from 'zod';

export const InitialStepFormSchema = z.object({
  organizationName: z.string().min(1, 'Required'),
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
    .min(1, 'Required')
    .length(2, 'Country code must be exactly 2 characters'),
  jurisdiction: z.enum(['US', 'CA']),
  product: z.enum(['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES']),
  organizationEmail: z.string().email(),
});
