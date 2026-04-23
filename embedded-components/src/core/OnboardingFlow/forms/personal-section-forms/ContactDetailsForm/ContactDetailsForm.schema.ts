import { z } from 'zod';

import {
  useAddressSchemas,
  usePhoneSchemas,
} from '@/core/OnboardingFlow/utils/commonSchemas';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

export const useContactDetailsFormSchema = () => {
  const v = useGetValidationMessage();
  const { PhoneSchema } = usePhoneSchemas('controllerPhone');
  const { AddressSchema } = useAddressSchemas('individualAddress');

  return z.object({
    controllerEmail: z
      .string()
      .min(1, v('controllerEmail', 'required'))
      .email(v('controllerEmail', 'invalid'))
      .max(100, v('controllerEmail', 'maxLength')),
    controllerPhone: PhoneSchema,
    individualAddress: AddressSchema,
  });
};
