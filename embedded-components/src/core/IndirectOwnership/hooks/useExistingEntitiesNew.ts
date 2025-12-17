import { useMemo } from 'react';
import type { BeneficialOwner, HierarchyStep } from '../IndirectOwnership.types';
import { 
  extractOwnershipRelationships, 
  categorizeEntitiesForHierarchy,
  type CategorizedEntities,
  type HierarchyBuildingContext 
} from '../utils/hierarchyIntegrity';

/**
 * Hook to extract existing entities from the current client's ownership structure
 * 
 * @param beneficialOwners - Array of beneficial owners with their ownership hierarchies
 * @returns Array of unique entity names that have been previously entered
 */
export function useExistingEntities(beneficialOwners: BeneficialOwner[]) {
  const existingEntities = useMemo(() => {
    const entityNames = new Set<string>();
    
    // Extract entity names from all ownership hierarchies
    beneficialOwners.forEach(owner => {
      if (owner.ownershipHierarchy?.steps) {
        owner.ownershipHierarchy.steps.forEach(step => {
          if (step.entityName?.trim()) {
            // Normalize the entity name (trim whitespace, but preserve case for display)
            entityNames.add(step.entityName.trim());
          }
        });
      }
    });
    
    // Convert to sorted array for consistent display
    return Array.from(entityNames).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [beneficialOwners]);
  
  return existingEntities;
}

/**
 * Enhanced hook that categorizes entities based on hierarchy building context
 * 
 * @param beneficialOwners - Array of beneficial owners with their ownership hierarchies
 * @param context - Current hierarchy building context (optional)
 * @returns Categorized entities: recommended, available, and problematic
 */
export function useCategorizedEntities(
  beneficialOwners: BeneficialOwner[],
  context?: HierarchyBuildingContext
): CategorizedEntities {
  return useMemo(() => {
    const allEntities = beneficialOwners.reduce<string[]>((entities, owner) => {
      if (owner.ownershipHierarchy?.steps) {
        owner.ownershipHierarchy.steps.forEach(step => {
          if (step.entityName?.trim() && !entities.includes(step.entityName.trim())) {
            entities.push(step.entityName.trim());
          }
        });
      }
      return entities;
    }, []);

    if (!context) {
      // If no context provided, return all as available
      return {
        recommended: [],
        available: allEntities.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
        problematic: []
      };
    }

    const relationships = extractOwnershipRelationships(beneficialOwners);
    return categorizeEntitiesForHierarchy(allEntities, relationships, context, beneficialOwners);
  }, [beneficialOwners, context]);
}
