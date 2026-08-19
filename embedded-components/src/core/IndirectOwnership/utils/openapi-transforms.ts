/**
 * Utilities for transforming OpenAPI data to IndirectOwnership component types
 */
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  BeneficialOwner,
  BeneficialOwnerStatus,
} from '../IndirectOwnership.types';

/**
 * Transform a PartyResponse to BeneficialOwner format
 */
export function transformPartyToBeneficialOwner(
  party: PartyResponse,
  allParties: PartyResponse[] = [],
  existingHierarchy?: any
): BeneficialOwner {
  // Determine ownership type from multiple signals:
  // 1. natureOfOwnership field on individual or organization (explicit API classification)
  // 2. parentPartyId pointing to a non-CLIENT party (structural chain)
  // 3. parentPartyId pointing to CLIENT = direct (just links party to client)
  const natureOfOwnership =
    party.individualDetails?.natureOfOwnership ||
    // OrganizationDetails.natureOfOwnership is not yet in the generated schema
    (party.organizationDetails as { natureOfOwnership?: string } | undefined)
      ?.natureOfOwnership;
  const parentIsClient = party.parentPartyId
    ? allParties
        .find((p) => p.id === party.parentPartyId)
        ?.roles?.includes('CLIENT')
    : false;
  // An explicit natureOfOwnership always wins. Only fall back to the
  // parentPartyId-based inference when nature is unset. Without this, a chain
  // intermediary (created with natureOfOwnership "Direct" and a parentPartyId
  // pointing at the owner it sits under) was wrongly classified INDIRECT, which
  // made the transform rebuild a backwards chain back through that owner.
  const ownershipType =
    natureOfOwnership === 'Indirect'
      ? 'INDIRECT'
      : natureOfOwnership === 'Direct'
        ? 'DIRECT'
        : party.parentPartyId && !parentIsClient
          ? 'INDIRECT'
          : 'DIRECT';

  // Use existing hierarchy if provided, otherwise build for indirect owners
  const ownershipHierarchy =
    existingHierarchy ||
    (ownershipType === 'INDIRECT'
      ? buildOwnershipHierarchy(party, allParties)
      : undefined);

  // Determine status based ONLY on hierarchy completion (not KYC status)
  const status = determineOwnerStatus(party, ownershipType, ownershipHierarchy);

  // Calculate if meets 25% threshold based on hierarchy metadata
  const meets25PercentThreshold = calculateMeets25PercentThreshold(
    ownershipType,
    ownershipHierarchy
  );

  return {
    id: party.id,
    parentPartyId: party.parentPartyId,
    partyType: party.partyType,
    profileStatus: party.profileStatus,
    active: party.active,
    individualDetails: party.individualDetails,
    organizationDetails: party.organizationDetails,
    ownershipType,
    status,
    ownershipHierarchy,
    meets25PercentThreshold,
    // Convenience properties for display
    firstName: party.individualDetails?.firstName,
    lastName: party.individualDetails?.lastName,
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now()),
  } as BeneficialOwner;
}

/**
 * Reconstruct an owner's ownership chain from the intermediary parties that
 * reference it as their parent. Chain intermediaries are persisted with
 * parentPartyId pointing at the owner they sit under, so this lets the chain be
 * rebuilt from the saved party graph — surviving navigation/refresh even when
 * the in-memory UI state has been reset (which previously wiped the chain after
 * editing an intermediary's details).
 */
function buildChainFromChildren(
  party: PartyResponse,
  allParties: PartyResponse[]
) {
  const children = allParties
    .filter(
      (p) =>
        p.active !== false &&
        p.parentPartyId === party.id &&
        p.partyType === 'ORGANIZATION' &&
        !p.roles?.includes('CLIENT')
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    );

  if (children.length === 0) return undefined;

  const steps = children.map((child, index) => ({
    id: `step-${child.id}`,
    entityName: child.organizationDetails?.organizationName || 'Unknown Entity',
    entityType: 'COMPANY' as const,
    hasOwnership: true,
    // The last intermediary in the chain owns the business directly.
    ownsRootBusinessDirectly: index === children.length - 1,
    level: index + 1,
    metadata: {
      ownershipPercentage: 0,
      verificationStatus: 'VERIFIED' as const,
    },
  }));

  return {
    id: `hierarchy-${party.id}`,
    steps,
    isValid: true,
    meets25PercentThreshold: true,
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now()),
  };
}

/**
 * Build ownership hierarchy chain for indirect owners
 */
function buildOwnershipHierarchy(
  party: PartyResponse,
  allParties: PartyResponse[]
) {
  // Prefer a chain reconstructed from intermediary children (the durable,
  // persisted representation). Falls back to walking up the parentPartyId
  // links (the spec's canonical direction) when there are no children.
  const childChain = buildChainFromChildren(party, allParties);
  if (childChain) return childChain;

  if (!party.parentPartyId) return undefined;

  const steps: any[] = [];
  let currentParty = allParties.find((p) => p.id === party.parentPartyId);

  // If parentPartyId exists but no matching party found, hierarchy is incomplete
  if (!currentParty) return undefined;

  // If the parent is an individual, this entity belongs to that person — it's
  // not part of an intermediary chain. Don't construct a backwards chain.
  if (currentParty.partyType === 'INDIVIDUAL') return undefined;

  let level = 1;

  while (currentParty) {
    // Stop if we've reached the root CLIENT party (the entity being onboarded).
    // It's the destination of the chain, not a step in it.
    if (currentParty.roles?.includes('CLIENT')) {
      break;
    }

    // Skip individual parties — only organizations are intermediary chain steps
    if (currentParty.partyType === 'INDIVIDUAL') {
      if (currentParty.parentPartyId) {
        currentParty = allParties.find(
          (p) => p.id === currentParty!.parentPartyId
        );
        continue;
      }
      break;
    }

    const isDirectOwner =
      !currentParty.parentPartyId ||
      allParties
        .find((p) => p.id === currentParty!.parentPartyId)
        ?.roles?.includes('CLIENT');

    steps.push({
      id: `step-${currentParty.id}`,
      entityName:
        currentParty.organizationDetails?.organizationName ||
        `${currentParty.individualDetails?.firstName} ${currentParty.individualDetails?.lastName}`.trim() ||
        'Unknown Entity',
      entityType: 'COMPANY',
      hasOwnership: true,
      ownsRootBusinessDirectly: isDirectOwner,
      level,
      metadata: {
        ownershipPercentage: getOwnershipPercentage(party, currentParty),
        verificationStatus: 'VERIFIED' as const,
      },
    });

    // Move up the chain
    if (currentParty.parentPartyId) {
      const nextParty = allParties.find(
        (p) => p.id === currentParty!.parentPartyId
      );
      currentParty = nextParty;
      level += 1;
    } else {
      break;
    }
  }

  return {
    id: `hierarchy-${party.id}`,
    steps,
    isValid: true,
    meets25PercentThreshold: calculateMeets25PercentThreshold('INDIRECT', {
      steps,
    }),
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now()),
  };
}

/**
 * Calculate whether an ownership chain meets the 25% beneficial ownership threshold.
 * For direct owners, always true (they wouldn't be listed if <25%).
 * For indirect owners, check the minimum percentage along the hierarchy chain.
 */
function calculateMeets25PercentThreshold(
  ownershipType: 'DIRECT' | 'INDIRECT',
  hierarchy?: { steps?: Array<{ metadata?: { ownershipPercentage?: number } }> }
): boolean {
  // Direct owners always meet threshold (they own ≥25% directly)
  if (ownershipType === 'DIRECT') return true;

  // No hierarchy data — can't determine, assume meets threshold
  if (!hierarchy?.steps || hierarchy.steps.length === 0) return true;

  // Find the minimum ownership percentage in the chain
  const percentages = hierarchy.steps
    .map((step) => step.metadata?.ownershipPercentage)
    .filter((p): p is number => p !== undefined && p > 0);

  // If no percentages recorded, assume meets threshold
  if (percentages.length === 0) return true;

  // The effective indirect ownership is the minimum percentage in the chain
  // (simplified — actual calculation may multiply along chain)
  return Math.min(...percentages) >= 25;
}

/**
 * Get ownership percentage from party metadata.
 * Returns the percentage stored on the intermediary, or a default.
 */
function getOwnershipPercentage(
  _beneficialOwner: PartyResponse,
  intermediateEntity: PartyResponse
): number {
  // Try to read from organization details metadata if available
  // The API doesn't have a standard field for this yet, so we use
  // a placeholder that will be populated once the detail form is built
  const orgDetails = intermediateEntity.organizationDetails;
  if (orgDetails && 'ownershipPercentage' in orgDetails) {
    return (orgDetails as any).ownershipPercentage as number;
  }

  // Default: unknown percentage (display as 0 to indicate "not yet collected")
  return 0;
}

/**
 * Canonical "owner details complete" predicate.
 *
 * Single source of truth shared by the ownership summary (cards / validation)
 * and the Stage-2 details screen so the two can never disagree about whether an
 * owner is complete. Encodes the spec's required-field set per party type:
 * - Individual: date of birth, residential address, country of residence, and
 *   an individual government ID (e.g. SSN).
 * - Organization (intermediary owner): organization name, organization type,
 *   a government ID (EIN), a legal business address, and country of formation.
 */
export function isBeneficialOwnerDetailsComplete(
  party: PartyResponse
): boolean {
  if (party.partyType === 'INDIVIDUAL') {
    const ind = party.individualDetails;
    return (
      !!ind?.birthDate &&
      (ind?.addresses?.length ?? 0) > 0 &&
      !!ind?.countryOfResidence &&
      (ind?.individualIds?.length ?? 0) > 0
    );
  }

  if (party.partyType === 'ORGANIZATION') {
    const org = party.organizationDetails;
    return (
      !!org?.organizationName &&
      !!org?.organizationType &&
      (org?.organizationIds?.length ?? 0) > 0 &&
      (org?.addresses?.length ?? 0) > 0 &&
      !!org?.countryOfFormation
    );
  }

  return true;
}

/**
 * Determine owner completion status.
 *
 * Per the Indirect Ownership spec, nature of ownership applies to both
 * individuals and business (intermediary) owners:
 * - Indirect owners (individual OR business) require a built chain AND details.
 * - Direct owners (individual OR business) require only their details.
 *
 * An owner missing its own details is PENDING_DETAILS (not PENDING_HIERARCHY);
 * PENDING_HIERARCHY is reserved for an indirect owner with no chain yet.
 */
function determineOwnerStatus(
  party: PartyResponse,
  ownershipType?: 'DIRECT' | 'INDIRECT',
  hierarchy?: { steps?: unknown[] }
): BeneficialOwnerStatus {
  if (ownershipType === 'INDIRECT') {
    const hasAtLeastOneChainStep = (hierarchy?.steps?.length ?? 0) > 0;
    if (!hasAtLeastOneChainStep) {
      return 'PENDING_HIERARCHY';
    }
    return isBeneficialOwnerDetailsComplete(party)
      ? 'COMPLETE'
      : 'PENDING_DETAILS';
  }

  // Direct owners (individual or business) are complete once details are filled.
  return isBeneficialOwnerDetailsComplete(party)
    ? 'COMPLETE'
    : 'PENDING_DETAILS';
}

/**
 * Extract beneficial owners from ClientResponse
 */
export function extractBeneficialOwners(
  client: ClientResponse
): BeneficialOwner[] {
  if (!client.parties) return [];

  // Filter parties that are beneficial owners
  const beneficialOwnerParties = client.parties.filter((party) =>
    party.roles?.includes('BENEFICIAL_OWNER')
  );

  return beneficialOwnerParties.map((party) =>
    transformPartyToBeneficialOwner(party, client.parties)
  );
}

/**
 * Get the root company name from ClientResponse
 */
export function getRootCompanyName(client: ClientResponse): string {
  // Find the CLIENT role party
  const clientParty = client.parties?.find((party) =>
    party.roles?.includes('CLIENT')
  );

  if (clientParty?.partyType === 'ORGANIZATION') {
    return clientParty.organizationDetails?.organizationName || 'Organization';
  }

  if (clientParty?.partyType === 'INDIVIDUAL') {
    const { firstName, lastName } = clientParty.individualDetails || {};
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Individual';
  }

  return 'Unknown Entity';
}

/**
 * Check if client has outstanding beneficial owner requirements
 */
export function hasOutstandingOwnershipRequirements(
  client: ClientResponse
): boolean {
  return client.outstanding?.partyRoles?.includes('BENEFICIAL_OWNER') || false;
}

/**
 * Get display name for a beneficial owner
 */
export function getBeneficialOwnerDisplayName(owner: BeneficialOwner): {
  firstName: string;
  lastName: string;
} {
  if (owner.partyType === 'INDIVIDUAL' && owner.individualDetails) {
    return {
      firstName: owner.individualDetails.firstName || '',
      lastName: owner.individualDetails.lastName || '',
    };
  }

  if (owner.partyType === 'ORGANIZATION' && owner.organizationDetails) {
    return {
      firstName: owner.organizationDetails.organizationName || 'Organization',
      lastName: '',
    };
  }

  return {
    firstName: 'Unknown',
    lastName: '',
  };
}

/**
 * Get full display name as single string
 */
export function getBeneficialOwnerFullName(owner: BeneficialOwner): string {
  const { firstName, lastName } = getBeneficialOwnerDisplayName(owner);
  return `${firstName} ${lastName}`.trim() || 'Unknown';
}
