import type {
  OwnershipStructure,
  OwnershipParty,
  IndividualOwner,
  OwnershipPathStep,
} from '../types';
import { PartyResponse, Role } from '@/api/generated/smbdo.schemas';

/**
 * Transforms API party data into ownership structure
 */
export function transformPartiesToOwnershipStructure(
  parties: PartyResponse[],
  clientId: string
): OwnershipStructure | null {
  if (!parties || parties.length === 0) return null;

  // Find the root party (CLIENT role)
  const rootParty = parties.find(party => 
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
      completionPercentage: ultimateOwners.length > 0 ? 100 : 50,
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
  const partyMap = new Map(parties.map(p => [p.id, p]));
  
  function buildParty(party: PartyResponse, depth = 0): OwnershipParty {
    const children = parties
      .filter(p => p.parentPartyId === party.id)
      .map(childParty => buildParty(childParty, depth + 1));

    return {
      ...party,
      roles: (party.roles || []) as Role[],
      ownershipType: depth === 0 ? 'DIRECT' : 'INDIRECT',
      children,
      ultimateBeneficialOwner: party.partyType === 'INDIVIDUAL' && 
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
    let level = levels.find(l => l.depth === depth);
    if (!level) {
      level = { depth, parties: [] };
      levels.push(level);
    }
    
    level.parties.push(party);
    
    // Traverse children
    party.children.forEach(child => traverse(child, depth + 1));
  }
  
  traverse(rootParty, 0);
  return levels.sort((a, b) => a.depth - b.depth);
}

/**
 * Finds ultimate beneficial owners in the structure
 */
function findUltimateBeneficialOwners(rootParty: OwnershipParty): IndividualOwner[] {
  const owners: IndividualOwner[] = [];
  
  function traverse(party: OwnershipParty, path: OwnershipPathStep[]) {
    if (party.partyType === 'INDIVIDUAL' && 
        party.roles.includes('BENEFICIAL_OWNER' as Role)) {
      
      const owner = createIndividualOwner(party, path);
      if (owner) owners.push(owner);
    }
    
    // Continue traversing children
    party.children.forEach(child => {
      const newPath = [
        ...path,
        {
          entityName: party.organizationDetails?.organizationName || 
                     `${party.individualDetails?.firstName} ${party.individualDetails?.lastName}` || 
                     'Unknown',
          entityId: party.id || '',
          ownershipPercentage: 0, // TODO: Extract ownership percentage
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
    ownershipPercentage: 0, // TODO: Extract from party data or calculate
    ownershipPath: path,
    verificationStatus: 'PENDING', // TODO: Map from actual status
  };
}

/**
 * Calculates total ownership percentage for validation
 */
export function calculateTotalOwnership(parties: OwnershipParty[]): number {
  return parties.reduce((total, party) => {
    return total + (party.ownershipPercentage || 0);
  }, 0);
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
  
  // Check ownership percentages
  const totalOwnership = calculateTotalOwnership([structure.rootParty]);
  if (totalOwnership < 100) {
    warnings.push('Total ownership is less than 100%');
  } else if (totalOwnership > 100) {
    errors.push('Total ownership exceeds 100%');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completionPercentage: Math.min(100, (totalOwnership / 100) * 100),
  };
}

/**
 * Flattens ownership tree for display purposes
 */
export function flattenOwnershipTree(rootParty: OwnershipParty): OwnershipParty[] {
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
  
  function findPath(party: OwnershipParty, currentPath: OwnershipParty[]): boolean {
    const newPath = [...currentPath, party];
    
    if (party.id === targetPartyId) {
      path.splice(0, path.length, ...newPath);
      return true;
    }
    
    return party.children.some(child => findPath(child, newPath));
  }
  
  findPath(rootParty, []);
  return path;
}
