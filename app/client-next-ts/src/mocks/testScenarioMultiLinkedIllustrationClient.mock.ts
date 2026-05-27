/**
 * MSW seed for the `/test-scenario-2` onboarding demo — sole proprietor–style org and dedicated client id.
 * Seeded when `testScenarioBundle` is `test-scenario-2`.
 */
export const TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID = '3100006998';

export const testScenarioMultiLinkedIllustrationClient = {
  id: TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID,
  attestations: [],
  createdAt: '2026-05-08T14:22:10.000Z',
  parties: [
    {
      id: '2100535100',
      createdAt: '2026-05-08T14:22:10.1Z',
      partyType: 'ORGANIZATION',
      profileStatus: 'NEW',
      roles: ['CLIENT'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'addresses' }],
        },
      ],
      organizationDetails: {
        countryOfFormation: 'US',
        dbaName: 'Riverbend Cafe',
        industryCategory: 'Food Services',
        industryType: 'Cafeterias and Buffets',
        industry: {
          codeType: 'NAICS',
          code: '722514',
        },
        organizationName: 'Riverbend Cafe Collective',
        organizationDescription:
          'Counter-service cafe with baked goods and espresso.',
        organizationType: 'SOLE_PROPRIETORSHIP',
        organizationIds: [
          {
            idType: 'EIN',
            value: '887654321',
            issuer: 'US',
          },
        ],
        websiteAvailable: true,
        yearOfFormation: '2015',
      },
      individualDetails: {},
      status: 'ACTIVE',
      preferences: {
        defaultLanguage: 'en-US',
      },
      access: [],
      networkRegistration: {},
      parentPartyId: '',
      parentExternalId: '',
    },
    {
      id: '2100535101',
      createdAt: '2026-05-08T14:22:10.2Z',
      email: '',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535100',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            { name: 'individualIds' },
            { name: 'addresses' },
            { name: 'birthDate' },
          ],
        },
      ],
      individualDetails: {
        countryOfResidence: 'US',
        firstName: 'Jordan',
        middleName: 'Lee',
        lastName: 'Okonkwo',
        jobTitle: 'Other',
        jobTitleDescription: 'Proprietor',
      },
      organizationDetails: {},
      status: 'ACTIVE',
      preferences: {
        defaultLanguage: 'en-US',
      },
      access: [],
      networkRegistration: {},
      parentExternalId: '',
    },
  ],
  partyId: '2100535100',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['b82e8c31-0a35-4d91-9f2a-9d1c6aa29c01'],
    documentRequestIds: [],
    questionIds: ['30195'],
    partyIds: ['2100535100', '2100535101'],
    partyRoles: [],
  },
  questionResponses: [
    {
      questionId: '30194',
      values: ['500'],
    },
  ],
  status: 'NEW',
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
};
