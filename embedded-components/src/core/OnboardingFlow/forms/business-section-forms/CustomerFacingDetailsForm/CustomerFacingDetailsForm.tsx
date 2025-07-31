import { useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { useFormContext } from 'react-hook-form';
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
          label={t('fields.dbaNameNotAvailable.label')}
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
                {t(
                  'fields.organizationDescription.tooltipContent.exampleTitle'
                )}
              </h2>
              <p className="eb-text-sm">
                {t('fields.organizationDescription.tooltipContent.exampleText')}
              </p>
              <p className="eb-pb-1 eb-text-sm">
                {t(
                  'fields.organizationDescription.tooltipContent.alignmentNote'
                )}
              </p>
              <h2 className="eb-font-header eb-text-2xl eb-font-medium">
                {t(
                  'fields.organizationDescription.tooltipContent.visibilityTitle'
                )}
              </h2>
              <p className="eb-pb-1 eb-text-sm">
                {t(
                  'fields.organizationDescription.tooltipContent.visibilityText'
                )}
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
