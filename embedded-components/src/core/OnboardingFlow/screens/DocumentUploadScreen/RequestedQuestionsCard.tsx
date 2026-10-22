import { FC } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ChevronRightIcon, MessageSquareTextIcon } from 'lucide-react';

import { Button, Card } from '@/components/ui';

interface RequestedQuestionsCardProps {
  onAnswerClick: () => void;
}

/**
 * Prompt shown alongside document requests when the same information request
 * also asks the user to answer questions.
 */
export const RequestedQuestionsCard: FC<RequestedQuestionsCardProps> = ({
  onAnswerClick,
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview']);

  return (
    <div className="eb-space-y-3">
      <h2 className="eb-font-header eb-text-2xl eb-font-medium">
        {t('documentUpload.requestedQuestions.title')}
      </h2>
      <Card className="eb-flex eb-flex-col eb-gap-3 eb-rounded-lg eb-border eb-p-4 eb-shadow sm:eb-flex-row sm:eb-items-center sm:eb-justify-between">
        <div className="eb-flex eb-items-start eb-gap-2">
          <MessageSquareTextIcon
            className="eb-mt-0.5 eb-size-4 eb-shrink-0"
            aria-hidden="true"
          />
          <p className="eb-text-sm">
            {t('documentUpload.requestedQuestions.description')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="eb-shrink-0"
          onClick={onAnswerClick}
        >
          {t('documentUpload.requestedQuestions.answerQuestions')}
          <ChevronRightIcon />
        </Button>
      </Card>
    </div>
  );
};
