/**
 * Utilities for transforming OpenAPI data to IndirectOwnership component types
 */
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  BeneficialOwner,
  BeneficialOwnerStatus,
} from '../IndirectOwnership.types';

/**
 * Convert validation error codes to user-friendly messages
 */
function formatValidationError(
  validationType?: string,
  validationStatus?: string
): string {
  // Handle null/undefined values
  if (!validationType || !validationStatus) {
    return 'Additional information required';
  }

  // Map validation types to user-friendly contexts
  const typeMessages: Record<string, string> = {
    ENTITY_VALIDATION: 'Entity information',
    DOCUMENT_VALIDATION: 'Document verification',
    IDENTITY_VALIDATION: 'Identity verification',
    OWNERSHIP_VALIDATION: 'Ownership details',
    COMPLIANCE_VALIDATION: 'Compliance check',
  };

  // Map validation statuses to user-friendly actions
  const statusMessages: Record<string, string> = {
    NEEDS_INFO: 'requires additional information',
    PENDING: 'is pending review',
    FAILED: 'has validation errors',
    REJECTED: 'was rejected',
    INCOMPLETE: 'is incomplete',
  };

  const typeMessage = typeMessages[validationType] || 'Information';
  const statusMessage = statusMessages[validationStatus] || 'needs attention';

  return `${typeMessage} ${statusMessage}`;
}

/**
 * Transform a PartyResponse to BeneficialOwner format
 */
export function transformPartyToBeneficialOwner(
  party: PartyResponse,
  allParties: PartyResponse[] = [],
  existingHierarchy?: any
): BeneficialOwner {
  // Determine ownership type based on parentPartyId
  const ownershipType = party.parentPartyId ? 'INDIRECT' : 'DIRECT';

  // Use existing hierarchy if provided, otherwise build for indirect owners
  const ownershipHierarchy =
    existingHierarchy ||
    (ownershipType === 'INDIRECT'
      ? buildOwnershipHierarchy(party, allParties)
      : undefined);

  // Determine status based ONLY on hierarchy completion (not KYC status)
  const status = determineOwnerStatus(ownershipType, !!ownershipHierarchy);

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
    validationErrors: party.validationResponse?.map((vr) =>
      formatValidationError(vr.validationType, vr.validationStatus)
    ),
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now()),
  } as BeneficialOwner;
}

/**
 * Build ownership hierarchy chain for indirect owners
 */
function buildOwnershipHierarchy(
  party: PartyResponse,
  allParties: PartyResponse[]
) {
  if (!party.parentPartyId) return undefined;

  const steps: any[] = [];
  let currentParty = allParties.find((p) => p.id === party.parentPartyId);

  // If parentPartyId exists but no matching party found, hierarchy is incomplete
  if (!currentParty) return undefined;

  let level = 1;

  while (currentParty) {
    const isDirectOwner = !currentParty.parentPartyId;

    steps.push({
      id: `step-${currentParty.id}`,
      entityName:
        currentParty.organizationDetails?.organizationName ||
        `${currentParty.individualDetails?.firstName} ${currentParty.individualDetails?.lastName}`.trim() ||
        'Unknown Entity',
      entityType:
        currentParty.partyType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COMPANY',
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
 * Determine owner completion status based ONLY on hierarchy requirements
 * This component focuses on ownership structure completion, not KYC status
 */
function determineOwnerStatus(
  ownershipType?: 'DIRECT' | 'INDIRECT',
  hasHierarchy?: boolean
): BeneficialOwnerStatus {
  // For direct owners, they're always complete (no hierarchy needed)
  if (ownershipType === 'DIRECT') {
    return 'COMPLETE';
  }

  // For indirect owners, status depends only on whether hierarchy is built
  if (ownershipType === 'INDIRECT') {
    return hasHierarchy ? 'COMPLETE' : 'PENDING_HIERARCHY';
  }

  // Fallback - assume complete if we can't determine
  return 'COMPLETE';
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
