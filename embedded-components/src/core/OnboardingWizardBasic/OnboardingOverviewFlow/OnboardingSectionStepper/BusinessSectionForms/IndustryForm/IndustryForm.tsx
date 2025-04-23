import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { LearnMorePopoverTrigger } from '../../../LearnMorePopover/LearnMorePopover';
import { SectionStepFormComponent } from '../../../types';
import { IndustryFormSchema } from './IndustryForm.schema';

export const IndustryForm: SectionStepFormComponent = () => {
  // const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof IndustryFormSchema>>();

  return (
    <div className="eb-space-y-6">
      <LearnMorePopoverTrigger content={<div>hello</div>}>
        <Button className="-eb-mt-6 eb-text-primary" size="sm" variant="ghost">
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
