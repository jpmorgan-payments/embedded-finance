import { describe, expect, it } from 'vitest';

import {
  flattenOwnershipTree,
  getOwnershipPath,
  transformPartiesToOwnershipStructure,
  validateOwnershipCompleteness,
} from './utils';

describe('IndirectOwnership utils', () => {
  describe('transformPartiesToOwnershipStructure', () => {
    it('returns null for empty parties array', () => {
      expect(transformPartiesToOwnershipStructure([], 'client-1')).toBeNull();
    });

    it('returns null for null/undefined parties', () => {
      expect(
        transformPartiesToOwnershipStructure(null as any, 'client-1')
      ).toBeNull();
    });

    it('returns null when no CLIENT role party exists', () => {
      const parties = [
        {
          id: 'party-1',
          partyType: 'ORGANIZATION',
          roles: ['BENEFICIAL_OWNER'],
        },
      ] as any[];

      expect(
        transformPartiesToOwnershipStructure(parties, 'client-1')
      ).toBeNull();
    });

    it('builds structure when CLIENT role party exists', () => {
      const parties = [
        {
          id: 'root-party',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          organizationDetails: { organizationName: 'Root Corp' },
        },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');

      expect(result).not.toBeNull();
      expect(result!.clientId).toBe('client-1');
      expect(result!.rootParty.id).toBe('root-party');
    });

    it('builds hierarchy with child parties', () => {
      const parties = [
        {
          id: 'root',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          organizationDetails: { organizationName: 'Root Corp' },
        },
        {
          id: 'child-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'root',
          individualDetails: { firstName: 'John', lastName: 'Doe' },
        },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');

      expect(result).not.toBeNull();
      expect(result!.rootParty.children).toHaveLength(1);
      expect(result!.ultimateBeneficialOwners).toHaveLength(1);
      expect(result!.ultimateBeneficialOwners[0].firstName).toBe('John');
    });

    it('marks structure as valid when beneficial owners exist', () => {
      const parties = [
        {
          id: 'root',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
        },
        {
          id: 'owner-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'root',
          individualDetails: { firstName: 'Jane', lastName: 'Smith' },
        },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');

      expect(result!.validationStatus.isValid).toBe(true);
      expect(result!.validationStatus.completionLevel).toBe('COMPLETE');
    });

    it('marks structure as invalid when no beneficial owners', () => {
      const parties = [
        {
          id: 'root',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
        },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');

      expect(result!.validationStatus.isValid).toBe(false);
      expect(result!.validationStatus.completionLevel).toBe('INCOMPLETE');
    });

    it('assigns DIRECT ownership type to root children', () => {
      const parties = [
        { id: 'root', partyType: 'ORGANIZATION', roles: ['CLIENT'] },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');
      expect(result!.rootParty.ownershipType).toBe('DIRECT');
    });

    it('assigns INDIRECT ownership type to nested children', () => {
      const parties = [
        { id: 'root', partyType: 'ORGANIZATION', roles: ['CLIENT'] },
        {
          id: 'mid',
          partyType: 'ORGANIZATION',
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'root',
        },
        {
          id: 'deep',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'mid',
          individualDetails: { firstName: 'Deep', lastName: 'Owner' },
        },
      ] as any[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');
      const midChild = result!.rootParty.children[0];
      expect(midChild.ownershipType).toBe('INDIRECT');
      expect(midChild.children[0].ownershipType).toBe('INDIRECT');
    });
  });

  describe('validateOwnershipCompleteness', () => {
    it('returns invalid when no ultimate beneficial owners', () => {
      const structure = {
        clientId: 'c1',
        rootParty: { children: [{}] } as any,
        ownershipChain: [],
        ultimateBeneficialOwners: [],
        validationStatus: {} as any,
      };

      const result = validateOwnershipCompleteness(structure);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'No ultimate beneficial owners identified'
      );
    });

    it('returns valid when beneficial owners exist', () => {
      const structure = {
        clientId: 'c1',
        rootParty: { children: [{}] } as any,
        ownershipChain: [],
        ultimateBeneficialOwners: [{ partyId: 'p1' } as any],
        validationStatus: {} as any,
      };

      const result = validateOwnershipCompleteness(structure);
      expect(result.isValid).toBe(true);
      expect(result.completionLevel).toBe('COMPLETE');
    });

    it('warns when no children in root party', () => {
      const structure = {
        clientId: 'c1',
        rootParty: { children: [] } as any,
        ownershipChain: [],
        ultimateBeneficialOwners: [{ partyId: 'p1' } as any],
        validationStatus: {} as any,
      };

      const result = validateOwnershipCompleteness(structure);
      expect(result.warnings).toContain('No ownership structure defined');
    });
  });

  describe('flattenOwnershipTree', () => {
    it('returns single item for leaf node', () => {
      const party = { id: 'p1', children: [] } as any;
      const result = flattenOwnershipTree(party);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('flattens nested tree', () => {
      const party = {
        id: 'root',
        children: [
          { id: 'child-1', children: [] },
          {
            id: 'child-2',
            children: [{ id: 'grandchild-1', children: [] }],
          },
        ],
      } as any;

      const result = flattenOwnershipTree(party);
      expect(result).toHaveLength(4);
      expect(result.map((p: any) => p.id)).toEqual([
        'root',
        'child-1',
        'child-2',
        'grandchild-1',
      ]);
    });
  });

  describe('getOwnershipPath', () => {
    const tree = {
      id: 'root',
      children: [
        { id: 'a', children: [] },
        {
          id: 'b',
          children: [{ id: 'c', children: [] }],
        },
      ],
    } as any;

    it('returns path from root to target', () => {
      const path = getOwnershipPath(tree, 'c');
      expect(path.map((p: any) => p.id)).toEqual(['root', 'b', 'c']);
    });

    it('returns path for direct child', () => {
      const path = getOwnershipPath(tree, 'a');
      expect(path.map((p: any) => p.id)).toEqual(['root', 'a']);
    });

    it('returns path for root itself', () => {
      const path = getOwnershipPath(tree, 'root');
      expect(path.map((p: any) => p.id)).toEqual(['root']);
    });

    it('returns empty path when target not found', () => {
      const path = getOwnershipPath(tree, 'nonexistent');
      expect(path).toEqual([]);
    });
  });
});
