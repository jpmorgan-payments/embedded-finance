import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * US Publicly Traded Company — traded on NYSE (XNYS).
 *
 * Expected behaviour:
 * - Beneficial owners section: SKIPPED
 * - Controller gov ID: HIDDEN (collect name, address, job title only)
 * - FinCEN attestation: SKIPPED
 */
export const efClientCorpPTC_US_Mock: ClientResponse = {
  id: '0030000150',
  attestations: [],
  parties: [
    {
      id: '2000000150',
      partyType: 'ORGANIZATION',
      externalId: 'PTC_US_001',
      email: 'info@acmecorp.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Acme Corporation',
        dbaName: 'Acme Corp',
        organizationDescription:
          'Leading industrial equipment manufacturer and distributor',
        industryCategory: 'Manufacturing',
        industryType: 'Industrial Machinery Manufacturing',
        industry: {
          code: '333249',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '1962',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['1 Wall Street'],
            city: 'New York',
            state: 'NY',
            postalCode: '10005',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2125551000',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '131234567',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.acmecorp.com',
        isSubsidiary: false,
        publiclyTraded: {
          tickerSymbol: 'ACME',
          stockExchange: 'XNYS',
        },
      },
    },
    {
      id: '2000000151',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000150',
      parentExternalId: 'PTC_US_001',
      externalId: 'PTC_US_CTRL_001',
      email: 'jane.smith@acmecorp.com',
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
        countryOfResidence: 'US',
        jobTitle: 'CFO',
        soleOwner: false,
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['200 Park Avenue'],
            city: 'New York',
            state: 'NY',
            postalCode: '10166',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '2125551001',
        },
        // NOTE: No individualIds (gov ID) — US PTC controllers don't need it
      },
    },
  ],
  partyId: '2000000150',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [],
  status: 'NEW',
};

/**
 * US Subsidiary of a PTC — parent company traded on NASDAQ (XNAS).
 *
 * Expected behaviour: same as US PTC (beneficial owners skipped, no gov ID on controller).
 * The ticker/exchange refer to the parent PTC, not the subsidiary.
 */
export const efClientCorpPTC_US_Subsidiary_Mock: ClientResponse = {
  ...efClientCorpPTC_US_Mock,
  id: '0030000151',
  parties: [
    {
      ...efClientCorpPTC_US_Mock.parties![0],
      id: '2000000160',
      externalId: 'PTC_US_SUB_001',
      email: 'info@acmewidgets.com',
      organizationDetails: {
        ...efClientCorpPTC_US_Mock.parties![0].organizationDetails!,
        organizationName: 'Acme Widgets LLC',
        dbaName: 'Acme Widgets',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationDescription:
          'Subsidiary of Acme Corp specializing in widget distribution',
        isSubsidiary: true,
        publiclyTraded: {
          tickerSymbol: 'ACME',
          stockExchange: 'XNAS',
        },
      },
    },
    {
      ...efClientCorpPTC_US_Mock.parties![1],
      id: '2000000161',
      parentPartyId: '2000000160',
      parentExternalId: 'PTC_US_SUB_001',
    },
  ],
  partyId: '2000000160',
};

/**
 * Non-US PTC — traded on London Stock Exchange (XLON).
 *
 * Expected behaviour:
 * - Beneficial owners section: COLLECT (≥25% ownership)
 * - Controller gov ID: REQUIRED
 * - FinCEN attestation: REQUIRED
 */
export const efClientCorpPTC_NonUS_Mock: ClientResponse = {
  id: '0030000152',
  attestations: [],
  parties: [
    {
      id: '2000000170',
      partyType: 'ORGANIZATION',
      externalId: 'PTC_NONUS_001',
      email: 'info@globexcorp.co.uk',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Globex Corporation',
        dbaName: 'Globex',
        organizationDescription: 'Global commodities trading and logistics',
        industryCategory: 'Wholesale Trade',
        industryType: 'Other Professional, Scientific, and Technical Services',
        industry: {
          code: '425120',
          codeType: 'NAICS',
        },
        countryOfFormation: 'GB',
        yearOfFormation: '1985',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['10 Paternoster Square'],
            city: 'London',
            postalCode: 'EC4M 7LS',
            country: 'GB',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+44',
          phoneNumber: '2071234567',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '981234567',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.globexcorp.co.uk',
        isSubsidiary: false,
        publiclyTraded: {
          tickerSymbol: 'GLBX',
          stockExchange: 'XLON',
        },
      },
    },
    {
      id: '2000000171',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000170',
      parentExternalId: 'PTC_NONUS_001',
      externalId: 'PTC_NONUS_CTRL_001',
      email: 'hank.scorpio@globexcorp.co.uk',
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Hank',
        lastName: 'Scorpio',
        countryOfResidence: 'GB',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1970-05-15',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['42 Mayfair Lane'],
            city: 'London',
            postalCode: 'W1K 3AB',
            country: 'GB',
          },
        ],
        individualIds: [
          {
            idType: 'PASSPORT',
            issuer: 'GB',
            value: '533400199',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+44',
          phoneNumber: '7911123456',
        },
      },
    },
    {
      id: '2000000172',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000170',
      parentExternalId: 'PTC_NONUS_001',
      externalId: 'PTC_NONUS_BO_001',
      email: 'frank.grimes@globexcorp.co.uk',
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Frank',
        lastName: 'Grimes',
        countryOfResidence: 'GB',
        natureOfOwnership: 'Direct',
        jobTitle: 'VP Operations',
        soleOwner: false,
        birthDate: '1975-03-22',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['88 Kensington High Street'],
            city: 'London',
            postalCode: 'W8 4PT',
            country: 'GB',
          },
        ],
        individualIds: [
          {
            idType: 'PASSPORT',
            issuer: 'GB',
            value: '533400200',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+44',
          phoneNumber: '7911654321',
        },
      },
    },
  ],
  partyId: '2000000170',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [],
  status: 'NEW',
};

/**
 * Non-US Subsidiary of PTC — parent traded on "Other" exchange.
 *
 * Expected behaviour: same as non-US PTC (collect everything including gov ID).
 * Uses stockExchange: "Other" with stockExchangeName for coverage.
 */
export const efClientCorpPTC_NonUS_Subsidiary_Mock: ClientResponse = {
  ...efClientCorpPTC_NonUS_Mock,
  id: '0030000153',
  parties: [
    {
      ...efClientCorpPTC_NonUS_Mock.parties![0],
      id: '2000000180',
      externalId: 'PTC_NONUS_SUB_001',
      email: 'info@globexasia.com',
      organizationDetails: {
        ...efClientCorpPTC_NonUS_Mock.parties![0].organizationDetails!,
        organizationName: 'Globex Asia Holdings',
        dbaName: 'Globex Asia',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationDescription: 'Asian subsidiary of Globex Corporation',
        isSubsidiary: true,
        publiclyTraded: {
          tickerSymbol: 'GLBX',
          stockExchange: 'Other',
          stockExchangeName: 'Tokyo Stock Exchange',
        },
      },
    },
    {
      ...efClientCorpPTC_NonUS_Mock.parties![1],
      id: '2000000181',
      parentPartyId: '2000000180',
      parentExternalId: 'PTC_NONUS_SUB_001',
    },
    {
      ...efClientCorpPTC_NonUS_Mock.parties![2],
      id: '2000000182',
      parentPartyId: '2000000180',
      parentExternalId: 'PTC_NONUS_SUB_001',
    },
  ],
  partyId: '2000000180',
};
