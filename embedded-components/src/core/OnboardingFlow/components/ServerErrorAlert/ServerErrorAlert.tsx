import { FC } from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const defaultErrorMessage: Record<string, string> = {
  '400': 'Please check the information you entered and try again.',
  '401': 'Please log in and try again.',
  '500': 'An unexpected error occurred. Please try again later.',
  default: 'An unexpected error occurred. Please try again later.',
};

type ServerErrorAlertProps = {
  error: ErrorType<ApiError> | null;
  customErrorMessage?: string | Record<string, string>;
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
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircleIcon className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {error?.response?.data?.title ?? error?.message}
        </AlertTitle>
        <AlertDescription>
          {typeof customErrorMessage === 'string' && customErrorMessage}

          {typeof customErrorMessage === 'object' &&
            (((httpStatus &&
              httpStatus in customErrorMessage &&
              customErrorMessage[httpStatus]) ||
              customErrorMessage.default) ??
              'An unexpected error occurred.')}
        </AlertDescription>
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
