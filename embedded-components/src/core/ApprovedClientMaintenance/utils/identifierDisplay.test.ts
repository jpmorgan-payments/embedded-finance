import { describe, expect, test } from 'vitest';

import {
  formatIdentifier,
  formatPhone,
  maskIdentifier,
} from './identifierDisplay';

describe('identifierDisplay', () => {
  test.each([
    ['SSN', '111223333', '***-**-3333', '111-22-3333'],
    ['ITIN', '911223333', '***-**-3333', '911-22-3333'],
    ['EIN', '123456789', '**-***6789', '12-3456789'],
    ['PASSPORT', 'X12345678', '****5678', 'X12345678'],
  ])('masks and formats %s', (idType, value, masked, formatted) => {
    expect(maskIdentifier({ idType, value })).toBe(masked);
    expect(formatIdentifier({ idType, value })).toBe(formatted);
  });

  test('returns empty strings for missing values', () => {
    expect(maskIdentifier({ idType: 'SSN' })).toBe('');
    expect(formatIdentifier({ idType: 'SSN' })).toBe('');
    expect(formatPhone(undefined)).toBe('');
  });

  test('shows phone numbers in full', () => {
    expect(formatPhone({ countryCode: '+1', phoneNumber: '2125550142' })).toBe(
      '+1 2125550142'
    );
  });
});
