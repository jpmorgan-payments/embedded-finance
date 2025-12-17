import { describe, test, expect } from 'vitest';
import { isIntermediaryInExistingHierarchy, getEntityOwnershipInfo } from './hierarchyIntegrity';
import type { BeneficialOwner } from '../IndirectOwnership.types';

describe('Intermediary Validation', () => {
  const mockBeneficialOwners: BeneficialOwner[] = [
    {
      id: '1',
      ownershipType: 'INDIRECT',
      status: 'COMPLETE',
      firstName: 'John',
      lastName: 'Doe',
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
            entityName: 'Parent Corp',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: false,
            level: 1
          },
          {
            id: 'step-2',  
            entityName: 'Subsidiary LLC',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: true,
            level: 2
          }
        ]
      }
    },
    {
      id: '2',
      ownershipType: 'DIRECT',
      status: 'COMPLETE',
      firstName: 'Jane',
      lastName: 'Smith',
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
            entityName: 'Direct Owner Corp',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: true,
            level: 1
          }
        ]
      }
    },
    {
      id: '3',
      ownershipType: 'INDIRECT',
      status: 'COMPLETE',
      firstName: 'Bob',
      lastName: 'Johnson',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownershipHierarchy: {
        id: 'hierarchy-3',
        isValid: true,
        meets25PercentThreshold: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'step-4',
            entityName: 'Top Level Inc',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: false,
            level: 1
          },
          {
            id: 'step-5',
            entityName: 'Middle Company',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: false,
            level: 2
          },
          {
            id: 'step-6',
            entityName: 'Final Owner LLC',
            entityType: 'COMPANY',
            hasOwnership: true,
            ownsRootBusinessDirectly: true,
            level: 3
          }
        ]
      }
    }
  ];

  describe('isIntermediaryInExistingHierarchy', () => {
    test('identifies entity as intermediary when in middle of chain', () => {
      const result = isIntermediaryInExistingHierarchy('Parent Corp', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(true);
      expect(result.source?.ownerName).toBe('John Doe');
      expect(result.source?.hierarchyId).toBe('hierarchy-1');
    });

    test('identifies entity as intermediary in multi-level hierarchy', () => {
      const result = isIntermediaryInExistingHierarchy('Middle Company', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(true);
      expect(result.source?.ownerName).toBe('Bob Johnson');
      expect(result.source?.hierarchyId).toBe('hierarchy-3');
    });

    test('does not identify direct owner as intermediary', () => {
      const result = isIntermediaryInExistingHierarchy('Direct Owner Corp', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test('does not identify final step as intermediary', () => {
      const result = isIntermediaryInExistingHierarchy('Subsidiary LLC', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test('handles non-existent entity', () => {
      const result = isIntermediaryInExistingHierarchy('Non Existent Corp', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test('case insensitive matching', () => {
      const result = isIntermediaryInExistingHierarchy('PARENT CORP', mockBeneficialOwners);
      
      expect(result.isIntermediary).toBe(true);
      expect(result.source?.ownerName).toBe('John Doe');
    });

    test('handles empty hierarchies', () => {
      const emptyBeneficialOwners: BeneficialOwner[] = [
        {
          id: '1',
          ownershipType: 'DIRECT',
          status: 'COMPLETE',
          firstName: 'Empty',
          lastName: 'Owner',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = isIntermediaryInExistingHierarchy('Any Corp', emptyBeneficialOwners);
      
      expect(result.isIntermediary).toBe(false);
    });
  });

  describe('getEntityOwnershipInfo with intermediary validation', () => {
    test('prevents intermediary from being recognized as direct owner', () => {
      const result = getEntityOwnershipInfo('Parent Corp', 'Root Business', mockBeneficialOwners);
      
      expect(result.isKnownDirectOwner).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test('allows actual direct owner to be recognized', () => {
      const result = getEntityOwnershipInfo('Direct Owner Corp', 'Root Business', mockBeneficialOwners);
      
      expect(result.isKnownDirectOwner).toBe(true);
      expect(result.source?.ownerName).toBe('Jane Smith');
    });

    test('prevents multi-level intermediary from being direct owner', () => {
      const result = getEntityOwnershipInfo('Middle Company', 'Root Business', mockBeneficialOwners);
      
      expect(result.isKnownDirectOwner).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test('allows final step in multi-level hierarchy to be direct owner', () => {
      const result = getEntityOwnershipInfo('Final Owner LLC', 'Root Business', mockBeneficialOwners);
      
      expect(result.isKnownDirectOwner).toBe(true);
      expect(result.source?.ownerName).toBe('Bob Johnson');
    });

    test('allows unknown entity to potentially be direct owner', () => {
      const result = getEntityOwnershipInfo('Unknown Corp', 'Root Business', mockBeneficialOwners);
      
      expect(result.isKnownDirectOwner).toBe(false);
      expect(result.source).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles single step hierarchy correctly', () => {
      const singleStepOwners: BeneficialOwner[] = [
        {
          id: '1',
          ownershipType: 'DIRECT',
          status: 'COMPLETE',
          firstName: 'Single',
          lastName: 'Owner',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownershipHierarchy: {
            id: 'single-hierarchy',
            isValid: true,
            meets25PercentThreshold: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            steps: [
              {
                id: 'single-step',
                entityName: 'Only Company',
                entityType: 'COMPANY',
                hasOwnership: true,
                ownsRootBusinessDirectly: true,
                level: 1
              }
            ]
          }
        }
      ];

      const intermediaryResult = isIntermediaryInExistingHierarchy('Only Company', singleStepOwners);
      expect(intermediaryResult.isIntermediary).toBe(false);

      const ownershipResult = getEntityOwnershipInfo('Only Company', 'Root Business', singleStepOwners);
      expect(ownershipResult.isKnownDirectOwner).toBe(true);
    });

    test('handles empty steps array', () => {
      const emptyStepsOwners: BeneficialOwner[] = [
        {
          id: '1',
          ownershipType: 'DIRECT',
          status: 'COMPLETE',
          firstName: 'Empty',
          lastName: 'Steps',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownershipHierarchy: {
            id: 'empty-hierarchy',
            isValid: true,
            meets25PercentThreshold: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            steps: []
          }
        }
      ];

      const result = isIntermediaryInExistingHierarchy('Any Company', emptyStepsOwners);
      expect(result.isIntermediary).toBe(false);
    });
  });
});
