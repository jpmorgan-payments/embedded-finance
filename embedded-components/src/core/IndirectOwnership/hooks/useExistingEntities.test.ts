import { renderHook } from '@testing-library/react';
import { useExistingEntities } from './useExistingEntities';
import type { BeneficialOwner } from '../IndirectOwnership.types';

// Mock beneficial owners with ownership hierarchies
const createMockOwner = (id: string, steps: Array<{ entityName: string }>): BeneficialOwner => ({
  id,
  partyType: 'INDIVIDUAL',
  ownershipType: 'INDIRECT' as const,
  status: 'COMPLETE' as const,
  firstName: 'Test',
  lastName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownershipHierarchy: {
    id: `hierarchy-${id}`,
    steps: steps.map((step, index) => ({
      id: `step-${index}`,
      entityName: step.entityName,
      entityType: 'COMPANY' as const,
      hasOwnership: true,
      ownsRootBusinessDirectly: false,
      level: index + 1,
    })),
    isValid: true,
    meets25PercentThreshold: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

describe('useExistingEntities', () => {
  test('returns empty array when no beneficial owners provided', () => {
    const { result } = renderHook(() => useExistingEntities([]));
    
    expect(result.current).toEqual([]);
  });

  test('extracts unique entity names from ownership hierarchies', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [
        { entityName: 'Apple Inc' },
        { entityName: 'Tech Holdings LLC' }
      ]),
      createMockOwner('owner2', [
        { entityName: 'Google LLC' },
        { entityName: 'Tech Holdings LLC' } // Duplicate
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    expect(result.current).toEqual(['Apple Inc', 'Google LLC', 'Tech Holdings LLC']);
  });

  test('handles owners without ownership hierarchies', () => {
    const mockOwners: BeneficialOwner[] = [
      {
        id: 'direct-owner',
        partyType: 'INDIVIDUAL',
        ownershipType: 'DIRECT',
        status: 'COMPLETE',
        firstName: 'Direct',
        lastName: 'Owner',
        createdAt: new Date(),
        updatedAt: new Date(),
        // No ownershipHierarchy for direct owners
      },
      createMockOwner('indirect-owner', [
        { entityName: 'Microsoft Corporation' }
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    expect(result.current).toEqual(['Microsoft Corporation']);
  });

  test('trims whitespace from entity names', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [
        { entityName: '  Apple Inc  ' },
        { entityName: '\tTech Holdings LLC\n' }
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    expect(result.current).toEqual(['Apple Inc', 'Tech Holdings LLC']);
  });

  test('filters out empty entity names', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [
        { entityName: 'Apple Inc' },
        { entityName: '' },
        { entityName: '   ' },
        { entityName: 'Google LLC' }
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    expect(result.current).toEqual(['Apple Inc', 'Google LLC']);
  });

  test('sorts entity names alphabetically (case-insensitive)', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [
        { entityName: 'Zebra Corp' },
        { entityName: 'apple Inc' },
        { entityName: 'Microsoft Corporation' },
        { entityName: 'Amazon LLC' }
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    expect(result.current).toEqual([
      'Amazon LLC',
      'apple Inc', 
      'Microsoft Corporation',
      'Zebra Corp'
    ]);
  });

  test('preserves original casing in sorted results', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [
        { entityName: 'aPpLe InC' },
        { entityName: 'GOOGLE LLC' },
        { entityName: 'microsoft corp' }
      ]),
    ];

    const { result } = renderHook(() => useExistingEntities(mockOwners));
    
    // Should preserve original casing while sorting case-insensitively
    expect(result.current).toEqual([
      'aPpLe InC',
      'GOOGLE LLC',
      'microsoft corp'
    ]);
  });

  test('updates when beneficial owners change', () => {
    const initialOwners: BeneficialOwner[] = [
      createMockOwner('owner1', [{ entityName: 'Apple Inc' }])
    ];

    const { result, rerender } = renderHook(
      ({ owners }) => useExistingEntities(owners),
      { initialProps: { owners: initialOwners } }
    );

    expect(result.current).toEqual(['Apple Inc']);

    // Add new owner
    const updatedOwners = [
      ...initialOwners,
      createMockOwner('owner2', [{ entityName: 'Google LLC' }])
    ];

    rerender({ owners: updatedOwners });

    expect(result.current).toEqual(['Apple Inc', 'Google LLC']);
  });
});
