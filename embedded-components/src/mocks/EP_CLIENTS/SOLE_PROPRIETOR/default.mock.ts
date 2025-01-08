import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientSolPropWithMoreData: ClientResponse = {
  id: '0030000129',
  attestations: [],
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
        organizationName: 'Monica Geller',
        dbaName: undefined,
        organizationDescription:
          'Relax, unwind and experience the comforting charm of our apartment',
        industryCategory: 'Accommodation and Food Services',
        industryType: 'All Other Traveler Accommodation',
        countryOfFormation: 'US',
        yearOfFormation: '1990',
        // significantOwnership: true,
        entitiesInOwnership: false,
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['90 Bedford Street', 'Apt 2E'],
            city: 'New York',
            state: 'NY',
            postalCode: '10014',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2126215110',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '00-0000001',
            expiryDate: '2023-10-31',
            description: 'EIN',
          },
        ],
        jurisdiction: 'US',
        websiteAvailable: false,
        website: undefined,
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'monicageller@ggmail.com',
      profileStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: '2023-10-31T00:20:09.401Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER', 'DECISION_MAKER'],
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        jobTitleDescription: 'Chief Executive Officer',
        soleOwner: true,
        birthDate: '1990-01-01',
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2126215110',
        },
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['90 Bedford Street', 'Apt 2E'],
            city: 'New York',
            state: 'NY',
            postalCode: '10014',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '000000001',
          },
        ],
      },
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: ['2000000112'],
    partyRoles: [],
    questionIds: [
      '30005',
      '30026',
      '30027',
      '30069',
      '30070',
      '30071',
      '30072',
      '30073',
    ],
  },
  questionResponses: [],
  status: 'NEW',
};
