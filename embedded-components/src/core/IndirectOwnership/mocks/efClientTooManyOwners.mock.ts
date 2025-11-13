import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with too many beneficial owners (5 individuals) in a mixed direct/indirect structure.
 * This triggers the TOO_MANY_BENEFICIAL_OWNERS validation error since
 * mathematically, you can only have 4 individuals if each must own ≥25%.
 * 
 * Structure:
 * Complex Holdings LLC (Client)
 * ├── Alice Johnson - Individual (1st beneficial owner - DIRECT)
 * ├── Bob Smith - Individual (2nd beneficial owner - DIRECT)  
 * ├── Management Partners LLC - Entity
 * │   └── Carol Davis - Individual (3rd beneficial owner - INDIRECT)
 * ├── Investment Group Corp - Entity  
 * │   └── David Wilson - Individual (4th beneficial owner - INDIRECT)
 * └── Eve Brown - Individual (5th beneficial owner - DIRECT) ⚠️ VALIDATION ERROR
 * 
 * Having 5 individuals is mathematically impossible if each must own ≥25%
 * (5 × 25% = 125% > 100%), demonstrating the error in a realistic mixed ownership scenario.
 */
export const efClientTooManyOwners: ClientResponse = {
  id: 'too-many-owners-client-001',
  attestations: [],
  parties: [
    // Root client entity
    {
      id: 'party-client-001',
      partyType: 'ORGANIZATION',
      externalId: 'CLIENT001',
      email: 'contact@complexholdings.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Complex Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    // 1st Individual Beneficial Owner (DIRECT)
    {
      id: 'party-individual-001',
      partyType: 'INDIVIDUAL',
      externalId: 'IND001',
      email: 'alice.johnson@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Alice',
        lastName: 'Johnson',
      },
    },
    // 2nd Individual Beneficial Owner (DIRECT)
    {
      id: 'party-individual-002',
      partyType: 'INDIVIDUAL',
      externalId: 'IND002',
      email: 'bob.smith@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Bob',
        lastName: 'Smith',
      },
    },
    // Intermediary Entity 1 - Management Partners LLC
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'ENT001',
      email: 'contact@managementpartners.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Management Partners LLC',
        countryOfFormation: 'US',
      },
    },
    // 3rd Individual Beneficial Owner (INDIRECT via Management Partners LLC)
    {
      id: 'party-individual-003',
      partyType: 'INDIVIDUAL',
      externalId: 'IND003',
      email: 'carol.davis@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-001',
      individualDetails: {
        firstName: 'Carol',
        lastName: 'Davis',
      },
    },
    // Intermediary Entity 2 - Investment Group Corp
    {
      id: 'party-entity-002',
      partyType: 'ORGANIZATION',
      externalId: 'ENT002',
      email: 'contact@investmentgroup.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Investment Group Corp',
        countryOfFormation: 'US',
      },
    },
    // 4th Individual Beneficial Owner (INDIRECT via Investment Group Corp)
    {
      id: 'party-individual-004',
      partyType: 'INDIVIDUAL',
      externalId: 'IND004',
      email: 'david.wilson@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-entity-002',
      individualDetails: {
        firstName: 'David',
        lastName: 'Wilson',
      },
    },
    // 5th Individual Beneficial Owner (DIRECT) ⚠️ VALIDATION ERROR - TOO MANY
    {
      id: 'party-individual-005',
      partyType: 'INDIVIDUAL',
      externalId: 'IND005',
      email: 'eve.brown@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Eve',
        lastName: 'Brown',
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
