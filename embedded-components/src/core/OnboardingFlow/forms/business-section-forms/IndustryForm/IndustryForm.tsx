import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
// import { useTranslation } from '@/i18n/useTranslation';
import { z } from 'zod';

import { AlertDescription } from '@/components/ui/alert';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import { IndustryFormSchema } from './IndustryForm.schema';

export const IndustryForm: FormStepComponent = () => {
  // const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof IndustryFormSchema>>();

  return (
    <div className="eb-mt-1 eb-space-y-6">
      <Alert variant="informative" density="sm" noTitle className="eb-mt-8">
        <InfoIcon className="eb-size-4" />
        <AlertDescription>
          This is used for regulatory and compliance purposes, so please ensure
          your selection is accurate.
        </AlertDescription>
      </Alert>
      <OnboardingFormField
        control={form.control}
        name="industry"
        type="industrySelect"
        popoutTooltip
        tooltip={
          <div className="eb-mb-6">
            <h2 className="eb-mb-0 eb-font-header eb-text-2xl eb-font-medium">
              How do I make the right choice?
            </h2>
            <p className="eb-mb-0 eb-mt-1 eb-text-sm">
              Please select the same classification chosen when your business or
              organization was registered in North America.
            </p>
            <h3 className="eb-mb-0 eb-mt-3 eb-text-sm eb-font-medium">
              If you are a sole proprietor or your business is registered
              outside of North America,
            </h3>
            <p className="eb-mb-0 eb-mt-1 eb-text-sm">
              You may not have previously selected a classification. In this
              case, please make the best choice based on your primary line of
              business.
            </p>
          </div>
        }
      />
    </div>
  );
};

IndustryForm.schema = IndustryFormSchema;
