import type { MaintenanceEntityTasks } from './buildMaintenanceEntityTasks';

export type MaintenanceRequestSummaryState =
  | 'draft'
  | 'draftRequirements'
  | 'submitted'
  | 'action';

const hasOpenDocumentWork = (task: {
  unresolvedDocumentRequestIds: string[];
  documentRequests: Array<{ status?: string }>;
}) =>
  task.unresolvedDocumentRequestIds.length > 0 ||
  task.documentRequests.some(
    (documentRequest) => documentRequest.status !== 'CLOSED'
  );

export function getMaintenanceRequestSummaryState({
  activeRequestStatus,
  entityTasks,
  isDocumentDiscoveryPending,
}: {
  activeRequestStatus?: string;
  entityTasks: MaintenanceEntityTasks;
  isDocumentDiscoveryPending: boolean;
}): MaintenanceRequestSummaryState {
  const requiresAction =
    isDocumentDiscoveryPending ||
    hasOpenDocumentWork(entityTasks.organization) ||
    entityTasks.parties.some(hasOpenDocumentWork) ||
    entityTasks.intermediaryOrganizations.some(hasOpenDocumentWork);

  if (activeRequestStatus === 'INFORMATION_REQUESTED') return 'action';
  if (requiresAction && activeRequestStatus !== 'REVIEW_IN_PROGRESS') {
    return 'draftRequirements';
  }
  if (activeRequestStatus === 'REVIEW_IN_PROGRESS') return 'submitted';
  return 'draft';
}
