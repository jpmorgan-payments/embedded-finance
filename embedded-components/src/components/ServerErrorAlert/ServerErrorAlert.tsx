import { FC, useState } from 'react';
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

const defaultErrorMessage: Record<string, string> = {
  '400': 'Please check the information you entered and try again.',
  '401': 'Please log in and try again.',
  '500': 'An unexpected error occurred. Please try again later.',
  '503': 'The service is currently unavailable. Please try again later.',
  default: 'An unexpected error occurred. Please try again later.',
};

type ServerErrorAlertProps = {
  error: ErrorType<ApiError> | null;
  customTitle?: string;
  customErrorMessage?: string | Record<string, string>;
  tryAgainAction?: () => void;
  className?: string;
  showDetails?: boolean;
};

/**
 * Renders a single reason item with field, message, reason code, and rejected value
 */
const ReasonItem: FC<{ reason: any }> = ({ reason }) => {
  if (typeof reason === 'string') {
    return <>{reason}</>;
  }

  return (
    <>
      {reason.field && <span className="eb-font-semibold">{reason.field}</span>}
      {reason.field && reason.message && ': '}
      {reason.message || 'Unknown error'}
      {(reason.reason || reason.rejectedValue) && (
        <div className="eb-ml-5 eb-text-xs">
          {reason.reason && (
            <span>
              Reason: <span className="eb-font-mono">{reason.reason}</span>
            </span>
          )}
          {reason.reason && reason.rejectedValue && ' • '}
          {reason.rejectedValue && (
            <span>
              Value:{' '}
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
  if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
    return null;
  }

  return (
    <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
      <div className="eb-self-start eb-font-semibold eb-text-red-900">
        Reasons:
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
  if (!context || !Array.isArray(context) || context.length === 0) {
    return null;
  }

  return (
    <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
      <div className="eb-self-start eb-font-semibold eb-text-red-900">
        Context:
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
  customErrorMessage = defaultErrorMessage,
  tryAgainAction,
  showDetails = false,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!error) {
    return null;
  }

  const httpStatus =
    error.response?.data?.httpStatus?.toString() ?? error.status?.toString();

  // Determine the error message to display
  const getErrorMessage = () => {
    if (typeof customErrorMessage === 'string') {
      return customErrorMessage;
    }

    if (typeof customErrorMessage === 'object' && httpStatus) {
      return (
        customErrorMessage[httpStatus] ||
        defaultErrorMessage[httpStatus] ||
        customErrorMessage.default ||
        defaultErrorMessage.default
      );
    }

    return defaultErrorMessage.default;
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
            {isDetailsExpanded ? 'Hide Details' : 'Show Details'}
          </Button>

          {isDetailsExpanded && (
            <div className="eb-mt-2 eb-space-y-2 eb-rounded eb-border eb-border-red-300 eb-bg-red-50 eb-p-3 eb-text-xs">
              {error.response.data.httpStatus && (
                <div className="eb-grid eb-grid-cols-[auto_1fr] eb-gap-x-3 eb-gap-y-0.5">
                  <div className="eb-font-semibold eb-text-red-900">
                    Status:
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
            Try Again
          </Button>
        </AlertDescription>
      )}
    </Alert>
  );
};
