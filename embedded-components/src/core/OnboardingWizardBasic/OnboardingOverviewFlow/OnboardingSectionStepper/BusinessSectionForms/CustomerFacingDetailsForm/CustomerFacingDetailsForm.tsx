import { useEffect } from 'react';
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

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'dbaNameNotAvailable' && value.dbaNameNotAvailable) {
        form.setValue('dbaName', '');
        form.clearErrors('dbaName');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentPartyData]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'websiteNotAvailable' && value.websiteNotAvailable) {
        form.setValue('website', '');
        form.clearErrors('website');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <div className="eb-space-y-2">
        <OnboardingFormField
          control={form.control}
          name="dbaName"
          type="text"
          placeholder={
            form.watch('dbaNameNotAvailable')
              ? (currentPartyData?.organizationDetails?.organizationName ?? '')
              : undefined
          }
          disabled={form.watch('dbaNameNotAvailable')}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="dbaNameNotAvailable"
          type="checkbox-basic"
          label="Same as legal name of the company"
          noOptionalLabel
        />
      </div>
      <OnboardingFormField
        control={form.control}
        name="organizationDescription"
        type="textarea"
      />
      <div className="eb-space-y-2">
        <OnboardingFormField
          control={form.control}
          name="website"
          type="text"
          placeholder={form.watch('websiteNotAvailable') ? 'N/A' : undefined}
          disabled={form.watch('websiteNotAvailable')}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="websiteNotAvailable"
          type="checkbox-basic"
          disableFieldRuleMapping
          label="My business doesn't have a website"
          noOptionalLabel
        />
      </div>
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
