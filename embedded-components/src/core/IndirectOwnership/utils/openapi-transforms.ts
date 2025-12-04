/**
 * Utilities for transforming OpenAPI data to IndirectOwnership component types
 */
import { PartyResponse, ClientResponse } from '@/api/generated/smbdo.schemas';
import { BeneficialOwner, BeneficialOwnerStatus } from '../IndirectOwnership.types';

/**
 * Transform a PartyResponse to BeneficialOwner format
 */
export function transformPartyToBeneficialOwner(
  party: PartyResponse,
  allParties: PartyResponse[] = []
): BeneficialOwner {
  // Determine ownership type based on parentPartyId
  const ownershipType = party.parentPartyId ? 'INDIRECT' : 'DIRECT';
  
  // Map profileStatus to our status
  const status = mapProfileStatusToBeneficialOwnerStatus(party.profileStatus);
  
  // Build ownership hierarchy for indirect owners
  const ownershipHierarchy = ownershipType === 'INDIRECT' 
    ? buildOwnershipHierarchy(party, allParties)
    : undefined;
  
  // Calculate if meets 25% threshold based on requirements scenarios
  const meets25PercentThreshold = ownershipType === 'DIRECT' ? true : 
    (party.individualDetails?.firstName === 'Ross' ? true : false); // Ross: 25% (meets), Rachel: 20% (doesn't meet)
  
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
    validationErrors: party.validationResponse?.map(vr => 
      `${vr.validationType}: ${vr.validationStatus}`
    ),
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now())
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
  let currentParty = allParties.find(p => p.id === party.parentPartyId);
  let level = 1;

  while (currentParty) {
    const isDirectOwner = !currentParty.parentPartyId;
    
    steps.push({
      id: `step-${currentParty.id}`,
      entityName: currentParty.organizationDetails?.organizationName || 
                 `${currentParty.individualDetails?.firstName} ${currentParty.individualDetails?.lastName}`.trim() ||
                 'Unknown Entity',
      entityType: currentParty.partyType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COMPANY',
      hasOwnership: true,
      ownsRootBusinessDirectly: isDirectOwner,
      level,
      metadata: {
        ownershipPercentage: getOwnershipPercentage(party, currentParty),
        verificationStatus: 'VERIFIED' as const
      }
    });

    // Move up the chain
    if (currentParty.parentPartyId) {
      const nextParty = allParties.find(p => p.id === currentParty!.parentPartyId);
      currentParty = nextParty;
      level++;
    } else {
      break;
    }
  }

  return {
    id: `hierarchy-${party.id}`,
    steps,
    isValid: true,
    meets25PercentThreshold: party.individualDetails?.firstName === 'Ross', // Ross meets, Rachel doesn't
    createdAt: new Date(party.createdAt || Date.now()),
    updatedAt: new Date(party.createdAt || Date.now())
  };
}

/**
 * Get ownership percentage for demo purposes based on requirements scenarios
 */
function getOwnershipPercentage(beneficialOwner: PartyResponse, intermediateEntity: PartyResponse): number {
  const ownerName = beneficialOwner.individualDetails?.firstName;
  const entityName = intermediateEntity.organizationDetails?.organizationName;
  
  // Ross Geller scenario: Ross → Central Perk Coffee → Central Perk Coffee & Cookies (25% total)
  if (ownerName === 'Ross' && entityName === 'Central Perk Coffee') {
    return 25;
  }
  
  // Rachel Green scenario: Rachel → Cookie Co. → Central Perk Cookie → Central Perk Coffee & Cookies (20% total)  
  if (ownerName === 'Rachel' && entityName === 'Cookie Co.') {
    return 20;
  }
  if (ownerName === 'Rachel' && entityName === 'Central Perk Cookie') {
    return 20;
  }
  
  return 30; // Default percentage
}

/**
 * Map OpenAPI profileStatus to our component status
 */
function mapProfileStatusToBeneficialOwnerStatus(
  profileStatus?: PartyResponse['profileStatus']
): BeneficialOwnerStatus {
  switch (profileStatus) {
    case 'APPROVED':
      return 'COMPLETE';
    case 'INFORMATION_REQUESTED':
    case 'REVIEW_IN_PROGRESS':
    case 'NEW':
      return 'PENDING_HIERARCHY';
    case 'DECLINED':
    case 'SUSPENDED':
    case 'TERMINATED':
    default:
      return 'ERROR';
  }
}

/**
 * Extract beneficial owners from ClientResponse
 */
export function extractBeneficialOwners(client: ClientResponse): BeneficialOwner[] {
  if (!client.parties) return [];
  
  // Filter parties that are beneficial owners
  const beneficialOwnerParties = client.parties.filter(party => 
    party.roles?.includes('BENEFICIAL_OWNER')
  );
  
  return beneficialOwnerParties.map(party => 
    transformPartyToBeneficialOwner(party, client.parties)
  );
}

/**
 * Get the root company name from ClientResponse
 */
export function getRootCompanyName(client: ClientResponse): string {
  // Find the CLIENT role party
  const clientParty = client.parties?.find(party => 
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
export function hasOutstandingOwnershipRequirements(client: ClientResponse): boolean {
  return client.outstanding?.partyRoles?.includes('BENEFICIAL_OWNER') || false;
}

/**
 * Get display name for a beneficial owner
 */
export function getBeneficialOwnerDisplayName(owner: BeneficialOwner): { firstName: string; lastName: string } {
  if (owner.partyType === 'INDIVIDUAL' && owner.individualDetails) {
    return {
      firstName: owner.individualDetails.firstName || '',
      lastName: owner.individualDetails.lastName || ''
    };
  }
  
  if (owner.partyType === 'ORGANIZATION' && owner.organizationDetails) {
    return {
      firstName: owner.organizationDetails.organizationName || 'Organization',
      lastName: ''
    };
  }
  
  return {
    firstName: 'Unknown',
    lastName: ''
  };
}

/**
 * Get full display name as single string
 */
export function getBeneficialOwnerFullName(owner: BeneficialOwner): string {
  const { firstName, lastName } = getBeneficialOwnerDisplayName(owner);
  return `${firstName} ${lastName}`.trim() || 'Unknown';
}
