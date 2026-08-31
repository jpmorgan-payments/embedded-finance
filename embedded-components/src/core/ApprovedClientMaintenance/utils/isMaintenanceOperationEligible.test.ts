import { describe, expect, test } from 'vitest';

import type { MaintenanceClient } from '../models/maintenanceApi.types';
import { isMaintenanceOperationEligible } from './isMaintenanceOperationEligible';

const client: MaintenanceClient = {
  id: 'client-1',
  partyId: 'organization-1',
  status: 'APPROVED',
  parties: [
    {
      id: 'organization-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: {
        countryOfFormation: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
  ],
};

describe('isMaintenanceOperationEligible', () => {
  test('allows an exact configured match', () => {
    expect(
      isMaintenanceOperationEligible(
        client,
        [
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['EDIT_PARTY_NAME'],
          },
        ],
        'EDIT_PARTY_NAME'
      )
    ).toBe(true);
  });

  test('denies missing and partial matches', () => {
    expect(
      isMaintenanceOperationEligible(
        client,
        [
          {
            country: 'CA',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['EDIT_PARTY_NAME'],
          },
        ],
        'EDIT_PARTY_NAME'
      )
    ).toBe(false);
    expect(isMaintenanceOperationEligible(client, [], 'EDIT_PARTY_NAME')).toBe(
      false
    );
  });
});
