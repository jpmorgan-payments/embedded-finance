import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';

// import { useOnboardingOverviewContext } from '../../../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../../../OnboardingGlobalStepper';
import { SectionStepComponent } from '../../../types';

export const ReviewForm: SectionStepComponent = ({ stepId, handleNext }) => {
  // const { clientData } = useOnboardingOverviewContext();
  const globalStepper = GlobalStepper.useStepper();

  // const { t } = useTranslation('onboarding-overview');

  const metadata = globalStepper.getMetadata('review-and-attest');

  const form = useForm({
    defaultValues: {
      attested: Boolean(metadata?.attested),
    },
    resolver: zodResolver(
      z.object({
        attested: z.boolean().refine((value) => value === true, {
          message:
            'You must attest that the data is true, accurate, and complete.',
        }),
      })
    ),
  });

  return (
    <Form {...form}>
      <form
        id={stepId}
        onSubmit={form.handleSubmit(() => {
          handleNext();
          globalStepper.setMetadata('review-and-attest', {
            attested: true,
          });
        })}
      >
        <div className="eb-mt-6 eb-space-y-8">
          <div className="eb-space-y-4">
            <FormField
              control={form.control}
              name="attested"
              render={({ field }) => (
                <FormItem>
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="eb-text-sm eb-font-medium peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                      The data I am providing is true, accurate and complete to
                      the best of my knowledge.
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
