import { useMemo, useRef, useState } from 'react';
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
import { createDynamicZodSchema } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm.schema';
import { QuestionList } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/QuestionField';
import {
  buildQuestionDefaultValues,
  buildVisibleQuestionResponses,
  useApplyQuestionServerErrors,
} from '@/core/OnboardingFlow/screens/OperationalDetailsForm/questionForm';
import { useQuestionTree } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/useQuestionTree';
import { clientHasRequestedDocuments } from '@/core/OnboardingFlow/utils/dataUtils';

/**
 * Answers the questions in a Request for Information (RFI), raised during
 * review (`INFORMATION_REQUESTED`) or after approval (`APPROVED`). Only
 * outstanding questions are shown; answers are saved with `PATCH /clients`
 * (`questionResponses`) and no separate submit call is needed.
 */
export const RequestedQuestionsScreen = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const queryClient = useQueryClient();
  const { clientData, docUploadOnlyMode } = useOnboardingContext();
  const { goTo, updateSessionData, setIsFormSubmitting } = useFlowContext();

  const returnScreenId = docUploadOnlyMode
    ? 'upload-documents-section'
    : 'overview';

  // Questions answered on this screen stay listed with their answers so a
  // follow-up question revealed by an answer keeps its parent for context.
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);

  const outstandingQuestionIds = useMemo(
    () => clientData?.outstanding?.questionIds ?? [],
    [clientData?.outstanding?.questionIds]
  );

  // Earlier onboarding answers are not part of this request, so only seed
  // responses for questions that are outstanding or answered here.
  const relevantResponses = useMemo(
    () =>
      (clientData?.questionResponses ?? []).filter(
        (response) =>
          !!response.questionId &&
          (outstandingQuestionIds.includes(response.questionId) ||
            answeredQuestionIds.includes(response.questionId))
      ),
    [clientData?.questionResponses, outstandingQuestionIds, answeredQuestionIds]
  );

  const {
    allQuestions,
    allFormQuestionIds,
    isLoading: isQuestionsLoading,
    error: questionsFetchError,
  } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses: relevantResponses,
  });

  const defaultValues = useMemo(
    () => buildQuestionDefaultValues(allFormQuestionIds, relevantResponses),
    [allFormQuestionIds, relevantResponses]
  );

  const dynamicSchema = useMemo(
    () =>
      allQuestions.length ? createDynamicZodSchema(allQuestions) : z.object({}),
    [allQuestions]
  );

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  const [hasFollowUpQuestions, setHasFollowUpQuestions] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient({
    mutation: {
      onMutate: () => setIsFormSubmitting(true),
      onError: () => setIsFormSubmitting(false),
      onSuccess: (response, variables) => {
        const clientQueryKey = getSmbdoGetClientQueryKey(clientData?.id ?? '');
        queryClient.setQueryData(clientQueryKey, response);
        // Status and outstanding items can change after the save (e.g. back
        // to REVIEW_IN_PROGRESS), so refetch rather than trust the response.
        queryClient.invalidateQueries({ queryKey: clientQueryKey });
        setIsFormSubmitting(false);

        const submittedIds = (variables.data?.questionResponses ?? [])
          .map((response) => response.questionId)
          .filter((id): id is string => !!id);
        setAnsweredQuestionIds((prev) => [
          ...new Set([...prev, ...submittedIds]),
        ]);
        form.reset(form.getValues());

        if ((response?.outstanding?.questionIds?.length ?? 0) > 0) {
          setHasFollowUpQuestions(true);
          setTimeout(() => {
            alertRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 100);
          return;
        }

        updateSessionData({ requestedQuestionsSubmitted: true });
        goTo(
          clientHasRequestedDocuments(response)
            ? 'upload-documents-section'
            : returnScreenId,
          { resetHistory: true }
        );
      },
    },
  });

  useApplyQuestionServerErrors({
    form,
    error: updateClientStatus === 'error' ? updateClientError : null,
    allQuestions,
  });

  const onSubmit = (values: Record<string, unknown>) => {
    if (!clientData?.id) return;
    updateClient({
      id: clientData.id,
      data: {
        questionResponses: buildVisibleQuestionResponses(values, allQuestions),
      },
    });
  };

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

  const isSubmitting = updateClientStatus === 'pending';
  const hasQuestions = allQuestions.length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="eb-space-y-6">
        <StepLayout
          title={t('screens.requestedQuestions.title')}
          subTitle={
            <Button
              type="button"
              variant="link"
              onClick={() => goTo(returnScreenId, { resetHistory: true })}
              className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
            >
              <ArrowLeftIcon className="eb-size-3.5" />
              {docUploadOnlyMode
                ? t('documentUpload.title')
                : t('common:overview', 'Overview')}
            </Button>
          }
          description={t('screens.requestedQuestions.description')}
          alert={
            hasFollowUpQuestions ? (
              <Alert ref={alertRef} variant="informative" noTitle>
                <InfoIcon className="eb-h-4 eb-w-4" />
                <AlertDescription>
                  {t('screens.requestedQuestions.followUpQuestions')}
                </AlertDescription>
              </Alert>
            ) : undefined
          }
        >
          <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
            {hasQuestions ? (
              <QuestionList questions={allQuestions} multilineText />
            ) : (
              <p className="eb-text-muted-foreground">
                {t('screens.requestedQuestions.noQuestions')}
              </p>
            )}

            <ServerErrorAlert
              error={questionsFetchError || updateClientError}
            />
            {hasQuestions && (
              <Button
                type="submit"
                size="lg"
                className="eb-w-full eb-text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2Icon className="eb-animate-spin" />}
                {clientHasRequestedDocuments(clientData)
                  ? t('screens.requestedQuestions.submitAndContinue')
                  : t('screens.requestedQuestions.submit')}
              </Button>
            )}
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
