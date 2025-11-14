import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock data representing Central Perk's complex beneficial ownership structure:
 * 
 * Layer 1 (Root): Central Perk Coffee & Cookies (Client)
 * Layer 2: Intermediary entities that qualify for beneficial ownership (≥25%)
 * Layer 3: Individual beneficial owners (3 total = mathematically valid)
 * 
 * Structure (Central Perk Beneficial Ownership):
 * Central Perk Coffee & Cookies
 * ├── Monica Gellar - Direct Individual Owner (40% beneficial ownership)
 * ├── Central Perk Coffee - Coffee Division (35% beneficial ownership)
 * │   └── Ross Gellar - Individual Owner (owns 100% of Coffee Division)
 * └── Central Perk Cookies - Cookie Division (25% beneficial ownership)
 *     └── Rachel Green - Individual Owner (owns 100% of Cookie Division)
 */
export const efClientComplexOwnership: ClientResponse = {
  id: 'complex-ownership-client-001',
  attestations: [],
  parties: [
    // Layer 1: Root Client Organization - Central Perk Coffee & Cookies
    {
      id: 'party-root-001', 
      partyType: 'ORGANIZATION',
      externalId: 'CENTRALPERK001',
      email: 'contact@centralperk.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee & Cookies',
        countryOfFormation: 'US',
      },
    },
    
    // Layer 2: Central Perk Coffee (35% beneficial ownership) - Coffee Division
    {
      id: 'party-sub-001',
      partyType: 'ORGANIZATION', 
      externalId: 'COFFEE001',
      email: 'coffee@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:15:00.000Z',
      parentPartyId: 'party-root-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee',
        countryOfFormation: 'US',
      },
    },
    
    // Layer 2: Central Perk Cookies (25% beneficial ownership) - Cookie Division
    {
      id: 'party-sub-002',
      partyType: 'ORGANIZATION',
      externalId: 'COOKIES001', 
      email: 'cookies@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:30:00.000Z',
      parentPartyId: 'party-root-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Cookies', 
        countryOfFormation: 'US',
      },
    },
    
    // Layer 3: Individual owner under Central Perk Coffee (35% beneficial ownership through entity)
    {
      id: 'party-ind-001',
      partyType: 'INDIVIDUAL',
      externalId: 'ROSS001',
      email: 'ross.gellar@centralperk.com', 
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:00:00.000Z',
      parentPartyId: 'party-sub-001',
      individualDetails: {
        firstName: 'Ross',
        middleName: 'Eustace',
        lastName: 'Gellar',
      },
    },
    
    // Layer 3: Individual owner under Central Perk Cookies (25% beneficial ownership through entity)
    {
      id: 'party-ind-002',
      partyType: 'INDIVIDUAL', 
      externalId: 'RACHEL001',
      email: 'rachel.green@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:10:00.000Z',
      parentPartyId: 'party-sub-002',
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green', 
      },
    },

    // Direct Owner: Individual who directly owns 40% of Central Perk Coffee & Cookies
    {
      id: 'party-ind-003',
      partyType: 'INDIVIDUAL',
      externalId: 'MONICA001',
      email: 'monica.gellar@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:30:00.000Z',
      parentPartyId: 'party-root-001', // Direct ownership of the client entity
      individualDetails: {
        firstName: 'Monica',
        middleName: 'E',
        lastName: 'Gellar',
      },
    },
  ],
  partyId: 'party-root-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2025-11-12T09:00:00.000Z', 
  status: 'APPROVED',
};
