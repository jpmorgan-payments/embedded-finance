import type { PartyFieldChange } from './buildMaintenanceProjection';

/** Owned through already says whether ownership is direct or indirect, so that row is dropped beside it. */
export function getVisibleFieldChanges(fieldChanges: PartyFieldChange[]) {
  const statesConnection = fieldChanges.some(
    (change) => change.field === 'parentPartyId'
  );
  return fieldChanges.filter(
    (change) => !(change.field === 'natureOfOwnership' && statesConnection)
  );
}
