import { describe, expect, it } from 'vitest';

import { maintenanceVerificationResponseSchema } from './maintenanceApi.schemas';

describe('maintenanceApi schemas', () => {
  // Server timestamps are passed through as-is; consumers parse them and
  // handle invalid values, so formatting differences must not fail parsing.
  it.each([
    '2024-07-21T17:32:28.000Z',
    '2026-08-26T17:58:36.99Z',
    '2024-01-01T00:00:00+00:00',
    '2024-01-01T00:00:00',
  ])('accepts acceptedAt %s', (acceptedAt) => {
    expect(
      maintenanceVerificationResponseSchema.parse({ acceptedAt }).acceptedAt
    ).toBe(acceptedAt);
  });

  it('still rejects a non-string acceptedAt', () => {
    expect(
      maintenanceVerificationResponseSchema.safeParse({ acceptedAt: 123 })
        .success
    ).toBe(false);
  });
});
