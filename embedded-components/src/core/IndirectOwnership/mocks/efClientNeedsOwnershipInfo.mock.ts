import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client that needs more information - represents a client that has been
 * created but requires additional ownership information before proceeding
 */
export const efClientNeedsOwnershipInfo: ClientResponse = {
  id: 'needs-info-client-002',
  attestations: [],
  parties: [
    {
      id: 'party-002',
      partyType: 'ORGANIZATION',
      externalId: 'CENTRALPERK002',
      email: 'compliance@centralperk.com',
      roles: ['CLIENT'],
      profileStatus: 'INFORMATION_REQUESTED',
      active: true,
      createdAt: '2025-11-10T15:30:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Central Perk Coffee & Cookies',
        countryOfFormation: 'US',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'beneficial_owners',
            },
            {
              name: 'ownership_structure',
            },
            {
              name: 'organizational_chart',
            },
          ],
        },
      ],
    },
  ],
  partyId: 'party-002',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: ['party-002'],
    partyRoles: ['BENEFICIAL_OWNER'],
    questionIds: ['ownership-001', 'ownership-002'],
  },
  createdAt: '2025-11-10T15:30:00.000Z',
  status: 'INFORMATION_REQUESTED',
};
