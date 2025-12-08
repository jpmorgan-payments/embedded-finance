import { describe, expect, test } from 'vitest';

import { getAccountStatusVariant } from './getAccountStatusVariant';

describe('getAccountStatusVariant', () => {
  test('returns success for OPEN state', () => {
    expect(getAccountStatusVariant('OPEN')).toBe('success');
  });

  test('returns destructive for CLOSED state', () => {
    expect(getAccountStatusVariant('CLOSED')).toBe('destructive');
  });

  test('returns warning for PENDING state', () => {
    expect(getAccountStatusVariant('PENDING')).toBe('warning');
  });

  test('returns secondary for SUSPENDED state', () => {
    expect(getAccountStatusVariant('SUSPENDED')).toBe('secondary');
  });

  test('returns outline for unknown state', () => {
    expect(getAccountStatusVariant('UNKNOWN')).toBe('outline');
  });

  test('returns outline for undefined state', () => {
    expect(getAccountStatusVariant(undefined)).toBe('outline');
  });
});

