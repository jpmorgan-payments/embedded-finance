import { ReactNode, useMemo } from 'react';

import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';

const defaultErrorMessages: Record<string, string> = {
  '400': 'Please check the information you entered and try again.',
  '401': 'Please log in and try again.',
  '403': 'You do not have permission to access this resource.',
  '404': 'The requested resource could not be found.',
  '500': 'An unexpected error occurred. Please try again later.',
  '502': 'The service is temporarily unavailable. Please try again later.',
  '503': 'The service is currently unavailable. Please try again later.',
  default: 'An unexpected error occurred. Please try again later.',
};

export interface ServerErrorInfo {
  /** HTTP status code as string */
  httpStatus: string | undefined;
  /** Error title from API response or error message */
  title: string | undefined;
  /** API message from response (e.g., "ABA routing number not found") */
  apiMessage: string | undefined;
  /** Array of error reasons from API response */
  reasons: any[];
  /** Array of context items from API response */
  context: any[];
  /** Whether the error has detailed information to show */
  hasDetails: boolean;
  /** Get the appropriate error message based on status and custom messages */
  getErrorMessage: (
    customMessages?: ReactNode | Record<string, ReactNode>
  ) => ReactNode;
}

/**
 * Hook to parse and extract error information from API errors.
 * Provides the same error parsing logic as ServerErrorAlert but returns
 * the data for custom rendering.
 *
 * @example
 * ```tsx
 * const errorInfo = useServerError(error);
 *
 * if (!errorInfo) return null;
 *
 * return (
 *   <div>
 *     <h3>{errorInfo.title}</h3>
 *     <p>{errorInfo.getErrorMessage({ '404': 'Client not found' })}</p>
 *     {errorInfo.hasDetails && (
 *       <details>
 *         <summary>Show details</summary>
 *         <p>Status: {errorInfo.httpStatus}</p>
 *         {errorInfo.reasons.map((r, i) => <p key={i}>{r.message}</p>)}
 *       </details>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useServerError(
  error: ErrorType<ApiError> | null | undefined
): ServerErrorInfo | null {
  return useMemo(() => {
    if (!error) {
      return null;
    }

    const httpStatus =
      error.response?.data?.httpStatus?.toString() ?? error.status?.toString();

    const title = error.response?.data?.title ?? error.message;

    // Get the API message from response if available
    const apiMessage =
      (error.response?.data as any)?.message ||
      error.response?.data?.context?.[0]?.message;

    const reasons = (error.response?.data as any)?.reasons || [];
    const context = error.response?.data?.context || [];

    const hasDetails = Boolean(
      error.response?.data &&
        (error.response.data.httpStatus ||
          reasons.length > 0 ||
          context.length > 0)
    );

    const getErrorMessage = (
      customMessages?: ReactNode | Record<string, ReactNode>
    ): ReactNode => {
      // If a custom string/ReactNode is provided directly, use it
      if (
        customMessages &&
        (typeof customMessages === 'string' ||
          (typeof customMessages === 'object' &&
            customMessages !== null &&
            !('400' in customMessages) &&
            !('default' in customMessages)))
      ) {
        return customMessages as ReactNode;
      }

      // Prefer the API message when available
      if (apiMessage) {
        return apiMessage;
      }

      // Fall back to status-based messages
      const customRecord = customMessages as
        | Record<string, ReactNode>
        | undefined;
      if (httpStatus) {
        return (
          customRecord?.[httpStatus] ||
          defaultErrorMessages[httpStatus] ||
          customRecord?.default ||
          defaultErrorMessages.default
        );
      }

      return customRecord?.default || defaultErrorMessages.default;
    };

    return {
      httpStatus,
      title,
      apiMessage,
      reasons,
      context,
      hasDetails,
      getErrorMessage,
    };
  }, [error]);
}
