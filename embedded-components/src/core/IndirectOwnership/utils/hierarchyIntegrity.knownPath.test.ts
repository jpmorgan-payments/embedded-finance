import { describe, test, expect } from 'vitest';
import { getEntityOwnershipInfo } from './hierarchyIntegrity';
import type { BeneficialOwner } from '../IndirectOwnership.types';

describe('Known Path to Root Detection', () => {
  const rootCompanyName = 'Root Business Inc';

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

  test('detects intermediary with known complete path to root', () => {
    // Scenario: Alice → Holding Corp → Subsidiary LLC → Root Business
    // If we select "Holding Corp", it should know the complete path
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Alice', 'Smith', [
        { entityName: 'Holding Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Subsidiary LLC', ownsRootBusinessDirectly: false },
        { entityName: 'Direct Owner Inc', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Holding Corp', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('Holding Corp');
    expect(result.isKnownDirectOwner).toBe(false); // Not a direct owner
    expect(result.hasKnownPathToRoot).toBe(true); // But has a known path
    expect(result.pathToRoot).toBeDefined();
    expect(result.pathToRoot).toHaveLength(3); // Holding Corp → Subsidiary LLC → Direct Owner Inc
    expect(result.pathToRoot![0].entityName).toBe('Holding Corp');
    expect(result.pathToRoot![1].entityName).toBe('Subsidiary LLC');
    expect(result.pathToRoot![2].entityName).toBe('Direct Owner Inc');
    expect(result.pathToRoot![2].ownsRootBusinessDirectly).toBe(true);
    expect(result.source?.ownerName).toBe('Alice Smith');
  });

  test('detects middle intermediary with known path to root', () => {
    // Scenario: Bob → Top Corp → Middle Corp → Bottom Corp → Root Business
    // If we select "Middle Corp", it should know the path from there
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Bob', 'Jones', [
        { entityName: 'Top Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Middle Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Bottom Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Middle Corp', rootCompanyName, mockOwners);

    expect(result.hasKnownPathToRoot).toBe(true);
    expect(result.pathToRoot).toHaveLength(2); // Middle Corp → Bottom Corp
    expect(result.pathToRoot![0].entityName).toBe('Middle Corp');
    expect(result.pathToRoot![1].entityName).toBe('Bottom Corp');
    expect(result.pathToRoot![1].ownsRootBusinessDirectly).toBe(true);
  });

  test('returns path for direct owner (single step)', () => {
    // If entity is a direct owner, it still has a "path" (itself)
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Charlie', 'Brown', [
        { entityName: 'Direct Owner Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Direct Owner Corp', rootCompanyName, mockOwners);

    expect(result.isKnownDirectOwner).toBe(true);
    expect(result.hasKnownPathToRoot).toBe(true);
    // Note: For direct owners, pathToRoot is not set since they're already the end
  });

  test('does not return path if hierarchy does not reach root', () => {
    // Scenario: Incomplete hierarchy (should not happen in practice, but test it)
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Diana', 'Prince', [
        { entityName: 'Top Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Bottom Corp', ownsRootBusinessDirectly: false } // Does not own root
      ])
    ];

    const result = getEntityOwnershipInfo('Top Corp', rootCompanyName, mockOwners);

    expect(result.hasKnownPathToRoot).toBe(false);
    expect(result.pathToRoot).toBeUndefined();
  });

  test('case insensitive matching for entity name', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Eve', 'Adams', [
        { entityName: 'HOLDING CORP', ownsRootBusinessDirectly: false },
        { entityName: 'Direct Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('holding corp', rootCompanyName, mockOwners);

    expect(result.hasKnownPathToRoot).toBe(true);
    expect(result.pathToRoot).toHaveLength(2);
    expect(result.pathToRoot![0].entityName).toBe('HOLDING CORP');
  });

  test('returns path for first matching entity if multiple exist', () => {
    // If same entity appears in multiple hierarchies, use the first one
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'First', 'Owner', [
        { entityName: 'Shared Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Direct A', ownsRootBusinessDirectly: true }
      ]),
      createMockOwner('owner2', 'Second', 'Owner', [
        { entityName: 'Shared Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Direct B', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Shared Corp', rootCompanyName, mockOwners);

    expect(result.hasKnownPathToRoot).toBe(true);
    expect(result.source?.ownerName).toBe('First Owner');
    expect(result.pathToRoot![1].entityName).toBe('Direct A');
  });

  test('handles entity not in any hierarchy', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Test', 'User', [
        { entityName: 'Some Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Unknown Corp', rootCompanyName, mockOwners);

    expect(result.isKnownDirectOwner).toBe(false);
    expect(result.hasKnownPathToRoot).toBe(false);
    expect(result.pathToRoot).toBeUndefined();
  });

  test('handles empty beneficial owners array', () => {
    const result = getEntityOwnershipInfo('Any Corp', rootCompanyName, []);

    expect(result.isKnownDirectOwner).toBe(false);
    expect(result.hasKnownPathToRoot).toBe(false);
    expect(result.pathToRoot).toBeUndefined();
  });
});
