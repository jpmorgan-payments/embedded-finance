import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { SectionStepFormComponent } from '../../../types';
import {
  CustomerFacingDetailsFormSchema,
  refineCustomerFacingDetailsFormSchema,
} from './CustomerFacingDetailsForm.schema';

export const CustomerFacingDetailsForm: SectionStepFormComponent = ({
  currentPartyData,
}) => {
  // const { t } = useTranslation(['onboarding-overview', 'onboarding']);

  const form =
    useFormContext<z.input<typeof CustomerFacingDetailsFormSchema>>();

  return (
    <div className="eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="dbaName"
        type="text"
        disabled={form.watch('dbaNameNotAvailable')}
        {...(form.watch('dbaNameNotAvailable')
          ? { value: currentPartyData?.organizationDetails?.organizationName }
          : {})}
      />
      <OnboardingFormField
        control={form.control}
        name="dbaNameNotAvailable"
        type="checkbox"
        label="Same as legal name of the company"
      />
      <OnboardingFormField
        control={form.control}
        name="organizationDescription"
        type="textarea"
      />
      <OnboardingFormField
        control={form.control}
        name="website"
        type="text"
        disabled={form.watch('websiteNotAvailable')}
        {...(form.watch('websiteNotAvailable') ? { value: 'N/A' } : {})}
      />
      <OnboardingFormField
        control={form.control}
        name="websiteNotAvailable"
        type="checkbox"
        disableFieldRuleMapping
        label="My business doesn't have a website"
      />
    </div>
  );
};

CustomerFacingDetailsForm.schema = CustomerFacingDetailsFormSchema;
CustomerFacingDetailsForm.refineSchemaFn =
  refineCustomerFacingDetailsFormSchema;
CustomerFacingDetailsForm.modifyFormValuesBeforeSubmit = (
  values: Partial<z.output<typeof CustomerFacingDetailsFormSchema>>
) => {
  const {
    dbaName,
    website,
    dbaNameNotAvailable,
    websiteNotAvailable,
    ...rest
  } = values;
  return {
    ...rest,
    ...(!dbaNameNotAvailable ? { dbaName } : {}),
    ...(!websiteNotAvailable ? { website } : {}),
  };
};
