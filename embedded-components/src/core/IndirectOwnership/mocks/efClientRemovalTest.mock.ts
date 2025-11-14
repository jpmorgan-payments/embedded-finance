import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data specifically designed for testing the removal functionality.
 * This structure allows testing various removal scenarios using Central Perk structure:
 * 
 * 1. Removing individuals from entities (while keeping the entity)
 * 2. Removing entire entities (cascade deletion)
 * 3. Testing nested entity structures with multi-level ownership
 * 
 * Structure:
 * Central Perk Coffee & Cookies (Client)
 * ├── Monica Gellar - Individual (can be removed)
 * ├── Central Perk Coffee - Entity 
 * │   └── Ross Gellar - Individual (can be removed, last individual will trigger orphan warning)
 * └── Central Perk Cookies - Entity
 *     └── Cookie Co. - Entity (nested entity)
 *         └── Rachel Green - Individual (can be removed, last in nested chain)
 */
export const efClientRemovalTest: ClientResponse = {
  id: 'removal-test-client-001',
  attestations: [],
  parties: [
    // Root client entity - Central Perk Coffee & Cookies
    {
      id: 'party-client-001',
      partyType: 'ORGANIZATION',
      externalId: 'CLIENT001',
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
    // Direct individual beneficial owner - Monica Gellar
    {
      id: 'party-individual-001',
      partyType: 'INDIVIDUAL',
      externalId: 'IND001',
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
    // Central Perk Coffee entity
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'ENT001',
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
    // Ross Gellar under Central Perk Coffee (can be removed - last individual will trigger orphan warning)
    {
      id: 'party-individual-002',
      partyType: 'INDIVIDUAL',
      externalId: 'IND002',
      email: 'ross.gellar@centralperk.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-001',
      individualDetails: {
        firstName: 'Ross',
        lastName: 'Gellar',
      },
    },
    // Central Perk Cookies entity
    {
      id: 'party-entity-002',
      partyType: 'ORGANIZATION',
      externalId: 'ENT002',
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
    // Cookie Co. - nested entity under Central Perk Cookies
    {
      id: 'party-entity-003',
      partyType: 'ORGANIZATION',
      externalId: 'ENT003',
      email: 'info@cookieco.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-002',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Cookie Co.',
        countryOfFormation: 'US',
      },
    },
    // Rachel Green under Cookie Co. (can be removed - last individual in nested chain)
    {
      id: 'party-individual-003',
      partyType: 'INDIVIDUAL',
      externalId: 'IND003',
      email: 'rachel.green@cookieco.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-003',
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green',
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
