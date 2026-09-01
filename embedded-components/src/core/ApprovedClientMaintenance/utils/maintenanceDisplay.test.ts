import { describe, expect, test } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import type { PartyChange } from './buildMaintenanceProjection';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from './maintenanceDisplay';

const party: MaintenanceParty = {
  id: 'person-1',
  individualDetails: {
    firstName: 'Jane',
    middleName: 'R',
    lastName: 'Doe',
  },
};

const change = {
  partyId: 'person-1',
  approvedParty: party,
  proposal: {
    id: 'person-1',
    individualDetails: { firstName: 'Janet', lastName: 'Diaz' },
    updateRequest: {
      status: 'NEW',
      action: 'MODIFY',
      requestId: 'request-1',
      submittedAt: '2026-08-27T12:00:00.000Z',
    },
  },
  fieldChanges: [],
} as PartyChange;

describe('maintenanceDisplay', () => {
  test('uses the sparse proposed name and preserves the previous identity', () => {
    expect(getMaintenancePartyIdentity(party, change, 'Not provided')).toEqual({
      displayName: 'Janet R Diaz',
      previousName: 'Jane R Doe',
    });
  });

  test('keeps the approved identity when no name field changed', () => {
    expect(
      getMaintenancePartyIdentity(party, undefined, 'Not provided')
    ).toEqual({
      displayName: 'Jane R Doe',
    });
  });

  test('localizes known roles and humanizes unknown role fallbacks', () => {
    const translateRole = vi.fn((_role: string, fallback: string) => fallback);

    expect(
      formatMaintenanceRoles(
        ['BENEFICIAL_OWNER', 'FUTURE_ROLE'],
        translateRole,
        'No roles'
      )
    ).toBe('Beneficial owner · Future role');
    expect(translateRole).toHaveBeenCalledWith(
      'BENEFICIAL_OWNER',
      'Beneficial owner'
    );
  });
});
