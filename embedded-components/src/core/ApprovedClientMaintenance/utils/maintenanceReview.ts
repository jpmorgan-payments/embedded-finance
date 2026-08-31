import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import type {
  MaintenanceClient,
  MaintenanceDocumentRequestSummary,
} from '../models/maintenanceApi.types';
import type { MaintenanceProjection } from './buildMaintenanceProjection';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';

export type MaintenanceRequirementType =
  | 'documents'
  | 'questions'
  | 'parties'
  | 'roles'
  | 'attestations'
  | 'unresolved'
  | 'conflict'
  | 'request';

export type MaintenanceSubmissionBlocker = {
  type: MaintenanceRequirementType;
  count: number;
};

export function createMaintenanceReviewFingerprint(
  client: MaintenanceClient,
  projection: MaintenanceProjection
): string {
  return JSON.stringify({
    requestId: projection.activeRequestId,
    clientRequest: client.updateRequest
      ? {
          requestId: client.updateRequest.requestId,
          status: client.updateRequest.status,
          submittedAt: client.updateRequest.submittedAt,
        }
      : undefined,
    productDetails: client.productDetails ?? [],
    parties: [...projection.partyChanges]
      .sort((left, right) => left.partyId.localeCompare(right.partyId))
      .map((change) => ({
        partyId: change.partyId,
        action: change.proposal.updateRequest?.action,
        status: change.proposal.updateRequest?.status,
        fields: [...change.fieldChanges]
          .sort((left, right) => left.field.localeCompare(right.field))
          .map((fieldChange) => ({
            field: fieldChange.field,
            proposedValue: fieldChange.proposedValue,
            requestId: fieldChange.source.requestId,
            submittedAt: fieldChange.source.submittedAt,
          })),
      })),
  });
}

export function getMaintenanceSubmissionBlockers(
  client: MaintenanceClient,
  projection: MaintenanceProjection,
  documentRequests: DocumentRequestResponse[],
  isDocumentDiscoveryPending: boolean
): MaintenanceSubmissionBlocker[] {
  const blockers: MaintenanceSubmissionBlocker[] = [];
  const outstanding = client.outstanding;
  const addBlocker = (type: MaintenanceRequirementType, count: number) => {
    if (count > 0) blockers.push({ type, count });
  };

  if (!projection.activeRequestId) addBlocker('request', 1);
  if (projection.hasConflicts) addBlocker('conflict', 1);
  addBlocker('unresolved', projection.unresolvedProposals.length);
  addBlocker('questions', outstanding?.questionIds?.length ?? 0);
  const documentBackedPartyIds = new Set(
    projection.validationTasks
      .filter((validationTask) => validationTask.documentRequestIds.length > 0)
      .map((validationTask) => validationTask.partyId)
  );
  const partyRequirementCount = (outstanding?.partyIds ?? []).filter(
    (partyId) => !documentBackedPartyIds.has(partyId)
  ).length;
  addBlocker('parties', partyRequirementCount);
  addBlocker('roles', outstanding?.partyRoles?.length ?? 0);
  addBlocker('attestations', outstanding?.attestationDocumentIds?.length ?? 0);

  const expectedDocumentIds = new Set([
    ...(outstanding?.documentRequestIds ?? []),
    ...projection.validationTasks.flatMap(
      (validationTask) => validationTask.documentRequestIds
    ),
  ]);
  const returnedDocumentIds = new Set(
    documentRequests
      .map((documentRequest) => documentRequest.id)
      .filter((id): id is string => Boolean(id))
  );
  const openDocumentCount = documentRequests.filter(
    (documentRequest) =>
      documentRequest.id &&
      expectedDocumentIds.has(documentRequest.id) &&
      documentRequest.status !== 'CLOSED'
  ).length;
  const missingDocumentCount = [...expectedDocumentIds].filter(
    (documentRequestId) => !returnedDocumentIds.has(documentRequestId)
  ).length;
  addBlocker(
    'documents',
    openDocumentCount +
      missingDocumentCount +
      Number(isDocumentDiscoveryPending && expectedDocumentIds.size === 0)
  );

  return blockers;
}

export const areMaintenanceReadsStable = (
  firstFingerprint: string,
  secondFingerprint: string
) => firstFingerprint === secondFingerprint;

export type CompleteMaintenanceReviewRead = {
  client: MaintenanceClient;
  parties: Parameters<typeof buildMaintenanceProjection>[1];
  documentRequests: MaintenanceDocumentRequestSummary[];
};

export class MaintenanceSubmissionError extends Error {
  constructor(
    message: string,
    readonly code: 'BLOCKED' | 'CHANGED'
  ) {
    super(message);
    this.name = 'MaintenanceSubmissionError';
  }
}

export async function validateStableMaintenanceSubmission(
  readCompleteState: () => Promise<CompleteMaintenanceReviewRead>,
  reviewedFingerprint: string
): Promise<CompleteMaintenanceReviewRead> {
  const firstRead = await readCompleteState();
  const firstProjection = buildMaintenanceProjection(
    firstRead.client,
    firstRead.parties
  );
  const firstFingerprint = createMaintenanceReviewFingerprint(
    firstRead.client,
    firstProjection
  );
  const firstBlockers = getMaintenanceSubmissionBlockers(
    firstRead.client,
    firstProjection,
    firstRead.documentRequests,
    false
  );
  if (firstBlockers.length > 0) {
    throw new MaintenanceSubmissionError(
      'Requirements changed before submission. Review the updated checklist.',
      'BLOCKED'
    );
  }
  if (firstFingerprint !== reviewedFingerprint) {
    throw new MaintenanceSubmissionError(
      'Draft updates changed before submission. Review the latest updates.',
      'CHANGED'
    );
  }

  const secondRead = await readCompleteState();
  const secondProjection = buildMaintenanceProjection(
    secondRead.client,
    secondRead.parties
  );
  const secondFingerprint = createMaintenanceReviewFingerprint(
    secondRead.client,
    secondProjection
  );
  const secondBlockers = getMaintenanceSubmissionBlockers(
    secondRead.client,
    secondProjection,
    secondRead.documentRequests,
    false
  );
  if (secondBlockers.length > 0) {
    throw new MaintenanceSubmissionError(
      'Requirements changed before submission. Review the updated checklist.',
      'BLOCKED'
    );
  }
  if (!areMaintenanceReadsStable(firstFingerprint, secondFingerprint)) {
    throw new MaintenanceSubmissionError(
      'Draft updates changed while they were being checked. Review the latest updates.',
      'CHANGED'
    );
  }

  return secondRead;
}
