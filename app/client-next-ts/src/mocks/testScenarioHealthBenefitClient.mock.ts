/**
 * MSW seed for the `/test-scenario-3` onboarding demo — "Health & Benefit Solutions, LLC".
 * Minimum data required to create a client + authorized user.
 * Seeded when `testScenarioBundle` is `test-scenario-3`.
 */
export const TEST_SCENARIO_BUNDLE_HEALTH_BENEFIT_CLIENT_ID = '3100007001';

export const testScenarioHealthBenefitClient = {
  id: TEST_SCENARIO_BUNDLE_HEALTH_BENEFIT_CLIENT_ID,
  attestations: [],
  createdAt: '2026-05-20T09:15:00.000Z',
  parties: [
    {
      id: '2100535200',
      createdAt: '2026-05-20T09:15:00.1Z',
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
        dbaName: 'Health & Benefit Solutions',
        organizationName: 'Health & Benefit Solutions, LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
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
      id: '2100535201',
      createdAt: '2026-05-20T09:15:00.2Z',
      email: 'ross.gellar@healthbenefits.com',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535200',
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
        firstName: 'Ross',
        middleName: 'Thomas',
        lastName: 'Gellar',
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
  partyId: '2100535200',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['c93f9d42-1b46-5e02-a03b-ae2d7bb30d12'],
    documentRequestIds: [],
    questionIds: ['30195'],
    partyIds: ['2100535200', '2100535201'],
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
