import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with too many beneficial owners (5 individuals) using Central Perk characters.
 * This triggers the TOO_MANY_BENEFICIAL_OWNERS validation error since
 * mathematically, you can only have 4 individuals if each must own ≥25%.
 *
 * Structure:
 * Central Perk Coffee & Cookies (Client)
 * ├── Monica Gellar - Individual (1st beneficial owner - DIRECT)
 * ├── Ross Gellar - Individual (2nd beneficial owner - DIRECT)
 * ├── Central Perk Coffee - Entity
 * │   └── Rachel Green - Individual (3rd beneficial owner - INDIRECT)
 * ├── Central Perk Cookies - Entity
 * │   └── Chandler Bing - Individual (4th beneficial owner - INDIRECT)
 * └── Joey Tribbiani - Individual (5th beneficial owner - DIRECT) ⚠️ VALIDATION ERROR
 *
 * Having 5 individuals is mathematically impossible if each must own ≥25%
 * (5 × 25% = 125% > 100%), demonstrating the error with Friends characters.
 */
export const efClientTooManyOwners: ClientResponse = {
  id: 'too-many-owners-client-001',
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
    // 1st Individual Beneficial Owner (DIRECT) - Monica Gellar
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
    // 2nd Individual Beneficial Owner (DIRECT) - Ross Gellar
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
    // Intermediary Entity 1 - Central Perk Coffee
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
    // 3rd Individual Beneficial Owner (INDIRECT via Central Perk Coffee) - Rachel Green
    {
      id: 'party-individual-003',
      partyType: 'INDIVIDUAL',
      externalId: 'RACHEL001',
      email: 'rachel.green@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-001',
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green',
      },
    },
    // Intermediary Entity 2 - Central Perk Cookies
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
    // 4th Individual Beneficial Owner (INDIRECT via Central Perk Cookies) - Chandler Bing
    {
      id: 'party-individual-004',
      partyType: 'INDIVIDUAL',
      externalId: 'CHANDLER001',
      email: 'chandler.bing@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-002',
      individualDetails: {
        firstName: 'Chandler',
        lastName: 'Bing',
      },
    },
    // 5th Individual Beneficial Owner (DIRECT) ⚠️ VALIDATION ERROR - TOO MANY - Joey Tribbiani
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
