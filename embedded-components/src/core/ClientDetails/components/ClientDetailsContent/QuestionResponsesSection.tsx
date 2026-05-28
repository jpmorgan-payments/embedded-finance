import { useMemo } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import { cn } from '@/lib/utils';
import { useSmbdoListQuestions } from '@/api/generated/smbdo';
import type {
  ClientQuestionResponse,
  ClientResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';
import { Skeleton } from '@/components/ui';

import { formatQuestionResponseValue } from '../../utils/formatClientFacing';

interface QuestionResponsesSectionProps {
  client: ClientResponse;
  /** When true, renders the section title from t('sections.questionResponses') */
  showTitle?: boolean;
  headingLevel?: HeadingLevel;
}

export function QuestionResponsesSection({
  client,
  showTitle = false,
  headingLevel = 2,
}: QuestionResponsesSectionProps) {
  const { t, tString, i18n } = useTranslationWithTokens('client-details');
  const locale =
    i18n.resolvedLanguage
      ?.replace('_', '-')
      .replace('US', '-US')
      .replace('CA', '-CA') || 'en-US';

  const questionLabelUnavailable = tString('labels.questionTextUnavailable');

  const questionResponses = client.questionResponses ?? [];
  const questionIds = useMemo(
    () =>
      questionResponses
        .map((r) => r.questionId)
        .filter(Boolean)
        .join(','),
    [questionResponses]
  );

  const { data: questionsData, isLoading: questionsLoading } =
    useSmbdoListQuestions(
      { questionIds },
      {
        query: { enabled: questionIds.length > 0 },
      }
    );

  const questions = questionsData?.questions ?? [];
  const showLoading =
    questionResponses.length > 0 && !!questionIds && questionsLoading;

  const Heading = getHeadingTag(headingLevel);

  // Build a map of questionId -> response values for quick lookups
  const responseMap = useMemo(
    () =>
      new Map(questionResponses.map((qr) => [qr.questionId, qr.values ?? []])),
    [questionResponses]
  );

  // Determine if a child question should be visible based on parent's response
  const isChildVisible = (
    childQuestion: QuestionResponse,
    parentQuestion: QuestionResponse
  ): boolean => {
    const parentValues = responseMap.get(parentQuestion.id ?? '');
    if (!parentValues || parentValues.length === 0) return false;

    const subQuestion = parentQuestion.subQuestions?.find((sq) =>
      sq.questionIds?.includes(childQuestion.id ?? '')
    );
    if (!subQuestion?.anyValuesMatch) return false;

    if (typeof subQuestion.anyValuesMatch === 'string') {
      return parentValues.includes(subQuestion.anyValuesMatch);
    }

    if (Array.isArray(subQuestion.anyValuesMatch)) {
      return parentValues.some((value) =>
        (subQuestion.anyValuesMatch as unknown as string[]).includes(value)
      );
    }

    return false;
  };

  // Get visible question responses grouped by parent hierarchy
  const groupedQuestions = useMemo(() => {
    // Separate parent (top-level) and child questions
    const parentQuestions = questions.filter((q) => !q.parentQuestionId);
    const childQuestions = questions.filter((q) => !!q.parentQuestionId);

    type QuestionGroup = {
      parent: QuestionResponse;
      parentResponse: ClientQuestionResponse | undefined;
      children: {
        question: QuestionResponse;
        response: ClientQuestionResponse | undefined;
      }[];
    };

    const groups: QuestionGroup[] = parentQuestions
      .filter((pq) => responseMap.has(pq.id ?? ''))
      .map((parentQ) => {
        const parentResp = questionResponses.find(
          (qr) => qr.questionId === parentQ.id
        );

        // Find child questions for this parent and filter by visibility
        const visibleChildren = childQuestions
          .filter((cq) => cq.parentQuestionId === parentQ.id)
          .filter((cq) => isChildVisible(cq, parentQ))
          .filter((cq) => responseMap.has(cq.id ?? ''))
          .map((cq) => ({
            question: cq,
            response: questionResponses.find((qr) => qr.questionId === cq.id),
          }));

        return {
          parent: parentQ,
          parentResponse: parentResp,
          children: visibleChildren,
        };
      });

    // Also include any orphan responses (questions not in the fetched data)
    const knownIds = new Set(questions.map((q) => q.id));
    const orphanResponses = questionResponses.filter(
      (qr) => !knownIds.has(qr.questionId)
    );

    return { groups, orphanResponses };
  }, [questions, questionResponses, responseMap]);

  const renderQuestionRow = (
    qr: ClientQuestionResponse,
    question: QuestionResponse | undefined,
    isChild = false
  ) => {
    const questionLabel = question?.description?.trim()
      ? question.description.trim()
      : questionLabelUnavailable;
    const rawValue = formatQuestionResponseValue(qr, locale);
    const displayValue =
      rawValue === 'true' || rawValue === 'false'
        ? t(`booleanValues.${rawValue}`)
        : rawValue;

    return (
      <div
        key={qr.questionId}
        className={cn(
          'eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2 eb-text-sm',
          isChild && 'eb-border-l-2 eb-border-border/40 eb-pl-4'
        )}
      >
        <dt className="eb-max-w-[50%] eb-shrink-0 eb-font-medium eb-text-muted-foreground">
          {question?.description?.includes('\n') ? (
            <span className="eb-block eb-space-y-1">
              {question.description.split('\n').map((line, i) => (
                <span key={i} className={cn(i > 0 && 'eb-block')}>
                  {line}
                </span>
              ))}
            </span>
          ) : (
            questionLabel
          )}
        </dt>
        <dd className="eb-min-w-0 eb-break-words eb-text-right eb-text-foreground">
          {displayValue}
        </dd>
      </div>
    );
  };

  return (
    <section
      className="eb-w-full"
      aria-labelledby={showTitle ? 'client-details-questions' : undefined}
    >
      {showTitle && (
        <Heading
          id="client-details-questions"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {t('sections.questionResponses')}
        </Heading>
      )}
      {questionResponses.length === 0 ? (
        <p className="eb-py-2 eb-text-sm eb-text-muted-foreground">
          {t('labels.noQuestionResponses')}
        </p>
      ) : showLoading ? (
        <dl className="eb-divide-y eb-divide-border/60">
          {questionResponses.map((qr: ClientQuestionResponse, index) => (
            <div
              key={qr.questionId}
              className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2.5 eb-text-sm"
            >
              <dt className="eb-max-w-[60%] eb-shrink-0 eb-space-y-1">
                <Skeleton
                  className={cn(
                    'eb-h-4 eb-rounded',
                    index % 3 === 0 && 'eb-w-48',
                    index % 3 === 1 && 'eb-w-56',
                    index % 3 === 2 && 'eb-w-40'
                  )}
                />
                {index % 2 === 0 && (
                  <Skeleton className="eb-h-4 eb-w-32 eb-rounded" />
                )}
              </dt>
              <dd className="eb-min-w-0">
                <Skeleton
                  className={cn(
                    'eb-h-4 eb-rounded',
                    index % 2 === 0 ? 'eb-w-16' : 'eb-w-24'
                  )}
                />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="eb-divide-y eb-divide-border/60">
          {groupedQuestions.groups.map((group) => (
            <div
              key={group.parent.id}
              className="eb-divide-y eb-divide-border/60"
            >
              {group.parentResponse &&
                renderQuestionRow(group.parentResponse, group.parent, false)}
              {group.children.map(
                (child) =>
                  child.response &&
                  renderQuestionRow(child.response, child.question, true)
              )}
            </div>
          ))}
          {groupedQuestions.orphanResponses.map((qr) =>
            renderQuestionRow(qr, undefined, false)
          )}
        </dl>
      )}
    </section>
  );
}
