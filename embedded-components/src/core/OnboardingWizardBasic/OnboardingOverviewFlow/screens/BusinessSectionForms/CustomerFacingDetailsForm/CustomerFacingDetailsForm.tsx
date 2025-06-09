import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { FormStepComponent } from '../../../flow.types';
import {
  CustomerFacingDetailsFormSchema,
  refineCustomerFacingDetailsFormSchema,
} from './CustomerFacingDetailsForm.schema';

export const CustomerFacingDetailsForm: FormStepComponent = ({
  currentPartyData,
}) => {
  // const { t } = useTranslation(['onboarding-overview', 'onboarding']);

  const form =
    useFormContext<z.input<typeof CustomerFacingDetailsFormSchema>>();

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'dbaNameNotAvailable' && value.dbaNameNotAvailable) {
        form.clearErrors('dbaName');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentPartyData]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'websiteNotAvailable' && value.websiteNotAvailable) {
        form.clearErrors('website');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <div className="eb-space-y-3">
        <OnboardingFormField
          control={form.control}
          name="dbaName"
          type="text"
          valueOverride={
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
      <div>
        <OnboardingFormField
          control={form.control}
          name="organizationDescription"
          type="textarea"
          popoutTooltip
          tooltip={
            <div className="eb-space-y-3">
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                Description example
              </h2>
              <p className="eb-text-sm">
                {
                  '{Business name} creates sustainable and affordable beauty and hair care products that are vegan and cruelty free. Our top selling products are our organic citrus shampoo and conditioner line as well as our paraben and sulfate free mascara.'
                }
              </p>
              <p className="eb-pb-1 eb-text-sm">
                Please ensure this aligns with the business classification you
                have selected.
              </p>
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                Will my customers see this?
              </h2>
              <p className="eb-pb-1 eb-text-sm">
                No. This is used for compliance and regulatory purposes only.
              </p>
            </div>
          }
        />
      </div>
      <div className="eb-space-y-3">
        <OnboardingFormField
          control={form.control}
          name="website"
          type="text"
          valueOverride={form.watch('websiteNotAvailable') ? 'N/A' : undefined}
          disabled={form.watch('websiteNotAvailable')}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="websiteNotAvailable"
          type="checkbox-basic"
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
    websiteNotAvailable,
  };
};
