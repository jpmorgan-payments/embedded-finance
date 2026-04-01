import { describe, expect, it } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { ClientStatus } from '@/api/generated/smbdo.schemas';

import { shouldSuppressOnboardingLeaveWarnings } from './flowLeaveWarnings';

describe('shouldSuppressOnboardingLeaveWarnings', () => {
  it('does not suppress when clientData is missing', () => {
    expect(shouldSuppressOnboardingLeaveWarnings(undefined)).toBe(false);
  });

  it.each([
    [ClientStatus.NEW, false],
    [ClientStatus.INFORMATION_REQUESTED, false],
    [ClientStatus.REVIEW_IN_PROGRESS, true],
    [ClientStatus.APPROVED, true],
    [ClientStatus.DECLINED, true],
    [ClientStatus.SUSPENDED, true],
    [ClientStatus.TERMINATED, true],
  ] as const)('status %s -> suppress=%s', (status, suppress) => {
    expect(
      shouldSuppressOnboardingLeaveWarnings({ status } as ClientResponse)
    ).toBe(suppress);
  });
});
