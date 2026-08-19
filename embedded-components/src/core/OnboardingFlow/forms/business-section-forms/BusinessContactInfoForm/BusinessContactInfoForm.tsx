import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  AddressFields,
  OnboardingFormField,
} from '@/core/OnboardingFlow/components';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';

import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

export const BusinessContactInfoForm: FormStepComponent = () => {
  const { clientData } = useOnboardingContext();
  const countryOfFormation =
    getOrganizationParty(clientData)?.organizationDetails?.countryOfFormation;

  const form =
    useFormContext<
      z.input<ReturnType<typeof useBusinessContactInfoFormSchema>>
    >();

  const organizationPhoneType = form.watch('organizationPhone.phoneType');
  const organizationPhoneNumber = form.watch('organizationPhone.phoneNumber');

  useEffect(() => {
    if (organizationPhoneNumber && organizationPhoneType !== 'BUSINESS_PHONE') {
      form.setValue('organizationPhone.phoneType', 'BUSINESS_PHONE');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- default the phone type only when the number/type change; form is read as latest and intentionally excluded
  }, [organizationPhoneNumber, organizationPhoneType]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField control={form.control} name="organizationEmail" />
      <OnboardingFormField
        control={form.control}
        name="organizationPhone.phoneNumber"
      />
      <AddressFields
        addressName="organizationAddress"
        countryReadonly={!!countryOfFormation}
      />
    </div>
  );
};

BusinessContactInfoForm.schema = useBusinessContactInfoFormSchema;
