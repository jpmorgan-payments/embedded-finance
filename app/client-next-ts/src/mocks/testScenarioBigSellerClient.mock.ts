/**
 * MSW seeds for the `/test-scenario-7` onboarding demo — "Big Seller Corp" (online general
 * merchandise seller). Business details are pre-populated like `/test-scenario`; the non-US
 * login is pre-populated as a China-formed business wherever the flow allows.
 * Seeded when `testScenarioBundle` is `test-scenario-7`.
 */
import {
  createDeltaModeSoleOwnerOperatorClient,
  type DeltaModePresetClient,
} from './testScenarioDeltaModeClient.mock';

export const TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID = '3100007007';

const ORG_PARTY_ID = '2100535700';
const CONTROLLER_PARTY_ID = '2100535701';

const CHINA_REGISTRATION_ID = {
  idType: 'BUSINESS_REGISTRATION_ID',
  value: '91310000MA1FL1234X',
  issuer: 'CN',
};

const SHANGHAI_BUSINESS_ADDRESS = {
  addressType: 'BUSINESS_ADDRESS',
  addressLines: ['1000 Lujiazui Ring Road', 'Floor 25'],
  city: 'Shanghai',
  state: 'SH',
  postalCode: '200120',
  country: 'CN',
};

const SHANGHAI_RESIDENTIAL_ADDRESS = {
  addressType: 'RESIDENTIAL_ADDRESS',
  addressLines: ['88 Century Avenue', 'Apartment 1203'],
  city: 'Shanghai',
  state: 'SH',
  postalCode: '200120',
  country: 'CN',
};

const CHINA_CONTROLLER_DETAILS = {
  firstName: 'Wei',
  lastName: 'Zhang',
  countryOfResidence: 'CN',
  jobTitle: 'CEO',
  birthDate: '1984-03-18',
};

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
    organizationIds: [CHINA_REGISTRATION_ID],
    addresses: [SHANGHAI_BUSINESS_ADDRESS],
  },
  outstandingOrgFields: [],
  controllerEmail: 'wei.zhang@bigseller.test',
  controllerDetails: {
    ...CHINA_CONTROLLER_DETAILS,
    individualIds: [
      {
        idType: 'PASSPORT',
        issuer: 'CN',
        value: 'E12345678',
        expiryDate: '2031-05-20',
      },
    ],
    addresses: [SHANGHAI_RESIDENTIAL_ADDRESS],
  },
  outstandingControllerFields: [],
});

/** Fully populated Big Seller client in the Storybook delta preset shape. */
const bigSellerDeltaPreset: DeltaModePresetClient = {
  id: TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID,
  attestations: [
    {
      attesterFullName: 'Rachel Green',
      attestationTime: '2026-09-02T15:04:11.232Z',
      documentId: '62d29548-f55a-458e-b9bb-ed32a6a05a1b',
      ipAddress: '1.1.1.1',
    },
  ],
  parties: [
    {
      id: ORG_PARTY_ID,
      partyType: 'ORGANIZATION',
      externalId: 'BSC1000',
      email: 'info@bigseller.test',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2026-09-02T15:00:00.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Big Seller Corp',
        dbaName: 'Big Seller',
        organizationDescription:
          'Online marketplace seller of general merchandise and home goods.',
        industryCategory: 'Retail Trade',
        industryType: 'All Other General Merchandise Retailers',
        industry: {
          code: '455219',
          codeType: 'NAICS',
        },
        jurisdiction: 'US',
        countryOfFormation: 'US',
        yearOfFormation: '2015',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['350 Market St'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '4155550136',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '274815903',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.bigseller.test',
      },
    },
    {
      id: CONTROLLER_PARTY_ID,
      partyType: 'INDIVIDUAL',
      parentPartyId: ORG_PARTY_ID,
      parentExternalId: 'BSC1000',
      externalId: 'BSC1001',
      email: 'rachel.green@bigseller.test',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2026-09-02T15:00:00.005Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Rachel',
        lastName: 'Green',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1985-05-05',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['1200 Valencia St'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94110',
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
          phoneNumber: '4155550194',
        },
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: ['68804'],
        },
      ],
    },
  ],
  partyId: ORG_PARTY_ID,
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: ['68803'],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [],
  status: 'NEW',
};

/**
 * `delta-sole-owner`: same delta shape as `/test-scenario-6` — Rachel Green as sole
 * controller/owner; SSN, birth date, contact details and sanctions questions outstanding.
 */
export const testScenarioBigSellerDeltaClient =
  createDeltaModeSoleOwnerOperatorClient(bigSellerDeltaPreset);

/**
 * `delta-non-us`: the same delta shape for the China-formed business, with everything
 * pre-populated except the controller's passport and the sanctions questions.
 */
export const testScenarioBigSellerChinaDeltaClient = {
  ...testScenarioBigSellerDeltaClient,
  attestations: testScenarioBigSellerDeltaClient.attestations.map(
    (attestation) => ({ ...attestation, attesterFullName: 'Wei Zhang' })
  ),
  outstanding: {
    ...testScenarioBigSellerDeltaClient.outstanding,
    documentRequestIds: [],
  },
  parties: testScenarioBigSellerDeltaClient.parties.map((party) =>
    party.partyType === 'ORGANIZATION'
      ? {
          ...party,
          email: 'treasury@bigseller.test',
          organizationDetails: {
            ...party.organizationDetails,
            countryOfFormation: 'CN',
            organizationIds: [CHINA_REGISTRATION_ID],
            addresses: [SHANGHAI_BUSINESS_ADDRESS],
          },
        }
      : {
          ...party,
          email: 'wei.zhang@bigseller.test',
          validationResponse: [],
          individualDetails: {
            ...party.individualDetails,
            ...CHINA_CONTROLLER_DETAILS,
            addresses: [SHANGHAI_RESIDENTIAL_ADDRESS],
          },
        }
  ),
};
