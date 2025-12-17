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

describe('categorizeEntitiesForHierarchy - Single Company Hierarchy Prevention', () => {
  const rootCompanyName = 'Root Business Inc';
  
  test('prevents using single-company hierarchy end as intermediary', () => {
    // Setup: Create existing ownership structures
    const mockOwners: BeneficialOwner[] = [
      // Owner 1: Single-company hierarchy (John → Direct Corp → Root Business)
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Direct Corp', ownsRootBusinessDirectly: true }
      ]),
      
      // Owner 2: Multi-company hierarchy (Jane → Intermediate → Final Corp → Root Business)
      createMockOwner('owner2', 'Jane', 'Doe', [
        { entityName: 'Intermediate LLC', ownsRootBusinessDirectly: false },
        { entityName: 'Final Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Direct Corp', 'Intermediate LLC', 'Final Corp', 'New Company'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    // Test scenario: Building a new hierarchy and trying to add "Direct Corp" as an intermediary
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Some Parent Company',
          entityType: 'COMPANY',
          hasOwnership: true,
          ownsRootBusinessDirectly: false,
          level: 1,
        }
      ],
      rootCompanyName,
      ownerName: 'Bob Wilson'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // "Direct Corp" should be problematic because it's the end of a single-company hierarchy
    expect(result.problematic).toContainEqual({
      name: 'Direct Corp',
      reason: "Cannot be used as intermediary - already established as direct owner in John Smith's hierarchy"
    });

    // "Intermediate LLC" should be available (it's not the end of a single-company hierarchy)
    expect(result.available).toContain('Intermediate LLC');

    // "Final Corp" should be available (it's part of a multi-company hierarchy)
    expect(result.available).toContain('Final Corp');

    // "New Company" should be available (not part of any existing hierarchy)
    expect(result.available).toContain('New Company');
  });

  test('allows using multi-company hierarchy entities', () => {
    const mockOwners: BeneficialOwner[] = [
      // Multi-company hierarchy: Owner → Intermediate A → Intermediate B → Final → Root Business
      createMockOwner('owner1', 'Alice', 'Johnson', [
        { entityName: 'Intermediate A', ownsRootBusinessDirectly: false },
        { entityName: 'Intermediate B', ownsRootBusinessDirectly: false },
        { entityName: 'Final Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Intermediate A', 'Intermediate B', 'Final Company'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // All entities should be available since none are single-company hierarchy ends
    expect(result.available).toContain('Intermediate A');
    expect(result.available).toContain('Intermediate B'); 
    expect(result.available).toContain('Final Company');
    expect(result.problematic).toHaveLength(0);
  });

  test('prevents using root company in its own hierarchy', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Test', 'Owner', [
        { entityName: 'Some Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Some Company', rootCompanyName];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [],
      rootCompanyName,
      ownerName: 'New Owner'
    };

    const result = categorizeEntitiesForHierarchy(allEntities, relationships, context, mockOwners);

    // Root company should be problematic
    expect(result.problematic).toContainEqual({
      name: rootCompanyName,
      reason: `Cannot add the root company (${rootCompanyName}) to its own ownership chain`
    });

    // "Some Company" should be available
    expect(result.available).toContain('Some Company');
  });

  test('prevents using entities already in current chain', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Test', 'Owner', [
        { entityName: 'Existing Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const allEntities = ['Existing Company', 'Already Added Co'];
    const relationships = extractOwnershipRelationships(mockOwners);
    
    const context: HierarchyBuildingContext = {
      currentOwnerId: 'new-owner',
      currentHierarchySteps: [
        {
          id: 'step-1',
          entityName: 'Already Added Co',
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

    // Entity already in chain should be problematic
    expect(result.problematic).toContainEqual({
      name: 'Already Added Co',
      reason: 'Already exists in this ownership chain'
    });

    // Other entity should be available
    expect(result.available).toContain('Existing Company');
  });
});
