import {
  isActiveMaintenanceStatus,
  type ActiveMaintenanceStatus,
  type MaintenanceClient,
  type MaintenanceParty,
  type MaintenanceStatus,
} from '../models/maintenanceApi.types';
import {
  MAINTENANCE_FIELD_DESCRIPTORS,
  type EditablePartyField,
} from './maintenanceFieldDescriptors';

export type PartyFieldChange = {
  field: EditablePartyField;
  labelKey: string;
  approvedValue: string;
  proposedValue: string;
  approvedRawValue?: unknown;
  proposedRawValue: unknown;
  sensitivity: 'public' | 'masked';
  source: {
    requestId: string;
    submittedAt: string;
    status: ActiveMaintenanceStatus;
  };
};

export type PartyChange = {
  partyId: string;
  approvedParty?: MaintenanceParty;
  proposal: MaintenanceParty;
  action: 'ADD' | 'MODIFY' | 'DELETE';
  removesParty: boolean;
  fieldChanges: PartyFieldChange[];
};

export type ProductChange = {
  product: string;
  subProduct?: string;
  requestedAction: 'ADD' | 'REMOVE';
  onboardingStatus?: string;
  source: {
    requestId?: string;
    status: ActiveMaintenanceStatus;
    submittedAt?: string;
  };
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
  proposedClient: MaintenanceClient;
  productChanges: ProductChange[];
  partyChanges: PartyChange[];
  validationTasks: PartyValidationTask[];
  documentRequestIds: string[];
  outstandingPartyIds: string[];
  unresolvedProposals: MaintenanceParty[];
  hasConflicts: boolean;
  activeRequestId?: string;
  canReview: boolean;
};

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
  const approvedBaseline = structuredClone(approvedClient);
  const proposedClient = structuredClone(approvedClient);
  const nonApprovedEmbeddedAdditions = (approvedClient.parties ?? []).filter(
    (party) =>
      party.updateRequest?.action === 'ADD' &&
      party.updateRequest.status !== 'APPROVED'
  );
  const activeEmbeddedAdditionProposals = nonApprovedEmbeddedAdditions.filter(
    (party) => isActiveMaintenanceStatus(party.updateRequest?.status)
  );
  const embeddedAdditionIds = new Set(
    nonApprovedEmbeddedAdditions
      .map((party) => party.id)
      .filter((partyId): partyId is string => Boolean(partyId))
  );
  approvedBaseline.parties = (approvedBaseline.parties ?? []).filter(
    (party) => !party.id || !embeddedAdditionIds.has(party.id)
  );
  proposedClient.parties = (proposedClient.parties ?? []).filter(
    (party) => !party.id || !embeddedAdditionIds.has(party.id)
  );
  const normalizedProductDetails = (approvedClient.productDetails ?? []).map(
    (detail) => ({
      ...detail,
      product:
        detail.product ??
        (detail.subProduct === 'LIMITED_DDA' ||
        detail.subProduct === 'LIMITED_DDA_PAYMENTS'
          ? 'EMBEDDED_PAYMENTS'
          : undefined),
      subProduct:
        detail.subProduct ??
        (detail.product === 'EMBEDDED_PAYMENTS' ? 'LIMITED_DDA' : undefined),
    })
  );
  approvedBaseline.productDetails = structuredClone(normalizedProductDetails);
  proposedClient.productDetails = structuredClone(normalizedProductDetails);
  const maintenancePartyIds = new Set(
    maintenanceParties
      .map((party) => party.id)
      .filter((partyId): partyId is string => Boolean(partyId))
  );
  const activeProposals = [
    ...maintenanceParties,
    ...activeEmbeddedAdditionProposals.filter(
      (party) => !party.id || !maintenancePartyIds.has(party.id)
    ),
  ].filter((party) => isActiveMaintenanceStatus(party.updateRequest?.status));
  const unresolvedProposals = activeProposals.filter(
    (proposal) => !hasRequiredCorrelation(proposal)
  );
  const correlatedProposals = activeProposals.filter(hasRequiredCorrelation);
  const activeRequestIds = new Set(
    correlatedProposals.map((proposal) => proposal.updateRequest!.requestId!)
  );
  if (
    isActiveMaintenanceStatus(approvedClient.updateRequest?.status) &&
    approvedClient.updateRequest?.requestId
  ) {
    activeRequestIds.add(approvedClient.updateRequest.requestId);
  }
  const proposalsByPartyId = groupProposalsByPartyId(correlatedProposals);
  const hasConflicts = activeRequestIds.size > 1;
  const partyChanges: PartyChange[] = [];

  const productChanges: ProductChange[] = [];
  normalizedProductDetails
    .filter(
      (detail) =>
        detail.subProduct === 'LIMITED_DDA_PAYMENTS' &&
        isActiveMaintenanceStatus(
          detail.onboardingStatus as MaintenanceStatus | undefined
        )
    )
    .forEach((detail) => {
      if (!detail.product) return;
      productChanges.push({
        product: detail.product,
        subProduct: detail.subProduct,
        requestedAction: detail.action ?? 'ADD',
        onboardingStatus: detail.onboardingStatus,
        source: {
          requestId: approvedClient.updateRequest?.requestId,
          status: detail.onboardingStatus as ActiveMaintenanceStatus,
          submittedAt: approvedClient.updateRequest?.submittedAt,
        },
      });
    });
  if (productChanges.length > 0) {
    const activeProductKeys = new Set(
      productChanges.map(
        (change) => `${change.product}:${change.subProduct ?? ''}`
      )
    );
    approvedBaseline.productDetails = (
      approvedBaseline.productDetails ?? []
    ).filter(
      (detail) =>
        !activeProductKeys.has(
          `${detail.product ?? ''}:${detail.subProduct ?? ''}`
        )
    );
  }

  proposalsByPartyId.forEach((proposals, partyId) => {
    const orderedProposals = [...proposals].sort((left, right) =>
      (left.updateRequest?.submittedAt ?? '').localeCompare(
        right.updateRequest?.submittedAt ?? ''
      )
    );
    const latestProposal = orderedProposals.at(-1)!;
    const additionProposal = orderedProposals.find(
      (proposal) => proposal.updateRequest?.action === 'ADD'
    );
    const approvedParty = approvedBaseline.parties?.find(
      (party) => party.id === partyId
    );
    const action =
      !approvedParty && additionProposal
        ? 'ADD'
        : latestProposal.updateRequest?.action;
    if (!approvedParty && !additionProposal) {
      unresolvedProposals.push(...proposals);
      return;
    }

    const baselineParty: MaintenanceParty = approvedParty ?? {
      id: partyId,
      partyType: latestProposal.partyType,
      roles: [],
    };

    const proposedParty =
      proposedClient.parties?.find((party) => party.id === partyId) ??
      structuredClone(additionProposal ?? latestProposal);
    const fieldChanges: PartyFieldChange[] = [];
    const effectiveRoles =
      orderedProposals
        .filter((proposal) => (proposal.roles?.length ?? 0) > 0)
        .at(-1)?.roles ??
      baselineParty.roles ??
      [];
    MAINTENANCE_FIELD_DESCRIPTORS.forEach((descriptor) => {
      if (
        descriptor.field === 'natureOfOwnership' &&
        !effectiveRoles.includes('BENEFICIAL_OWNER')
      ) {
        return;
      }
      const proposal = orderedProposals
        .filter((candidate) => {
          if (!descriptor.isPresent(candidate)) return false;
          const value = descriptor.read(candidate);
          return !Array.isArray(value) || value.length > 0;
        })
        .at(-1);
      if (!proposal) return;

      const approvedRawValue =
        descriptor.field === 'natureOfOwnership' &&
        !baselineParty.roles?.includes('BENEFICIAL_OWNER')
          ? undefined
          : descriptor.read(baselineParty);
      const proposedRawValue = descriptor.read(proposal);
      if (proposedRawValue === undefined) return;
      if (
        JSON.stringify(proposedRawValue) === JSON.stringify(approvedRawValue)
      ) {
        return;
      }
      const proposedValue = descriptor.format(proposedRawValue);
      const approvedValue = descriptor.format(approvedRawValue);

      fieldChanges.push({
        field: descriptor.field,
        labelKey: descriptor.labelKey,
        approvedValue,
        proposedValue,
        approvedRawValue,
        proposedRawValue,
        sensitivity: descriptor.sensitivity,
        source: {
          requestId: proposal.updateRequest!.requestId!,
          submittedAt: proposal.updateRequest!.submittedAt!,
          status: proposal.updateRequest!.status as ActiveMaintenanceStatus,
        },
      });
      descriptor.write(proposedParty, proposedRawValue);
    });

    const removesParty = proposals.some(
      (proposal) => proposal.active === false
    );
    if (action === 'ADD' && !approvedParty) {
      proposedClient.parties = [
        ...(proposedClient.parties ?? []).filter(
          (party) => party.id !== proposedParty.id
        ),
        proposedParty,
      ];
    } else if (removesParty) {
      proposedClient.parties = (proposedClient.parties ?? []).filter(
        (party) => party.id !== partyId
      );
    }

    if (fieldChanges.length > 0 || removesParty || action === 'ADD') {
      partyChanges.push({
        partyId,
        approvedParty,
        proposal: latestProposal,
        action: action ?? 'MODIFY',
        removesParty,
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
    approvedClient: approvedBaseline,
    proposedClient,
    productChanges,
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
