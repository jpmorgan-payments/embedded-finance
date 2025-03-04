import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientCorpEBMock: ClientResponse = {
  id: '0030000130',
  attestations: [
    {
      attesterFullName: 'Peiter Pan',
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
      email: 'info@Neverlandbooks.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Neverland Books',
        dbaName: 'FT Books',
        organizationDescription: 'Step into a world of stories and imagination',
        industryCategory:
          'Sporting Goods, Hobby, Musical Instrument, and Book Stores',
        industryType: 'Pet and Pet Supplies Retailers',
        industry: {
          code: '459910',
          codeType: 'NAICS',
        },
        jurisdiction: 'US',
        countryOfFormation: 'US',
        yearOfFormation: '1989',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['2030 Century Park E'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '90068',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '7606810558',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '300030003',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.Neverlandbooks.com',
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'Peiter@neverlandbooks.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Peiter',
        lastName: 'Pan',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CFO',
        soleOwner: false,
        birthDate: '1945-01-30',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['2029 Century Park E'],
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90067',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '300400004',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '7606810558',
        },
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: ['68804'],
        },
      ],
    },
    {
      id: '2000000113',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'Tinker@neverlandbook.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Tinker',
        lastName: 'Ball',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1969-08-18',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['3223 Hanover St'],
            city: 'Palo Alto',
            state: 'CA',
            postalCode: '94304',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '300050005',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '6503532444',
        },
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: ['68805'],
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
    questionIds: [
      '30005',
    ],
  },
  questionResponses: [],
  status: 'NEW',
};
