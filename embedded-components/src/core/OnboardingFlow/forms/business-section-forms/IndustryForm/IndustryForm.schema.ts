import { z } from 'zod';

import { sanitizeInput } from '@/lib/utils';
import { getValidationMessage as v } from '@/core/OnboardingFlow/utils/formUtils';

export const IndustryFormSchema = z.object({
  industry: z.string().min(1, v('industry', 'required')),

  organizationDescription: z
    .string()
    .min(1, v('organizationDescription', 'required'))
    .min(10)
    .max(1000)
    .transform(sanitizeInput),
});
