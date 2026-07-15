/**
 * Transaction error parsing for PaymentFlowFX.
 *
 * Self-contained reimplementation of PaymentFlow's private error helpers, extended
 * additively with FX-specific mappings (SPECIFICATION.md §11). PaymentFlow's own
 * helpers are left untouched (non-breaking mandate D6).
 */
import type { ApiErrorV2 } from '@/api/generated/ep-transactions-v3.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

export interface ParsedTransactionError {
  title: string;
  message: string;
}

interface ErrorContextItem {
  code?: string | null;
  location?: string | null;
  field?: string | null;
  message?: string;
}

/** True when the error indicates the locked FX rate has expired (§11). */
export function isExpiredRateError(
  error: ErrorType<ApiErrorV2> | null | undefined
): boolean {
  if (!error) return false;
  const context = error.response?.data?.context ?? [];
  return context.some((item) => {
    const field = item.field?.toLowerCase() ?? '';
    const message = item.message?.toLowerCase() ?? '';
    return (
      field.includes('fxinformation.rateid') ||
      field === 'rateid' ||
      (field.includes('rate') && message.includes('expired'))
    );
  });
}

/**
 * Map API error context to a user-friendly title/message.
 *
 * @param context - `ApiErrorV2.context` array.
 * @param isFx - whether the submitted request carried `targetCurrency`.
 */
/**
 * Map a single API error `context` item to a user-friendly title/message.
 *
 * Extracted from {@link getErrorMessageFromContext} to keep cognitive
 * complexity within limits; behaviour is unchanged.
 */
function matchErrorContextItem(
  item: ErrorContextItem,
  isFx: boolean
): ParsedTransactionError | null {
  const { code, field: rawField, message: errorMessage } = item;
  const field = rawField?.toLowerCase() ?? undefined;
  const lowerMessage = errorMessage?.toLowerCase() ?? '';

  // --- FX-specific mappings (§11) ---
  if (
    field?.includes('fxinformation.rateid') ||
    field === 'rateid' ||
    (field?.includes('rate') && lowerMessage.includes('expired'))
  ) {
    return {
      title: 'Exchange Rate Expired',
      message:
        'The exchange rate for this payment expired. We refreshed it — please review and submit again.',
    };
  }

  if (field === 'targetcurrency' && isFx) {
    return {
      title: 'Currency Not Supported',
      message:
        errorMessage ||
        'This currency is not enabled for your account. Choose a different recipient or contact support.',
    };
  }

  if (field?.includes('paymentpurpose')) {
    return {
      title: 'Payment Purpose Required',
      message:
        errorMessage || 'This destination requires a payment purpose code.',
    };
  }

  // --- Parity mappings (ported from PaymentFlow) ---
  if (
    code === '10104' &&
    field === 'recipientid' &&
    lowerMessage.includes('routing number')
  ) {
    return {
      title: 'Payment Method Not Enabled',
      message:
        errorMessage ||
        'The selected payment method is not configured for this recipient. Please enable the payment method for this recipient or choose a different payment method.',
    };
  }

  if (code === '10104' || field === 'targetcurrency' || field === 'currency') {
    return {
      title: 'Payment Method Not Supported',
      message:
        errorMessage ||
        'The selected payment method is not available for this account. Please select a different payment method or use a different account.',
    };
  }

  if (field === 'recipientid' || field === 'recipient') {
    return {
      title: 'Recipient Error',
      message:
        errorMessage ||
        'There was a problem with the selected recipient. Please verify the recipient details or select a different recipient.',
    };
  }

  return null;
}

export function getErrorMessageFromContext(
  context: ErrorContextItem[],
  isFx = false
): ParsedTransactionError | null {
  if (!context || context.length === 0) return null;

  for (const item of context) {
    const match = matchErrorContextItem(item, isFx);
    if (match) return match;
  }

  const firstMessage = context.find((c) => c.message)?.message;
  if (firstMessage) {
    return { title: 'Payment Error', message: firstMessage };
  }

  return null;
}

/**
 * Parse a transaction error into a user-friendly title and message.
 *
 * @param error - the axios error.
 * @param isFx - whether the submitted request carried `targetCurrency`.
 */
export function parseTransactionError(
  error: ErrorType<ApiErrorV2> | null | undefined,
  isFx = false
): ParsedTransactionError | null {
  if (!error) return null;

  const errorData = error.response?.data;
  const httpStatus = errorData?.httpStatus ?? error.status ?? 500;

  const contextError = getErrorMessageFromContext(
    errorData?.context ?? [],
    isFx
  );
  if (contextError) return contextError;

  // Prefer the FX-validation message on a 422 when a target currency was sent.
  if (httpStatus === 422 && isFx) {
    return {
      title: 'Validation Error',
      message:
        "International payment could not be validated. Check the recipient's bank details.",
    };
  }

  switch (httpStatus) {
    case 400:
      return {
        title: 'Invalid Request',
        message: 'Please check the payment details and try again.',
      };
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in and try again.',
      };
    case 403:
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to make this payment.',
      };
    case 404:
      return {
        title: 'Not Found',
        message: 'The account or recipient was not found.',
      };
    case 422:
      return {
        title: 'Validation Error',
        message: 'The payment details are invalid. Please check and try again.',
      };
    case 503:
      return {
        title: 'Service Unavailable',
        message:
          'The service is currently unavailable. Please try again later.',
      };
    default:
      return {
        title: 'Payment Failed',
        message: 'An unexpected error occurred. Please try again later.',
      };
  }
}
