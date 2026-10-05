import type { MaintenancePartyStep } from '../hooks/useMaintenanceWorkspace';
import type { MaintenanceDiscardEntry } from './buildMaintenanceDiscardContent';

const hasSameRoles = (left: string[], right: string[]) =>
  left.length === right.length && left.every((role) => right.includes(role));

const withControllerFirst = (roles: string[]) =>
  roles.includes('CONTROLLER')
    ? ['CONTROLLER', ...roles.filter((role) => role !== 'CONTROLLER')]
    : roles;

/**
 * Moves control back to the outgoing controller while keeping unrelated edits.
 * A side is discarded outright only when the hand-over is all it changed.
 */
export function buildControllerReplacementUndo({
  requestId,
  outgoing,
  incoming,
  incomingIsAddition,
}: {
  requestId: string;
  outgoing: MaintenanceDiscardEntry;
  incoming: MaintenanceDiscardEntry;
  incomingIsAddition: boolean;
}): MaintenancePartyStep[] {
  const restoreRoles = (
    entry: MaintenanceDiscardEntry,
    roles: string[]
  ): MaintenancePartyStep => {
    const onlyRolesChanged = (entry.change?.fieldChanges ?? []).every(
      (fieldChange) => fieldChange.field === 'roles'
    );
    return onlyRolesChanged && hasSameRoles(roles, entry.party.roles ?? [])
      ? { kind: 'discard', requestId, partyId: entry.id }
      : {
          kind: 'update',
          partyId: entry.id,
          requestBody: { roles: withControllerFirst(roles) },
        };
  };

  const outgoingStep: MaintenancePartyStep = outgoing.change?.removesParty
    ? { kind: 'discard', requestId, partyId: outgoing.id }
    : restoreRoles(outgoing, [
        ...new Set([...(outgoing.proposedParty.roles ?? []), 'CONTROLLER']),
      ]);
  const incomingStep: MaintenancePartyStep = incomingIsAddition
    ? { kind: 'discard', requestId, partyId: incoming.id }
    : restoreRoles(
        incoming,
        (incoming.proposedParty.roles ?? []).filter(
          (role) => role !== 'CONTROLLER'
        )
      );

  return [outgoingStep, incomingStep];
}
