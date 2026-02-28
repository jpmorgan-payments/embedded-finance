import { FC, ReactNode } from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const defaultErrorMessage: Record<string, ReactNode> = {
  '400': 'Please check the information you entered and try again.',
  '401': 'Please log in and try again.',
  '500': 'An unexpected error occurred. Please try again later.',
  default: 'An unexpected error occurred. Please try again later.',
};

type ServerErrorAlertProps = {
  error: ErrorType<ApiError> | null;
  customErrorMessage?: ReactNode | Record<string, ReactNode>;
  tryAgainAction?: () => void;
  className?: string;
};
export const ServerErrorAlert: FC<ServerErrorAlertProps> = ({
  error,
  customErrorMessage = defaultErrorMessage,
  tryAgainAction,
  className,
}) => {
  if (error) {
    const httpStatus =
      error.response?.data?.httpStatus?.toString() ?? error.status?.toString();

    // Get the error message based on type
    const getErrorMessage = (): ReactNode => {
      if (typeof customErrorMessage === 'string') {
        return customErrorMessage;
      }
      if (
        typeof customErrorMessage === 'object' &&
        customErrorMessage !== null &&
        !('400' in customErrorMessage) &&
        !('default' in customErrorMessage)
      ) {
        return customErrorMessage as ReactNode;
      }
      const customRecord = customErrorMessage as Record<string, ReactNode>;
      if (httpStatus && customRecord[httpStatus]) {
        return customRecord[httpStatus];
      }
      return customRecord?.default ?? 'An unexpected error occurred.';
    };

    return (
      <Alert variant="destructive" className={className}>
        <AlertCircleIcon className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {error?.response?.data?.title ?? error?.message}
        </AlertTitle>
        <AlertDescription>{getErrorMessage()}</AlertDescription>
        {tryAgainAction && (
          <AlertDescription className="eb-mt-4">
            <Button size="sm" onClick={tryAgainAction}>
              <RefreshCwIcon className="eb-mr-1 eb-h-4 eb-w-4" />
              Click to try again
            </Button>
          </AlertDescription>
        )}
      </Alert>
    );
  }

  return null;
};
