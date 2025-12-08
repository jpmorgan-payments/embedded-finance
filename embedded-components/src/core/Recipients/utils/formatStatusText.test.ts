import { describe, expect, test } from 'vitest';

import { formatStatusText } from './formatStatusText';

describe('formatStatusText', () => {
  test('formats ACTIVE to Active', () => {
    expect(formatStatusText('ACTIVE')).toBe('Active');
  });

  test('formats INACTIVE to Inactive', () => {
    expect(formatStatusText('INACTIVE')).toBe('Inactive');
  });

  test('formats PENDING to Pending', () => {
    expect(formatStatusText('PENDING')).toBe('Pending');
  });

  test('formats REJECTED to Rejected', () => {
    expect(formatStatusText('REJECTED')).toBe('Rejected');
  });

  test('formats MICRODEPOSITS_INITIATED to Microdeposits Initiated', () => {
    expect(formatStatusText('MICRODEPOSITS_INITIATED')).toBe(
      'Microdeposits Initiated'
    );
  });

  test('formats READY_FOR_VALIDATION to Ready For Validation', () => {
    expect(formatStatusText('READY_FOR_VALIDATION')).toBe(
      'Ready For Validation'
    );
  });

  test('returns N/A for undefined', () => {
    expect(formatStatusText(undefined)).toBe('N/A');
  });

  test('returns N/A for empty string', () => {
    expect(formatStatusText('')).toBe('N/A');
  });

  test('handles mixed case input', () => {
    expect(formatStatusText('AcTiVe')).toBe('Active');
  });

  test('handles single word statuses', () => {
    expect(formatStatusText('ACTIVE')).toBe('Active');
  });
});
