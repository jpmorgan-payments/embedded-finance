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
  proposedParty: MaintenanceParty;
  isPendingAddition: boolean;
  change?: PartyChange;
  validationTasks: PartyValidationTask[];
  documentRequests: DocumentRequestResponse[];
  unresolvedDocumentRequestIds: string[];
};

export type OrganizationMaintenanceEntityTask = {
  party?: MaintenanceParty;
  change?: PartyChange;
  documentRequests: DocumentRequestResponse[];
  unresolvedDocumentRequestIds: string[];
};

export type MaintenanceEntityTasks = {
  organization: OrganizationMaintenanceEntityTask;
  parties: PartyMaintenanceEntityTask[];
  intermediaryOrganizations: PartyMaintenanceEntityTask[];
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

  const proposedPartyIds = new Set(
    (projection.proposedClient.parties ?? [])
      .map((party) => party.id)
      .filter((id): id is string => Boolean(id))
  );
  const approvedParties = (client.parties ?? []).filter(
    (party) =>
      !party.id ||
      proposedPartyIds.has(party.id) ||
      projection.partyChanges.some(
        (change) => change.partyId === party.id && change.removesParty
      )
  );
  const approvedPartyIds = new Set(
    approvedParties
      .map((party) => party.id)
      .filter((id): id is string => Boolean(id))
  );
  const addedParties = (projection.proposedClient.parties ?? []).filter(
    (party) => party.id && !approvedPartyIds.has(party.id)
  );
  const createEntityTask = (
    party: MaintenanceParty & { id: string }
  ): PartyMaintenanceEntityTask => ({
    partyId: party.id,
    party,
    proposedParty:
      projection.proposedClient.parties?.find(
        (proposedParty) => proposedParty.id === party.id
      ) ?? party,
    change: projection.partyChanges.find(
      (change) => change.partyId === party.id
    ),
    isPendingAddition: projection.partyChanges.some(
      (change) =>
        change.partyId === party.id &&
        change.action === 'ADD' &&
        !change.approvedParty
    ),
    validationTasks: projection.validationTasks.filter(
      (validationTask) => validationTask.partyId === party.id
    ),
    documentRequests: partyDocuments.get(party.id) ?? [],
    unresolvedDocumentRequestIds: partyUnresolvedIds.get(party.id) ?? [],
  });
  const relatedEntities = [...approvedParties, ...addedParties].filter(
    (party): party is MaintenanceParty & { id: string } => Boolean(party.id)
  );
  const parties = relatedEntities
    .filter((party) => party.partyType === 'INDIVIDUAL')
    .map(createEntityTask);
  const intermediaryOrganizations = relatedEntities
    .filter(
      (party) =>
        party.partyType === 'ORGANIZATION' &&
        party.roles?.includes('INTERMEDIARY_OWNER')
    )
    .map(createEntityTask);

  const organizationParty = getOrganizationParty(client);

  return {
    organization: {
      party: organizationParty,
      change: projection.partyChanges.find(
        (change) => change.partyId === organizationParty?.id
      ),
      documentRequests: organizationDocuments,
      unresolvedDocumentRequestIds: organizationUnresolvedIds,
    },
    parties,
    intermediaryOrganizations,
  };
}
