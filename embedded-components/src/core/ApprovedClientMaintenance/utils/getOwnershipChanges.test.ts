import { describe, expect, test } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { getOwnershipChanges } from './getOwnershipChanges';

const owner = (
  id: string,
  parentPartyId: string,
  roles: string[] = ['BENEFICIAL_OWNER']
): MaintenanceParty => ({
  id,
  parentPartyId,
  partyType: 'INDIVIDUAL',
  roles: roles as MaintenanceParty['roles'],
});

describe('getOwnershipChanges', () => {
  test('marks additions, removals, and moves against the approved structure', () => {
    const approvedParties = [
      owner('holding-1', 'client-1', ['INTERMEDIARY_OWNER']),
      owner('moved', 'holding-1'),
      owner('removed', 'client-1'),
      owner('unchanged', 'client-1'),
    ];
    const proposedParties = [
      owner('holding-1', 'client-1', ['INTERMEDIARY_OWNER']),
      owner('moved', 'client-1'),
      owner('unchanged', 'client-1'),
      owner('added', 'holding-1'),
    ];

    const { changes, displayParties, previousParentIds } = getOwnershipChanges({
      approvedParties,
      proposedParties,
      clientPartyId: 'client-1',
    });

    expect(Object.fromEntries(changes)).toEqual({
      moved: 'moved',
      added: 'added',
      removed: 'removed',
    });
    expect(Object.fromEntries(previousParentIds)).toEqual({
      moved: 'holding-1',
    });
    expect(displayParties.map((party) => party.id)).toEqual([
      'holding-1',
      'moved',
      'unchanged',
      'added',
      'removed',
    ]);
  });

  test('keeps a party that loses its ownership role at its approved position', () => {
    const { changes, displayParties } = getOwnershipChanges({
      approvedParties: [
        owner('person', 'client-1', ['CONTROLLER', 'BENEFICIAL_OWNER']),
      ],
      proposedParties: [owner('person', 'client-1', ['CONTROLLER'])],
      clientPartyId: 'client-1',
    });

    expect(changes.get('person')).toBe('removed');
    expect(displayParties).toEqual([
      expect.objectContaining({ roles: ['CONTROLLER', 'BENEFICIAL_OWNER'] }),
    ]);
  });

  test('treats a missing parent as the client', () => {
    const { changes } = getOwnershipChanges({
      approvedParties: [
        { ...owner('person', 'client-1'), parentPartyId: undefined },
      ],
      proposedParties: [owner('person', 'client-1')],
      clientPartyId: 'client-1',
    });

    expect(changes.size).toBe(0);
  });
});
