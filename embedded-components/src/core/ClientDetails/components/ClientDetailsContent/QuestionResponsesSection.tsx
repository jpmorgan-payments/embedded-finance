import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

export function QuestionResponsesSection({
  client,
  title,
}: QuestionResponsesSectionProps) {
  const { t, i18n } = useTranslation('client-details');
  const locale =
    i18n.resolvedLanguage
      ?.replace('_', '-')
      .replace('US', '-US')
      .replace('CA', '-CA') || 'en-US';

  const questionLabelUnavailable = t('labels.questionTextUnavailable', {
    defaultValue: 'Question text unavailable',
  });

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
          {t('labels.noQuestionResponses', {
            defaultValue: 'No question responses.',
          })}
        </p>
      ) : showLoading ? (
        <dl className="eb-divide-y eb-divide-border/60">
          {questionResponses.map((qr: ClientQuestionResponse, index) => (
            <div
              key={qr.questionId}
              className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2.5 eb-text-sm"
            >
              <dt className="eb-max-w-[60%] eb-shrink-0 eb-space-y-1">
                {/* Question text skeleton - varies width for realism */}
                <Skeleton
                  className={cn(
                    'eb-h-4 eb-rounded',
                    index % 3 === 0 && 'eb-w-48',
                    index % 3 === 1 && 'eb-w-56',
                    index % 3 === 2 && 'eb-w-40'
                  )}
                />
                {/* Some questions have second line */}
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
          {questionResponses.map((qr: ClientQuestionResponse) => {
            const question = questions.find((q) => q.id === qr.questionId);
            const questionLabel = question?.description?.trim()
              ? question.description.trim()
              : questionLabelUnavailable;
            const rawValue = formatQuestionResponseValue(qr, locale);
            // Translate boolean values using i18n
            const displayValue =
              rawValue === 'true' || rawValue === 'false'
                ? t(`booleanValues.${rawValue}`)
                : rawValue;

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
