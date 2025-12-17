import { getEntityOwnershipInfo, isSingleCompanyHierarchyEnd } from './hierarchyIntegrity';
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

describe('getEntityOwnershipInfo', () => {
  const rootCompanyName = 'Root Business Inc';

  test('identifies entity as known direct owner', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Parent Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Direct Owner LLC', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Direct Owner LLC', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('Direct Owner LLC');
    expect(result.isKnownDirectOwner).toBe(true);
    expect(result.source).toEqual({
      ownerName: 'John Smith',
      hierarchyId: 'hierarchy-owner1'
    });
  });

  test('identifies entity as not direct owner when it is intermediary', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Jane', 'Doe', [
        { entityName: 'Intermediate Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Direct Owner LLC', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Intermediate Corp', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('Intermediate Corp');
    expect(result.isKnownDirectOwner).toBe(false);
    expect(result.source).toBeUndefined();
  });

  test('returns false for unknown entity', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Bob', 'Wilson', [
        { entityName: 'Some Other Corp', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Unknown Entity', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('Unknown Entity');
    expect(result.isKnownDirectOwner).toBe(false);
    expect(result.source).toBeUndefined();
  });

  test('handles case-insensitive matching', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'Alice', 'Brown', [
        { entityName: 'DIRECT OWNER LLC', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('direct owner llc', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('direct owner llc');
    expect(result.isKnownDirectOwner).toBe(true);
    expect(result.source).toEqual({
      ownerName: 'Alice Brown',
      hierarchyId: 'hierarchy-owner1'
    });
  });

  test('returns first match when multiple owners have same direct owner entity', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'First', 'Owner', [
        { entityName: 'Shared Direct Owner', ownsRootBusinessDirectly: true }
      ]),
      createMockOwner('owner2', 'Second', 'Owner', [
        { entityName: 'Shared Direct Owner', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = getEntityOwnershipInfo('Shared Direct Owner', rootCompanyName, mockOwners);

    expect(result.entityName).toBe('Shared Direct Owner');
    expect(result.isKnownDirectOwner).toBe(true);
    expect(result.source).toEqual({
      ownerName: 'First Owner',
      hierarchyId: 'hierarchy-owner1'
    });
  });

  test('handles empty beneficial owners array', () => {
    const result = getEntityOwnershipInfo('Any Entity', rootCompanyName, []);

    expect(result.entityName).toBe('Any Entity');
    expect(result.isKnownDirectOwner).toBe(false);
    expect(result.source).toBeUndefined();
  });
});

describe('isSingleCompanyHierarchyEnd', () => {
  test('identifies entity as single-company hierarchy end', () => {
    const mockOwners: BeneficialOwner[] = [
      // Single-company hierarchy: Owner → Direct Company → Root Business
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Single Direct Company', ownsRootBusinessDirectly: true }
      ]),
      // Multi-company hierarchy for comparison
      createMockOwner('owner2', 'Jane', 'Doe', [
        { entityName: 'Intermediate Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Multi Direct Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = isSingleCompanyHierarchyEnd('Single Direct Company', mockOwners);

    expect(result.isSingleCompanyEnd).toBe(true);
    expect(result.source).toEqual({
      ownerName: 'John Smith',
      hierarchyId: 'hierarchy-owner1'
    });
  });

  test('returns false for entity in multi-company hierarchy', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Intermediate Corp', ownsRootBusinessDirectly: false },
        { entityName: 'Multi Direct Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = isSingleCompanyHierarchyEnd('Multi Direct Company', mockOwners);

    expect(result.isSingleCompanyEnd).toBe(false);
    expect(result.source).toBeUndefined();
  });

  test('returns false for intermediary company in single hierarchy', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Some Company', ownsRootBusinessDirectly: false }
      ])
    ];

    const result = isSingleCompanyHierarchyEnd('Some Company', mockOwners);

    expect(result.isSingleCompanyEnd).toBe(false);
    expect(result.source).toBeUndefined();
  });

  test('returns false for unknown entity', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'Known Company', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = isSingleCompanyHierarchyEnd('Unknown Company', mockOwners);

    expect(result.isSingleCompanyEnd).toBe(false);
    expect(result.source).toBeUndefined();
  });

  test('handles case-insensitive matching', () => {
    const mockOwners: BeneficialOwner[] = [
      createMockOwner('owner1', 'John', 'Smith', [
        { entityName: 'SINGLE COMPANY LLC', ownsRootBusinessDirectly: true }
      ])
    ];

    const result = isSingleCompanyHierarchyEnd('single company llc', mockOwners);

    expect(result.isSingleCompanyEnd).toBe(true);
    expect(result.source).toEqual({
      ownerName: 'John Smith',
      hierarchyId: 'hierarchy-owner1'
    });
  });
});
