import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import type {
  MaintenanceProjection,
  PartyChange,
  PartyValidationTask,
} from './buildMaintenanceProjection';

export type PartyMaintenanceEntityTask = {
  partyId: string;
  party: MaintenanceParty;
  change?: PartyChange;
  validationTasks: PartyValidationTask[];
  documentRequests: DocumentRequestResponse[];
  unresolvedDocumentRequestIds: string[];
};

export type OrganizationMaintenanceEntityTask = {
  party?: MaintenanceParty;
  documentRequests: DocumentRequestResponse[];
  unresolvedDocumentRequestIds: string[];
};

export type MaintenanceEntityTasks = {
  organization: OrganizationMaintenanceEntityTask;
  parties: PartyMaintenanceEntityTask[];
};

const getOrganizationParty = (client: MaintenanceClient) =>
  client.parties?.find(
    (party) =>
      party.id === client.partyId ||
      (party.partyType === 'ORGANIZATION' && party.roles?.includes('CLIENT'))
  );

export function buildMaintenanceEntityTasks(
  client: MaintenanceClient,
  projection: MaintenanceProjection,
  documentRequests: DocumentRequestResponse[]
): MaintenanceEntityTasks {
  const documentRequestsById = new Map(
    documentRequests
      .filter((request) => request.id)
      .map((request) => [request.id!, request])
  );
  const validationOwnerByDocumentId = new Map<string, string>();
  projection.validationTasks.forEach((validationTask) => {
    validationTask.documentRequestIds.forEach((documentRequestId) => {
      validationOwnerByDocumentId.set(
        documentRequestId,
        validationTask.partyId
      );
    });
  });

  const partyDocuments = new Map<string, DocumentRequestResponse[]>();
  const partyUnresolvedIds = new Map<string, string[]>();
  const organizationDocuments: DocumentRequestResponse[] = [];
  const organizationUnresolvedIds: string[] = [];

  projection.documentRequestIds.forEach((documentRequestId) => {
    const expectedPartyId = validationOwnerByDocumentId.get(documentRequestId);
    const documentRequest = documentRequestsById.get(documentRequestId);

    if (!documentRequest) {
      if (expectedPartyId) {
        partyUnresolvedIds.set(expectedPartyId, [
          ...(partyUnresolvedIds.get(expectedPartyId) ?? []),
          documentRequestId,
        ]);
      } else {
        organizationUnresolvedIds.push(documentRequestId);
      }
      return;
    }

    if (
      expectedPartyId &&
      documentRequest.partyId &&
      documentRequest.partyId !== expectedPartyId
    ) {
      partyUnresolvedIds.set(expectedPartyId, [
        ...(partyUnresolvedIds.get(expectedPartyId) ?? []),
        documentRequestId,
      ]);
      return;
    }

    const ownerPartyId = documentRequest.partyId ?? expectedPartyId;
    if (ownerPartyId && ownerPartyId !== client.partyId) {
      partyDocuments.set(ownerPartyId, [
        ...(partyDocuments.get(ownerPartyId) ?? []),
        documentRequest,
      ]);
      return;
    }

    organizationDocuments.push(documentRequest);
  });

  const parties = (client.parties ?? [])
    .filter(
      (party): party is MaintenanceParty & { id: string } =>
        party.partyType === 'INDIVIDUAL' && Boolean(party.id)
    )
    .map((party) => ({
      partyId: party.id,
      party,
      change: projection.partyChanges.find(
        (change) => change.partyId === party.id
      ),
      validationTasks: projection.validationTasks.filter(
        (validationTask) => validationTask.partyId === party.id
      ),
      documentRequests: partyDocuments.get(party.id) ?? [],
      unresolvedDocumentRequestIds: partyUnresolvedIds.get(party.id) ?? [],
    }));

  return {
    organization: {
      party: getOrganizationParty(client),
      documentRequests: organizationDocuments,
      unresolvedDocumentRequestIds: organizationUnresolvedIds,
    },
    parties,
  };
}
