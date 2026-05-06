/**
 * MSW seed shape for `/test-scenario` only — aligns with
 * `embedded-components` Prepopulated story: Operator 80 (`efClientOperator80.mock.ts`).
 * Not part of default `initializeDb` predefined clients.
 */
export const TEST_DEMO_SCENARIO_CLIENT_ID = '3100006997';

/** MSW-stable org document request (`POST …/submit` demos + network tooling). */
export const TEST_DEMO_SCENARIO_DOC_REQUEST_ORG_ID = '61800';

/**
 * Numeric base for individual-party document requests in doc-request demo (`61801`, `61802`, …).
 * Operator 80 shape has one individual → `61801` only is typical.
 */
export const TEST_DEMO_SCENARIO_DOC_REQUEST_INDIVIDUAL_ID_BASE = 61801;

export const testScenarioOperator80Client = {
  id: TEST_DEMO_SCENARIO_CLIENT_ID,
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
            value: '123456123',
            issuer: 'US',
          },
        ],
        websiteAvailable: false,
        yearOfFormation: '1980',
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
        jobTitleDescription: 'Owner/Operator',
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
  partyId: '2100533138',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['a71d7f12-f224-4f80-865f-bc5c04f128bf'],
    documentRequestIds: [],
    questionIds: ['30195'],
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
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
};
