import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client with an indirect owner that needs hierarchy building.
 * This shows the PENDING_HIERARCHY status and warning badge.
 */
export const efClientPendingHierarchy: ClientResponse = {
  id: 'pending-hierarchy-client-001',
  attestations: [],
  parties: [
    // CLIENT: The business being onboarded
    {
      id: 'party-target-business',
      partyType: 'ORGANIZATION',
      externalId: 'TARGET_BUSINESS_001',
      email: 'info@targetbusiness.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Target Business LLC',
        countryOfFormation: 'US',
      },
    },

    // DIRECT BENEFICIAL OWNER: Monica Geller - Complete, no hierarchy needed
    {
      id: 'party-monica',
      partyType: 'INDIVIDUAL',
      externalId: 'MONICA_001',
      email: 'monica.geller@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Geller',
      },
      // No parentPartyId = Direct ownership
    },

    // INDIRECT BENEFICIAL OWNER: Ross Geller - Incomplete, needs hierarchy building
    // This owner has a placeholder parentPartyId that doesn't exist in allParties
    // This simulates Ross being added as indirect but hierarchy not yet built
    {
      id: 'party-ross',
      partyType: 'INDIVIDUAL',
      externalId: 'ROSS_001',
      email: 'ross.geller@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:45:00.000Z',
      individualDetails: {
        firstName: 'Ross',
        lastName: 'Geller',
      },
      // parentPartyId points to non-existent party - simulates incomplete hierarchy
      parentPartyId: 'party-nonexistent-placeholder',
    },
  ],
  partyId: 'party-target-business',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2024-01-15T10:00:00.000Z',
  status: 'APPROVED',
};
