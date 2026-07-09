import type { FC } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, Form } from '@/components/ui';
import { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

import { useTermsAndConditions } from './useTermsAndConditions';

export const TermsAndConditionsForm: FC<StepperStepProps> = ({
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  const { tString } = useTranslationWithTokens('onboarding-overview');
  const {
    form,
    useHostAckList,
    hostAckComplete,
    isFormSubmitting,
    trySubmit,
    termsBody,
  } = useTermsAndConditions({
    onAfterKycSuccess: handleNext,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          trySubmit().catch(() => {
            // Errors are surfaced via ServerErrorAlert / form state
          });
        }}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-mt-6 eb-flex-auto eb-space-y-6">{termsBody}</div>
        <div className="eb-mt-6 eb-space-y-6">
          <div className="eb-flex eb-flex-col eb-gap-3">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getNextButtonLabel() === null,
              })}
              disabled={
                isFormSubmitting || (useHostAckList && !hostAckComplete)
              }
            >
              {isFormSubmitting && <Loader2Icon className="eb-animate-spin" />}
              {getNextButtonLabel() ??
                tString('stepperRenderer.buttons.agreeAndFinish')}
            </Button>
            <Button
              type="button"
              onClick={handlePrev}
              variant="secondary"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getPrevButtonLabel() === null,
              })}
            >
              {getPrevButtonLabel()}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
