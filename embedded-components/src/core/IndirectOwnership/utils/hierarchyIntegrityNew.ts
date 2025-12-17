import type {
  BeneficialOwner,
  HierarchyStep,
} from '../IndirectOwnership.types';

/**
 * Represents a known ownership relationship between two entities
 */
export interface OwnershipRelationship {
  /** Entity that owns */
  owner: string;
  /** Entity that is owned */
  owned: string;
  /** Source information for debugging/display */
  source: {
    ownerName: string;
    hierarchyId: string;
  };
}

/**
 * Context for building a hierarchy step - helps determine what entities make sense
 */
export interface HierarchyBuildingContext {
  /** The current owner being built */
  currentOwnerId: string;
  /** The current steps in the hierarchy being built */
  currentHierarchySteps: HierarchyStep[];
  /** The root company that must be owned at the end */
  rootCompanyName: string;
  /** The beneficial owner's name for context */
  ownerName: string;
}

/**
 * Categorized entities based on their relationship to the current hierarchy building context
 */
export interface CategorizedEntities {
  /** Entities that make structural sense to use (maintain consistency) */
  recommended: Array<{
    name: string;
    reason: string;
    relationship?: OwnershipRelationship;
  }>;
  /** All other existing entities that could be used */
  available: string[];
  /** Entities that would create structural inconsistencies */
  problematic: Array<{
    name: string;
    reason: string;
    relationship?: OwnershipRelationship;
  }>;
}

/**
 * Extract all known ownership relationships from existing beneficial owners
 */
export function extractOwnershipRelationships(
  beneficialOwners: BeneficialOwner[]
): OwnershipRelationship[] {
  const relationships: OwnershipRelationship[] = [];

  beneficialOwners.forEach((owner) => {
    if (owner.ownershipHierarchy?.steps) {
      const { steps } = owner.ownershipHierarchy;
      const ownerName =
        `${owner.firstName || ''} ${owner.lastName || ''}`.trim();

      // Create relationships between consecutive steps in the hierarchy
      for (let i = 0; i < steps.length - 1; i += 1) {
        const currentStep = steps[i];
        const nextStep = steps[i + 1];

        if (currentStep.entityName && nextStep.entityName) {
          relationships.push({
            owner: currentStep.entityName.trim(),
            owned: nextStep.entityName.trim(),
            source: {
              ownerName,
              hierarchyId: owner.ownershipHierarchy.id,
            },
          });
        }
      }
    }
  });

  return relationships;
}

/**
 * Find what entity should own the given target entity based on known relationships
 */
function findKnownOwnerOf(
  target: string,
  relationships: OwnershipRelationship[]
): OwnershipRelationship | undefined {
  return relationships.find(
    (rel) => rel.owned.toLowerCase() === target.toLowerCase()
  );
}

/**
 * Categorize existing entities based on the current hierarchy building context
 */
export function categorizeEntitiesForHierarchy(
  allExistingEntities: string[],
  relationships: OwnershipRelationship[],
  context: HierarchyBuildingContext
): CategorizedEntities {
  const result: CategorizedEntities = {
    recommended: [],
    available: [],
    problematic: [],
  };

  // Determine what entity we need to find an owner for
  let targetEntity: string | undefined;

  if (context.currentHierarchySteps.length === 0) {
    // First step: we need something that will eventually own the root company
    // Look for entities that are known to own the root company
    const rootOwners = relationships.filter(
      (rel) => rel.owned.toLowerCase() === context.rootCompanyName.toLowerCase()
    );

    if (rootOwners.length > 0) {
      rootOwners.forEach((rel) => {
        result.recommended.push({
          name: rel.owner,
          reason: `Already known to own ${context.rootCompanyName}`,
          relationship: rel,
        });
      });
    }
  } else {
    // Subsequent steps: we need something that owns the last entity we added
    const lastStep =
      context.currentHierarchySteps[context.currentHierarchySteps.length - 1];
    targetEntity = lastStep.entityName;
  }

  // If we have a target entity, find its known owner
  if (targetEntity) {
    const knownOwner = findKnownOwnerOf(targetEntity, relationships);

    if (knownOwner) {
      result.recommended.push({
        name: knownOwner.owner,
        reason: `Already known to own ${targetEntity} (from ${knownOwner.source.ownerName}'s hierarchy)`,
        relationship: knownOwner,
      });
    }
  }

  // Categorize remaining entities
  const recommendedNames = new Set(
    result.recommended.map((r) => r.name.toLowerCase())
  );

  allExistingEntities.forEach((entityName) => {
    const lowerName = entityName.toLowerCase();

    // Skip if already recommended
    if (recommendedNames.has(lowerName)) {
      return;
    }

    // Skip if it's the root company (can't own itself)
    if (lowerName === context.rootCompanyName.toLowerCase()) {
      result.problematic.push({
        name: entityName,
        reason: `Cannot add the root company (${context.rootCompanyName}) to its own ownership chain`,
      });
      return;
    }

    // Check if this entity is already in the current hierarchy chain
    const alreadyInChain = context.currentHierarchySteps.some(
      (step) => step.entityName.toLowerCase() === lowerName
    );

    if (alreadyInChain) {
      result.problematic.push({
        name: entityName,
        reason: 'Already exists in this ownership chain',
      });
      return;
    }

    // Check if using this entity would contradict known relationships
    if (targetEntity) {
      const existingOwner = findKnownOwnerOf(targetEntity, relationships);
      if (existingOwner && existingOwner.owner.toLowerCase() !== lowerName) {
        result.problematic.push({
          name: entityName,
          reason: `Would conflict with known relationship: ${existingOwner.owner} owns ${targetEntity}`,
          relationship: existingOwner,
        });
        return;
      }
    }

    // If we made it here, it's available
    result.available.push(entityName);
  });

  return result;
}
