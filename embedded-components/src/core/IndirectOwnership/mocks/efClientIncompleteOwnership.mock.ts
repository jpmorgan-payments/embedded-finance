import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with incomplete beneficial ownership structure.
 * This client has entities that don't have identified beneficial owners (individuals),
 * which triggers the INCOMPLETE_BENEFICIAL_OWNERSHIP validation error.
 *
 * Structure:
 * Central Perk Coffee & Cookies (Client)
 * ├── Central Perk Coffee - Entity WITHOUT beneficial owners (⚠️ VALIDATION ERROR)
 * └── Central Perk Cookies - Entity WITHOUT beneficial owners (⚠️ VALIDATION ERROR)
 *
 * Both entities are missing their individual beneficial owners, which should trigger
 * the validation error: "Entity does not have identified beneficial owners"
 */
export const efClientIncompleteOwnership: ClientResponse = {
  id: 'incomplete-ownership-client-001',
  attestations: [],
  parties: [
    // Root client entity - Central Perk Coffee & Cookies
    {
      id: 'party-client-001',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRALPERK001',
      email: 'contact@centralperk.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee & Cookies',
        countryOfFormation: 'US',
      },
    },
    // Central Perk Coffee - entity without beneficial owners identified (VALIDATION ERROR)
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'COFFEE001',
      email: 'coffee@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee',
        countryOfFormation: 'US',
      },
    },
    // Central Perk Cookies - entity without beneficial owners identified (VALIDATION ERROR)
    {
      id: 'party-entity-002',
      partyType: 'ORGANIZATION',
      externalId: 'COOKIES001',
      email: 'cookies@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Cookies',
        countryOfFormation: 'US',
      },
    },
  ],
  partyId: 'party-client-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2024-01-15T10:00:00Z',
  status: 'APPROVED',
};
