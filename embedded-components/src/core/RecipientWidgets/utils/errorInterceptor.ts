import { ErrorType } from '@/api/axios-instance';
import { ApiError } from '@/api/generated/smbdo.schemas';

/**
 * Error codes that can be intercepted and displayed with friendly messages.
 * Add new error codes here as they are identified.
 */
export type KnownErrorCode = 'RTP_UNAVAILABLE';

/**
 * Configuration for a known error type
 */
export interface KnownErrorConfig {
  /** Unique code for this error type */
  code: KnownErrorCode;
  /** i18n key for the title */
  titleKey: string;
  /** i18n key for the description */
  descriptionKey: string;
  /** i18n key for suggestion text (optional) */
  suggestionKey?: string;
  /** Icon variant to use */
  variant: 'warning' | 'error' | 'info';
}

/**
 * Registry of known error configurations.
 * Add new error types here to enable friendly error messages.
 */
export const KNOWN_ERROR_REGISTRY: Record<KnownErrorCode, KnownErrorConfig> = {
  RTP_UNAVAILABLE: {
    code: 'RTP_UNAVAILABLE',
    titleKey: 'errors.known.RTP_UNAVAILABLE.title',
    descriptionKey: 'errors.known.RTP_UNAVAILABLE.description',
    suggestionKey: 'errors.known.RTP_UNAVAILABLE.suggestion',
    variant: 'warning',
  },
};

/**
 * Result of intercepting an error
 */
export interface InterceptedError {
  /** Whether this is a known error that can be displayed with friendly messages */
  isKnown: true;
  /** The configuration for displaying this error */
  config: KnownErrorConfig;
  /** The original error for reference */
  originalError: ErrorType<ApiError>;
  /** Additional context from the error (e.g., field name, rejected value) */
  context?: {
    field?: string;
    message?: string;
  };
}

/**
 * Result when error is not intercepted
 */
export interface UnknownError {
  /** This error should be displayed using the standard ServerErrorAlert */
  isKnown: false;
  /** The original error */
  originalError: ErrorType<ApiError>;
}

export type ErrorInterceptionResult = InterceptedError | UnknownError;

/**
 * Detects if an API error matches a known error pattern.
 *
 * This function inspects the error response to identify specific error types
 * that can be displayed with user-friendly messages instead of generic error alerts.
 *
 * @param error - The API error to inspect
 * @returns The interception result with configuration if known, or the original error if unknown
 *
 * @example
 * ```tsx
 * const result = interceptError(apiError);
 * if (result.isKnown) {
 *   // Display friendly error using result.config
 *   return <FriendlyErrorAlert error={result} />;
 * } else {
 *   // Fall back to standard error display
 *   return <ServerErrorAlert error={result.originalError} />;
 * }
 * ```
 */
export function interceptError(
  error: ErrorType<ApiError> | null | undefined
): ErrorInterceptionResult | null {
  if (!error) {
    return null;
  }

  const responseData = error.response?.data;

  // Check for RTP_UNAVAILABLE error
  // This error has a context entry with code 'RTP_UNAVAILABLE'
  if (responseData?.context && Array.isArray(responseData.context)) {
    const rtpUnavailableContext = responseData.context.find(
      (ctx: { code?: string; field?: string; message?: string }) =>
        ctx.code === 'RTP_UNAVAILABLE'
    );

    if (rtpUnavailableContext) {
      return {
        isKnown: true,
        config: KNOWN_ERROR_REGISTRY.RTP_UNAVAILABLE,
        originalError: error,
        context: {
          field: rtpUnavailableContext.field,
          message: rtpUnavailableContext.message,
        },
      };
    }
  }

  // Add more error detection patterns here as needed
  // Example for future error types:
  // if (responseData?.context?.some(ctx => ctx.code === 'SOME_OTHER_ERROR')) {
  //   return { isKnown: true, config: KNOWN_ERROR_REGISTRY.SOME_OTHER_ERROR, ... };
  // }

  // Unknown error - return for standard handling
  return {
    isKnown: false,
    originalError: error,
  };
}

/**
 * Type guard to check if an error interception result is a known error
 */
export function isKnownError(
  result: ErrorInterceptionResult | null
): result is InterceptedError {
  return result !== null && result.isKnown === true;
}
