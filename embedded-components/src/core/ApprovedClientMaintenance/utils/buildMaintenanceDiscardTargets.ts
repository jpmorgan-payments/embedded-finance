import type { MaintenanceEntityTasks } from './buildMaintenanceEntityTasks';
import type { MaintenanceProjection } from './buildMaintenanceProjection';
import { getMaintenancePartyIdentity } from './maintenanceDisplay';

export type MaintenanceDiscardTarget = {
  type: 'product' | 'business' | 'person' | 'intermediary' | 'required-work';
  label: string;
};

export function buildMaintenanceDiscardTargets(
  projection: MaintenanceProjection,
  entityTasks: MaintenanceEntityTasks,
  additionalRequiredWorkCount: number,
  labels: {
    product: (product: string, subProduct?: string) => string;
    business: string;
    personChange: (name: string) => string;
    personAddition: (name: string) => string;
    intermediaryAddition: (name: string) => string;
    requiredWork: (count: number) => string;
    notProvided: string;
  }
): MaintenanceDiscardTarget[] {
  const targets: MaintenanceDiscardTarget[] = projection.productChanges.map(
    (change) => ({
      type: 'product',
      label: labels.product(change.product, change.subProduct),
    })
  );

  if (entityTasks.organization.change) {
    targets.push({ type: 'business', label: labels.business });
  }

  projection.partyChanges.forEach((change) => {
    const party = change.approvedParty ?? change.proposal;
    if (
      change.partyId === projection.approvedClient.partyId ||
      party.roles?.includes('CLIENT')
    ) {
      return;
    }
    if (party.roles?.includes('INTERMEDIARY_OWNER')) {
      targets.push({
        type: 'intermediary',
        label: labels.intermediaryAddition(
          party.organizationDetails?.organizationName ?? labels.notProvided
        ),
      });
      return;
    }

    const name = getMaintenancePartyIdentity(
      party,
      undefined,
      labels.notProvided
    ).displayName;
    targets.push({
      type: 'person',
      label:
        change.action === 'ADD'
          ? labels.personAddition(name)
          : labels.personChange(name),
    });
  });

  const requiredWorkCount =
    entityTasks.organization.unresolvedDocumentRequestIds.length +
    entityTasks.organization.documentRequests.filter(
      (request) => request.status !== 'CLOSED'
    ).length +
    entityTasks.parties.reduce(
      (count, task) =>
        count +
        task.unresolvedDocumentRequestIds.length +
        task.documentRequests.filter((request) => request.status !== 'CLOSED')
          .length,
      0
    ) +
    entityTasks.intermediaryOrganizations.reduce(
      (count, task) =>
        count +
        task.unresolvedDocumentRequestIds.length +
        task.documentRequests.filter((request) => request.status !== 'CLOSED')
          .length,
      0
    ) +
    additionalRequiredWorkCount;
  if (requiredWorkCount > 0) {
    targets.push({
      type: 'required-work',
      label: labels.requiredWork(requiredWorkCount),
    });
  }

  return targets;
}
