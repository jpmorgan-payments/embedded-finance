import { describe, expect, it } from 'vitest';

import {
  categorizeEntitiesForHierarchy,
  extractOwnershipRelationships,
} from './hierarchyIntegrityNew';

describe('hierarchyIntegrityNew', () => {
  describe('extractOwnershipRelationships', () => {
    it('returns empty array for no beneficial owners', () => {
      expect(extractOwnershipRelationships([])).toEqual([]);
    });

    it('returns empty array when owners have no hierarchy', () => {
      const owners = [{ firstName: 'John', lastName: 'Doe' }] as any[];
      expect(extractOwnershipRelationships(owners)).toEqual([]);
    });

    it('extracts relationships from consecutive steps', () => {
      const owners = [
        {
          firstName: 'John',
          lastName: 'Doe',
          ownershipHierarchy: {
            id: 'h1',
            steps: [{ entityName: 'Parent Co' }, { entityName: 'Child Co' }],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toEqual({
        owner: 'Parent Co',
        owned: 'Child Co',
        source: { ownerName: 'John Doe', hierarchyId: 'h1' },
      });
    });

    it('skips steps with empty entityName', () => {
      const owners = [
        {
          firstName: 'A',
          lastName: 'B',
          ownershipHierarchy: {
            id: 'h1',
            steps: [
              { entityName: 'Valid' },
              { entityName: '' },
              { entityName: 'Also Valid' },
            ],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      expect(relationships).toHaveLength(0);
    });

    it('handles multiple owners', () => {
      const owners = [
        {
          firstName: 'A',
          lastName: 'B',
          ownershipHierarchy: {
            id: 'h1',
            steps: [{ entityName: 'X' }, { entityName: 'Y' }],
          },
        },
        {
          firstName: 'C',
          lastName: 'D',
          ownershipHierarchy: {
            id: 'h2',
            steps: [{ entityName: 'Y' }, { entityName: 'Z' }],
          },
        },
      ] as any[];

      const relationships = extractOwnershipRelationships(owners);
      expect(relationships).toHaveLength(2);
    });
  });

  describe('categorizeEntitiesForHierarchy', () => {
    it('returns empty categories when no entities', () => {
      const result = categorizeEntitiesForHierarchy([], [], {
        currentOwnerId: 'o1',
        currentHierarchySteps: [],
        rootCompanyName: 'Root',
        ownerName: 'Owner',
      });

      expect(result.recommended).toEqual([]);
      expect(result.available).toEqual([]);
      expect(result.problematic).toEqual([]);
    });

    it('marks root company as problematic', () => {
      const result = categorizeEntitiesForHierarchy(
        ['Root Corp', 'Other'],
        [],
        {
          currentOwnerId: 'o1',
          currentHierarchySteps: [],
          rootCompanyName: 'Root Corp',
          ownerName: 'Owner',
        }
      );

      expect(result.problematic).toContainEqual(
        expect.objectContaining({ name: 'Root Corp' })
      );
      expect(result.available).toContain('Other');
    });

    it('marks already-in-chain entities as problematic', () => {
      const result = categorizeEntitiesForHierarchy(
        ['Used Entity', 'Fresh Entity'],
        [],
        {
          currentOwnerId: 'o1',
          currentHierarchySteps: [{ entityName: 'Used Entity' } as any],
          rootCompanyName: 'Root',
          ownerName: 'Owner',
        }
      );

      expect(result.problematic).toContainEqual(
        expect.objectContaining({ name: 'Used Entity' })
      );
      expect(result.available).toContain('Fresh Entity');
    });
  });
});
