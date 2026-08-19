import { PartyResponse, Role } from '@/api/generated/smbdo.schemas';

import { INTERMEDIARY_OWNER_ROLE } from '../IndirectOwnership.types';
import type {
  IndividualOwner,
  OwnershipParty,
  OwnershipPathStep,
  OwnershipStructure,
} from '../types';

/**
 * Transforms API party data into ownership structure
 */
export function transformPartiesToOwnershipStructure(
  parties: PartyResponse[],
  clientId: string
): OwnershipStructure | null {
  if (!parties || parties.length === 0) return null;

  // Find the root party (CLIENT role)
  const rootParty = parties.find((party) =>
    party.roles?.includes('CLIENT' as Role)
  );

  if (!rootParty) return null;

  // Build hierarchy
  const ownershipParties = buildOwnershipHierarchy(parties, rootParty);
  const ownershipChain = buildOwnershipChain(ownershipParties);
  const ultimateOwners = findUltimateBeneficialOwners(ownershipParties);

  return {
    clientId,
    rootParty: ownershipParties,
    ownershipChain,
    ultimateBeneficialOwners: ultimateOwners,
    validationStatus: {
      isValid: ultimateOwners.length > 0,
      errors: [],
      warnings: [],
      completionLevel: ultimateOwners.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
    },
  };
}

/**
 * Builds the ownership hierarchy from flat party array
 */
function buildOwnershipHierarchy(
  parties: PartyResponse[],
  rootParty: PartyResponse
): OwnershipParty {
  // const partyMap = new Map(parties.map((p) => [p.id, p]));

  function buildParty(party: PartyResponse, depth = 0): OwnershipParty {
    const children = parties
      .filter((p) => p.parentPartyId === party.id)
      .map((childParty) => buildParty(childParty, depth + 1));

    return {
      ...party,
      roles: (party.roles || []) as Role[],
      ownershipType: depth === 0 ? 'DIRECT' : 'INDIRECT',
      children,
      ultimateBeneficialOwner:
        party.partyType === 'INDIVIDUAL' &&
        party.roles?.includes('BENEFICIAL_OWNER' as Role)
          ? createIndividualOwner(party, []) || undefined
          : undefined,
    };
  }

  return buildParty(rootParty);
}

/**
 * Builds ownership chain levels
 */
function buildOwnershipChain(rootParty: OwnershipParty) {
  const levels: { depth: number; parties: OwnershipParty[] }[] = [];

  function traverse(party: OwnershipParty, depth: number) {
    // Find or create level
    let level = levels.find((l) => l.depth === depth);
    if (!level) {
      level = { depth, parties: [] };
      levels.push(level);
    }

    level.parties.push(party);

    // Traverse children
    party.children.forEach((child) => traverse(child, depth + 1));
  }

  traverse(rootParty, 0);
  return levels.sort((a, b) => a.depth - b.depth);
}

/**
 * Finds ultimate beneficial owners in the structure
 */
function findUltimateBeneficialOwners(
  rootParty: OwnershipParty
): IndividualOwner[] {
  const owners: IndividualOwner[] = [];

  function traverse(party: OwnershipParty, path: OwnershipPathStep[]) {
    if (
      party.partyType === 'INDIVIDUAL' &&
      party.roles.includes('BENEFICIAL_OWNER' as Role)
    ) {
      const owner = createIndividualOwner(party, path);
      if (owner) owners.push(owner);
    }

    // Continue traversing children
    party.children.forEach((child) => {
      const newPath = [
        ...path,
        {
          entityName:
            party.organizationDetails?.organizationName ||
            `${party.individualDetails?.firstName} ${party.individualDetails?.lastName}` ||
            'Unknown',
          entityId: party.id || '',
          relationship: 'OWNS',
        },
      ];
      traverse(child, newPath);
    });
  }

  traverse(rootParty, []);
  return owners;
}

/**
 * Creates an IndividualOwner from PartyResponse
 */
function createIndividualOwner(
  party: PartyResponse,
  path: OwnershipPathStep[]
): IndividualOwner | null {
  if (!party.id || !party.individualDetails) return null;

  return {
    partyId: party.id,
    firstName: party.individualDetails.firstName || '',
    lastName: party.individualDetails.lastName || '',
    ownershipPath: path,
    verificationStatus: 'PENDING', // TODO: Map from actual status
  };
}

/**
 * Validates ownership structure completeness
 */
export function validateOwnershipCompleteness(structure: OwnershipStructure) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for ultimate beneficial owners
  if (structure.ultimateBeneficialOwners.length === 0) {
    errors.push('No ultimate beneficial owners identified');
  }

  // Check for complete ownership chains
  if (
    !structure.rootParty.children ||
    structure.rootParty.children.length === 0
  ) {
    warnings.push('No ownership structure defined');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completionLevel:
      structure.ultimateBeneficialOwners.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
  };
}

/**
 * Flattens ownership tree for display purposes
 */
export function flattenOwnershipTree(
  rootParty: OwnershipParty
): OwnershipParty[] {
  const flattened: OwnershipParty[] = [];

  function traverse(party: OwnershipParty) {
    flattened.push(party);
    party.children.forEach(traverse);
  }

  traverse(rootParty);
  return flattened;
}

/**
 * Gets ownership path from root to specific party
 */
export function getOwnershipPath(
  rootParty: OwnershipParty,
  targetPartyId: string
): OwnershipParty[] {
  const path: OwnershipParty[] = [];

  function findPath(
    party: OwnershipParty,
    currentPath: OwnershipParty[]
  ): boolean {
    const newPath = [...currentPath, party];

    if (party.id === targetPartyId) {
      path.splice(0, path.length, ...newPath);
      return true;
    }

    return party.children.some((child) => findPath(child, newPath));
  }

  findPath(rootParty, []);
  return path;
}

/**
 * Given an indirect owner being removed, returns the IDs of the intermediary
 * parties in that owner's ownership chain that become orphaned and should be
 * deactivated along with the owner.
 *
 * Walks up the `parentPartyId` chain from the owner toward the CLIENT and stops
 * at: the CLIENT, any inactive or non-intermediary party, or the first
 * intermediary still referenced by another active party (i.e. shared with
 * another owner's chain — that node and its ancestors are preserved). The
 * owner's own id is not included in the result.
 */
export function getOrphanedIntermediaryPartyIds(
  parties: PartyResponse[],
  ownerId: string
): string[] {
  const owner = parties.find((p) => p.id === ownerId);
  if (!owner) return [];

  const toDeactivate = new Set<string>([ownerId]);
  const orphaned: string[] = [];

  let parentId = owner.parentPartyId;
  while (parentId) {
    const parent = parties.find((p) => p.id === parentId);
    if (!parent || !parent.active) break;
    // Never deactivate the client, and only cascade through intermediaries.
    if (parent.roles?.includes('CLIENT' as Role)) break;
    if (
      parent.partyType !== 'ORGANIZATION' ||
      !parent.roles?.includes(INTERMEDIARY_OWNER_ROLE)
    ) {
      break;
    }
    // Stop if this intermediary is still used by another active party (its
    // ancestors stay reachable through that party's chain).
    const hasOtherActiveChild = parties.some(
      (p) =>
        p.active &&
        p.id !== undefined &&
        !toDeactivate.has(p.id) &&
        p.parentPartyId === parent.id
    );
    if (hasOtherActiveChild) break;

    if (parent.id) {
      toDeactivate.add(parent.id);
      orphaned.push(parent.id);
    }
    parentId = parent.parentPartyId;
  }

  return orphaned;
}

/**
 * Prune empty/stub fields from a party details object so recreating a party via
 * POST /parties preserves all the real data the user already entered without
 * tripping validation on partially-filled sub-objects.
 *
 * Drops: undefined/null/empty-string values, empty arrays, and a `phone`
 * object that has no phoneNumber (a country-code-only stub the form leaves
 * behind). Everything else — birthDate, addresses, individualIds,
 * organizationIds, jobTitles, etc. — is carried through unchanged.
 */
export function pruneEmptyDetailFields<T extends object>(
  details: T | undefined
): Partial<T> {
  if (!details) return {};
  const pruned: Record<string, unknown> = {};
  Object.entries(details as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      pruned[key] = value;
      return;
    }
    if (key === 'phone') {
      const phone = value as { phoneNumber?: string };
      if (!phone.phoneNumber) return;
    }
    pruned[key] = value;
  });
  return pruned as Partial<T>;
}
