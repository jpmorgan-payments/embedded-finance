import { describe, expect, test } from 'vitest';

import type { MaintenanceClient } from '../models/maintenanceApi.types';
import { getEligibleMaintenanceOperations } from './getEligibleMaintenanceOperations';

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

describe('getEligibleMaintenanceOperations', () => {
  test('returns the operations of an exact country and legal entity match', () => {
    expect([
      ...getEligibleMaintenanceOperations(client, [
        {
          country: 'US',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          operations: ['MANAGE_PROFILE'],
        },
        {
          country: 'US',
          organizationType: 'C_CORPORATION',
          operations: ['ADD_LIMITED_DDA_PAYMENTS'],
        },
      ]),
    ]).toEqual(['MANAGE_PROFILE']);
  });

  test('merges rules that repeat the same country and legal entity type', () => {
    expect([
      ...getEligibleMaintenanceOperations(client, [
        {
          country: 'US',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          operations: ['MANAGE_PROFILE'],
        },
        {
          country: 'US',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
        },
      ]),
    ]).toEqual(['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP']);
  });

  test('denies partial matches, empty matrices, and unidentified businesses', () => {
    const canadianRule = {
      country: 'CA',
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      operations: ['MANAGE_PROFILE'],
    } as const;
    expect(getEligibleMaintenanceOperations(client, [canadianRule]).size).toBe(
      0
    );
    expect(getEligibleMaintenanceOperations(client, []).size).toBe(0);
    expect(
      getEligibleMaintenanceOperations({ ...client, parties: [] }, [
        { ...canadianRule, country: 'US' },
      ]).size
    ).toBe(0);
  });
});
