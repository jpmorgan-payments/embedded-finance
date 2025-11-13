import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with incomplete beneficial ownership structure.
 * This client has entities that don't have identified beneficial owners (individuals),
 * which triggers the INCOMPLETE_BENEFICIAL_OWNERSHIP validation error.
 * 
 * Structure:
 * Incomplete Holdings LLC (Client)
 * ├── Mystery Holdings Corp - Entity WITHOUT beneficial owners (⚠️ VALIDATION ERROR)
 * └── Ghost Investments LLC - Entity WITHOUT beneficial owners (⚠️ VALIDATION ERROR)
 * 
 * Both entities are missing their individual beneficial owners, which should trigger
 * the validation error: "Entity does not have identified beneficial owners"
 */
export const efClientIncompleteOwnership: ClientResponse = {
  id: 'incomplete-ownership-client-001',
  attestations: [],
  parties: [
    // Root client entity
    {
      id: 'party-client-001',
      partyType: 'ORGANIZATION',
      externalId: 'CLIENT001',
      email: 'contact@incompleteownership.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Incomplete Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    // First intermediary entity without beneficial owners identified (VALIDATION ERROR)
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'ENT001',
      email: 'contact@mysteryholdings.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Mystery Holdings Corp',
        countryOfFormation: 'US',
      },
    },
    // Second intermediary entity without beneficial owners identified (VALIDATION ERROR)
    {
      id: 'party-entity-002',
      partyType: 'ORGANIZATION',
      externalId: 'ENT002',
      email: 'contact@ghostinvestments.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Ghost Investments LLC',
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
