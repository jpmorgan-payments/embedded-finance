import { i18n } from '@/i18n/config';
import { z } from 'zod';

import {
  AddressSchema,
  PhoneSchema,
} from '@/core/OnboardingWizardBasic/utils/schemas';

export const BusinessContactInfoFormSchema = z.object({
  organizationEmail: z
    .string()
    .email(i18n.t('onboarding:fields.organizationEmail.validation.invalid'))
    .max(
      100,
      i18n.t('onboarding:fields.organizationEmail.validation.maxLength')
    ),
  organizationPhone: PhoneSchema,
  addresses: z.array(AddressSchema).refine((addresses) => {
    const types = addresses.map((addr) => addr.addressType);
    return new Set(types).size === types.length;
  }, i18n.t('onboarding:fields.controllerAddresses.validation.uniqueTypes')),
});
