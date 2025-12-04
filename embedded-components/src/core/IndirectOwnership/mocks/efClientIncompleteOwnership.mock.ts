import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client with error state beneficial ownership - demonstrates parties needing additional information.
 * 
 * Features:
 * - Ross Geller: Needs additional documentation (INFORMATION_REQUESTED status)
 * - Demonstrates error handling workflow
 */
export const efClientIncompleteOwnership: ClientResponse = {
  id: 'incomplete-ownership-client-001',
  attestations: [],
  parties: [
    // CLIENT: Central Perk Coffee & Cookies
    {
      id: 'party-central-perk',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRAL_PERK_001',
      email: 'info@centralperk.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee & Cookies',
        countryOfFormation: 'US',
      },
    },

    // ERROR STATE: Ross Geller (indirect owner) needs additional documentation
    {
      id: 'party-ross-error',
      partyType: 'INDIVIDUAL',
      externalId: 'ROSS_ERROR_001',
      email: 'ross.geller@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'INFORMATION_REQUESTED', // Error state
      active: true,
      parentPartyId: 'party-central-perk-coffee-error', // Indirect ownership
      createdAt: '2024-01-15T10:45:00.000Z',
      individualDetails: {
        firstName: 'Ross',
        lastName: 'Geller',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'government_id',
            },
            {
              name: 'address_verification',
            },
          ],
        },
      ],
    },

    // INTERMEDIATE ENTITY for Ross's error state ownership chain
    {
      id: 'party-central-perk-coffee-error',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRAL_PERK_COFFEE_ERROR_001',
      email: 'contact@centralperkcoffee.com',
      roles: [], // Not a BENEFICIAL_OWNER role - just an intermediate entity
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T11:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee',
        countryOfFormation: 'US',
      },
      // No parentPartyId = Directly owns Central Perk Coffee & Cookies
    },
  ],
  partyId: 'party-central-perk',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: ['party-ross-error'],
    partyRoles: ['BENEFICIAL_OWNER'],
    questionIds: [],
  },
  createdAt: '2024-01-15T10:00:00Z',
  status: 'APPROVED',
};
