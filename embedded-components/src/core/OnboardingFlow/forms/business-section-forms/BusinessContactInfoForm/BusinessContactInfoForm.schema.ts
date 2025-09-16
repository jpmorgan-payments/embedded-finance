import { z } from 'zod';

import {
  PhoneSchema,
  useAddressSchemas,
} from '@/core/OnboardingFlow/utils/commonSchemas';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

export const useBusinessContactInfoFormSchema = () => {
  const v = useGetValidationMessage();
  const { AddressSchema } = useAddressSchemas('organizationAddress');

  return z.object({
    organizationEmail: z
      .string()
      .min(1, v('organizationEmail', 'required'))
      .email(v('organizationEmail', 'invalid'))
      .max(100, v('organizationEmail', 'maxLength', 100)),
    organizationPhone: PhoneSchema,
    organizationAddress: AddressSchema,
  });
};
