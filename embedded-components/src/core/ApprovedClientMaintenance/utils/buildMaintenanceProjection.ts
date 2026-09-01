import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';

import {
  isActiveMaintenanceStatus,
  type ActiveMaintenanceStatus,
  type MaintenanceClient,
  type MaintenanceParty,
} from '../models/maintenanceApi.types';

export type PartyFieldChange = {
  field: keyof IndividualLegalNameValues;
  approvedValue: string;
  proposedValue: string;
  source: {
    requestId: string;
    submittedAt: string;
    status: ActiveMaintenanceStatus;
  };
};

export type PartyChange = {
  partyId: string;
  approvedParty: MaintenanceParty;
  proposal: MaintenanceParty;
  fieldChanges: PartyFieldChange[];
};

export type PartyValidationTask = {
  partyId: string;
  party: MaintenanceParty;
  validationStatus?: string;
  validationType?: string;
  documentRequestIds: string[];
};

export type MaintenanceProjection = {
  approvedClient: MaintenanceClient;
  partyChanges: PartyChange[];
  validationTasks: PartyValidationTask[];
  documentRequestIds: string[];
  outstandingPartyIds: string[];
  unresolvedProposals: MaintenanceParty[];
  hasConflicts: boolean;
  activeRequestId?: string;
  canReview: boolean;
};

const NAME_FIELDS: Array<keyof IndividualLegalNameValues> = [
  'firstName',
  'middleName',
  'lastName',
];

const hasRequiredCorrelation = (proposal: MaintenanceParty) => {
  const updateRequest = proposal.updateRequest;
  return Boolean(
    proposal.id &&
      updateRequest?.requestId &&
      updateRequest.submittedAt &&
      updateRequest.action &&
      isActiveMaintenanceStatus(updateRequest.status)
  );
};

const groupProposalsByPartyId = (proposals: MaintenanceParty[]) =>
  proposals.reduce<Map<string, MaintenanceParty[]>>(
    (proposalsByPartyId, proposal) => {
      const partyId = proposal.id!;
      const partyProposals = proposalsByPartyId.get(partyId) ?? [];
      partyProposals.push(proposal);
      proposalsByPartyId.set(partyId, partyProposals);
      return proposalsByPartyId;
    },
    new Map()
  );

export function buildMaintenanceProjection(
  approvedClient: MaintenanceClient,
  maintenanceParties: MaintenanceParty[]
): MaintenanceProjection {
  const activeProposals = maintenanceParties.filter((party) =>
    isActiveMaintenanceStatus(party.updateRequest?.status)
  );
  const unresolvedProposals = activeProposals.filter(
    (proposal) => !hasRequiredCorrelation(proposal)
  );
  const correlatedProposals = activeProposals.filter(hasRequiredCorrelation);
  const activeRequestIds = new Set(
    correlatedProposals.map((proposal) => proposal.updateRequest!.requestId!)
  );
  const proposalsByPartyId = groupProposalsByPartyId(correlatedProposals);
  let hasConflicts = activeRequestIds.size > 1;
  const partyChanges: PartyChange[] = [];

  proposalsByPartyId.forEach((proposals, partyId) => {
    const approvedParty = approvedClient.parties?.find(
      (party) => party.id === partyId
    );
    if (!approvedParty) {
      unresolvedProposals.push(...proposals);
      return;
    }

    const fieldChanges: PartyFieldChange[] = [];
    NAME_FIELDS.forEach((field) => {
      const proposalsWithField = proposals.filter(
        (proposal) => proposal.individualDetails?.[field] !== undefined
      );
      const proposedValues = new Set(
        proposalsWithField.map(
          (proposal) => proposal.individualDetails?.[field] as string
        )
      );

      if (proposedValues.size > 1) {
        hasConflicts = true;
        return;
      }

      const proposal = proposalsWithField[0];
      if (!proposal) return;

      const proposedValue = proposal.individualDetails?.[field];
      const approvedValue = approvedParty.individualDetails?.[field] ?? '';
      if (proposedValue === undefined || proposedValue === approvedValue)
        return;

      fieldChanges.push({
        field,
        approvedValue,
        proposedValue,
        source: {
          requestId: proposal.updateRequest!.requestId!,
          submittedAt: proposal.updateRequest!.submittedAt!,
          status: proposal.updateRequest!.status as ActiveMaintenanceStatus,
        },
      });
    });

    if (fieldChanges.length > 0) {
      partyChanges.push({
        partyId,
        approvedParty,
        proposal: proposals[0],
        fieldChanges,
      });
    }
  });

  const validationTasks = (approvedClient.parties ?? []).flatMap((party) => {
    if (!party.id) return [];
    return (party.validationResponse ?? [])
      .filter(
        (validation) =>
          validation.validationStatus === 'NEEDS_INFO' ||
          (validation.documentRequestIds?.length ?? 0) > 0
      )
      .map((validation) => ({
        partyId: party.id!,
        party,
        validationStatus: validation.validationStatus,
        validationType: validation.validationType,
        documentRequestIds: validation.documentRequestIds ?? [],
      }));
  });
  const documentRequestIds = [
    ...new Set([
      ...(approvedClient.outstanding?.documentRequestIds ?? []),
      ...validationTasks.flatMap((task) => task.documentRequestIds),
    ]),
  ];

  return {
    approvedClient,
    partyChanges,
    validationTasks,
    documentRequestIds,
    outstandingPartyIds: approvedClient.outstanding?.partyIds ?? [],
    unresolvedProposals,
    hasConflicts,
    activeRequestId:
      activeRequestIds.size === 1 ? [...activeRequestIds][0] : undefined,
    canReview:
      unresolvedProposals.length === 0 &&
      !hasConflicts &&
      activeRequestIds.size <= 1,
  };
}
