import { z } from 'zod';

import { sanitizeInput } from '@/lib/utils';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

export const useIndustryFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    organizationDescription: z
      .string()
      .min(1, v('organizationDescription', 'required'))
      .min(10, v('organizationDescription', 'minLength', 10))
      .max(1000, v('organizationDescription', 'maxLength', 1000))
      .refine(
        (val) => !/<[^>]*>/g.test(val),
        v('organizationDescription', 'noHtml')
      )
      .refine(
        (val) => !/(https?:\/\/[^\s]+)/g.test(val),
        v('organizationDescription', 'noUrls')
      )
      .transform(sanitizeInput),
    industry: z.string().min(1, v('industry', 'required')),
  });
};
