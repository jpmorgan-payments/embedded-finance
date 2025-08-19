import { i18n } from '@/i18n/config';
import { z } from 'zod';

import {
  AddressSchema,
  PhoneSchema,
} from '@/core/OnboardingFlow/utils/commonSchemas';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';

export const useContactDetailsFormSchema = () => {
  const v = useGetValidationMessage();
  return z.object({
    controllerEmail: z
      .string()
      .email(v('controllerEmail', 'invalid'))
      .max(100, v('controllerEmail', 'maxLength')),
    controllerPhone: PhoneSchema,
    controllerAddresses: z.array(AddressSchema).refine((addresses) => {
      const types = addresses.map((addr) => addr.addressType);
      return new Set(types).size === types.length;
    }, i18n.t('onboarding:fields.controllerAddresses.validation.uniqueTypes')),
  });
};
