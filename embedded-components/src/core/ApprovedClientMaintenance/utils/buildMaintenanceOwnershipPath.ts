import type { MaintenanceParty } from '../models/maintenanceApi.types';

const getPartyName = (party: MaintenanceParty, fallback: string) =>
  party.partyType === 'ORGANIZATION'
    ? (party.organizationDetails?.organizationName ?? fallback)
    : [
        party.individualDetails?.firstName,
        party.individualDetails?.middleName,
        party.individualDetails?.lastName,
      ]
        .filter(Boolean)
        .join(' ') || fallback;

export function buildMaintenanceOwnershipPath({
  parties,
  clientPartyId,
  clientName,
  ownerPartyId,
  fallback,
}: {
  parties: MaintenanceParty[];
  clientPartyId: string;
  clientName: string;
  ownerPartyId: string;
  fallback: string;
}): string[] {
  const partiesById = new Map(
    parties
      .filter((party): party is MaintenanceParty & { id: string } =>
        Boolean(party.id)
      )
      .map((party) => [party.id, party])
  );
  const path: string[] = [];
  const visitedPartyIds = new Set<string>();
  let currentPartyId: string | undefined = ownerPartyId;

  while (
    currentPartyId &&
    currentPartyId !== clientPartyId &&
    !visitedPartyIds.has(currentPartyId)
  ) {
    visitedPartyIds.add(currentPartyId);
    const party = partiesById.get(currentPartyId);
    if (!party) break;
    path.unshift(getPartyName(party, fallback));
    currentPartyId = party.parentPartyId;
  }

  return [clientName, ...path];
}
