/**
 * FX rate sheet fixtures for SellSense PaymentFlowFX (ratesheet mode).
 * Shape mirrors the FX Rate Sheet API (`getCurrentRatesheet`).
 */

/** Rough indicative rates (target units per 1 USD). */
export const MOCK_FX_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.35,
  CAD: 1.36,
  MXN: 17.1,
  INR: 83.2,
  AUD: 1.52,
  AED: 3.67,
  BRL: 5.05,
  HKD: 7.82,
  KRW: 1350,
  PHP: 56.5,
  PLN: 3.95,
  RON: 4.57,
  SEK: 10.4,
  VND: 25400,
};

const RATE_SHEET_CURRENCIES = Object.entries(MOCK_FX_RATES).map(
  ([ccy, rate]) => ({ ccy, rate })
);

/**
 * A minimal valid rate sheet with EXECUTABLE + INDICATIVE rates per pair.
 * Default expiry is 24h to match the real pre-agreed-rate lock window.
 */
export function buildMockRateSheet(expiryMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  return {
    _metadata: {
      disclaimer:
        'Rates are held for 24 hours from publication. Executable rates may be ' +
        'locked for a transaction using their rateId; indicative rates are for ' +
        'information only and subject to change until the transaction is confirmed.',
    },
    data: {
      ratesheetId: 'mock-ratesheet-sellsense-1',
      publicationTime: new Date(now).toISOString(),
      expiry: new Date(now + expiryMs).toISOString(),
      customerDepartment: [
        {
          name: 'DEFAULT',
          currencyPairs: RATE_SHEET_CURRENCIES.map(({ ccy, rate }) => ({
            clientSellCcy: 'USD',
            clientBuyCcy: ccy,
            fromBuyCcyToSellCcy: 'Divide',
            rates: [
              {
                rateType: 'EXECUTABLE',
                rateId: `rate-${ccy.toLowerCase()}-exec`,
                paymentMethod: 'ACH',
                clientRate: rate,
              },
              {
                rateType: 'EXECUTABLE',
                rateId: `rate-${ccy.toLowerCase()}-wire`,
                paymentMethod: 'WIRE_DRAFT_BOOK',
                clientRate: rate * 0.998,
              },
              {
                rateType: 'INDICATIVE',
                paymentMethod: 'ACH',
                clientRate: rate * 1.002,
              },
            ],
          })),
        },
      ],
    },
  };
}
