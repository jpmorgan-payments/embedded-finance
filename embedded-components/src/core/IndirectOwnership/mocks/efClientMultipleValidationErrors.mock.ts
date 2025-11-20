import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with BOTH validation errors using Central Perk characters:
 * 1. Too many beneficial owners (5 individuals > 4 limit)
 * 2. Incomplete beneficial ownership (entity without individuals)
 *
 * This creates a "worst case" scenario for testing comprehensive validation.
 *
 * Structure:
 * Central Perk Coffee & Cookies (Client)
 * ├── Monica Gellar - Individual (1st beneficial owner)
 * ├── Ross Gellar - Individual (2nd beneficial owner)
 * ├── Rachel Green - Individual (3rd beneficial owner)
 * ├── Chandler Bing - Individual (4th beneficial owner)
 * ├── Joey Tribbiani - Individual (5th beneficial owner) ⚠️ TOO_MANY_BENEFICIAL_OWNERS
 * └── Central Perk Merchandise - Entity WITHOUT individuals ⚠️ INCOMPLETE_BENEFICIAL_OWNERSHIP
 */
export const efClientMultipleValidationErrors: ClientResponse = {
  id: 'multiple-errors-client-001',
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
    // 1st Individual Beneficial Owner - Monica Gellar
    {
      id: 'party-individual-001',
      partyType: 'INDIVIDUAL',
      externalId: 'MONICA001',
      email: 'monica.gellar@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
      },
    },
    // 2nd Individual Beneficial Owner - Ross Gellar
    {
      id: 'party-individual-002',
      partyType: 'INDIVIDUAL',
      externalId: 'ROSS001',
      email: 'ross.gellar@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Ross',
        lastName: 'Gellar',
      },
    },
    // 3rd Individual Beneficial Owner - Rachel Green
    {
      id: 'party-individual-003',
      partyType: 'INDIVIDUAL',
      externalId: 'RACHEL001',
      email: 'rachel.green@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green',
      },
    },
    // 4th Individual Beneficial Owner - Chandler Bing
    {
      id: 'party-individual-004',
      partyType: 'INDIVIDUAL',
      externalId: 'CHANDLER001',
      email: 'chandler.bing@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Chandler',
        lastName: 'Bing',
      },
    },
    // 5th Individual Beneficial Owner (VALIDATION ERROR - TOO MANY) - Joey Tribbiani
    {
      id: 'party-individual-005',
      partyType: 'INDIVIDUAL',
      externalId: 'JOEY001',
      email: 'joey.tribbiani@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Joey',
        lastName: 'Tribbiani',
      },
    },
    // Entity without beneficial owners identified (VALIDATION ERROR - INCOMPLETE)
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'MERCH001',
      email: 'merchandise@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'INFORMATION_REQUESTED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Merchandise',
        countryOfFormation: 'US',
      },
    },
  ],
  partyId: 'party-client-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: ['party-entity-001'],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2024-01-15T10:00:00Z',
  status: 'INFORMATION_REQUESTED',
};
