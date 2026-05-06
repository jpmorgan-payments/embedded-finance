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
        dbaName: 'Operator 80 Palo Alto',
        industryCategory: 'Accommodation and Food Services',
        industryType: 'Limited-Service Restaurants',
        industry: {
          codeType: 'NAICS',
          code: '722513',
        },
        organizationName: 'Operator 80 Palo Alto CA',
        organizationDescription:
          'Quick service restaurant without alcohol sales.',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationIds: [
          {
            idType: 'EIN',
            value: '914316140',
            issuer: 'US',
          },
        ],
        websiteAvailable: false,
        yearOfFormation: '1980',
      },
    },
    {
      id: '2100533139',
      createdAt: '2026-05-06T00:40:05.8Z',
      email: '',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100533138',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            {
              name: 'individualIds',
            },
            {
              name: 'addresses',
            },
            {
              name: 'birthDate',
            },
          ],
        },
      ],
      individualDetails: {
        countryOfResidence: 'US',
        firstName: 'Kathy',
        middleName: 'Thomas',
        lastName: 'Gellar',
        jobTitle: 'Other',
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
