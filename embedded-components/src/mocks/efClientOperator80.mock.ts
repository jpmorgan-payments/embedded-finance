import { ClientResponse } from '@/api/generated/smbdo.schemas';

export const efClientOperator80Mock: ClientResponse = {
  id: '3100006997',
  attestations: [],
  createdAt: '2026-05-06T00:40:05.985Z',
  parties: [
    {
      id: '2100533138',
      createdAt: '2026-05-06T00:40:05.63Z',
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'info@Neverlandbooks.com',
      profileStatus: 'NEW',
      roles: ['CLIENT'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'addresses',
            },
          ],
        },
      ],
      organizationDetails: {
        countryOfFormation: 'US',
        dbaName: 'FT Books',
        industryCategory:
          'Sporting Goods, Hobby, Musical Instrument, and Book Stores',
        industryType: 'Pet and Pet Supplies Retailers',
        industry: {
          codeType: 'NAICS',
          code: '459910',
        },
        organizationName: 'Neverland Books',
        organizationDescription: 'Step into a world of stories and imagination',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        jurisdiction: 'US',
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
        websiteAvailable: true,
        website: 'https://www.Neverlandbooks.com',
      },
    },
    {
      id: '2100533139',
      createdAt: '2026-05-06T00:40:05.8Z',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100533138',
      externalId: 'TCU12344',
      email: 'Peiter@neverlandbooks.com',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'AUTHORIZED_USER'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'birthDate',
            },
          ],
        },
      ],
      individualDetails: {
        countryOfResidence: 'US',
        firstName: 'Peiter',
        lastName: 'Pan',
        jobTitle: 'CFO',
        natureOfOwnership: 'Direct',
        soleOwner: false,
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
    },
  ],
  partyId: '2100533138',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['a71d7f12-f224-4f80-865f-bc5c04f128bf'],
    documentRequestIds: [],
    questionIds: ['30162', '30195', '30005'],
    partyIds: ['2100533138', '2100533139'],
    partyRoles: [],
  },
  questionResponses: [
    {
      questionId: '30194',
      values: ['1000'],
    },
  ],
  status: 'NEW',
};
