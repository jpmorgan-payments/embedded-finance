import { describe, expect, test } from 'vitest';

import { formatStatusText } from './formatStatusText';

describe('formatStatusText', () => {
  test('returns N/A for undefined and empty string', () => {
    expect(formatStatusText(undefined)).toBe('N/A');
    expect(formatStatusText('')).toBe('N/A');
  });

  test('uses translation when provided and falls back to formatting when key not found', () => {
    // Mock translation function that returns translated values
    const mockT = (key: string): string => {
      const translations: Record<string, string> = {
        'common:na': 'N/A',
        'recipients:status.active': 'Active',
        'recipients:status.microdeposits_initiated': 'Microdeposits Initiated',
      };

      return translations[key] || key;
    };

    // Uses translation when available
    expect(formatStatusText('ACTIVE', mockT)).toBe('Active');
    expect(formatStatusText('MICRODEPOSITS_INITIATED', mockT)).toBe(
      'Microdeposits Initiated'
    );

    // Falls back to formatting when translation key not found
    const mockTWithoutKey = (key: string): string => key;
    expect(formatStatusText('UNKNOWN_STATUS', mockTWithoutKey)).toBe(
      'Unknown Status'
    );
  });
});
