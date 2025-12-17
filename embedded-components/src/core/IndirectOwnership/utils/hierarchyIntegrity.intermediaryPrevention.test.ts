import { describe, expect, test } from 'vitest';

import type { BeneficialOwner } from '../IndirectOwnership.types';
import {
  categorizeEntitiesForHierarchy,
  getEntityOwnershipInfo,
  type HierarchyBuildingContext,
  type OwnershipRelationship,
} from './hierarchyIntegrity';

describe('Intermediary Prevention Integration Tests', () => {
  const mockBeneficialOwners: BeneficialOwner[] = [
    {
      id: '1',
      ownershipType: 'INDIRECT',
      status: 'COMPLETE',
      firstName: 'Alice',
      lastName: 'Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownershipHierarchy: {
        id: 'hierarchy-1',
        isValid: true,
        meets25PercentThreshold: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'step-1',
            entityName: 'Holding Corp',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: false,
            level: 1,
          },
          {
            id: 'step-2',
            entityName: 'Subsidiary LLC',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: true,
            level: 2,
          },
        ],
      },
    },
    {
      id: '2',
      ownershipType: 'DIRECT',
      status: 'COMPLETE',
      firstName: 'Bob',
      lastName: 'Jones',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownershipHierarchy: {
        id: 'hierarchy-2',
        isValid: true,
        meets25PercentThreshold: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'step-3',
            entityName: 'Direct Owner Inc',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: true,
            level: 1,
          },
        ],
      },
    },
  ];

  const mockRelationships: OwnershipRelationship[] = [
    {
      owner: 'Holding Corp',
      owned: 'Subsidiary LLC',
      source: {
        ownerName: 'Alice Smith',
        hierarchyId: 'hierarchy-1',
      },
    },
    {
      owner: 'Subsidiary LLC',
      owned: 'Root Business',
      source: {
        ownerName: 'Alice Smith',
        hierarchyId: 'hierarchy-1',
      },
    },
    {
      owner: 'Direct Owner Inc',
      owned: 'Root Business',
      source: {
        ownerName: 'Bob Jones',
        hierarchyId: 'hierarchy-2',
      },
    },
  ];

  describe('Scenario: Trying to add intermediary as direct owner', () => {
    test('allows intermediary entity to be selected with known path completion', () => {
      const context: HierarchyBuildingContext = {
        currentOwnerId: 'new-owner-id',
        ownerName: 'Test Owner',
        rootCompanyName: 'Root Business',
        currentHierarchySteps: [], // Starting new hierarchy
      };

      const allEntities = [
        'Holding Corp',
        'Subsidiary LLC',
        'Direct Owner Inc',
        'New Company',
      ];

      const result = categorizeEntitiesForHierarchy(
        allEntities,
        mockRelationships,
        context,
        mockBeneficialOwners
      );

      // All entities should be available - the system will auto-complete known paths
      // 'Holding Corp' is an intermediary with a known path, so it will auto-complete
      expect(result.available).toContain('Holding Corp');

      // 'Subsidiary LLC' and 'Direct Owner Inc' are final steps, so they should be recommended
      expect(result.recommended.some((r) => r.name === 'Subsidiary LLC')).toBe(
        true
      );
      expect(
        result.recommended.some((r) => r.name === 'Direct Owner Inc')
      ).toBe(true);

      // 'New Company' should be available since it's not in any existing hierarchy
      expect(result.available).toContain('New Company');
    });

    test('getEntityOwnershipInfo prevents intermediary from being recognized as direct owner', () => {
      // 'Holding Corp' is an intermediary in Alice's hierarchy
      const result = getEntityOwnershipInfo(
        'Holding Corp',
        'Root Business',
        mockBeneficialOwners
      );

      // Should NOT be recognized as a known direct owner
      expect(result.isKnownDirectOwner).toBe(false);
      // But should have source for attribution since it has a known path
      expect(result.hasKnownPathToRoot).toBe(true);
      expect(result.source?.ownerName).toBe('Alice Smith');
    });

    test('allows actual direct owners to be recognized', () => {
      const result = getEntityOwnershipInfo(
        'Direct Owner Inc',
        'Root Business',
        mockBeneficialOwners
      );

      expect(result.isKnownDirectOwner).toBe(true);
      expect(result.source?.ownerName).toBe('Bob Jones');
    });

    test('allows final step entities to be recognized as direct owners', () => {
      const result = getEntityOwnershipInfo(
        'Subsidiary LLC',
        'Root Business',
        mockBeneficialOwners
      );

      expect(result.isKnownDirectOwner).toBe(true);
      expect(result.source?.ownerName).toBe('Alice Smith');
    });
  });

  describe('Multi-level hierarchy scenario', () => {
    test('prevents all intermediary levels from being used as direct owners', () => {
      const multiLevelBeneficialOwners: BeneficialOwner[] = [
        {
          id: '1',
          ownershipType: 'INDIRECT',
          status: 'COMPLETE',
          firstName: 'Charlie',
          lastName: 'Brown',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownershipHierarchy: {
            id: 'multi-hierarchy',
            isValid: true,
            meets25PercentThreshold: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            steps: [
              {
                id: 'step-1',
                entityName: 'Top Level Corp',
                entityType: 'COMPANY',
                hasOwnership: true,
                ownsRootBusinessDirectly: false,
                level: 1,
              },
              {
                id: 'step-2',
                entityName: 'Middle Level LLC',
                entityType: 'COMPANY',
                hasOwnership: true,
                ownsRootBusinessDirectly: false,
                level: 2,
              },
              {
                id: 'step-3',
                entityName: 'Bottom Level Inc',
                entityType: 'COMPANY',
                hasOwnership: true,
                ownsRootBusinessDirectly: true,
                level: 3,
              },
            ],
          },
        },
      ];

      // Both 'Top Level Corp' and 'Middle Level LLC' should be prevented from being direct owners
      const topLevelResult = getEntityOwnershipInfo(
        'Top Level Corp',
        'Root Business',
        multiLevelBeneficialOwners
      );
      expect(topLevelResult.isKnownDirectOwner).toBe(false);

      const middleLevelResult = getEntityOwnershipInfo(
        'Middle Level LLC',
        'Root Business',
        multiLevelBeneficialOwners
      );
      expect(middleLevelResult.isKnownDirectOwner).toBe(false);

      // Only 'Bottom Level Inc' should be allowed as direct owner
      const bottomLevelResult = getEntityOwnershipInfo(
        'Bottom Level Inc',
        'Root Business',
        multiLevelBeneficialOwners
      );
      expect(bottomLevelResult.isKnownDirectOwner).toBe(true);
    });
  });

  describe('Auto-completion behavior', () => {
    test('intermediaries with known paths get auto-completed', () => {
      const context: HierarchyBuildingContext = {
        currentOwnerId: 'new-owner-id',
        ownerName: 'Test Owner',
        rootCompanyName: 'Root Business',
        currentHierarchySteps: [],
      };

      const result = categorizeEntitiesForHierarchy(
        ['Holding Corp'],
        mockRelationships,
        context,
        mockBeneficialOwners
      );

      // 'Holding Corp' should be available (will auto-complete with known path)
      expect(result.available).toContain('Holding Corp');
      expect(result.problematic).toHaveLength(0);
    });
  });
});
