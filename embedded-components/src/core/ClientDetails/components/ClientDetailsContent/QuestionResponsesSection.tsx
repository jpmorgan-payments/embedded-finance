import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { useSmbdoListQuestions } from '@/api/generated/smbdo';
import type {
  ClientQuestionResponse,
  ClientResponse,
} from '@/api/generated/smbdo.schemas';
import { Skeleton } from '@/components/ui';

import { formatQuestionResponseValue } from '../../utils/formatClientFacing';

interface QuestionResponsesSectionProps {
  client: ClientResponse;
  title?: string;
}

/** Fallback when question details are not available (no internal ID shown). */
const QUESTION_LABEL_UNAVAILABLE = 'Question text unavailable';

export function QuestionResponsesSection({
  client,
  title = 'Question responses',
}: QuestionResponsesSectionProps) {
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

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-questions' : undefined}
    >
      {title ? (
        <h2
          id="client-details-questions"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      {questionResponses.length === 0 ? (
        <p className="eb-py-2 eb-text-sm eb-text-muted-foreground">
          No question responses.
        </p>
      ) : showLoading ? (
        <dl className="eb-divide-y eb-divide-border/60">
          {questionResponses.map((qr: ClientQuestionResponse) => (
            <div
              key={qr.questionId}
              className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2 eb-text-sm"
            >
              <dt className="eb-max-w-[50%] eb-shrink-0">
                <Skeleton className="eb-h-4 eb-w-full eb-rounded" />
              </dt>
              <dd className="eb-min-w-0">
                <Skeleton className="eb-h-4 eb-w-20 eb-rounded" />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="eb-divide-y eb-divide-border/60">
          {questionResponses.map((qr: ClientQuestionResponse) => {
            const question = questions.find((q) => q.id === qr.questionId);
            const questionLabel = question?.description?.trim()
              ? question.description.trim()
              : QUESTION_LABEL_UNAVAILABLE;
            const displayValue = formatQuestionResponseValue(qr);

            return (
              <div
                key={qr.questionId}
                className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2 eb-text-sm"
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
          })}
        </dl>
      )}
    </section>
  );
}
