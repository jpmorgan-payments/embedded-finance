import type { MaintenanceParty } from '../models/maintenanceApi.types';

export type OwnershipNodeChange = 'added' | 'removed' | 'moved';

export type OwnershipChanges = {
  /** Proposed parties, with anything leaving the structure kept at its approved position. */
  displayParties: MaintenanceParty[];
  changes: ReadonlyMap<string, OwnershipNodeChange>;
  /** The approved parent of each moved party. */
  previousParentIds: ReadonlyMap<string, string>;
};

const isOwnershipParty = (party: MaintenanceParty) =>
  party.active !== false &&
  Boolean(
    party.roles?.includes('BENEFICIAL_OWNER') ||
      party.roles?.includes('INTERMEDIARY_OWNER')
  );

const indexOwnershipParties = (parties: MaintenanceParty[]) =>
  new Map(
    parties.flatMap((party) =>
      party.id && isOwnershipParty(party) ? [[party.id, party] as const] : []
    )
  );

export function getOwnershipChanges({
  approvedParties,
  proposedParties,
  clientPartyId,
}: {
  approvedParties: MaintenanceParty[];
  proposedParties: MaintenanceParty[];
  clientPartyId?: string;
}): OwnershipChanges {
  const approvedOwnership = indexOwnershipParties(approvedParties);
  const proposedOwnership = indexOwnershipParties(proposedParties);
  const changes = new Map<string, OwnershipNodeChange>();
  const previousParentIds = new Map<string, string>();

  proposedOwnership.forEach((party, partyId) => {
    const approvedParty = approvedOwnership.get(partyId);
    const approvedParentId = approvedParty?.parentPartyId ?? clientPartyId;
    if (!approvedParty) {
      changes.set(partyId, 'added');
    } else if (approvedParentId !== (party.parentPartyId ?? clientPartyId)) {
      changes.set(partyId, 'moved');
      if (approvedParentId) previousParentIds.set(partyId, approvedParentId);
    }
  });
  approvedOwnership.forEach((_, partyId) => {
    if (!proposedOwnership.has(partyId)) changes.set(partyId, 'removed');
  });

  const proposedIds = new Set(proposedParties.map((party) => party.id));
  const displayParties = [
    ...proposedParties.map((party) =>
      party.id && changes.get(party.id) === 'removed'
        ? approvedOwnership.get(party.id)!
        : party
    ),
    ...[...approvedOwnership.values()].filter(
      (party) =>
        changes.get(party.id!) === 'removed' && !proposedIds.has(party.id)
    ),
  ];

  return { displayParties, changes, previousParentIds };
}
