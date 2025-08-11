import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { sanitizeInput } from '@/lib/utils';

export const IndustryFormSchema = z.object({
  industry: z
    .string()
    .min(1, i18n.t('onboarding:fields.industry.validation.required')),

  organizationDescription: z
    .string()
    .min(10)
    .max(1000)
    .transform(sanitizeInput),
});
