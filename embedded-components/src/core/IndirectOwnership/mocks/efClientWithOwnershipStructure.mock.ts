import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client with multiple ownership parties demonstrating the LinkedAccountWidget 
 * multiple accounts theme
 */
export const efClientWithOwnershipStructure: ClientResponse = {
  id: 'ownership-structure-client-004',
  attestations: [],
  parties: [
    {
      id: 'party-001',
      partyType: 'ORGANIZATION',
      externalId: 'ORG001',
      email: 'info@acmeholdings.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-10T15:30:00.000Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Acme Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'party-002',
      partyType: 'ORGANIZATION',
      externalId: 'ORG002',
      email: 'contact@acmeholdings.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      parentPartyId: 'party-001',
      createdAt: '2025-11-10T15:30:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Acme Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'party-003',
      partyType: 'INDIVIDUAL',
      externalId: 'IND001',
      email: 'john.smith@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      parentPartyId: 'party-002',
      createdAt: '2025-11-10T15:35:00.000Z',
      individualDetails: {
        firstName: 'John',
        lastName: 'Smith',
      },
    },
    {
      id: 'party-004',
      partyType: 'INDIVIDUAL',
      externalId: 'IND002',
      email: 'jane.doe@email.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'INFORMATION_REQUESTED',
      active: true,
      parentPartyId: 'party-001',
      createdAt: '2025-11-11T09:15:00.000Z',
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'ownership_percentage',
            },
            {
              name: 'verification_documents',
            },
          ],
        },
      ],
    },
  ],
  partyId: 'party-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: ['party-004'],
    partyRoles: ['BENEFICIAL_OWNER'],
    questionIds: [],
  },
  createdAt: '2025-11-10T15:30:00.000Z',
  status: 'APPROVED',
};
