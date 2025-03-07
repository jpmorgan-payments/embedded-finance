import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientCorpNew: ClientResponse = {
  attestations: [],
  createdAt: '2025-03-07T20:33:13.85Z',
  id: '0030000130',
  parties: [
    {
      access: [],
      id: '2000000111',
      createdAt: '2025-03-07T20:33:13.641Z',
      email: 'info@Neverlandbooks.com',
      partyType: 'ORGANIZATION',
      profileStatus: 'NEW',
      roles: ['CLIENT'],
      status: 'ACTIVE',
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'organizationDescription',
            },
            {
              name: 'addresses',
            },
            {
              name: 'yearOfFormation',
            },
            {
              name: 'organizationIds',
            },
            {
              name: 'naics',
            },
          ],
          identities: [],
          documentRequestIds: [],
        },
      ],
      organizationDetails: {
        addresses: [],
        associatedCountries: [],
        countryOfFormation: 'US',
        secondaryMccList: [],
        socialMedia: [],
        organizationName: 'Neverland Books',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationIds: [],
        websiteAvailable: false,
      },
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    questionIds: ['30005'],
    partyIds: ['2000000111'],
    partyRoles: ['CONTROLLER'],
  },
  questionResponses: [],
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
  status: 'NEW',
};
