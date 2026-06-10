/**
 * MSW seed for `/test-scenario-5` — Leap Frog Investments, LP.
 * NAICS onboarding: three recommended NAICS codes (fund management) trigger assessment questions.
 */
export const TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID = '3100007005';

export const testScenarioNaicsCodesClient = {
  id: TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID,
  attestations: [],
  createdAt: '2026-06-01T09:00:00.000Z',
  parties: [
    {
      id: '2100535400',
      createdAt: '2026-06-01T09:00:00.1Z',
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
        dbaName: 'Leap Frog Investments',
        organizationName: 'Leap Frog Investments, LP',
        organizationType: 'LIMITED_LIABILITY_PARTNERSHIP',
        organizationDescription:
          'Venture capital fund with the purpose of investing in cutting edge technology',
        industryCategory: '',
        industryType: '',
        yearOfFormation: '',
        organizationIds: [
          {
            idType: '',
            value: '',
            issuer: '',
          },
        ],
        email: 'admin@leapfroginvestments.com',
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
      id: '2100535401',
      createdAt: '2026-06-01T09:00:00.2Z',
      email: 'ross.gellar@leapfroginvestments.com',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535400',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'AUTHORIZED_USER'],
      active: true,
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [
            { name: 'addresses' },
            { name: 'individualIds' },
            { name: 'dateOfBirth' },
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
  partyId: '2100535400',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['b82e8f23-a335-54aa-b9f6-d363037ce90a'],
    documentRequestIds: [],
    questionIds: ['30194'],
    partyIds: ['2100535400', '2100535401'],
    partyRoles: [],
  },
  questionResponses: [],
  status: 'NEW',
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
};
