import { describe, expect, it } from 'vitest';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import type { OwnershipParty, OwnershipStructure } from '../types';
import {
  flattenOwnershipTree,
  getOrphanedIntermediaryPartyIds,
  getOwnershipPath,
  pruneEmptyDetailFields,
  transformPartiesToOwnershipStructure,
  validateOwnershipCompleteness,
} from './utils';

const INTERMEDIARY_OWNER_ROLE = 'INTERMEDIARY_OWNER';

describe('IndirectOwnership utils', () => {
  describe('transformPartiesToOwnershipStructure', () => {
    it('returns null for empty parties array', () => {
      expect(transformPartiesToOwnershipStructure([], 'client-1')).toBeNull();
    });

    it('returns null for null/undefined parties', () => {
      expect(
        transformPartiesToOwnershipStructure(
          null as unknown as PartyResponse[],
          'client-1'
        )
      ).toBeNull();
    });

    it('returns null when no CLIENT role party exists', () => {
      const parties = [
        {
          id: 'party-1',
          partyType: 'ORGANIZATION',
          roles: ['BENEFICIAL_OWNER'],
        },
      ] as unknown as PartyResponse[];

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
      ] as unknown as PartyResponse[];

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
      ] as unknown as PartyResponse[];

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
      ] as unknown as PartyResponse[];

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
      ] as unknown as PartyResponse[];

      const result = transformPartiesToOwnershipStructure(parties, 'client-1');

      expect(result!.validationStatus.isValid).toBe(false);
      expect(result!.validationStatus.completionLevel).toBe('INCOMPLETE');
    });

    it('assigns DIRECT ownership type to root children', () => {
      const parties = [
        { id: 'root', partyType: 'ORGANIZATION', roles: ['CLIENT'] },
      ] as unknown as PartyResponse[];

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
      ] as unknown as PartyResponse[];

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
        rootParty: { children: [{}] },
        ownershipChain: [],
        ultimateBeneficialOwners: [],
        validationStatus: {},
      } as unknown as OwnershipStructure;

      const result = validateOwnershipCompleteness(structure);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'No ultimate beneficial owners identified'
      );
    });

    it('returns valid when beneficial owners exist', () => {
      const structure = {
        clientId: 'c1',
        rootParty: { children: [{}] },
        ownershipChain: [],
        ultimateBeneficialOwners: [{ partyId: 'p1' }],
        validationStatus: {},
      } as unknown as OwnershipStructure;

      const result = validateOwnershipCompleteness(structure);
      expect(result.isValid).toBe(true);
      expect(result.completionLevel).toBe('COMPLETE');
    });

    it('warns when no children in root party', () => {
      const structure = {
        clientId: 'c1',
        rootParty: { children: [] },
        ownershipChain: [],
        ultimateBeneficialOwners: [{ partyId: 'p1' }],
        validationStatus: {},
      } as unknown as OwnershipStructure;

      const result = validateOwnershipCompleteness(structure);
      expect(result.warnings).toContain('No ownership structure defined');
    });
  });

  describe('flattenOwnershipTree', () => {
    it('returns single item for leaf node', () => {
      const party = { id: 'p1', children: [] } as unknown as OwnershipParty;
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
      } as unknown as OwnershipParty;

      const result = flattenOwnershipTree(party);
      expect(result).toHaveLength(4);
      expect(result.map((p) => p.id)).toEqual([
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
    } as unknown as OwnershipParty;

    it('returns path from root to target', () => {
      const path = getOwnershipPath(tree, 'c');
      expect(path.map((p) => p.id)).toEqual(['root', 'b', 'c']);
    });

    it('returns path for direct child', () => {
      const path = getOwnershipPath(tree, 'a');
      expect(path.map((p) => p.id)).toEqual(['root', 'a']);
    });

    it('returns path for root itself', () => {
      const path = getOwnershipPath(tree, 'root');
      expect(path.map((p) => p.id)).toEqual(['root']);
    });

    it('returns empty path when target not found', () => {
      const path = getOwnershipPath(tree, 'nonexistent');
      expect(path).toEqual([]);
    });
  });

  describe('getOrphanedIntermediaryPartyIds', () => {
    // CLIENT <- root(int) <- mid(int) <- owner
    const linearChain = [
      {
        id: 'client',
        partyType: 'ORGANIZATION',
        active: true,
        roles: ['CLIENT'],
      },
      {
        id: 'root',
        partyType: 'ORGANIZATION',
        active: true,
        roles: [INTERMEDIARY_OWNER_ROLE],
        parentPartyId: 'client',
      },
      {
        id: 'mid',
        partyType: 'ORGANIZATION',
        active: true,
        roles: [INTERMEDIARY_OWNER_ROLE],
        parentPartyId: 'root',
      },
      {
        id: 'owner',
        partyType: 'INDIVIDUAL',
        active: true,
        roles: ['BENEFICIAL_OWNER'],
        parentPartyId: 'mid',
      },
    ] as unknown as PartyResponse[];

    it('returns the full intermediary chain up to (not including) the client', () => {
      expect(getOrphanedIntermediaryPartyIds(linearChain, 'owner')).toEqual([
        'mid',
        'root',
      ]);
    });

    it('returns empty when the owner is not found', () => {
      expect(getOrphanedIntermediaryPartyIds(linearChain, 'missing')).toEqual(
        []
      );
    });

    it('returns empty for a direct owner parented to the client', () => {
      const parties = [
        {
          id: 'client',
          partyType: 'ORGANIZATION',
          active: true,
          roles: ['CLIENT'],
        },
        {
          id: 'direct',
          partyType: 'INDIVIDUAL',
          active: true,
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'client',
        },
      ] as unknown as PartyResponse[];
      expect(getOrphanedIntermediaryPartyIds(parties, 'direct')).toEqual([]);
    });

    it('stops at an intermediary shared with another active owner chain', () => {
      // 'root' is also the parent of a second owner, so it (and the client)
      // must be preserved; only 'mid' is orphaned by removing 'owner'.
      const shared = [
        ...linearChain,
        {
          id: 'owner-2',
          partyType: 'INDIVIDUAL',
          active: true,
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: 'root',
        },
      ] as unknown as PartyResponse[];
      expect(getOrphanedIntermediaryPartyIds(shared, 'owner')).toEqual(['mid']);
    });

    it('ignores inactive intermediaries in the chain', () => {
      const withInactive = linearChain.map((p) =>
        p.id === 'root' ? { ...p, active: false } : p
      ) as unknown as PartyResponse[];
      // Walk stops at the inactive 'root'; only 'mid' is collected.
      expect(getOrphanedIntermediaryPartyIds(withInactive, 'owner')).toEqual([
        'mid',
      ]);
    });
  });

  describe('pruneEmptyDetailFields', () => {
    it('returns {} for undefined', () => {
      expect(pruneEmptyDetailFields(undefined)).toEqual({});
    });

    it('preserves populated fields and drops empty stubs', () => {
      const details = {
        firstName: 'Ann',
        lastName: '',
        birthDate: '1980-01-01',
        countryOfResidence: 'US',
        addresses: [{ addressType: 'RESIDENTIAL_ADDRESS' }],
        individualIds: [],
        jobTitle: undefined,
      };
      expect(pruneEmptyDetailFields(details)).toEqual({
        firstName: 'Ann',
        birthDate: '1980-01-01',
        countryOfResidence: 'US',
        addresses: [{ addressType: 'RESIDENTIAL_ADDRESS' }],
      });
    });

    it('drops a phone with no phoneNumber but keeps a real one', () => {
      expect(pruneEmptyDetailFields({ phone: { countryCode: '+1' } })).toEqual(
        {}
      );
      expect(
        pruneEmptyDetailFields({
          phone: { countryCode: '+1', phoneNumber: '5551234' },
        })
      ).toEqual({ phone: { countryCode: '+1', phoneNumber: '5551234' } });
    });
  });
});
