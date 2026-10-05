import {
  isActiveMaintenanceStatus,
  type MaintenanceParty,
  type MaintenancePartyUpdateRequest,
} from '../models/maintenanceApi.types';
import { getOwnershipDescendants } from './getOwnershipDescendants';

export type OwnershipOperation =
  | { partyId: string; request: MaintenancePartyUpdateRequest }
  // A party that was never approved can't be deactivated; it's withdrawn from its request.
  | { partyId: string; withdrawFromRequestId: string };

const WRITABLE_PARTY_ROLES = new Set([
  'AUTHORIZED_USER',
  'BENEFICIAL_OWNER',
  'CLIENT',
  'CONTROLLER',
  'INTERMEDIARY_OWNER',
  'TRUSTEE',
  'DECISION_MAKER',
  'PRIMARY_CONTACT',
  'DIRECTOR',
]);

export type OwnershipOperationProgress = Map<
  string,
  { idempotencyKey: string; isComplete: boolean }
>;

export async function executeOwnershipOperations({
  operations,
  progress,
  createIdempotencyKey,
  applyOperation,
}: {
  operations: OwnershipOperation[];
  progress: OwnershipOperationProgress;
  createIdempotencyKey: () => string;
  applyOperation: (
    operation: OwnershipOperation,
    idempotencyKey: string
  ) => Promise<void>;
}) {
  for (const operation of operations) {
    const operationKey = `${operation.partyId}:${JSON.stringify(
      'request' in operation ? operation.request : operation
    )}`;
    const existingProgress = progress.get(operationKey);
    if (existingProgress?.isComplete) continue;
    const idempotencyKey =
      existingProgress?.idempotencyKey ?? createIdempotencyKey();
    progress.set(operationKey, { idempotencyKey, isComplete: false });
    await applyOperation(operation, idempotencyKey);
    progress.set(operationKey, { idempotencyKey, isComplete: true });
  }
}

const getDepth = (
  partyId: string,
  partiesById: Map<string, MaintenanceParty>
) => {
  let depth = 0;
  let currentPartyId: string | undefined = partyId;
  const visitedPartyIds = new Set<string>();

  while (currentPartyId && !visitedPartyIds.has(currentPartyId)) {
    visitedPartyIds.add(currentPartyId);
    currentPartyId = partiesById.get(currentPartyId)?.parentPartyId;
    depth += 1;
  }

  return depth;
};

const getGeneratedRoles = (party: MaintenanceParty) => {
  return (party.roles ?? []).filter((role) => WRITABLE_PARTY_ROLES.has(role));
};

const getOwnershipRole = (party: MaintenanceParty) =>
  party.partyType === 'ORGANIZATION' ||
  party.roles?.includes('INTERMEDIARY_OWNER')
    ? 'INTERMEDIARY_OWNER'
    : 'BENEFICIAL_OWNER';

const getPendingAdditionRequestId = (party: MaintenanceParty) =>
  party.updateRequest?.action === 'ADD' &&
  isActiveMaintenanceStatus(party.updateRequest.status)
    ? party.updateRequest.requestId
    : undefined;

export function getEligibleOwnershipParents({
  partyId,
  clientPartyId,
  parties,
}: {
  partyId: string;
  clientPartyId: string;
  parties: MaintenanceParty[];
}) {
  const descendantIds = new Set(
    getOwnershipDescendants(partyId, [parties]).flatMap(
      (party) => party.id ?? []
    )
  );

  return [
    clientPartyId,
    ...parties.flatMap((party) =>
      party.id &&
      party.active !== false &&
      party.roles?.includes('INTERMEDIARY_OWNER') &&
      party.id !== partyId &&
      !descendantIds.has(party.id)
        ? [party.id]
        : []
    ),
  ];
}

export function buildMoveOwnershipPlan({
  party,
  destinationPartyId,
  clientPartyId,
}: {
  party: MaintenanceParty;
  destinationPartyId: string;
  clientPartyId: string;
}): OwnershipOperation[] {
  if (!party.id || party.id === destinationPartyId) return [];

  const natureOfOwnership =
    destinationPartyId === clientPartyId ? 'Direct' : 'Indirect';
  const natureRequest: MaintenancePartyUpdateRequest =
    getOwnershipRole(party) === 'INTERMEDIARY_OWNER'
      ? { organizationDetails: { natureOfOwnership } }
      : { individualDetails: { natureOfOwnership } };

  // The parent goes alone, so a move the API doesn't record leaves nothing else behind.
  return [
    { partyId: party.id, request: { parentPartyId: destinationPartyId } },
    { partyId: party.id, request: natureRequest },
  ];
}

export function buildRemoveIntermediaryPlan({
  intermediaryPartyId,
  clientPartyId,
  parties,
  strategy,
}: {
  intermediaryPartyId: string;
  clientPartyId: string;
  parties: MaintenanceParty[];
  strategy: 'promote-children' | 'remove-branch';
}): OwnershipOperation[] {
  const intermediary = parties.find(
    (party) => party.id === intermediaryPartyId
  );
  if (!intermediary?.id) return [];
  const intermediaryRequestId = getPendingAdditionRequestId(intermediary);
  const intermediaryOperation: OwnershipOperation = intermediaryRequestId
    ? {
        partyId: intermediaryPartyId,
        withdrawFromRequestId: intermediaryRequestId,
      }
    : { partyId: intermediaryPartyId, request: { active: false } };

  if (strategy === 'promote-children') {
    const destinationPartyId = intermediary.parentPartyId ?? clientPartyId;
    const directChildren = parties.filter(
      (party) =>
        party.id &&
        party.active !== false &&
        party.parentPartyId === intermediaryPartyId
    );

    return [
      ...directChildren.flatMap((party) =>
        buildMoveOwnershipPlan({ party, destinationPartyId, clientPartyId })
      ),
      intermediaryOperation,
    ];
  }

  const descendants = getOwnershipDescendants(intermediaryPartyId, [parties]);
  const partiesById = new Map(
    parties.flatMap((party) => (party.id ? [[party.id, party]] : []))
  );
  const descendantOperations = [...descendants]
    .sort(
      (left, right) =>
        getDepth(right.id ?? '', partiesById) -
        getDepth(left.id ?? '', partiesById)
    )
    .flatMap((party): OwnershipOperation[] => {
      if (!party.id) return [];
      const remainingRoles = getGeneratedRoles(party).filter(
        (role) => role !== getOwnershipRole(party)
      );
      if (remainingRoles.length > 0) {
        return [
          { partyId: party.id, request: { parentPartyId: clientPartyId } },
          { partyId: party.id, request: { roles: remainingRoles } },
        ];
      }
      const pendingRequestId = getPendingAdditionRequestId(party);
      return [
        pendingRequestId
          ? { partyId: party.id, withdrawFromRequestId: pendingRequestId }
          : { partyId: party.id, request: { active: false } },
      ];
    });

  return [...descendantOperations, intermediaryOperation];
}
