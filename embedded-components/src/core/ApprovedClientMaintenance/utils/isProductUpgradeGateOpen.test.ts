import { describe, expect, test } from 'vitest';

import { isProductUpgradeGateOpen } from './isProductUpgradeGateOpen';

const acceptedAt = '2026-09-01T12:00:00.000Z';

describe('isProductUpgradeGateOpen', () => {
  test('stays closed before five minutes and when the original product is not approved', () => {
    expect(
      isProductUpgradeGateOpen(
        acceptedAt,
        true,
        Date.parse('2026-09-01T12:04:59.999Z')
      )
    ).toBe(false);
    expect(
      isProductUpgradeGateOpen(
        acceptedAt,
        false,
        Date.parse('2026-09-01T12:05:00.000Z')
      )
    ).toBe(false);
  });

  test('opens at five minutes only with an approved original product', () => {
    expect(
      isProductUpgradeGateOpen(
        acceptedAt,
        true,
        Date.parse('2026-09-01T12:05:00.000Z')
      )
    ).toBe(true);
  });
});
