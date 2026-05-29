import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client with Friends character ownership structure matching requirements:
 * 1. Monica Geller (Direct Owner) → Central Perk Coffee & Cookies
 * 2. Ross Geller (Indirect Owner) → Central Perk Coffee → Central Perk Coffee & Cookies
 * 3. Rachel Green (Indirect Owner) → Cookie Co. → Central Perk Cookie → Central Perk Coffee & Cookies
 */
export const efClientWithOwnershipStructure: ClientResponse = {
  id: 'central-perk-client-001',
  attestations: [],
  parties: [
    // CLIENT: Central Perk Coffee & Cookies (the business being onboarded)
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

    // 1. DIRECT BENEFICIAL OWNER: Monica Geller → Central Perk Coffee & Cookies
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
      // No parentPartyId = Direct ownership of Central Perk Coffee & Cookies
    },

    // 2. INDIRECT BENEFICIAL OWNER: Ross Geller → Central Perk Coffee → Central Perk Coffee & Cookies
    {
      id: 'party-ross',
      partyType: 'INDIVIDUAL',
      externalId: 'ROSS_001',
      email: 'ross.geller@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      parentPartyId: 'party-central-perk-coffee', // Reference to intermediate entity
      createdAt: '2024-01-15T10:45:00.000Z',
      individualDetails: {
        firstName: 'Ross',
        lastName: 'Geller',
      },
    },

    // INTERMEDIATE ENTITY: Central Perk Coffee (not a beneficial owner, just part of ownership chain)
    {
      id: 'party-central-perk-coffee',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRAL_PERK_COFFEE_001',
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

    // 3. INDIRECT BENEFICIAL OWNER: Rachel Green → Cookie Co. → Central Perk Cookie → Central Perk Coffee & Cookies
    {
      id: 'party-rachel',
      partyType: 'INDIVIDUAL',
      externalId: 'RACHEL_001',
      email: 'rachel.green@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      parentPartyId: 'party-cookie-co', // Reference to first intermediate entity
      createdAt: '2024-01-15T11:30:00.000Z',
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green',
      },
    },

    // INTERMEDIATE ENTITY: Cookie Co. (not a beneficial owner, part of Rachel's ownership chain)
    {
      id: 'party-cookie-co',
      partyType: 'ORGANIZATION',
      externalId: 'COOKIE_CO_001',
      email: 'contact@cookieco.com',
      roles: [], // Not a BENEFICIAL_OWNER role - just an intermediate entity
      profileStatus: 'APPROVED',
      active: true,
      parentPartyId: 'party-central-perk-cookie', // Owned by Central Perk Cookie
      createdAt: '2024-01-15T11:15:00.000Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Cookie Co.',
        countryOfFormation: 'US',
      },
    },

    // INTERMEDIATE ENTITY: Central Perk Cookie (not a beneficial owner, part of Rachel's ownership chain)
    {
      id: 'party-central-perk-cookie',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRAL_PERK_COOKIE_001',
      email: 'contact@centralperkcookie.com',
      roles: [], // Not a BENEFICIAL_OWNER role - just an intermediate entity
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T12:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Cookie',
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
    partyIds: [], // No outstanding requirements - all approved
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2024-01-15T10:00:00.000Z',
  status: 'APPROVED',
};
