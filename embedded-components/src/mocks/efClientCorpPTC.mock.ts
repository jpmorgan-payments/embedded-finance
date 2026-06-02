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
      externalId: 'PTC_NONPRIMARY_001',
      email: 'info@neverlandbooks.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Neverland Books Inc.',
        dbaName: 'Neverland Books',
        organizationDescription: 'Step into a world of stories and imagination',
        industryCategory:
          'Sporting Goods, Hobby, Musical Instrument, and Book Stores',
        industryType: 'Book Retailers and News Dealers',
        industry: {
          code: '451211',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '1989',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['2029 Century Park E'],
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90067',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '7606810558',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '981234567',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.neverlandbooks.com',
        isSubsidiary: false,
        publiclyTraded: {
          tickerSymbol: 'NVLD',
          stockExchange: 'XCBO',
        },
      },
    },
    {
      id: '2000000171',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000170',
      parentExternalId: 'PTC_NONPRIMARY_001',
      externalId: 'PTC_NONPRIMARY_CTRL_001',
      email: 'peiter.pan@neverlandbooks.com',
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Peiter',
        lastName: 'Pan',
        countryOfResidence: 'US',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1970-05-15',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['100 Neverland Way'],
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '111223333',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '7605551234',
        },
      },
    },
    {
      id: '2000000172',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000170',
      parentExternalId: 'PTC_NONPRIMARY_001',
      externalId: 'PTC_NONPRIMARY_BO_001',
      email: 'tink.bell@neverlandbooks.com',
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Tink',
        lastName: 'Bell',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'VP Operations',
        soleOwner: false,
        birthDate: '1975-03-22',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['200 Pixie Dust Blvd'],
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90002',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '444556666',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '7605554321',
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
      externalId: 'PTC_NONPRIMARY_SUB_001',
      email: 'info@neverlandcomics.com',
      organizationDetails: {
        ...efClientCorpPTC_NonUS_Mock.parties![0].organizationDetails!,
        organizationName: 'Neverland Comics LLC',
        dbaName: 'Neverland Comics',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationDescription: 'Comics subsidiary of Neverland Books Inc.',
        isSubsidiary: true,
        publiclyTraded: {
          tickerSymbol: 'NVLD',
          stockExchange: 'Other',
          stockExchangeName: 'OTC Markets',
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
