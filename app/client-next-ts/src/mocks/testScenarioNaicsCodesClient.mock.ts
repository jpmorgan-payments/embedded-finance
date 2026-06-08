/**
 * MSW seed for `/test-scenario-5` — CommerceBridge Marketplace LLC.
 * NAICS onboarding: three recommended NAICS codes trigger assessment questions.
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
        dbaName: 'CommerceBridge',
        organizationName: 'CommerceBridge Marketplace LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationDescription:
          'Multi-channel online retailer selling consumer goods through owned and marketplace storefronts.',
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
      email: '',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2100535400',
      profileStatus: 'NEW',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
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
        countryOfResidence: 'US',
        firstName: 'Jordan',
        lastName: 'Reeves',
        jobTitle: 'Owner',
        jobTitleDescription: 'Founder & CEO',
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
