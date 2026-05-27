/**
 * MSW seed for the `/test-scenario-2` onboarding demo — "Top Dog Construction, LLC".
 * Minimum data required to create a client + authorized user.
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
          fields: [
            { name: 'addresses' },
            { name: 'industryCategory' },
            { name: 'industryType' },
            { name: 'organizationDescription' },
            { name: 'yearOfFormation' },
            { name: 'organizationIds' },
          ],
        },
      ],
      organizationDetails: {
        countryOfFormation: 'US',
        dbaName: 'Top Dog Construction',
        industryCategory: '',
        industryType: '',
        organizationName: 'Top Dog Construction, LLC',
        organizationDescription: '',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationIds: [
          {
            idType: '',
            value: '',
            issuer: '',
          },
        ],
        yearOfFormation: '',
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
      email: 'ross.gellar@topdog.com',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535100',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'AUTHORIZED_USER'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            { name: 'individualIds' },
            { name: 'addresses' },
            { name: 'birthDate' },
            { name: 'countryOfResidence' },
            { name: 'jobTitle' },
            { name: 'jobTitleDescription' },
          ],
        },
      ],
      individualDetails: {
        countryOfResidence: '',
        firstName: 'Ross',
        middleName: 'Thomas',
        lastName: 'Gellar',
        jobTitle: '',
        jobTitleDescription: '',
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
