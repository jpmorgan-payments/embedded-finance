import { z } from 'zod';

import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useAddressSchemas } from '@/core/OnboardingFlow/utils/commonSchemas';
import { useGetValidationMessage } from '@/core/OnboardingFlow/utils/formUtils';
import { NAME_PATTERN } from '@/core/OnboardingFlow/utils/validationPatterns';

export const useCharitableDonorFormSchema = () => {
  const v = useGetValidationMessage();
  const { AddressSchema } = useAddressSchemas('organizationAddress');

  return z.object({
    organizationName: z
      .string()
      .min(1, v('organizationName', 'required'))
      .min(2, v('organizationName', 'minLength'))
      .max(100, v('organizationName', 'maxLength'))
      .refine(
        (val) => NAME_PATTERN.test(val),
        v('organizationName', 'pattern')
      ),
    countryOfFormation: z
      .string()
      .length(2, v('countryOfFormation', 'length'))
      .refine(
        (val) => COUNTRIES_OF_FORMATION.includes(val),
        v('countryOfFormation', 'invalid')
      ),
    organizationAddress: AddressSchema,
  });
};
