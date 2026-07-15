import { describe, expect, it } from 'vitest';

import type { ApiErrorV2 } from '@/api/generated/ep-transactions-v3.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

import {
  getErrorMessageFromContext,
  isExpiredRateError,
  parseTransactionError,
} from './transactionErrors';

/** Build an axios-like error carrying an ApiErrorV2 body. */
function makeError(
  httpStatus: number,
  context?: Array<{ code?: string; field?: string; message?: string }>
): ErrorType<ApiErrorV2> {
  return {
    status: httpStatus,
    response: {
      data: {
        httpStatus,
        context,
      },
    },
  } as unknown as ErrorType<ApiErrorV2>;
}

describe('isExpiredRateError', () => {
  it('detects an expired rate via field name', () => {
    expect(
      isExpiredRateError(
        makeError(422, [{ field: 'fxInformation.rateId', message: 'expired' }])
      )
    ).toBe(true);
  });

  it('detects an expired rate via rate + expired message', () => {
    expect(
      isExpiredRateError(
        makeError(422, [{ field: 'rate', message: 'Rate has expired' }])
      )
    ).toBe(true);
  });

  it('is false for unrelated errors and null', () => {
    expect(isExpiredRateError(makeError(400, [{ field: 'amount' }]))).toBe(
      false
    );
    expect(isExpiredRateError(null)).toBe(false);
  });
});

describe('getErrorMessageFromContext', () => {
  it('maps an expired-rate context to a friendly message', () => {
    const parsed = getErrorMessageFromContext(
      [{ field: 'fxInformation.rateId', message: 'expired' }],
      true
    );
    expect(parsed?.title).toBe('Exchange Rate Expired');
  });

  it('maps a targetCurrency error when isFx', () => {
    const parsed = getErrorMessageFromContext(
      [{ field: 'targetCurrency', message: 'not enabled' }],
      true
    );
    expect(parsed?.title).toBe('Currency Not Supported');
  });

  it('maps a paymentPurpose requirement', () => {
    const parsed = getErrorMessageFromContext(
      [{ field: 'paymentPurpose.code', message: 'required' }],
      true
    );
    expect(parsed?.title).toBe('Payment Purpose Required');
  });

  it('returns null for empty context', () => {
    expect(getErrorMessageFromContext([], true)).toBeNull();
  });

  it('maps a recipient routing-number error (10104)', () => {
    const parsed = getErrorMessageFromContext([
      {
        code: '10104',
        field: 'recipientId',
        message: 'routing number not configured',
      },
    ]);
    expect(parsed?.title).toBe('Payment Method Not Enabled');
  });

  it('maps a generic 10104 to method-not-supported', () => {
    const parsed = getErrorMessageFromContext([{ code: '10104' }]);
    expect(parsed?.title).toBe('Payment Method Not Supported');
  });

  it('maps a recipient error', () => {
    const parsed = getErrorMessageFromContext([{ field: 'recipientId' }]);
    expect(parsed?.title).toBe('Recipient Error');
  });

  it('falls back to the first available message', () => {
    const parsed = getErrorMessageFromContext([
      { field: 'unknown', message: 'Custom problem' },
    ]);
    expect(parsed).toEqual({
      title: 'Payment Error',
      message: 'Custom problem',
    });
  });

  it('returns null when no message is present', () => {
    expect(getErrorMessageFromContext([{ field: 'unknown' }])).toBeNull();
  });
});

describe('parseTransactionError', () => {
  it('returns null for no error', () => {
    expect(parseTransactionError(null, true)).toBeNull();
  });

  it('prefers the FX validation message on a 422 with target currency', () => {
    const parsed = parseTransactionError(makeError(422), true);
    expect(parsed?.title).toBe('Validation Error');
    expect(parsed?.message).toContain('International payment');
  });

  it('maps a plain 401 to Session Expired', () => {
    const parsed = parseTransactionError(makeError(401), false);
    expect(parsed?.title).toBe('Session Expired');
  });

  it.each([
    [400, 'Invalid Request'],
    [403, 'Permission Denied'],
    [404, 'Not Found'],
    [422, 'Validation Error'],
    [503, 'Service Unavailable'],
  ])('maps HTTP %i to %s (non-FX)', (status, title) => {
    expect(parseTransactionError(makeError(status), false)?.title).toBe(title);
  });

  it('maps an unknown status to a generic failure', () => {
    const parsed = parseTransactionError(makeError(500), false);
    expect(parsed?.title).toBe('Payment Failed');
  });

  it('surfaces a context error over the status fallback', () => {
    const parsed = parseTransactionError(
      makeError(400, [{ field: 'fxInformation.rateId', message: 'expired' }]),
      true
    );
    expect(parsed?.title).toBe('Exchange Rate Expired');
  });
});
