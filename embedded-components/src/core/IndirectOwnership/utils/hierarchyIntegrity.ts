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
 * Information about whether an entity is known to directly own the root business
 */
export interface EntityOwnershipInfo {
  /** The entity name */
  entityName: string;
  /** Whether this entity is known to directly own the root business */
  isKnownDirectOwner: boolean;
  /** Whether this entity has a known complete path to the root business */
  hasKnownPathToRoot: boolean;
  /** The complete path from this entity to root (if known) */
  pathToRoot?: HierarchyStep[];
  /** The source of this information (for display purposes) */
  source?: {
    ownerName: string;
    hierarchyId: string;
  };
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
 * Check if an entity is known to directly own the root business or has a known path to it
 */
export function getEntityOwnershipInfo(
  entityName: string,
  rootCompanyName: string,
  beneficialOwners: BeneficialOwner[]
): EntityOwnershipInfo {
  const result: EntityOwnershipInfo = {
    entityName,
    isKnownDirectOwner: false,
    hasKnownPathToRoot: false,
  };

  // First check if this entity is serving as an intermediary in any hierarchy
  const intermediaryCheck = isIntermediaryInExistingHierarchy(
    entityName,
    beneficialOwners
  );
  if (intermediaryCheck.isIntermediary) {
    // Cannot be a direct owner if already serving as intermediary
    // But check if it has a known path to root (for auto-completion feature)
    const pathInfo = getKnownPathToRoot(
      entityName,
      rootCompanyName,
      beneficialOwners
    );
    if (pathInfo) {
      result.hasKnownPathToRoot = true;
      result.pathToRoot = pathInfo.path;
      result.source = pathInfo.source; // For attribution in UI
    }
    return result;
  }

  // Look through all beneficial owners to see if this entity directly owns the root business
  for (const owner of beneficialOwners) {
    if (owner.ownershipHierarchy?.steps) {
      const { steps } = owner.ownershipHierarchy;

      // Find the step that matches our entity
      const entityStep = steps.find(
        (step) => step.entityName.toLowerCase() === entityName.toLowerCase()
      );

      if (entityStep && entityStep.ownsRootBusinessDirectly) {
        result.isKnownDirectOwner = true;
        result.hasKnownPathToRoot = true;
        result.source = {
          ownerName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
          hierarchyId: owner.ownershipHierarchy.id,
        };
        break;
      }
    }
  }

  return result;
}

/**
 * Get the known complete path from an entity to the root business
 * This finds if there's a chain like: Entity → Company A → Company B → Root Business
 */
function getKnownPathToRoot(
  entityName: string,
  rootCompanyName: string,
  beneficialOwners: BeneficialOwner[]
): {
  path: HierarchyStep[];
  source: { ownerName: string; hierarchyId: string };
} | null {
  for (const owner of beneficialOwners) {
    if (owner.ownershipHierarchy?.steps) {
      const { steps } = owner.ownershipHierarchy;

      // Find where this entity appears in the hierarchy
      const entityIndex = steps.findIndex(
        (step) => step.entityName.toLowerCase() === entityName.toLowerCase()
      );

      // If found, check if there's a path from this entity to root
      if (entityIndex >= 0) {
        // Get all steps from this entity onwards
        const pathFromEntity = steps.slice(entityIndex);

        // Check if the last step owns the root business directly
        const lastStep = pathFromEntity[pathFromEntity.length - 1];
        if (lastStep.ownsRootBusinessDirectly) {
          return {
            path: pathFromEntity,
            source: {
              ownerName:
                `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
              hierarchyId: owner.ownershipHierarchy.id,
            },
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if an entity is serving as an intermediary in any existing hierarchy
 */
export function isIntermediaryInExistingHierarchy(
  entityName: string,
  beneficialOwners: BeneficialOwner[]
): {
  isIntermediary: boolean;
  source?: { ownerName: string; hierarchyId: string };
} {
  for (const owner of beneficialOwners) {
    if (owner.ownershipHierarchy?.steps) {
      const { steps } = owner.ownershipHierarchy;

      // Check if this entity appears in a hierarchy with multiple steps and is NOT the final step
      if (steps.length > 1) {
        const entityStepIndex = steps.findIndex(
          (step) => step.entityName.toLowerCase() === entityName.toLowerCase()
        );

        // If found and it's not the last step (index < length - 1), it's an intermediary
        if (entityStepIndex >= 0 && entityStepIndex < steps.length - 1) {
          return {
            isIntermediary: true,
            source: {
              ownerName:
                `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
              hierarchyId: owner.ownershipHierarchy.id,
            },
          };
        }
      }
    }
  }

  return { isIntermediary: false };
}

/**
 * Check if an entity is the end of a single-company hierarchy (no intermediaries)
 */
export function isSingleCompanyHierarchyEnd(
  entityName: string,
  beneficialOwners: BeneficialOwner[]
): {
  isSingleCompanyEnd: boolean;
  source?: { ownerName: string; hierarchyId: string };
} {
  for (const owner of beneficialOwners) {
    if (owner.ownershipHierarchy?.steps) {
      const { steps } = owner.ownershipHierarchy;

      // Check if this is a single-company hierarchy (only one step)
      if (steps.length === 1) {
        const singleStep = steps[0];

        // Check if this entity is the single company in the hierarchy
        if (
          singleStep.entityName.toLowerCase() === entityName.toLowerCase() &&
          singleStep.ownsRootBusinessDirectly
        ) {
          return {
            isSingleCompanyEnd: true,
            source: {
              ownerName:
                `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
              hierarchyId: owner.ownershipHierarchy.id,
            },
          };
        }
      }
    }
  }

  return { isSingleCompanyEnd: false };
}

/**
 * Categorize existing entities based on the current hierarchy building context
 */
export function categorizeEntitiesForHierarchy(
  allExistingEntities: string[],
  relationships: OwnershipRelationship[],
  context: HierarchyBuildingContext,
  beneficialOwners: BeneficialOwner[]
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

    // Check if this entity is the end of a single-company hierarchy
    // Such entities cannot be used as intermediaries
    // Only enforce this when we're building a chain and need more intermediaries
    const needsIntermediary = context.currentHierarchySteps.length > 0 &&
      !context.currentHierarchySteps[context.currentHierarchySteps.length - 1].ownsRootBusinessDirectly;
    
    if (needsIntermediary) {
      const singleCompanyCheck = isSingleCompanyHierarchyEnd(
        entityName,
        beneficialOwners
      );
      if (singleCompanyCheck.isSingleCompanyEnd) {
        result.problematic.push({
          name: entityName,
          reason: `Cannot be used as intermediary - already established as direct owner in ${singleCompanyCheck.source?.ownerName}'s hierarchy`,
        });
        return;
      }
    }

    // If we made it here, it's available
    result.available.push(entityName);
  });

  return result;
}
