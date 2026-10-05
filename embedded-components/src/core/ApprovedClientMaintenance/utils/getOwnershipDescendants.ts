import type { MaintenanceParty } from '../models/maintenanceApi.types';

export function getOwnershipDescendants(
  parentPartyId: string,
  partySnapshots: readonly (readonly MaintenanceParty[])[]
): MaintenanceParty[] {
  const descendantsById = new Map<string, MaintenanceParty>();
  const visitedParentIds = new Set<string>();
  const pendingParentIds = [parentPartyId];

  while (pendingParentIds.length > 0) {
    const currentParentId = pendingParentIds.shift();
    if (!currentParentId || visitedParentIds.has(currentParentId)) continue;
    visitedParentIds.add(currentParentId);

    partySnapshots.forEach((parties) => {
      parties.forEach((party) => {
        if (
          !party.id ||
          party.id === parentPartyId ||
          party.parentPartyId !== currentParentId ||
          party.active === false
        ) {
          return;
        }

        if (!descendantsById.has(party.id)) {
          descendantsById.set(party.id, party);
          pendingParentIds.push(party.id);
        }
      });
    });
  }

  return [...descendantsById.values()];
}
