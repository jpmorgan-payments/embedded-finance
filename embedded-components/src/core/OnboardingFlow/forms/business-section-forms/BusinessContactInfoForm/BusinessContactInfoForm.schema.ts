import { i18n } from '@/i18n/config';
import { z } from 'zod';

import {
  AddressSchema,
  PhoneSchema,
} from '@/core/OnboardingFlow/utils/commonSchemas';

export const BusinessContactInfoFormSchema = z.object({
  organizationEmail: z
    .string()
    .email(
      i18n.t(
        'onboarding-overview:fields.organizationEmail.validation.invalid',
        {
          fallbackLng: 'en',
          defaultValue: i18n.t(
            'onboarding:fields.organizationEmail.validation.invalid'
          ),
        }
      )
    )
    .max(
      100,
      i18n.t(
        'onboarding-overview:fields.organizationEmail.validation.maxLength',
        {
          fallbackLng: 'en',
          defaultValue: i18n.t(
            'onboarding:fields.organizationEmail.validation.maxLength'
          ),
        }
      )
    ),
  organizationPhone: PhoneSchema,
  addresses: z.array(AddressSchema).refine(
    (addresses) => {
      const types = addresses.map((addr) => addr.addressType);
      return new Set(types).size === types.length;
    },
    i18n.t('onboarding-overview:fields.addresses.validation.uniqueTypes', {
      fallbackLng: 'en',
      defaultValue: i18n.t(
        'onboarding:fields.controllerAddresses.validation.uniqueTypes'
      ),
    })
  ),
});
