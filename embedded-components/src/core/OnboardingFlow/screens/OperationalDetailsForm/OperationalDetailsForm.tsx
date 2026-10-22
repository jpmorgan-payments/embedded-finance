import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, InfoIcon, Loader2Icon } from 'lucide-react';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClient,
} from '@/api/generated/smbdo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button } from '@/components/ui';
import { FormLoadingState, StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';

import { createDynamicZodSchema } from './OperationalDetailsForm.schema';
import { QuestionList } from './QuestionField';
import {
  buildQuestionDefaultValues,
  buildVisibleQuestionResponses,
  useApplyQuestionServerErrors,
} from './questionForm';
import { useQuestionTree } from './useQuestionTree';

export const OperationalDetailsForm = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const queryClient = useQueryClient();
  const { clientData } = useOnboardingContext();

  const { originScreenId, goTo, updateSessionData, setIsFormSubmitting } =
    useFlowContext();

  const reviewMode = originScreenId === 'review-attest-section';

  // Get outstanding question IDs and existing question responses
  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = useMemo(
    () => clientData?.questionResponses ?? [],
    [clientData?.questionResponses]
  );

  // Fetch the full question tree (handles arbitrary nesting depth)
  const {
    allQuestions,
    allFormQuestionIds,
    isLoading: isQuestionsLoading,
    error: questionsFetchError,
  } = useQuestionTree({ outstandingQuestionIds, existingQuestionResponses });

  // Build default form values from existing responses
  const defaultValues = useMemo(
    () =>
      buildQuestionDefaultValues(allFormQuestionIds, existingQuestionResponses),
    [allFormQuestionIds, existingQuestionResponses]
  );

  const queryKey = getSmbdoGetClientQueryKey(clientData?.id ?? '');

  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient({
    mutation: {
      onError: () => {
        // Mutation error occurred
      },
      onSuccess: (response) => {
        queryClient.setQueryData(queryKey, response);
        setIsFormSubmitting(false);

        // Check if the response has new outstanding questions.
        // If so, stay on the page so the user can answer them.
        const newOutstandingQuestionIds =
          response?.outstanding?.questionIds ?? [];
        if (newOutstandingQuestionIds.length > 0) {
          setHasNewQuestions(true);
          // Scroll alert into view after render
          setTimeout(() => {
            alertRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 100);
          return;
        }

        if (reviewMode) {
          goTo('review-attest-section', {
            reviewScreenOpenedSectionId: 'additional-questions-section',
          });
        } else {
          goTo('review-attest-section');
          updateSessionData({
            mockedVerifyingSectionId: 'additional-questions-section',
          });
        }
      },
    },
  });

  const dynamicSchema = useMemo(() => {
    if (!allQuestions.length) return z.object({});
    return createDynamicZodSchema(allQuestions);
  }, [allQuestions]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  useApplyQuestionServerErrors({
    form,
    error: updateClientStatus === 'error' ? updateClientError : null,
    allQuestions,
  });

  const onSubmit = (values: Record<string, unknown>) => {
    if (clientData?.id) {
      updateClient({
        id: clientData.id,
        data: {
          questionResponses: buildVisibleQuestionResponses(
            values,
            allQuestions
          ),
        },
      });
    }
  };

  const renderQuestions = () => {
    if (!allQuestions.length) {
      return (
        <div className="eb-text-muted-foreground">
          {t(
            'screens.operationalDetails.noQuestions',
            'There are no additional questions. You may proceed to the next step.'
          )}
        </div>
      );
    }

    return <QuestionList questions={allQuestions} />;
  };

  useEffect(() => {
    setIsFormSubmitting(updateClientStatus === 'pending');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirror the mutation status only when it changes; setIsFormSubmitting is a stable setter and intentionally excluded
  }, [updateClientStatus]);

  const isFormDisabled = isQuestionsLoading || updateClientStatus === 'pending';

  if (isQuestionsLoading) {
    return (
      <FormLoadingState
        message={tString(
          'screens.operationalDetails.loadingQuestions',
          'Loading questions...'
        )}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="eb-space-y-6">
        <StepLayout
          title={t('screens.operationalDetails.title', 'Operational details')}
          subTitle={
            <Button
              type="button"
              variant="link"
              onClick={() => goTo('overview')}
              className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
            >
              <ArrowLeftIcon className="eb-size-3.5" />
              {t('common:overview', 'Overview')}
            </Button>
          }
          description={t(
            'screens.operationalDetails.description',
            'Please answer these additional questions to help us understand your business operations.'
          )}
          alert={
            hasNewQuestions ? (
              <Alert ref={alertRef} variant="informative" noTitle>
                <InfoIcon className="eb-h-4 eb-w-4" />
                <AlertDescription>
                  {t(
                    'screens.operationalDetails.newQuestionsGenerated',
                    'Based on your responses, a few additional questions are needed. Please complete them to continue.'
                  )}
                </AlertDescription>
              </Alert>
            ) : undefined
          }
        >
          <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
            {renderQuestions()}

            <ServerErrorAlert
              error={questionsFetchError || updateClientError}
            />
            <Button
              type="submit"
              size="lg"
              className="eb-w-full eb-text-lg"
              disabled={isFormDisabled}
            >
              {updateClientStatus === 'pending' && (
                <Loader2Icon className="eb-animate-spin" />
              )}
              {reviewMode
                ? t(
                    'screens.operationalDetails.saveAndReturn',
                    'Save and return to review'
                  )
                : t(
                    'screens.operationalDetails.saveAndContinue',
                    'Save and continue to review'
                  )}
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
