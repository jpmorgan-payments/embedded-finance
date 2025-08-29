import { z } from 'zod';

import {
  AddressSchema,
  PhoneSchema,
} from '@/core/OnboardingFlow/utils/commonSchemas';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

export const useBusinessContactInfoFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    organizationEmail: z
      .string()
      .min(1, v('organizationEmail', 'required'))
      .email(v('organizationEmail', 'invalid'))
      .max(100, v('organizationEmail', 'maxLength', 100)),
    organizationPhone: PhoneSchema,
    addresses: z.array(AddressSchema),
  });
};
