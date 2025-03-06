import { FC } from 'react';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface InfoStepAlertProps {
  stepId: string;
}

export const InfoStepAlert: FC<InfoStepAlertProps> = ({ stepId }) => {
  const { t } = useTranslation('onboarding');
  const capitalizedStepId = stepId.charAt(0).toUpperCase() + stepId.slice(1);
  const content = t(['stepInfo', capitalizedStepId].join('.'), '');

  if (!content) return null;

  return (
    <Alert
      variant="default"
      className="eb-mb-4 eb-w-full eb-border-blue-100 eb-bg-blue-50"
    >
      <div className="eb-flex eb-gap-3">
        <InfoCircledIcon className="eb-h-5 eb-w-5 eb-text-blue-500" />
        <AlertDescription className="eb-flex eb-flex-col">
          <span className="eb-text-blue-800 eb-text-xs">
            <Markdown>{content}</Markdown>
          </span>
        </AlertDescription>
      </div>
    </Alert>
  );
};
