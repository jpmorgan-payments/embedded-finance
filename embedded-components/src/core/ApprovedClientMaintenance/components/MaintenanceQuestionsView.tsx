import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon, Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Separator } from '@/components/ui';
import { createDynamicZodSchema } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm.schema';
import { QuestionField } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/QuestionField';
import {
  getChildQuestions,
  isQuestionVisible,
  isTopLevelQuestion,
} from '@/core/OnboardingFlow/utils/questionTree';

import type { MaintenanceQuestionResponse } from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenancePageBody } from './MaintenancePageBody';

type MaintenanceQuestionsViewProps = {
  /** The outstanding question tree, as loaded for onboarding. */
  questions: QuestionResponse[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  /** Resolves `more` when the answers opened up further questions to stay for. */
  onSubmit: (
    responses: MaintenanceQuestionResponse[]
  ) => Promise<'done' | 'more'>;
};

const hasAnswer = (value: unknown) =>
  Array.isArray(value)
    ? value.some((item) => String(item ?? '').trim() !== '')
    : String(value ?? '').trim() !== '';

export function MaintenanceQuestionsView({
  questions,
  breadcrumbs,
  isLoading,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: MaintenanceQuestionsViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const schema = useMemo(
    () =>
      questions.length > 0 ? createDynamicZodSchema(questions) : z.object({}),
    [questions]
  );
  const form = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });
  const values = form.watch();

  // Visibility follows the same parent-answer rules as onboarding, read from live form state.
  const isVisible = (question: QuestionResponse) =>
    isQuestionVisible(
      question,
      questions,
      (questionId) => values[`question_${questionId}`]
    );
  const visibleQuestions = questions.filter(
    (question) => question.id && isVisible(question)
  );
  const topLevelQuestions = questions.filter((question) =>
    isTopLevelQuestion(question, questions)
  );
  const getVisibleFollowUps = (parentId: string | undefined) =>
    getChildQuestions(parentId, questions).filter(isVisible);
  // A question counts once with its follow-ups, so opening one never grows the total.
  const isFullyAnswered = (question: QuestionResponse): boolean =>
    hasAnswer(values[`question_${question.id}`]) &&
    getVisibleFollowUps(question.id).every(isFullyAnswered);
  const answeredCount = topLevelQuestions.filter(isFullyAnswered).length;

  const submit = form.handleSubmit(async (formValues) => {
    const responses = visibleQuestions.flatMap((question) => {
      const value = formValues[`question_${question.id}`];
      return question.id && hasAnswer(value)
        ? [
            {
              questionId: question.id,
              values: (Array.isArray(value) ? value : [value]).map(String),
            },
          ]
        : [];
    });
    setHasNewQuestions((await onSubmit(responses)) === 'more');
  });

  const renderFollowUps = (parentId: string | undefined): ReactNode => {
    const followUps = getVisibleFollowUps(parentId);
    if (followUps.length === 0) return null;
    return (
      <div
        data-question-follow-ups=""
        className="eb-mt-4 eb-space-y-4 eb-border-l-2 eb-pl-4 eb-duration-200 eb-animate-in eb-fade-in-0 motion-reduce:eb-animate-none"
      >
        {followUps.map((followUp) => (
          <div key={followUp.id} data-question-id={followUp.id}>
            <QuestionField question={followUp} />
            {renderFollowUps(followUp.id)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t('questions.title')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('questions.description')}
        </p>
      </header>
      <Form {...form}>
        <form
          data-maintenance-page-fill=""
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <MaintenancePageBody contentClassName="eb-space-y-5 eb-px-4 eb-py-5 @[40rem]:eb-px-5">
            {hasNewQuestions ? (
              <Alert variant="informative" noTitle>
                <InfoIcon className="eb-size-4" />
                <AlertDescription>
                  {t('questions.newQuestions')}
                </AlertDescription>
              </Alert>
            ) : null}
            {error ? <ServerErrorAlert error={error as never} /> : null}
            {isLoading ? (
              <p className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                <Loader2Icon className="eb-size-4 eb-animate-spin" />
                {t('questions.loading')}
              </p>
            ) : questions.length === 0 ? (
              <div>
                <p className="eb-text-sm eb-font-medium">
                  {t('questions.emptyTitle')}
                </p>
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {t('questions.emptyDescription')}
                </p>
              </div>
            ) : (
              <>
                <p
                  data-question-count=""
                  aria-live="polite"
                  className="eb-text-sm eb-font-medium eb-tabular-nums"
                >
                  {t('questions.progress', {
                    answered: answeredCount,
                    total: topLevelQuestions.length,
                  })}
                </p>
                <div className="eb-space-y-6">
                  {topLevelQuestions.map((question, index) => (
                    <Fragment key={question.id ?? `question-${index}`}>
                      {index > 0 ? <Separator /> : null}
                      <div data-question-id={question.id}>
                        <QuestionField question={question} />
                        {renderFollowUps(question.id)}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </MaintenancePageBody>
          <MaintenanceFormFooter
            leading={
              <Button
                type="button"
                variant="outlineSurface"
                size="sm"
                onClick={onBack}
              >
                {t('questions.cancel')}
              </Button>
            }
            trailing={
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || questions.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : null}
                {t('questions.save')}
              </Button>
            }
          />
        </form>
      </Form>
    </div>
  );
}
