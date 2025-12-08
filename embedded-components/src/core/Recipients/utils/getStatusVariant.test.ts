import { describe, expect, test } from 'vitest';

import { getStatusVariant } from './getStatusVariant';

describe('getStatusVariant', () => {
  test('returns success for ACTIVE', () => {
    expect(getStatusVariant('ACTIVE')).toBe('success');
  });

  test('returns warning for PENDING', () => {
    expect(getStatusVariant('PENDING')).toBe('warning');
  });

  test('returns warning for READY_FOR_VALIDATION', () => {
    expect(getStatusVariant('READY_FOR_VALIDATION')).toBe('warning');
  });

  test('returns destructive for REJECTED', () => {
    expect(getStatusVariant('REJECTED')).toBe('destructive');
  });

  test('returns informative for MICRODEPOSITS_INITIATED', () => {
    expect(getStatusVariant('MICRODEPOSITS_INITIATED')).toBe('informative');
  });

  test('returns outline for INACTIVE', () => {
    expect(getStatusVariant('INACTIVE')).toBe('outline');
  });

  test('returns outline for undefined', () => {
    expect(getStatusVariant(undefined)).toBe('outline');
  });

  test('returns outline for unknown status', () => {
    // TypeScript won't allow this, but testing runtime behavior
    expect(getStatusVariant('UNKNOWN_STATUS' as any)).toBe('outline');
  });
});
