import { useMemo } from 'react';

import type { BeneficialOwner } from '../IndirectOwnership.types';
import {
  categorizeEntitiesForHierarchy,
  extractOwnershipRelationships,
  type CategorizedEntities,
  type HierarchyBuildingContext,
} from '../utils/hierarchyIntegrity';

/**
 * Hook to extract existing entities from the current client's ownership structure
 * and categorize them based on hierarchy building context
 *
 * @param beneficialOwners - Array of beneficial owners with their ownership hierarchies
 * @param hierarchyContext - Optional context for hierarchy building (enables smart categorization)
 * @returns Array of unique entity names or categorized entities if context provided
 */
export function useExistingEntities(
  beneficialOwners: BeneficialOwner[],
  hierarchyContext?: HierarchyBuildingContext
): string[] | CategorizedEntities {
  const result = useMemo(() => {
    // Extract all unique entity names from ownership hierarchies
    const entityNames = new Set<string>();

    beneficialOwners.forEach((owner) => {
      if (owner.ownershipHierarchy?.steps) {
        owner.ownershipHierarchy.steps.forEach((step) => {
          if (step.entityName?.trim()) {
            entityNames.add(step.entityName.trim());
          }
        });
      }
    });

    const allEntities = Array.from(entityNames).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // If no hierarchy context provided, return simple list
    if (!hierarchyContext) {
      return allEntities;
    }

    // Use hierarchy context to categorize entities
    const relationships = extractOwnershipRelationships(beneficialOwners);
    return categorizeEntitiesForHierarchy(
      allEntities,
      relationships,
      hierarchyContext,
      beneficialOwners
    );
  }, [beneficialOwners, hierarchyContext]);

  return result;
}
