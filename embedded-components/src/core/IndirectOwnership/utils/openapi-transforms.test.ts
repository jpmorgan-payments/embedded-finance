/**
 * Tests for openapi-transforms utility functions
 * Comprehensive coverage of all transformation logic and edge cases
 */

import { describe, expect, test } from 'vitest';

import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import { INTERMEDIARY_OWNER_ROLE } from '../IndirectOwnership.types';
import {
  extractBeneficialOwners,
  getBeneficialOwnerDisplayName,
  getBeneficialOwnerFullName,
  getRootCompanyName,
  hasOutstandingOwnershipRequirements,
  isBeneficialOwnerDetailsComplete,
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
      birthDate: '1980-01-01',
      countryOfResidence: 'US',
      individualIds: [{ idType: 'SSN', value: '000-00-0000', issuer: 'US' }],
      addresses: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          addressLines: ['123 Main St'],
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      ],
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
      birthDate: '1978-05-05',
      countryOfResidence: 'US',
      individualIds: [{ idType: 'SSN', value: '000-00-0001', issuer: 'US' }],
      addresses: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          addressLines: ['456 Park Ave'],
          city: 'New York',
          state: 'NY',
          postalCode: '10002',
          country: 'US',
        },
      ],
    },
  };

  const mockCompanyParty: PartyResponse = {
    id: 'party-company-coffee',
    partyType: 'ORGANIZATION',
    roles: [], // Intermediate entity — not a CLIENT, not a BENEFICIAL_OWNER
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

    test('keeps indirect owner pending when parent points to client with no intermediary steps', () => {
      const indirectViaClientOnly = {
        ...mockIndirectOwnerParty,
        parentPartyId: 'party-client',
        individualDetails: {
          ...mockIndirectOwnerParty.individualDetails,
          natureOfOwnership: 'Indirect' as const,
        },
      };

      const result = transformPartyToBeneficialOwner(indirectViaClientOnly, [
        mockClientParty,
      ]);

      expect(result.ownershipType).toBe('INDIRECT');
      expect(result.ownershipHierarchy?.steps).toHaveLength(0);
      expect(result.status).toBe('PENDING_HIERARCHY');
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

    test('classifies organization as indirect when organization natureOfOwnership is Indirect', () => {
      const orgIndirectParty: PartyResponse = {
        id: 'party-org-indirect',
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        profileStatus: 'APPROVED',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        parentPartyId: 'party-client',
        organizationDetails: {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          organizationName: 'Intermediary Holdings LLC',
          // natureOfOwnership is not yet in the generated OrganizationDetails schema
          natureOfOwnership: 'Indirect',
        } as any,
      };

      const result = transformPartyToBeneficialOwner(orgIndirectParty, [
        mockClientParty,
      ]);

      expect(result.ownershipType).toBe('INDIRECT');
      // An indirect business owner needs its intermediary chain built before it
      // is complete (spec case 3.4).
      expect(result.status).toBe('PENDING_HIERARCHY');
    });

    test('marks a direct business owner complete without a chain (spec 3.3)', () => {
      const directBusinessOwner: PartyResponse = {
        id: 'party-direct-business',
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        profileStatus: 'APPROVED',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        organizationDetails: {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          organizationName: 'Direct Business Owner LLC',
          natureOfOwnership: 'Direct',
          countryOfFormation: 'US',
          organizationIds: [
            { idType: 'EIN', value: '12-3456789', issuer: 'US' },
          ],
          addresses: [
            {
              addressType: 'BUSINESS_ADDRESS',
              country: 'US',
            },
          ],
        } as any,
      };

      const result = transformPartyToBeneficialOwner(directBusinessOwner, []);

      expect(result.ownershipType).toBe('DIRECT');
      // A direct business owner (case 3.3) is complete once its own details
      // (e.g. a legal address) are populated — no chain required.
      expect(result.status).toBe('COMPLETE');
    });

    test('marks a direct owner missing details PENDING_DETAILS, not PENDING_HIERARCHY', () => {
      // A direct individual owner with only a name stub is missing its own
      // required details. That is a details problem, not a chain problem.
      const bareDirectOwner: PartyResponse = {
        id: 'party-bare',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        individualDetails: { firstName: 'Bare', lastName: 'Owner' },
      };

      const result = transformPartyToBeneficialOwner(bareDirectOwner, []);

      expect(result.ownershipType).toBe('DIRECT');
      expect(result.status).toBe('PENDING_DETAILS');
    });

    test('marks an indirect owner WITH a chain but missing details PENDING_DETAILS, not PENDING_HIERARCHY', () => {
      // owner ← intermediary ← client: the chain exists (reconstructable from
      // the intermediary child), so a missing detail is a DETAILS gap, not a
      // hierarchy gap. This is the exact distinction the surfaces must agree on.
      const parties: PartyResponse[] = [
        {
          id: 'client',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: { organizationName: 'Root Co' },
        } as PartyResponse,
        {
          id: 'mid',
          partyType: 'ORGANIZATION',
          roles: [INTERMEDIARY_OWNER_ROLE],
          active: true,
          parentPartyId: 'client',
          createdAt: '2024-01-02T00:00:00Z',
          organizationDetails: {
            organizationName: 'MidCo Holdings',
            natureOfOwnership: 'Direct',
          } as any,
        } as PartyResponse,
        {
          id: 'owner',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'mid',
          createdAt: '2024-01-03T00:00:00Z',
          individualDetails: {
            firstName: 'Ivy',
            lastName: 'Indirect',
            natureOfOwnership: 'Indirect',
            birthDate: '1980-01-01',
          },
        } as PartyResponse,
      ];

      const result = transformPartyToBeneficialOwner(parties[2], parties);

      expect(result.ownershipType).toBe('INDIRECT');
      expect(result.ownershipHierarchy?.steps?.length ?? 0).toBeGreaterThan(0);
      expect(result.status).toBe('PENDING_DETAILS');
    });

    test('a single collected detail does not mark an owner complete', () => {
      // Only a date of birth — still missing address, country, and ID.
      const oneDetailOwner: PartyResponse = {
        id: 'party-one-detail',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        individualDetails: {
          firstName: 'Sol',
          lastName: 'Single',
          birthDate: '1980-01-01',
        },
      };

      const result = transformPartyToBeneficialOwner(oneDetailOwner, []);

      expect(result.status).not.toBe('COMPLETE');
      expect(result.status).toBe('PENDING_DETAILS');
    });

    test('does not build a backwards chain for a chain intermediary whose parent is another owner', () => {
      // A chain intermediary is created with natureOfOwnership "Direct" and a
      // parentPartyId pointing at the owner it sits under. It must stay DIRECT
      // (it directly owns the business) and must NOT get its own reconstructed
      // chain back through that owner — which previously produced a circular
      // "intermediary -> owner -> root" chain.
      const owner: PartyResponse = {
        id: 'owner-1',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        individualDetails: { firstName: 'Tinker', lastName: 'Ball' },
      };
      const intermediary: PartyResponse = {
        id: 'intermediary-1',
        parentPartyId: 'owner-1',
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        organizationDetails: {
          organizationName: 'AMBLIM',
          natureOfOwnership: 'Direct',
        } as any,
      };

      const result = transformPartyToBeneficialOwner(intermediary, [
        owner,
        intermediary,
      ]);

      expect(result.ownershipType).toBe('DIRECT');
      expect(result.ownershipHierarchy).toBeUndefined();
    });

    test("reconstructs an owner's chain from its intermediary children so it survives a data refresh", () => {
      // The owner's chain is persisted as intermediary parties pointing at the
      // owner via parentPartyId. It must be rebuildable from the party graph
      // alone (not just ephemeral UI state), otherwise the chain disappears
      // after editing an intermediary's details.
      const owner: PartyResponse = {
        id: 'owner-1',
        parentPartyId: 'client-1',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        individualDetails: {
          firstName: 'Tinker',
          lastName: 'Ball',
          natureOfOwnership: 'Indirect' as const,
        },
      };
      const clientParty: PartyResponse = {
        id: 'client-1',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      const intermediary: PartyResponse = {
        id: 'intermediary-1',
        parentPartyId: 'owner-1',
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        active: true,
        createdAt: '2024-01-02T00:00:00Z',
        organizationDetails: {
          organizationName: 'AMBLIM',
          natureOfOwnership: 'Direct',
        } as any,
      };

      const result = transformPartyToBeneficialOwner(owner, [
        clientParty,
        owner,
        intermediary,
      ]);

      expect(result.ownershipType).toBe('INDIRECT');
      expect(result.ownershipHierarchy?.steps).toHaveLength(1);
      expect(result.ownershipHierarchy?.steps[0].entityName).toBe('AMBLIM');
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

    test('reconstructs an indirect chain by walking parentPartyId when there are no intermediary children', () => {
      const parties: PartyResponse[] = [
        {
          id: 'client',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: { organizationName: 'Root Co' },
        } as PartyResponse,
        {
          id: 'mid',
          partyType: 'ORGANIZATION',
          roles: [INTERMEDIARY_OWNER_ROLE],
          active: true,
          parentPartyId: 'client',
          createdAt: '2024-01-02T00:00:00Z',
          organizationDetails: { organizationName: 'MidCo Holdings' },
        } as PartyResponse,
        {
          id: 'owner',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'mid',
          createdAt: '2024-01-03T00:00:00Z',
          individualDetails: {
            firstName: 'Ada',
            lastName: 'Byron',
            natureOfOwnership: 'Indirect',
          },
        } as PartyResponse,
      ];

      const owner = parties[2];
      const bo = transformPartyToBeneficialOwner(owner, parties);
      const names = (bo.ownershipHierarchy?.steps ?? []).map(
        (s) => s.entityName
      );
      expect(names).toContain('MidCo Holdings');
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

  describe('isBeneficialOwnerDetailsComplete', () => {
    test('individual: true only when DOB, address, country and ID are present', () => {
      const complete: PartyResponse = {
        id: 'i1',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        individualDetails: {
          firstName: 'A',
          lastName: 'B',
          birthDate: '1980-01-01',
          countryOfResidence: 'US',
          individualIds: [{ idType: 'SSN', value: 'x', issuer: 'US' }],
          addresses: [{ addressType: 'RESIDENTIAL_ADDRESS', country: 'US' }],
        } as PartyResponse['individualDetails'],
      };
      expect(isBeneficialOwnerDetailsComplete(complete)).toBe(true);

      // Missing individualIds -> incomplete
      const missingId = {
        ...complete,
        individualDetails: {
          ...complete.individualDetails,
          individualIds: [],
        },
      } as PartyResponse;
      expect(isBeneficialOwnerDetailsComplete(missingId)).toBe(false);
    });

    test('organization: true only when name, type, EIN, address and country are present', () => {
      const complete: PartyResponse = {
        id: 'o1',
        partyType: 'ORGANIZATION',
        roles: [INTERMEDIARY_OWNER_ROLE],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        organizationDetails: {
          organizationName: 'Holdco',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          countryOfFormation: 'US',
          organizationIds: [{ idType: 'EIN', value: 'x', issuer: 'US' }],
          addresses: [{ addressType: 'BUSINESS_ADDRESS', country: 'US' }],
        } as PartyResponse['organizationDetails'],
      };
      expect(isBeneficialOwnerDetailsComplete(complete)).toBe(true);

      // Missing address -> incomplete
      const missingAddress = {
        ...complete,
        organizationDetails: {
          ...complete.organizationDetails,
          addresses: [],
        },
      } as PartyResponse;
      expect(isBeneficialOwnerDetailsComplete(missingAddress)).toBe(false);
    });
  });
});
