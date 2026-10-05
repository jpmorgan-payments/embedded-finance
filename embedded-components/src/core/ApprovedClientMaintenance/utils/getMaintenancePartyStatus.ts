import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';

import type { PartyMaintenanceEntityTask } from './buildMaintenanceEntityTasks';
import type { MaintenanceStatusTone } from './maintenanceStatusTone';

export type MaintenancePartyStatusKind =
  | 'unreviewed'
  | 'pendingRemoval'
  | 'pendingAddition'
  | 'preparingDocuments'
  | 'actionRequired'
  | 'additionUnderReview'
  | 'changeUnderReview'
  | 'changeStatus';

export type MaintenancePartyStatus = {
  kind: MaintenancePartyStatusKind;
  tone: MaintenanceStatusTone;
  changeStatus?: KycUpdateRequestStatus;
  changeCount: number;
};

export type MaintenancePartyStatusSource = Pick<
  PartyMaintenanceEntityTask,
  'change' | 'unresolvedDocumentRequestIds' | 'documentRequests'
> &
  Partial<
    Pick<
      PartyMaintenanceEntityTask,
      'isPendingAddition' | 'isUnreviewed' | 'validationTasks'
    >
  >;

const getChangeStatusTone = (
  changeStatus?: KycUpdateRequestStatus
): MaintenanceStatusTone =>
  changeStatus === 'INFORMATION_REQUESTED'
    ? 'warning'
    : changeStatus === 'NEW' || !changeStatus
      ? 'emphasis'
      : 'neutral';

const toneByKind: Record<
  Exclude<MaintenancePartyStatusKind, 'changeStatus'>,
  MaintenanceStatusTone
> = {
  unreviewed: 'warning',
  pendingRemoval: 'destructive',
  pendingAddition: 'informative',
  preparingDocuments: 'neutral',
  actionRequired: 'warning',
  additionUnderReview: 'neutral',
  changeUnderReview: 'neutral',
};

// Medallions only mark whole-party lifecycle; field edits are left to the badge.
export const getMaintenanceMedallionTone = (
  status?: MaintenancePartyStatus
): MaintenanceStatusTone =>
  status?.kind === 'pendingAddition' || status?.kind === 'additionUnderReview'
    ? 'informative'
    : status?.kind === 'pendingRemoval'
      ? 'destructive'
      : status?.kind === 'actionRequired' || status?.kind === 'unreviewed'
        ? 'warning'
        : 'neutral';

export function getMaintenancePartyStatus(
  task: MaintenancePartyStatusSource,
  isDocumentDiscoveryPending: boolean
): MaintenancePartyStatus | undefined {
  const isPendingAddition = task.isPendingAddition ?? false;
  const hasDocumentWork =
    task.unresolvedDocumentRequestIds.length > 0 ||
    task.documentRequests.some(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
  const isPreparingDocuments =
    isDocumentDiscoveryPending &&
    (task.validationTasks ?? []).some(
      (validationTask) => validationTask.documentRequestIds.length > 0
    );
  const isPendingRemoval = task.change?.removesParty ?? false;
  const changeStatus = task.change?.proposal.updateRequest?.status;
  const isAdditionUnderReview =
    isPendingAddition && changeStatus === 'REVIEW_IN_PROGRESS';

  const kind: MaintenancePartyStatusKind | undefined = task.isUnreviewed
    ? 'unreviewed'
    : isPendingRemoval
      ? 'pendingRemoval'
      : isPendingAddition && !isAdditionUnderReview
        ? 'pendingAddition'
        : isPreparingDocuments
          ? 'preparingDocuments'
          : hasDocumentWork
            ? 'actionRequired'
            : task.change
              ? changeStatus === 'REVIEW_IN_PROGRESS'
                ? isAdditionUnderReview
                  ? 'additionUnderReview'
                  : 'changeUnderReview'
                : 'changeStatus'
              : undefined;
  if (!kind) return undefined;

  return {
    kind,
    tone:
      kind === 'changeStatus'
        ? getChangeStatusTone(changeStatus)
        : toneByKind[kind],
    changeStatus,
    changeCount: task.change?.fieldChanges.length ?? 0,
  };
}
