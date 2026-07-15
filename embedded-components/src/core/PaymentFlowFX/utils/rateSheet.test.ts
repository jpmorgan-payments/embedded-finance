import { describe, expect, it } from 'vitest';

import type { RateSheetDetails } from '@/api/generated/fx-rate-sheet.schemas';

import {
  convertUsdToTarget,
  getRateSheetErrors,
  selectRateFromSheet,
} from './rateSheet';

/** Build a minimal rate sheet with a single USD -> target pair. */
function makeSheet(overrides?: {
  expiry?: string;
  thresholdAmount?: number;
  thresholdCcy?: string;
  fromBuyCcyToSellCcy?: 'Multiply' | 'Divide';
  rates?: unknown[];
  disclaimer?: string;
  departmentName?: string;
}): RateSheetDetails {
  return {
    _metadata: overrides?.disclaimer
      ? { disclaimer: overrides.disclaimer }
      : {},
    data: {
      expiry: overrides?.expiry,
      thresholdAmount: overrides?.thresholdAmount,
      thresholdCcy: overrides?.thresholdCcy,
      customerDepartment: [
        {
          name: overrides?.departmentName ?? 'DEFAULT',
          currencyPairs: [
            {
              clientSellCcy: 'USD',
              clientBuyCcy: 'EUR',
              fromBuyCcyToSellCcy: overrides?.fromBuyCcyToSellCcy ?? 'Divide',
              rates: overrides?.rates ?? [
                {
                  rateType: 'EXECUTABLE',
                  rateId: 'rate-exec-1',
                  paymentMethod: 'ACH',
                  clientRate: 0.92,
                },
              ],
            },
          ],
        },
      ],
    },
  } as unknown as RateSheetDetails;
}

const futureExpiry = new Date(Date.now() + 60_000).toISOString();
const pastExpiry = new Date(Date.now() - 60_000).toISOString();

describe('convertUsdToTarget', () => {
  it('multiplies USD by the normalised rate', () => {
    expect(convertUsdToTarget(100, 0.92)).toBeCloseTo(92);
  });
});

describe('getRateSheetErrors', () => {
  it('returns null for a clean body', () => {
    expect(getRateSheetErrors({ data: {} })).toBeNull();
  });

  it('extracts errors from an object with an errors[] array', () => {
    const errors = getRateSheetErrors({
      errors: [{ errorCode: 'E1', errorMsg: 'No rate' }],
    });
    expect(errors).toEqual(['E1: No rate']);
  });

  it('extracts errors from an array body', () => {
    const errors = getRateSheetErrors([
      { errors: [{ errorCode: 'E2', errorMsg: 'Down' }] },
    ]);
    expect(errors).toEqual(['E2: Down']);
  });
});

describe('selectRateFromSheet', () => {
  it('selects an EXECUTABLE rate and carries the rateId', () => {
    const result = selectRateFromSheet(makeSheet({ expiry: futureExpiry }), {
      targetCurrency: 'EUR',
      paymentMethod: 'ACH',
    });

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.rate.rate).toBeCloseTo(0.92);
      expect(result.rate.isIndicative).toBe(false);
      expect(result.rate.rateId).toBe('rate-exec-1');
    }
  });

  it('normalises a Multiply pair to target units per USD', () => {
    const result = selectRateFromSheet(
      makeSheet({
        expiry: futureExpiry,
        fromBuyCcyToSellCcy: 'Multiply',
        rates: [
          {
            rateType: 'EXECUTABLE',
            rateId: 'r',
            paymentMethod: 'ACH',
            clientRate: 1.08, // 1 EUR = 1.08 USD => R = 1/1.08
          },
        ],
      }),
      { targetCurrency: 'EUR', paymentMethod: 'ACH' }
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.rate.rate).toBeCloseTo(1 / 1.08);
    }
  });

  it('marks a non-EXECUTABLE rate as indicative and drops the rateId', () => {
    const result = selectRateFromSheet(
      makeSheet({
        expiry: futureExpiry,
        rates: [
          {
            rateType: 'INDICATIVE',
            rateId: 'should-not-appear',
            paymentMethod: 'ACH',
            clientRate: 0.9,
          },
        ],
      }),
      { targetCurrency: 'EUR', paymentMethod: 'ACH' }
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.rate.isIndicative).toBe(true);
      expect(result.rate.rateId).toBeUndefined();
    }
  });

  it('prefers EXECUTABLE over INDICATIVE when both match', () => {
    const result = selectRateFromSheet(
      makeSheet({
        expiry: futureExpiry,
        rates: [
          {
            rateType: 'INDICATIVE',
            paymentMethod: 'ACH',
            clientRate: 0.8,
          },
          {
            rateType: 'EXECUTABLE',
            rateId: 'exec',
            paymentMethod: 'ACH',
            clientRate: 0.92,
          },
        ],
      }),
      { targetCurrency: 'EUR', paymentMethod: 'ACH' }
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.rate.rateId).toBe('exec');
    }
  });

  it('reports unavailable when all rates are expired', () => {
    const result = selectRateFromSheet(makeSheet({ expiry: pastExpiry }), {
      targetCurrency: 'EUR',
      paymentMethod: 'ACH',
    });
    expect(result.status).toBe('unavailable');
  });

  it('reports unavailable when no pair matches the target currency', () => {
    const result = selectRateFromSheet(makeSheet({ expiry: futureExpiry }), {
      targetCurrency: 'JPY',
      paymentMethod: 'ACH',
    });
    expect(result.status).toBe('unavailable');
  });

  it('reports unavailable when the amount exceeds the sheet threshold', () => {
    const result = selectRateFromSheet(
      makeSheet({
        expiry: futureExpiry,
        thresholdAmount: 1000,
        thresholdCcy: 'USD',
      }),
      { targetCurrency: 'EUR', paymentMethod: 'ACH', amount: 5000 }
    );
    expect(result.status).toBe('unavailable');
  });

  it('respects a WIRE method mapping to WIRE_DRAFT_BOOK', () => {
    const result = selectRateFromSheet(
      makeSheet({
        expiry: futureExpiry,
        rates: [
          {
            rateType: 'EXECUTABLE',
            rateId: 'wire',
            paymentMethod: 'WIRE_DRAFT_BOOK',
            clientRate: 0.91,
          },
        ],
      }),
      { targetCurrency: 'EUR', paymentMethod: 'WIRE' }
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.rate.rateId).toBe('wire');
    }
  });

  it('exposes the disclaimer from _metadata', () => {
    const result = selectRateFromSheet(
      makeSheet({ expiry: futureExpiry, disclaimer: 'Rates are indicative.' }),
      { targetCurrency: 'EUR', paymentMethod: 'ACH' }
    );
    if (result.status === 'ok') {
      expect(result.rate.disclaimer).toBe('Rates are indicative.');
    }
  });
});
