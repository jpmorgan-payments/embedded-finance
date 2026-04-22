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
    // Hidden field — carries countryOfResidence from overrideDefaultValues
    // so the refineSchemaFn can validate address country consistency.
    countryOfResidence: z.string().optional(),
  });
};

/**
 * Cross-field validation: address country must match countryOfResidence.
 * This catches API data where the two diverge (e.g. sole prop with a
 * Canadian address but US countryOfResidence).
 */
export const refineContactDetailsFormSchema = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
) => {
  return schema.superRefine((values, ctx) => {
    const cor = values.countryOfResidence;
    const addressCountry = values.individualAddress?.country;
    if (cor && addressCountry && addressCountry !== cor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Address country must match country of residence (${cor}).`,
        path: ['individualAddress', 'country'],
      });
    }
  });
};
