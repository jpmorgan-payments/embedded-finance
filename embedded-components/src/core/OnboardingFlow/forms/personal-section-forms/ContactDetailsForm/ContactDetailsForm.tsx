import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  AddressFields,
  OnboardingFormField,
} from '@/core/OnboardingFlow/components';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import {
  getControllerParty,
  getOrganizationParty,
} from '@/core/OnboardingFlow/utils/dataUtils';

import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

export const ContactDetailsForm: FormStepComponent = ({ currentPartyData }) => {
  const { clientData } = useOnboardingContext();
  const orgParty = getOrganizationParty(clientData);
  const isSoleProp =
    orgParty?.organizationDetails?.organizationType === 'SOLE_PROPRIETORSHIP';
  const countryOfFormation = orgParty?.organizationDetails?.countryOfFormation;
  // Use the current party's own countryOfResidence (for owners),
  // falling back to the controller's value for backward compat.
  const countryOfResidence =
    currentPartyData?.individualDetails?.countryOfResidence ??
    getControllerParty(clientData)?.individualDetails?.countryOfResidence;

  const form =
    useFormContext<z.input<ReturnType<typeof useContactDetailsFormSchema>>>();

  const addressCountry = form.watch('individualAddress.country');

  // Detect mismatch between countryOfResidence and address country. For sole
  // props the address country is normally locked to countryOfFormation, but API
  // data may diverge; when it mismatches we unlock the country field so the user
  // can still submit (AddressFields renders the non-blocking warning).
  const hasCountryMismatch =
    !!countryOfResidence &&
    !!addressCountry &&
    addressCountry !== countryOfResidence;

  useEffect(() => {
    const phoneNumber = form.watch('controllerPhone.phoneNumber');
    if (
      phoneNumber &&
      form.watch('controllerPhone.phoneType') !== 'MOBILE_PHONE'
    ) {
      form.setValue('controllerPhone.phoneType', 'MOBILE_PHONE');
    }
  }, [
    form.watch('controllerPhone.phoneType'),
    form.watch('controllerPhone.phoneNumber'),
  ]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField control={form.control} name="controllerEmail" />
      <OnboardingFormField
        control={form.control}
        name="controllerPhone.phoneNumber"
      />
      <AddressFields
        addressName="individualAddress"
        countryReadonly={
          isSoleProp && !!countryOfFormation && !hasCountryMismatch
        }
        mismatchCountry={countryOfResidence}
      />
    </div>
  );
};

ContactDetailsForm.schema = useContactDetailsFormSchema;
