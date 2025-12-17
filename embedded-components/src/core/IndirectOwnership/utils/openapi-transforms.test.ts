/**
 * Tests for openapi-transforms utility functions
 * Comprehensive coverage of all transformation logic and edge cases
 */

import { describe, expect, test } from 'vitest';

import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  extractBeneficialOwners,
  getBeneficialOwnerDisplayName,
  getBeneficialOwnerFullName,
  getRootCompanyName,
  hasOutstandingOwnershipRequirements,
  transformPartyToBeneficialOwner,
} from './openapi-transforms';

describe('openapi-transforms', () => {
  // Helper to create valid ClientResponse
  const createMockClient = (parties: PartyResponse[]): ClientResponse => ({
    id: 'client-test',
    partyId: 'party-client',
    status: 'APPROVED',
    products: [],
    outstanding: {},
    parties,
  });

  // Mock data for testing
  const mockDirectOwnerParty: PartyResponse = {
    id: 'party-monica',
    partyType: 'INDIVIDUAL',
    roles: ['BENEFICIAL_OWNER'],
    profileStatus: 'APPROVED',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    individualDetails: {
      firstName: 'Monica',
      lastName: 'Geller',
    },
    // No parentPartyId = Direct owner
  };

  const mockIndirectOwnerParty: PartyResponse = {
    id: 'party-ross',
    partyType: 'INDIVIDUAL',
    roles: ['BENEFICIAL_OWNER'],
    profileStatus: 'APPROVED',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    parentPartyId: 'party-company-coffee',
    individualDetails: {
      firstName: 'Ross',
      lastName: 'Geller',
    },
  };

  const mockCompanyParty: PartyResponse = {
    id: 'party-company-coffee',
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'], // Use valid role from schema
    profileStatus: 'APPROVED',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    organizationDetails: {
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      organizationName: 'Central Perk Coffee',
    },
  };

  const mockClientParty: PartyResponse = {
    id: 'party-client',
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'],
    profileStatus: 'APPROVED',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    organizationDetails: {
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      organizationName: 'Central Perk Coffee & Cookies',
    },
  };

  const mockClient: ClientResponse = {
    id: 'client-001',
    partyId: 'party-client',
    status: 'APPROVED',
    products: [],
    outstanding: {},
    attestations: [],
    parties: [
      mockClientParty,
      mockDirectOwnerParty,
      mockIndirectOwnerParty,
      mockCompanyParty,
    ],
  };

  describe('transformPartyToBeneficialOwner', () => {
    test('transforms direct owner correctly', () => {
      const result = transformPartyToBeneficialOwner(mockDirectOwnerParty);

      expect(result).toMatchObject({
        id: 'party-monica',
        partyType: 'INDIVIDUAL',
        ownershipType: 'DIRECT',
        status: 'COMPLETE',
        meets25PercentThreshold: true,
        individualDetails: {
          firstName: 'Monica',
          lastName: 'Geller',
        },
      });

      expect(result.ownershipHierarchy).toBeUndefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('transforms indirect owner correctly', () => {
      const result = transformPartyToBeneficialOwner(mockIndirectOwnerParty, [
        mockCompanyParty,
        mockClientParty,
      ]);

      expect(result).toMatchObject({
        id: 'party-ross',
        partyType: 'INDIVIDUAL',
        ownershipType: 'INDIRECT',
        status: 'COMPLETE',
        meets25PercentThreshold: true, // Ross meets 25% threshold in mock logic
        individualDetails: {
          firstName: 'Ross',
          lastName: 'Geller',
        },
      });

      expect(result.ownershipHierarchy).toBeDefined();
      expect(result.ownershipHierarchy?.steps).toHaveLength(1);
    });

    test('handles different ownership types correctly', () => {
      // Direct owners are always COMPLETE (no hierarchy needed regardless of profileStatus)
      const directPendingParty = {
        ...mockDirectOwnerParty,
        profileStatus: 'INFORMATION_REQUESTED' as const,
      };
      const directResult = transformPartyToBeneficialOwner(directPendingParty);
      expect(directResult.status).toBe('COMPLETE');

      // Indirect owners with incomplete hierarchy are PENDING_HIERARCHY
      const indirectParty = {
        ...mockIndirectOwnerParty,
        parentPartyId: 'nonexistent-parent',
      };
      const indirectResult = transformPartyToBeneficialOwner(indirectParty, []);
      expect(indirectResult.status).toBe('PENDING_HIERARCHY');
    });

    test('handles organization parties', () => {
      const orgParty: PartyResponse = {
        id: 'party-org',
        partyType: 'ORGANIZATION',
        roles: ['BENEFICIAL_OWNER'],
        profileStatus: 'APPROVED',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        organizationDetails: {
          organizationType: 'C_CORPORATION',
          organizationName: 'Test Corp',
        },
      };

      const result = transformPartyToBeneficialOwner(orgParty);

      expect(result.partyType).toBe('ORGANIZATION');
      expect(result.organizationDetails?.organizationName).toBe('Test Corp');
    });

    test('handles missing individual details gracefully', () => {
      const partyWithoutDetails = { ...mockDirectOwnerParty };
      delete partyWithoutDetails.individualDetails;

      const result = transformPartyToBeneficialOwner(partyWithoutDetails);

      expect(result.individualDetails).toBeUndefined();
      expect(result.id).toBe('party-monica');
    });
  });

  describe('extractBeneficialOwners', () => {
    test('extracts only beneficial owners from client', () => {
      const result = extractBeneficialOwners(mockClient);

      expect(result).toHaveLength(2);
      expect(result.map((owner) => owner.id)).toEqual([
        'party-monica',
        'party-ross',
      ]);

      const monicaOwner = result.find((owner) => owner.id === 'party-monica');
      const rossOwner = result.find((owner) => owner.id === 'party-ross');

      expect(monicaOwner?.ownershipType).toBe('DIRECT');
      expect(rossOwner?.ownershipType).toBe('INDIRECT');
    });

    test('returns empty array when no beneficial owners', () => {
      const clientWithoutOwners = createMockClient([
        mockClientParty,
        mockCompanyParty,
      ]);
      const result = extractBeneficialOwners(clientWithoutOwners);
      expect(result).toHaveLength(0);
    });

    test('handles client with no parties', () => {
      const emptyClient = createMockClient([]);
      const result = extractBeneficialOwners(emptyClient);
      expect(result).toHaveLength(0);
    });

    test('includes inactive beneficial owners (filtered by role only)', () => {
      const inactiveOwner = {
        ...mockDirectOwnerParty,
        id: 'inactive',
        active: false,
      };
      const clientWithInactive = createMockClient([
        mockClientParty,
        mockDirectOwnerParty,
        mockIndirectOwnerParty,
        mockCompanyParty,
        inactiveOwner,
      ]);

      const result = extractBeneficialOwners(clientWithInactive);

      // Function only filters by role, not active status
      expect(result.map((owner) => owner.id)).toContain('inactive');
      expect(result).toHaveLength(3); // Monica, Ross, and inactive owner
    });
  });

  describe('getRootCompanyName', () => {
    test('gets company name from client party', () => {
      const result = getRootCompanyName(mockClient);
      expect(result).toBe('Central Perk Coffee & Cookies');
    });

    test('returns default when no client party found', () => {
      const clientWithoutClientParty = createMockClient([mockDirectOwnerParty]);
      const result = getRootCompanyName(clientWithoutClientParty);
      expect(result).toBe('Unknown Entity');
    });

    test('returns default when client party has no organization details', () => {
      const clientPartyWithoutOrgDetails = { ...mockClientParty };
      delete clientPartyWithoutOrgDetails.organizationDetails;

      const clientWithBadParty = createMockClient([
        clientPartyWithoutOrgDetails,
      ]);
      const result = getRootCompanyName(clientWithBadParty);
      expect(result).toBe('Organization'); // Default for ORGANIZATION party type
    });

    test('handles empty parties array', () => {
      const emptyClient = createMockClient([]);
      const result = getRootCompanyName(emptyClient);
      expect(result).toBe('Unknown Entity');
    });
  });

  describe('hasOutstandingOwnershipRequirements', () => {
    test('returns true when BENEFICIAL_OWNER role is outstanding', () => {
      const clientWithOutstanding: ClientResponse = {
        ...mockClient,
        outstanding: {
          partyRoles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
        },
      };

      const result = hasOutstandingOwnershipRequirements(clientWithOutstanding);
      expect(result).toBe(true);
    });

    test('returns false when no BENEFICIAL_OWNER role outstanding', () => {
      const clientWithOtherOutstanding: ClientResponse = {
        ...mockClient,
        outstanding: {
          partyRoles: ['CONTROLLER', 'DIRECTOR'],
        },
      };

      const result = hasOutstandingOwnershipRequirements(
        clientWithOtherOutstanding
      );
      expect(result).toBe(false);
    });

    test('returns false when no outstanding property', () => {
      const result = hasOutstandingOwnershipRequirements(mockClient);
      expect(result).toBe(false);
    });

    test('returns false when outstanding.partyRoles is undefined', () => {
      const clientWithEmptyOutstanding: ClientResponse = {
        ...mockClient,
        outstanding: {},
      };

      const result = hasOutstandingOwnershipRequirements(
        clientWithEmptyOutstanding
      );
      expect(result).toBe(false);
    });
  });

  describe('getBeneficialOwnerDisplayName', () => {
    test('returns name parts for individual owner', () => {
      const owner = transformPartyToBeneficialOwner(mockDirectOwnerParty);
      const result = getBeneficialOwnerDisplayName(owner);

      expect(result).toEqual({
        firstName: 'Monica',
        lastName: 'Geller',
      });
    });

    test('returns organization name for organization owner', () => {
      const orgOwner = transformPartyToBeneficialOwner(mockCompanyParty);
      const result = getBeneficialOwnerDisplayName(orgOwner);

      expect(result).toEqual({
        firstName: 'Central Perk Coffee',
        lastName: '',
      });
    });

    test('handles missing individual details', () => {
      const ownerWithoutDetails = {
        ...transformPartyToBeneficialOwner(mockDirectOwnerParty),
      };
      delete ownerWithoutDetails.individualDetails;

      const result = getBeneficialOwnerDisplayName(ownerWithoutDetails);

      expect(result).toEqual({
        firstName: 'Unknown',
        lastName: '',
      });
    });

    test('handles missing organization details', () => {
      const ownerWithoutOrgDetails = {
        ...transformPartyToBeneficialOwner(mockCompanyParty),
      };
      delete ownerWithoutOrgDetails.organizationDetails;

      const result = getBeneficialOwnerDisplayName(ownerWithoutOrgDetails);

      expect(result).toEqual({
        firstName: 'Unknown',
        lastName: '',
      });
    });

    test('handles empty individual names', () => {
      const partyWithEmptyNames = {
        ...mockDirectOwnerParty,
        individualDetails: {
          firstName: '',
          lastName: '',
        },
      };

      const owner = transformPartyToBeneficialOwner(partyWithEmptyNames);
      const result = getBeneficialOwnerDisplayName(owner);

      expect(result).toEqual({
        firstName: '',
        lastName: '',
      });
    });
  });

  describe('getBeneficialOwnerFullName', () => {
    test('returns full name for individual', () => {
      const owner = transformPartyToBeneficialOwner(mockDirectOwnerParty);
      const result = getBeneficialOwnerFullName(owner);

      expect(result).toBe('Monica Geller');
    });

    test('returns organization name for organization', () => {
      const orgOwner = transformPartyToBeneficialOwner(mockCompanyParty);
      const result = getBeneficialOwnerFullName(orgOwner);

      expect(result).toBe('Central Perk Coffee');
    });

    test('handles single name gracefully', () => {
      const singleNameParty = {
        ...mockDirectOwnerParty,
        individualDetails: {
          firstName: 'Madonna',
          lastName: '',
        },
      };

      const owner = transformPartyToBeneficialOwner(singleNameParty);
      const result = getBeneficialOwnerFullName(owner);

      expect(result).toBe('Madonna');
    });

    test('returns Unknown when no valid name found', () => {
      const ownerWithoutDetails = {
        ...transformPartyToBeneficialOwner(mockDirectOwnerParty),
      };
      delete ownerWithoutDetails.individualDetails;
      delete ownerWithoutDetails.organizationDetails;

      const result = getBeneficialOwnerFullName(ownerWithoutDetails);

      expect(result).toBe('Unknown');
    });

    test('handles empty names', () => {
      const partyWithEmptyNames = {
        ...mockDirectOwnerParty,
        individualDetails: {
          firstName: '',
          lastName: '',
        },
      };

      const owner = transformPartyToBeneficialOwner(partyWithEmptyNames);
      const result = getBeneficialOwnerFullName(owner);

      expect(result).toBe('Unknown');
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles undefined client gracefully', () => {
      expect(() => extractBeneficialOwners({} as ClientResponse)).not.toThrow();
      expect(() => getRootCompanyName({} as ClientResponse)).not.toThrow();
    });

    test('handles malformed party data', () => {
      const malformedParty = {
        id: 'malformed',
        // Missing required fields
      } as PartyResponse;

      expect(() =>
        transformPartyToBeneficialOwner(malformedParty)
      ).not.toThrow();
    });

    test('handles circular ownership references', () => {
      const circularParty1: PartyResponse = {
        id: 'party-1',
        parentPartyId: 'party-2',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        profileStatus: 'APPROVED',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const circularParty2: PartyResponse = {
        id: 'party-2',
        parentPartyId: 'party-1',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        profileStatus: 'APPROVED',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Should not cause infinite loop
      expect(() =>
        transformPartyToBeneficialOwner(circularParty1, [circularParty2])
      ).not.toThrow();
    });
  });
});
