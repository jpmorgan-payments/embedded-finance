/**
 * MSW seed for the `/test-scenario-4` onboarding demo — "Faster Fulfilment Corp." (PTC flow).
 * Publicly traded on Nasdaq (XNAS), ticker FULFL.
 * Minimum data required to create a client + authorized user.
 * Seeded when `testScenarioBundle` is `test-scenario-4`.
 */
export const TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID = '3100007004';

export const testScenarioFasterFulfilmentClient = {
  id: TEST_SCENARIO_BUNDLE_FASTER_FULFILMENT_CLIENT_ID,
  attestations: [],
  createdAt: '2026-05-28T10:30:00.000Z',
  parties: [
    {
      id: '2100535300',
      createdAt: '2026-05-28T10:30:00.1Z',
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
        dbaName: 'Faster Fulfilments',
        organizationName: 'Faster Fulfilment Corp.',
        organizationType: 'C_CORPORATION',
        publiclyTraded: {
          stockExchange: 'XNAS',
          tickerSymbol: 'FULFL',
        },
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
      id: '2100535301',
      createdAt: '2026-05-28T10:30:00.2Z',
      email: 'chandler.bing@fasterfulfilments.com',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535300',
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
        firstName: 'Chandler',
        middleName: 'Matthew',
        lastName: 'Bing',
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
  partyId: '2100535300',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['d04a0e53-2c57-6f13-b14c-bf3e8cc41e23'],
    documentRequestIds: [],
    questionIds: ['30195'],
    partyIds: ['2100535300', '2100535301'],
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
