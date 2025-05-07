import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { LearnMorePopoverTrigger } from '../../../components/LearnMorePopover/LearnMorePopover';
import { SectionStepFormComponent } from '../../../types';
import { IndustryFormSchema } from './IndustryForm.schema';

export const IndustryForm: SectionStepFormComponent = () => {
  // const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof IndustryFormSchema>>();

  return (
    <div className="eb-mt-1 eb-space-y-6">
      <LearnMorePopoverTrigger
        content={
          <div className="eb-space-y-3">
            <h2 className="eb-font-header eb-text-xl eb-font-medium">
              What is an NAICS code?
            </h2>
            <p className="eb-pb-1 eb-text-sm">
              A NAICS code, or North American Industry Classification System
              code, is a six-digit number used to classify businesses by
              industry.
            </p>
            <h2 className="eb-font-header eb-text-xl eb-font-medium">
              Does my business have a code?
            </h2>
            <p className="eb-pb-1 eb-text-sm">
              You&apos;ll need to choose one that best describes your
              income-producing lines of business. The code is linked to a
              description that helps others classify your business. It’s not
              assigned by an external authority.
            </p>
            <h2 className="eb-font-header eb-text-xl eb-font-medium">
              What if I&apos;m a sole proprietor?
            </h2>
            <p className="eb-pb-1 eb-text-sm">
              Even sole proprietors must select an NAICS code. It&apos;s a
              self-assigned code based on the nature of your business.
            </p>
          </div>
        }
      >
        <Button className="eb-text-primary" size="sm" variant="ghost">
          Learn more <InfoIcon />
        </Button>
      </LearnMorePopoverTrigger>
      <OnboardingFormField
        control={form.control}
        name="industry"
        type="industrySelect"
      />
    </div>
  );
};

IndustryForm.schema = IndustryFormSchema;
