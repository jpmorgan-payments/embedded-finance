import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client data with BOTH validation errors:
 * 1. Too many beneficial owners (5 individuals > 4 limit)
 * 2. Incomplete beneficial ownership (entity without individuals)
 * 
 * This creates a "worst case" scenario for testing comprehensive validation.
 * 
 * Structure:
 * Problematic Holdings LLC (Client)
 * ├── Alice Johnson - Individual (1st beneficial owner)
 * ├── Bob Smith - Individual (2nd beneficial owner)  
 * ├── Carol Davis - Individual (3rd beneficial owner)
 * ├── David Wilson - Individual (4th beneficial owner)
 * ├── Eve Brown - Individual (5th beneficial owner) ⚠️ TOO_MANY_BENEFICIAL_OWNERS
 * └── Mystery Entity Corp - Entity WITHOUT individuals ⚠️ INCOMPLETE_BENEFICIAL_OWNERSHIP
 */
export const efClientMultipleValidationErrors: ClientResponse = {
  id: 'multiple-errors-client-001',
  attestations: [],
  parties: [
    // Root client entity
    {
      id: 'party-client-001',
      partyType: 'ORGANIZATION',
      externalId: 'CLIENT001',
      email: 'contact@problematicholdigs.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Problematic Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    // 1st Individual Beneficial Owner
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
    // 2nd Individual Beneficial Owner
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
    // 3rd Individual Beneficial Owner
    {
      id: 'party-individual-003',
      partyType: 'INDIVIDUAL',
      externalId: 'IND003',
      email: 'carol.davis@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'Carol',
        lastName: 'Davis',
      },
    },
    // 4th Individual Beneficial Owner
    {
      id: 'party-individual-004',
      partyType: 'INDIVIDUAL',
      externalId: 'IND004',
      email: 'david.wilson@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      individualDetails: {
        firstName: 'David',
        lastName: 'Wilson',
      },
    },
    // 5th Individual Beneficial Owner (VALIDATION ERROR - TOO MANY)
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
    // Entity without beneficial owners identified (VALIDATION ERROR - INCOMPLETE)
    {
      id: 'party-entity-001',
      partyType: 'ORGANIZATION',
      externalId: 'ENT001',
      email: 'contact@mysteryentity.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'INFORMATION_REQUESTED',
      active: true,
      createdAt: '2024-01-15T10:00:00Z',
      parentPartyId: 'party-client-001',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Mystery Entity Corp',
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
