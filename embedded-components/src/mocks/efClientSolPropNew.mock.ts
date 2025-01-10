import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientSolPropNew: ClientResponse = {
  id: '0030000135',
  attestations: [
    {
      attesterFullName: 'Monica Gellar',
      attestationTime: '2023-10-19T12:28:11.232Z',
      documentId: '62d29548-f55a-458e-b9bb-ed32a6a05a1b',
      ipAddress: '1.1.1.1',
    },
  ],
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'monica@ggmail.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      status: 'ACTIVE',
      createdAt: '2023-10-31T00:20:09.401Z',
      organizationDetails: {
        organizationType: 'SOLE_PROPRIETORSHIP',
        organizationName: 'Monica Gellar',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
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
              name: 'phone',
            },
            {
              name: 'naics',
            },
          ],
        },
      ],
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: ['2000000111'],
    partyRoles: ['CONTROLLER'],
    questionIds: ['30005', '30026', '30027'],
  },
  questionResponses: [],
  status: 'NEW',
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
};
