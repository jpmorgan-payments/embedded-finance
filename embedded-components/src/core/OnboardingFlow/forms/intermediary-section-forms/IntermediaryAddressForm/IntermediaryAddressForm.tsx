import { z } from 'zod';

import { AddressFields } from '@/core/OnboardingFlow/components';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import type { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types/form.types';
import { useAddressSchemas } from '@/core/OnboardingFlow/utils/commonSchemas';

// Reuse the canonical organization-address schema (localized validation
// messages, required fields, max lengths, subdivision + postal-code rules)
// instead of a parallel intermediary-only field dialect.
export const useIntermediaryAddressSchema = () => {
  const { AddressSchema } = useAddressSchemas('organizationAddress');
  return z.object({
    organizationAddress: AddressSchema,
  });
};

export const IntermediaryAddressForm: FormStepComponent = () => (
  <div className="eb-mt-6 eb-space-y-6">
    <AddressFields addressName="organizationAddress" />
  </div>
);

IntermediaryAddressForm.schema = useIntermediaryAddressSchema;

// Intermediary legal addresses use LEGAL_ADDRESS per the official
// indirect-ownership examples, unlike the standard business-contact address
// (which defaults to BUSINESS_ADDRESS).
IntermediaryAddressForm.modifyFormValuesBeforeSubmit = (values) =>
  ({
    ...values,
    organizationAddress: {
      ...(values as { organizationAddress?: Record<string, unknown> })
        .organizationAddress,
      addressType: 'LEGAL_ADDRESS',
    },
  }) as Partial<OnboardingFormValuesSubmit>;
