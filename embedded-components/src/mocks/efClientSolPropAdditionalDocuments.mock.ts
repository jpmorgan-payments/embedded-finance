import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientSolPropAdditionalDocuments: ClientResponse = {
  id: '0030000129',
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
      createdAt: '2023-10-31T00:20:09.401Z',
      organizationDetails: {
        organizationType: 'SOLE_PROPRIETORSHIP',
        organizationName: 'Central Park Getaways',
        dbaName: 'CP Getaways',
        organizationDescription:
          'Relax, unwind and experience the comforting charm of our apartment while exploring New York',
        industryCategory: 'Manufacturing',
        industryType: 'Retail Bakeries',
        countryOfFormation: 'US',
        yearOfFormation: '2023',
        // significantOwnership: true,
        entitiesInOwnership: false,
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['901 Bedford Street', 'Suite 2'],
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
            value: '00-0000001',
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
      createdAt: '2023-10-31T00:20:09.401Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'Other',
        jobTitleDescription: 'CEO',
        soleOwner: true,
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
            value: '100-01-0001',
          },
        ],
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: ['68430'],
        },
      ],
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
      values: ['false'],
    },
  ],
  status: 'INFORMATION_REQUESTED',
};
