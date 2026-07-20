import { describe, expect, it } from 'vitest';

import { buildMockRateSheet, MOCK_FX_RATES } from './fx-rates.mock';

describe('fx-rates.mock', () => {
  it('includes EUR, GBP, and SGD rates used by scenario #8 recipients', () => {
    expect(MOCK_FX_RATES.EUR).toBeGreaterThan(0);
    expect(MOCK_FX_RATES.GBP).toBeGreaterThan(0);
    expect(MOCK_FX_RATES.SGD).toBeGreaterThan(0);
  });

  it('builds a ratesheet with executable ACH and WIRE rates per currency', () => {
    const sheet = buildMockRateSheet();
    expect(sheet.data.ratesheetId).toBeTruthy();
    expect(new Date(sheet.data.expiry).getTime()).toBeGreaterThan(Date.now());

    const pairs = sheet.data.customerDepartment[0].currencyPairs;
    const eur = pairs.find((p) => p.clientBuyCcy === 'EUR');
    expect(eur).toBeDefined();
    expect(
      eur!.rates.some(
        (r) => r.rateType === 'EXECUTABLE' && r.paymentMethod === 'ACH'
      )
    ).toBe(true);
    expect(
      eur!.rates.some(
        (r) =>
          r.rateType === 'EXECUTABLE' && r.paymentMethod === 'WIRE_DRAFT_BOOK'
      )
    ).toBe(true);
  });
});
