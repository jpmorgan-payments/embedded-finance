import { describe, expect, it } from 'vitest';

import {
  categorizeEntitiesForHierarchy,
  extractOwnershipRelationships,
} from './hierarchyIntegrityFixed';

describe('hierarchyIntegrityFixed', () => {
  describe('extractOwnershipRelationships', () => {
    it('returns empty array when no beneficial owners', () => {
      expect(extractOwnershipRelationships([])).toEqual([]);
    });

    it('returns empty array when owners have no hierarchy', () => {
      const owners = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ] as any[];

      expect(extractOwnershipRelationships(owners)).toEqual([]);
    });

    it('extracts relationships from consecutive hierarchy steps', () => {
      const owners = [
        {
          firstName: 'John',
          lastName: 'Doe',
          ownershipHierarchy: {
            id: 'hier-1',
            steps: [
              { entityName: 'Alpha Corp' },
              { entityName: 'Beta LLC' },
              { entityName: 'Root Company' },
            ],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);

      expect(relationships).toHaveLength(2);
      expect(relationships[0]).toEqual({
        owner: 'Alpha Corp',
        owned: 'Beta LLC',
        source: { ownerName: 'John Doe', hierarchyId: 'hier-1' },
      });
      expect(relationships[1]).toEqual({
        owner: 'Beta LLC',
        owned: 'Root Company',
        source: { ownerName: 'John Doe', hierarchyId: 'hier-1' },
      });
    });

    it('skips steps with missing entityName', () => {
      const owners = [
        {
          firstName: 'Jane',
          lastName: 'Smith',
          ownershipHierarchy: {
            id: 'hier-2',
            steps: [
              { entityName: 'Corp A' },
              { entityName: '' },
              { entityName: 'Corp B' },
            ],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      // Both Corp A → '' and '' → Corp B are skipped (empty string is falsy)
      expect(relationships).toHaveLength(0);
    });

    it('handles multiple owners with hierarchies', () => {
      const owners = [
        {
          firstName: 'John',
          lastName: 'Doe',
          ownershipHierarchy: {
            id: 'h1',
            steps: [{ entityName: 'Entity A' }, { entityName: 'Entity B' }],
          },
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          ownershipHierarchy: {
            id: 'h2',
            steps: [{ entityName: 'Entity C' }, { entityName: 'Entity B' }],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      expect(relationships).toHaveLength(2);
      expect(relationships[0].owner).toBe('Entity A');
      expect(relationships[1].owner).toBe('Entity C');
    });

    it('trims entity names', () => {
      const owners = [
        {
          firstName: 'Test',
          lastName: 'User',
          ownershipHierarchy: {
            id: 'h1',
            steps: [
              { entityName: '  Padded Corp  ' },
              { entityName: 'Clean LLC' },
            ],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      expect(relationships[0].owner).toBe('Padded Corp');
      expect(relationships[0].owned).toBe('Clean LLC');
    });
  });

  describe('categorizeEntitiesForHierarchy', () => {
    it('returns empty categories when no entities exist', () => {
      const result = categorizeEntitiesForHierarchy([], [], {
        currentOwnerId: 'owner-1',
        currentHierarchySteps: [],
        rootCompanyName: 'Root Corp',
        ownerName: 'John Doe',
      });

      expect(result.recommended).toEqual([]);
      expect(result.available).toEqual([]);
      expect(result.problematic).toEqual([]);
    });

    it('recommends entities that own the root company (first step)', () => {
      const relationships = [
        {
          owner: 'Holding Co',
          owned: 'Root Corp',
          source: { ownerName: 'Jane', hierarchyId: 'h1' },
        },
      ];

      const result = categorizeEntitiesForHierarchy(
        ['Holding Co', 'Other Entity'],
        relationships,
        {
          currentOwnerId: 'owner-1',
          currentHierarchySteps: [],
          rootCompanyName: 'Root Corp',
          ownerName: 'John Doe',
        }
      );

      expect(result.recommended).toHaveLength(1);
      expect(result.recommended[0].name).toBe('Holding Co');
    });

    it('marks root company as problematic', () => {
      const result = categorizeEntitiesForHierarchy(
        ['Root Corp', 'Other Entity'],
        [],
        {
          currentOwnerId: 'owner-1',
          currentHierarchySteps: [],
          rootCompanyName: 'Root Corp',
          ownerName: 'John Doe',
        }
      );

      expect(result.problematic).toContainEqual(
        expect.objectContaining({ name: 'Root Corp' })
      );
    });

    it('marks entities already in chain as problematic', () => {
      const result = categorizeEntitiesForHierarchy(
        ['Already Used', 'Available Entity'],
        [],
        {
          currentOwnerId: 'owner-1',
          currentHierarchySteps: [{ entityName: 'Already Used' } as any],
          rootCompanyName: 'Root Corp',
          ownerName: 'John Doe',
        }
      );

      expect(result.problematic).toContainEqual(
        expect.objectContaining({ name: 'Already Used' })
      );
      expect(result.available).toContain('Available Entity');
    });

    it('recommends known owner for subsequent steps', () => {
      const relationships = [
        {
          owner: 'Parent Corp',
          owned: 'Current Entity',
          source: { ownerName: 'Jane', hierarchyId: 'h1' },
        },
      ];

      const result = categorizeEntitiesForHierarchy(
        ['Parent Corp', 'Other Entity'],
        relationships,
        {
          currentOwnerId: 'owner-1',
          currentHierarchySteps: [{ entityName: 'Current Entity' } as any],
          rootCompanyName: 'Root Corp',
          ownerName: 'John Doe',
        }
      );

      expect(result.recommended).toContainEqual(
        expect.objectContaining({ name: 'Parent Corp' })
      );
    });
  });
});
