import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientPost: ClientResponse = {
  id: '0030000132',
  attestations: [],
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'monica@cpgetaways.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2023-10-31T00:02:15.499Z',
      organizationDetails: {
        organizationType: 'SOLE_PROPRIETORSHIP',
        organizationName: 'Central Park Getaways',
        countryOfFormation: 'US',
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'monicagellar@gmail.com',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2023-10-31T00:02:15.499Z',
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['62d29548-f55a-458e-b9bb-ed32a6a05a1b'],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['300001', '300002', '300003'],
  },
  questionResponses: [],
  status: 'NEW',
};
