import { describe, expect, test } from 'vitest';

import { getAddressDisplayLocationParts } from './addressDisplay';

describe('getAddressDisplayLocationParts', () => {
  test.each(['AE', 'QA'] as const)(
    'hides synthetic postal code for %s but keeps its state',
    (country) => {
      expect(
        getAddressDisplayLocationParts({
          city: 'Test City',
          state: 'AZ',
          postalCode: 'n/a',
          country,
        })
      ).toEqual(['Test City', 'AZ']);
    }
  );

  test('omits only synthetic Hong Kong state and postal code', () => {
    expect(
      getAddressDisplayLocationParts({
        city: 'Central',
        state: 'HK',
        postalCode: 'n/a',
        country: 'HK',
      })
    ).toEqual(['Central']);
  });

  test('keeps real Hong Kong address values', () => {
    expect(
      getAddressDisplayLocationParts({
        city: 'Central',
        state: 'HCW',
        postalCode: '12345',
        country: 'HK',
      })
    ).toEqual(['Central', 'HCW', '12345']);
  });

  test('does not suppress values for other countries', () => {
    expect(
      getAddressDisplayLocationParts({
        city: 'Somewhere',
        state: 'HK',
        postalCode: 'n/a',
        country: 'US',
      })
    ).toEqual(['Somewhere', 'HK', 'n/a']);
  });
});
