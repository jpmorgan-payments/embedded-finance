import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientEmptyOwnership: ClientResponse = {
  id: 'empty-ownership-client-001',
  attestations: [],
  parties: [
    {
      id: 'party-001',
      partyType: 'ORGANIZATION',
      externalId: 'EMPTY001',
      email: 'contact@newcompany.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2025-11-12T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'New Company Corp',
        countryOfFormation: 'US',
      },
      // No parentPartyId - this is the root organization
      // No other parties - empty ownership structure
    },
  ],
  partyId: 'party-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2025-11-12T10:00:00.000Z',
  status: 'NEW',
};
