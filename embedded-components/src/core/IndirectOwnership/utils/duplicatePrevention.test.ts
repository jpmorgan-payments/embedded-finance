import { categorizeEntitiesForHierarchy, extractOwnershipRelationships, type HierarchyBuildingContext } from './hierarchyIntegrity';
import type { BeneficialOwner } from '../IndirectOwnership.types';

// Helper function to create a mock beneficial owner
const createMockOwner = (
  id: string,
  firstName: string,
  lastName: string,
  steps: Array<{ entityName: string; ownsRootBusinessDirectly: boolean }>
): BeneficialOwner => ({
  id,
  partyType: 'INDIVIDUAL',
  ownershipType: 'INDIRECT',
  status: 'COMPLETE',
  firstName,
  lastName,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownershipHierarchy: {
    id: `hierarchy-${id}`,
    steps: steps.map((step, index) => ({
      id: `step-${index}`,
      entityName: step.entityName,
      entityType: 'COMPANY' as const,
      hasOwnership: true,
      ownsRootBusinessDirectly: step.ownsRootBusinessDirectly,
      level: index + 1,
    })),
    isValid: true,
    meets25PercentThreshold: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

describe('Duplicate Entity Prevention in Chain Building', () => {
  const rootCompanyName = 'Root Business Inc';
  
  test('prevents adding entity that is already in the current chain - case sensitive', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Some Other Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Company A', 'Company B', 'Company C'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    // Building chain with: Company A → Company B → [trying to add next]
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Company A',
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 1,
        },
        {
          id: 'step-2',
          entityName: 'Company B',
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 2,
        }
      ],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // Both Company A and Company B should be problematic (already in chain)
    expect(result.problematic).toContainEqual({
      name: 'Company A',
      reason: 'Already exists in this ownership chain'
    });
    
    expect(result.problematic).toContainEqual({
      name: 'Company B',
      reason: 'Already exists in this ownership chain'
    });

    // Company C should be available
    expect(result.available).toContain('Company C');
  });

  test('prevents adding entity that is already in chain - case insensitive', () => {
    const mockOwners: BeneficialOwner[] = [];
    const allEntities = ['TECH CORP', 'tech corp', 'Tech Corp'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Tech Corp',  // Already added with this exact casing
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 1,
        }
      ],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // All variations of "Tech Corp" should be problematic due to case-insensitive matching
    expect(result.problematic).toContainEqual({
      name: 'TECH CORP',
      reason: 'Already exists in this ownership chain'
    });
    
    expect(result.problematic).toContainEqual({
      name: 'tech corp',
      reason: 'Already exists in this ownership chain'
    });
    
    expect(result.problematic).toContainEqual({
      name: 'Tech Corp',
      reason: 'Already exists in this ownership chain'
    });

    expect(result.available).toHaveLength(0);
  });

  test('allows adding entities not in current chain', () => {
    const mockOwners: BeneficialOwner[] = [];
    const allEntities = ['Company A', 'Company B', 'Company C', 'Company D'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Company A',
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 1,
        }
      ],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // Only Company A should be problematic
    expect(result.problematic).toHaveLength(1);
    expect(result.problematic[0]).toEqual({
      name: 'Company A',
      reason: 'Already exists in this ownership chain'
    });

    // Companies B, C, D should be available
    expect(result.available).toContain('Company B');
    expect(result.available).toContain('Company C');
    expect(result.available).toContain('Company D');
    expect(result.available).toHaveLength(3);
  });

  test('handles empty current hierarchy steps', () => {
    const mockOwners: BeneficialOwner[] = [];
    const allEntities = ['Company A', 'Company B'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [], // Empty - first step being added
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // All entities should be available since nothing is in the chain yet
    expect(result.available).toContain('Company A');
    expect(result.available).toContain('Company B');
    expect(result.problematic.filter(p => p.reason === 'Already exists in this ownership chain')).toHaveLength(0);
  });

  test('combines duplicate prevention with other validations', () => {
    const mockOwners: BeneficialOwner[] = [
      // Single-company hierarchy
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Single Direct Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Already In Chain', 'Single Direct Corp', 'Available Corp', rootCompanyName];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Already In Chain',
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 1,
        }
      ],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // Should have multiple problematic entities for different reasons
    expect(result.problematic).toContainEqual({
      name: 'Already In Chain',
      reason: 'Already exists in this ownership chain'
    });
    
    expect(result.problematic).toContainEqual({
      name: 'Single Direct Corp',
      reason: "Cannot be used as intermediary - already established as direct owner in John Smith's hierarchy"
    });
    
    expect(result.problematic).toContainEqual({
      name: rootCompanyName,
      reason: `Cannot add the root company (${rootCompanyName}) to its own ownership chain`
    });

    // Only Available Corp should be available
    expect(result.available).toEqual(['Available Corp']);
  });
});
