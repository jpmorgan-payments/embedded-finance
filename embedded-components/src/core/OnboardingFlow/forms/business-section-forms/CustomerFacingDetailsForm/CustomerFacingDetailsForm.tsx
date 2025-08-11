import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import {
  CustomerFacingDetailsFormSchema,
  refineCustomerFacingDetailsFormSchema,
} from './CustomerFacingDetailsForm.schema';

export const CustomerFacingDetailsForm: FormStepComponent = ({
  currentPartyData,
}) => {
  const { t } = useTranslation(['onboarding-overview']);

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

  const orgName =
    currentPartyData?.organizationDetails?.organizationName ?? undefined;

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <div className="eb-space-y-3">
        <OnboardingFormField
          control={form.control}
          name="dbaName"
          type="text"
          valueOverride={
            form.watch('dbaNameNotAvailable')
              ? orgName === 'PLACEHOLDER_ORG_NAME'
                ? 'N/A'
                : orgName
              : undefined
          }
          disabled={form.watch('dbaNameNotAvailable')}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="dbaNameNotAvailable"
          type="checkbox-basic"
          label={t('fields.dbaNameNotAvailable.label')}
          noOptionalLabel
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
          label={t('fields.websiteNotAvailable.label')}
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
