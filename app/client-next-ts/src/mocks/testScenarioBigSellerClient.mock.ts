/**
 * MSW seeds for the `/test-scenario-7` onboarding demo — "Big Seller Corp" (online general
 * merchandise seller). Business details are pre-populated like `/test-scenario`; the non-US
 * login is pre-populated as a China-formed business wherever the flow allows.
 * Seeded when `testScenarioBundle` is `test-scenario-7`.
 */
export const TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID = '3100007007';

const ORG_PARTY_ID = '2100535700';
const CONTROLLER_PARTY_ID = '2100535701';

type BigSellerSeedOptions = {
  organizationDetails?: Record<string, unknown>;
  organizationEmail?: string;
  outstandingOrgFields: string[];
  controllerEmail?: string;
  controllerDetails?: Record<string, unknown>;
  outstandingControllerFields?: string[];
};

function needsInfo(fields: string[]) {
  return fields.length
    ? [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: fields.map((name) => ({ name })),
        },
      ]
    : [];
}

function buildBigSellerClient({
  organizationDetails = {},
  organizationEmail,
  outstandingOrgFields,
  controllerEmail = 'rachel.green@bigseller.test',
  controllerDetails = {
    firstName: 'Rachel',
    middleName: 'Karen',
    lastName: 'Green',
  },
  outstandingControllerFields = [
    'individualIds',
    'addresses',
    'birthDate',
    'countryOfResidence',
    'jobTitle',
    'jobTitleDescription',
  ],
}: BigSellerSeedOptions) {
  return {
    id: TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID,
    attestations: [],
    createdAt: '2026-10-16T09:00:00.000Z',
    parties: [
      {
        id: ORG_PARTY_ID,
        createdAt: '2026-10-16T09:00:00.1Z',
        ...(organizationEmail ? { email: organizationEmail } : {}),
        partyType: 'ORGANIZATION',
        profileStatus: 'NEW',
        roles: ['CLIENT'],
        active: true,
        validationResponse: needsInfo(outstandingOrgFields),
        organizationDetails: {
          countryOfFormation: 'US',
          dbaName: 'Big Seller',
          industryCategory: 'Retail Trade',
          industryType: 'All Other General Merchandise Retailers',
          industry: {
            codeType: 'NAICS',
            code: '455219',
          },
          organizationName: 'Big Seller Corp',
          organizationDescription:
            'Online marketplace seller of general merchandise and home goods.',
          organizationType: 'C_CORPORATION',
          organizationIds: [
            {
              idType: 'EIN',
              value: '274815903',
              issuer: 'US',
            },
          ],
          websiteAvailable: false,
          yearOfFormation: '2015',
          ...organizationDetails,
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
        id: CONTROLLER_PARTY_ID,
        createdAt: '2026-10-16T09:00:00.2Z',
        email: controllerEmail,
        partyType: 'INDIVIDUAL',
        parentPartyId: ORG_PARTY_ID,
        profileStatus: 'NEW',
        roles: ['CONTROLLER', 'AUTHORIZED_USER'],
        active: true,
        validationResponse: needsInfo(outstandingControllerFields),
        individualDetails: controllerDetails,
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
    partyId: ORG_PARTY_ID,
    products: ['EMBEDDED_PAYMENTS'],
    outstanding: {
      attestationDocumentIds: ['5b8e2f4a-7c1d-4e9b-a3f6-2d0c9e8b7a61'],
      documentRequestIds: [],
      questionIds: ['30195'],
      partyIds: [ORG_PARTY_ID, CONTROLLER_PARTY_ID],
      partyRoles: [],
    },
    questionResponses: [
      {
        questionId: '30194',
        values: ['750'],
      },
    ],
    status: 'NEW',
    results: {
      customerIdentityStatus: 'NOT_STARTED',
    },
  };
}

/** `happy-path-ptc`: C-corp listed on Nasdaq (XNAS), ticker BGSL. */
export const testScenarioBigSellerClient = buildBigSellerClient({
  organizationDetails: {
    publiclyTraded: {
      stockExchange: 'XNAS',
      tickerSymbol: 'BGSL',
    },
  },
  outstandingOrgFields: ['addresses'],
});

/** `happy-path` and the other operator logins: same business, not publicly traded. */
export const testScenarioBigSellerClientNoPtc = buildBigSellerClient({
  outstandingOrgFields: ['addresses'],
});

/**
 * `happy-path-non-us`: formed in China with a business registration ID instead of an EIN.
 * Business and controller details are complete; owners, operational questions and
 * review remain for the user.
 */
export const testScenarioBigSellerClientNonUs = buildBigSellerClient({
  organizationEmail: 'treasury@bigseller.test',
  organizationDetails: {
    countryOfFormation: 'CN',
    organizationIds: [
      {
        idType: 'BUSINESS_REGISTRATION_ID',
        value: '91310000MA1FL1234X',
        issuer: 'CN',
      },
    ],
    addresses: [
      {
        addressType: 'BUSINESS_ADDRESS',
        addressLines: ['1000 Lujiazui Ring Road', 'Floor 25'],
        city: 'Shanghai',
        state: 'SH',
        postalCode: '200120',
        country: 'CN',
      },
    ],
  },
  outstandingOrgFields: [],
  controllerEmail: 'wei.zhang@bigseller.test',
  controllerDetails: {
    firstName: 'Wei',
    lastName: 'Zhang',
    countryOfResidence: 'CN',
    jobTitle: 'CEO',
    birthDate: '1984-03-18',
    individualIds: [
      {
        idType: 'PASSPORT',
        issuer: 'CN',
        value: 'E12345678',
        expiryDate: '2031-05-20',
      },
    ],
    addresses: [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['88 Century Avenue', 'Apartment 1203'],
        city: 'Shanghai',
        state: 'SH',
        postalCode: '200120',
        country: 'CN',
      },
    ],
  },
  outstandingControllerFields: [],
});
