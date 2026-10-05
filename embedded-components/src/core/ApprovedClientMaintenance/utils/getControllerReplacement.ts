import type {
  MaintenanceProjection,
  PartyChange,
} from './buildMaintenanceProjection';

export type ControllerReplacement = {
  outgoingPartyId: string;
  incomingPartyId: string;
};

const heldControl = (change: PartyChange) =>
  Boolean(change.approvedParty?.roles?.includes('CONTROLLER'));

/**
 * The profile has exactly one controller, so a pending hand-over from one
 * person to another only stands as a pair; undoing one side must undo both.
 */
export function getControllerReplacement(
  projection: MaintenanceProjection
): ControllerReplacement | undefined {
  // The latest proposal may omit roles, so read control from the projected profile.
  const proposedControllerIds = new Set(
    (projection.proposedClient.parties ?? [])
      .filter(
        (party) => party.active !== false && party.roles?.includes('CONTROLLER')
      )
      .map((party) => party.id)
  );
  const outgoing = projection.partyChanges.find(
    (change) =>
      heldControl(change) && !proposedControllerIds.has(change.partyId)
  );
  const incoming = projection.partyChanges.find(
    (change) =>
      !heldControl(change) && proposedControllerIds.has(change.partyId)
  );
  return outgoing && incoming
    ? { outgoingPartyId: outgoing.partyId, incomingPartyId: incoming.partyId }
    : undefined;
}
