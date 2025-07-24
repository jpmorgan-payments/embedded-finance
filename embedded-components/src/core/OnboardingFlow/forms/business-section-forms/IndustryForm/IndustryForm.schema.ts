import { i18n } from '@/i18n/config';
import { z } from 'zod';

export const IndustryFormSchema = z.object({
  industry: z
    .string()
    .min(1, i18n.t('onboarding:fields.industry.validation.required')),
});
