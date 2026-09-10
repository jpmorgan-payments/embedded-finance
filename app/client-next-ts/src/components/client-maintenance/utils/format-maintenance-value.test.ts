import { describe, expect, it } from 'vitest';

import { formatMaintenanceValue } from './format-maintenance-value';

describe('formatMaintenanceValue', () => {
  it('formats addresses and phone numbers for comparison', () => {
    expect(
      formatMaintenanceValue(
        [
          {
            addressLines: ['28 Pine Avenue'],
            city: 'Brooklyn',
            state: 'NY',
            postalCode: '11217',
            country: 'US',
          },
        ],
        'individualDetails.addresses',
        'public'
      )
    ).toBe('28 Pine Avenue, Brooklyn, NY 11217, US');
    expect(
      formatMaintenanceValue(
        { countryCode: '+1', phoneNumber: '9175550104' },
        'individualDetails.phone',
        'public'
      )
    ).toBe('+1 ••• ••• 0104');
  });

  it('redacts sensitive identity values', () => {
    expect(
      formatMaintenanceValue(
        [{ idType: 'SSN', issuer: 'US', value: '100010001' }],
        'individualDetails.individualIds',
        'masked'
      )
    ).toBe('Ssn ending in 0001');
    expect(
      formatMaintenanceValue(
        '1988-06-14',
        'individualDetails.birthDate',
        'masked'
      )
    ).toBe('••••••••');
  });

  it('humanizes enum lists and missing values', () => {
    expect(
      formatMaintenanceValue(
        ['CONTROLLER', 'BENEFICIAL_OWNER'],
        'roles',
        'public'
      )
    ).toBe('Controller, Beneficial Owner');
    expect(formatMaintenanceValue(undefined, 'email', 'public')).toBe(
      'Not provided'
    );
  });
});
