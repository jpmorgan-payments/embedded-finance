import { useEffect, useMemo } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangle, Loader2Icon } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Form } from '@/components/ui';
import { useFlowContext } from '@/core/OnboardingFlow/contexts';
import { useTermsAndConditions } from '@/core/OnboardingFlow/screens/ReviewAndAttestSectionForms/TermsAndConditionsForm/useTermsAndConditions';
import { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

import { useDeltaPendingFieldsForm } from './DeltaPendingFieldsPanel';
import { InlineCompactReview } from './InlineCompactReview';
import { useDeltaReviewSubmit } from './useDeltaReviewSubmit';

/**
 * Inline delta review: always-expanded compact data + in-place missing editors,
 * combined attestation, Agree and finish. No top pending panel, no modals.
 */
export const InlineDeltaReviewForm: React.FC<StepperStepProps> = ({
  handlePrev,
  getPrevButtonLabel,
}) => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const {
    goTo,
    sections,
    setLiveReviewFormValues,
    savedFormValues,
    deltaModeActive,
  } = useFlowContext();

  const { form: deltaPendingForm, allQuestions: deltaAllQuestions } =
    useDeltaPendingFieldsForm(sections);

  const terms = useTermsAndConditions({
    enabled: true,
    combineAccuracyAttestation: true,
    onAfterKycSuccess: () => {
      goTo('overview', { resetHistory: true });
    },
  });

  const {
    handleDeltaSubmit,
    shouldDisplayAlert,
    deltaSaveError,
    partyUpdateError,
    clientUpdateError,
    pendingFieldsComplete,
  } = useDeltaReviewSubmit({
    deltaPendingForm,
    deltaAllQuestions,
    terms,
  });

  const liveDeltaValues = useWatch({
    control: deltaPendingForm.control,
  }) as Record<string, unknown> | undefined;

  const reviewFormValues = useMemo(
    () => ({
      ...(savedFormValues as Record<string, unknown> | undefined),
      ...(liveDeltaValues ?? {}),
    }),
    [savedFormValues, liveDeltaValues]
  );

  useEffect(() => {
    if (!deltaModeActive) {
      setLiveReviewFormValues(undefined);
      return undefined;
    }
    setLiveReviewFormValues(reviewFormValues);
    return () => {
      setLiveReviewFormValues(undefined);
    };
  }, [deltaModeActive, reviewFormValues, setLiveReviewFormValues]);

  return (
    <form
      onSubmit={(e) => {
        handleDeltaSubmit(e).catch(() => {
          // Errors surfaced via ServerErrorAlert / form state
        });
      }}
      className="eb-flex eb-flex-auto eb-flex-col"
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        {shouldDisplayAlert && (
          <Alert variant="warning">
            <AlertTriangle className="eb-h-4 eb-w-4" />
            <AlertTitle>
              {t('reviewAndAttest.thereIsAProblem', 'There is a problem')}
            </AlertTitle>
            <AlertDescription>
              {t(
                'reviewAndAttest.provideMissingDetails',
                'Please provide missing details before finishing your application.'
              )}
            </AlertDescription>
          </Alert>
        )}

        <InlineCompactReview sections={sections} form={deltaPendingForm} />

        <div className="eb-space-y-6">
          <Form {...terms.form}>
            <div className="eb-space-y-6">{terms.termsBody}</div>
          </Form>
          <ServerErrorAlert
            error={
              deltaSaveError
                ? ({ message: 'Failed to save remaining details' } as any)
                : partyUpdateError || clientUpdateError
            }
          />
        </div>
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        <div className="eb-flex eb-flex-col eb-gap-3">
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="eb-w-full eb-text-lg"
            disabled={
              terms.isFormSubmitting ||
              !terms.attestationComplete ||
              !pendingFieldsComplete
            }
          >
            {terms.isFormSubmitting && (
              <Loader2Icon className="eb-animate-spin" />
            )}
            {tString(
              'stepperRenderer.buttons.agreeAndFinish',
              'Agree and finish'
            )}
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
  );
};
