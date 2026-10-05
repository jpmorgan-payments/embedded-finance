import { describe, expect, test } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { getOwnershipDescendants } from './getOwnershipDescendants';

const party = (
  id: string,
  parentPartyId: string,
  active?: false
): MaintenanceParty => ({
  id,
  parentPartyId,
  active,
  partyType: id.startsWith('business') ? 'ORGANIZATION' : 'INDIVIDUAL',
});

describe('getOwnershipDescendants', () => {
  test('returns direct and nested descendants once across snapshots', () => {
    const approved = [
      party('business-1', 'client-1'),
      party('business-2', 'business-1'),
      party('owner-1', 'business-2'),
    ];
    const proposed = [...approved, party('owner-2', 'business-1')];

    expect(
      getOwnershipDescendants('business-1', [approved, proposed]).map(
        (descendant) => descendant.id
      )
    ).toEqual(['business-2', 'owner-2', 'owner-1']);
  });

  test('keeps an approved descendant blocked while its removal is pending', () => {
    expect(
      getOwnershipDescendants('business-1', [
        [party('owner-1', 'business-1')],
        [party('owner-1', 'business-1', false)],
      ]).map((descendant) => descendant.id)
    ).toEqual(['owner-1']);
  });

  test('does not follow cycles back to the intermediary', () => {
    expect(
      getOwnershipDescendants('business-1', [
        [party('business-2', 'business-1'), party('business-1', 'business-2')],
      ]).map((descendant) => descendant.id)
    ).toEqual(['business-2']);
  });
});
