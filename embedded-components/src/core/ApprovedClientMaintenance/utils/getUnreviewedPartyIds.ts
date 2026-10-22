import {
  isActiveMaintenanceStatus,
  type MaintenanceClient,
  type MaintenanceParty,
} from '../models/maintenanceApi.types';

/**
 * Active non-client parties that are still `NEW` without an open or approved
 * ADD request. The API leaves parties in this state when a pending ADD ends
 * without review, so they need fresh onboarding rather than maintenance.
 */
export function getUnreviewedPartyIds(
  client: MaintenanceClient,
  maintenanceParties: MaintenanceParty[]
): Set<string> {
  const reviewableAdditionIds = new Set(
    [...maintenanceParties, ...(client.parties ?? [])].flatMap((party) =>
      party.id &&
      party.updateRequest?.action === 'ADD' &&
      (isActiveMaintenanceStatus(party.updateRequest.status) ||
        party.updateRequest.status === 'APPROVED')
        ? [party.id]
        : []
    )
  );
  return new Set(
    (client.parties ?? []).flatMap((party) =>
      party.id &&
      party.profileStatus === 'NEW' &&
      party.active !== false &&
      !party.roles?.includes('CLIENT') &&
      !reviewableAdditionIds.has(party.id)
        ? [party.id]
        : []
    )
  );
}
