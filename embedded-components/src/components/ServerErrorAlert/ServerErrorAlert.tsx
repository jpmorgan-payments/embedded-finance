import { FC, ReactNode, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshCwIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type ServerErrorAlertProps = {
  error: ErrorType<ApiError> | null;
  customTitle?: ReactNode;
  customErrorMessage?: ReactNode | Record<string, ReactNode>;
  tryAgainAction?: () => void;
  className?: string;
  showDetails?: boolean;
};

/**
 * Renders a single reason item with field, message, reason code, and rejected value
 */
const ReasonItem: FC<{ reason: any }> = ({ reason }) => {
  const { t } = useTranslationWithTokens(['common']);

  if (typeof reason === 'string') {
    return <>{reason}</>;
  }

  return (
    <>
      {reason.field && <span className="eb-font-semibold">{reason.field}</span>}
      {reason.field && reason.message && ': '}
      {reason.message || t('errors.unknownError')}
      {(reason.reason || reason.rejectedValue) && (
        <div className="eb-ml-5 eb-text-xs">
          {reason.reason && (
            <span>
              {t('errors.reason')}{' '}
              <span className="eb-font-mono">{reason.reason}</span>
            </span>
          )}
          {reason.reason && reason.rejectedValue && ' \u2022 '}
          {reason.rejectedValue && (
            <span>
              {t('errors.value')}{' '}
              <span className="eb-font-mono">
                &quot;{reason.rejectedValue}&quot;
              </span>
            </span>
          )}
        </div>
      )}
    </>
  );
};

/**
 * Renders the reasons section with all error reasons
 */
const ReasonsSection: FC<{ reasons: any[] }> = ({ reasons }) => {
  const { t } = useTranslationWithTokens(['common']);

  if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
    return null;
  }

  return (
    <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
      <div className="eb-self-start eb-font-semibold eb-text-red-900">
        {t('errors.reasons')}
      </div>
      <div>
        <ul className="eb-list-inside eb-list-disc eb-space-y-2 eb-text-red-800">
          {reasons.map((reason, index) => (
            <li key={index} className="eb-break-words">
              <ReasonItem reason={reason} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Renders the context section with validation context
 */
const ContextSection: FC<{ context: any[] }> = ({ context }) => {
  const { t } = useTranslationWithTokens(['common']);

  if (!context || !Array.isArray(context) || context.length === 0) {
    return null;
  }

  return (
    <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
      <div className="eb-self-start eb-font-semibold eb-text-red-900">
        {t('errors.context')}
      </div>
      <div>
        <ul className="eb-list-inside eb-list-disc eb-space-y-0.5 eb-text-red-800">
          {context.map((item, index) => (
            <li key={index} className="eb-break-words">
              {item.field && (
                <span className="eb-font-semibold">{item.field}: </span>
              )}
              {item.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const ServerErrorAlert: FC<ServerErrorAlertProps> = ({
  className,
  error,
  customTitle,
  customErrorMessage,
  tryAgainAction,
  showDetails = true,
}) => {
  const { t } = useTranslationWithTokens(['common']);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!error) {
    return null;
  }

  const httpStatus =
    error.response?.data?.httpStatus?.toString() ?? error.status?.toString();

  // Get the most useful API message from the response.
  // The top-level `message` field is often a generic placeholder like
  // "Error details not available", while the `context` array carries the
  // real actionable detail (e.g. "Organization type [PARTNERSHIP] not
  // allowed"). Prefer context when the top-level message looks generic.
  const topLevelMessage = (error.response?.data as any)?.message as
    | string
    | undefined;
  const contextMessages = error.response?.data?.context
    ?.map((c) => c.message)
    .filter(Boolean);
  const bestContextMessage =
    contextMessages && contextMessages.length > 0
      ? contextMessages.join('; ')
      : undefined;

  const isGenericMessage =
    !topLevelMessage ||
    topLevelMessage === error.response?.data?.title ||
    /error details not available/i.test(topLevelMessage);

  const apiMessage = isGenericMessage
    ? (bestContextMessage ?? topLevelMessage)
    : (topLevelMessage ?? bestContextMessage);

  // Default error messages from i18n content tokens
  const defaultMessages: Record<string, ReactNode> = {
    '400': t('errors.defaultMessages.400'),
    '401': t('errors.defaultMessages.401'),
    '500': t('errors.defaultMessages.500'),
    '503': t('errors.defaultMessages.503'),
    default: t('errors.defaultMessages.default'),
  };

  // Use provided custom messages or fall back to i18n defaults
  const effectiveMessages = customErrorMessage ?? defaultMessages;

  // Determine the error message to display
  const getErrorMessage = (): ReactNode => {
    // If a custom string/ReactNode is provided directly, use it
    if (
      typeof effectiveMessages === 'string' ||
      (typeof effectiveMessages === 'object' &&
        effectiveMessages !== null &&
        !('400' in effectiveMessages) &&
        !('default' in effectiveMessages))
    ) {
      return effectiveMessages as ReactNode;
    }

    // Prefer the API message when available (e.g., "ABA routing number 533100000 not found")
    if (apiMessage) {
      return apiMessage;
    }

    // Fall back to status-based messages
    const messageRecord = effectiveMessages as Record<string, ReactNode>;
    if (httpStatus && messageRecord) {
      return (
        messageRecord[httpStatus] ||
        defaultMessages[httpStatus] ||
        messageRecord.default ||
        defaultMessages.default
      );
    }

    return defaultMessages.default;
  };

  return (
    <Alert
      variant="destructive"
      className={cn('eb-animate-fade-in', className)}
    >
      <AlertCircleIcon className="eb-h-4 eb-w-4" />
      <AlertTitle>
        {customTitle ?? error?.response?.data?.title ?? error?.message}
      </AlertTitle>
      <AlertDescription>{getErrorMessage()}</AlertDescription>

      {showDetails && error?.response?.data && (
        <AlertDescription className="eb-mt-3">
          <Button
            type="button"
            variant="link"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="eb-h-auto eb-p-0 eb-text-xs eb-text-red-900 eb-transition-colors hover:eb-text-red-700"
          >
            {isDetailsExpanded ? (
              <ChevronUpIcon className="eb-h-3 eb-w-3" />
            ) : (
              <ChevronDownIcon className="eb-h-3 eb-w-3" />
            )}
            {isDetailsExpanded
              ? t('errors.hideDetails')
              : t('errors.showDetails')}
          </Button>

          {isDetailsExpanded && (
            <div className="eb-mt-2 eb-space-y-2 eb-overflow-x-auto eb-rounded eb-border eb-border-red-300 eb-bg-red-50 eb-p-3 eb-text-xs">
              {error.response.data.httpStatus && (
                <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
                  <div className="eb-font-semibold eb-text-red-900">
                    {t('errors.status')}
                  </div>
                  <div className="eb-break-words eb-text-red-800">
                    {error.response.data.httpStatus} {error.response.data.title}
                  </div>
                </div>
              )}

              <ReasonsSection reasons={(error.response.data as any).reasons} />
              <ContextSection context={error.response.data.context || []} />
            </div>
          )}
        </AlertDescription>
      )}

      {tryAgainAction && (
        <AlertDescription className="eb-mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={tryAgainAction}
            className="eb-border-red-300 eb-bg-white eb-text-red-900 hover:eb-bg-red-50 hover:eb-text-red-700"
          >
            <RefreshCwIcon className="eb-mr-2 eb-h-4 eb-w-4" />
            {t('errors.tryAgain')}
          </Button>
        </AlertDescription>
      )}
    </Alert>
  );
};
