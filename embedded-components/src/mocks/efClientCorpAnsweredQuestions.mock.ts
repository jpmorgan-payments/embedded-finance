import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientCorpAnsweredQuestions: ClientResponse = {
  id: '0030000130',
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
      email: 'monica@cpgetaways.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      status: 'ACTIVE',
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Central Park Getaways',
        dbaName: 'CP Getaways',
        organizationDescription:
          'Relax, unwind and experience the comforting charm of our apartment while exploring New York',
        industryCategory: 'Retail Trade',
        industryType: 'Jewelry Retailers',
        countryOfFormation: 'US',
        yearOfFormation: '2023',
        entitiesInOwnership: false,
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['90 Bedford Street', 'Suite 2'],
            city: 'New York',
            state: 'NY',
            postalCode: '10014',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '6316215110',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '43-5248961',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.example.com',
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'monica@cpgetaways.com',
      profileStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: true,
        birthDate: '1983-02-08',
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
            value: '123456789',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '6316215110',
        },
      },
    },
    {
      id: '2000000113',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'maryjamessue@fake.website',
      profileStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Mary',
        lastName: 'Sue',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'COO',
        soleOwner: true,
        birthDate: '1983-03-03',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['2468 Real Ave', 'Apt 2E'],
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
            value: '394943213',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '2017700500',
        },
      },
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  questionResponses: [
    {
      questionId: '300005',
      values: ['$10,000'],
    },
    {
      questionId: '30026',
      values: ['No'],
    },
    {
      questionId: '30069',
      values: ['Licensed'],
    },
    {
      questionId: '30070',
      values: ['US'],
    },
    {
      questionId: '30071',
      values: ['09/10/1996'],
    },
    {
      questionId: '30072',
      values: ['US'],
    },
    {
      questionId: '30073',
      values: ['09/10/1996'],
    },
  ],
  status: 'NEW',
};
