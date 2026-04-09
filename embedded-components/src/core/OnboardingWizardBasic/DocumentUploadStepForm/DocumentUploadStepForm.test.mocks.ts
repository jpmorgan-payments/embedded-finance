/**
 * Fixtures used only by {@link DocumentUploadStepForm.test.tsx}.
 *
 * Storybook, MSW seed helpers, and other tests should keep using
 * `@/mocks/ef*.mock.ts` so document-request party IDs and client shape can
 * evolve for demos without coupling to this unit test suite.
 */

import { ClientResponse } from '@/api/generated/smbdo.schemas';

/** Same shape as {@link efClientCorpEBMock} at the time this test was isolated. */
export const documentUploadStepFormTestClient: ClientResponse = {
  id: '0030000133',
  attestations: [
    {
      attesterFullName: 'Peiter Pan',
      attestationTime: '2023-10-19T12:28:11.232Z',
      documentId: '62d29548-f55a-458e-b9bb-ed32a6a05a1b',
      ipAddress: '1.1.1.1',
    },
  ],
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'info@Neverlandbooks.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Neverland Books',
        dbaName: 'FT Books',
        organizationDescription: 'Step into a world of stories and imagination',
        industryCategory:
          'Sporting Goods, Hobby, Musical Instrument, and Book Stores',
        industryType: 'Pet and Pet Supplies Retailers',
        industry: {
          code: '459910',
          codeType: 'NAICS',
        },
        jurisdiction: 'US',
        countryOfFormation: 'US',
        yearOfFormation: '1989',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['2030 Century Park E'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '90068',
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
            value: '300030003',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.Neverlandbooks.com',
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'Peiter@neverlandbooks.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Peiter',
        lastName: 'Pan',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CFO',
        soleOwner: false,
        birthDate: '1945-01-30',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['2029 Century Park E'],
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90067',
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
          phoneNumber: '7606810558',
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
    {
      id: '2000000113',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'Tinker@neverlandbook.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Tinker',
        lastName: 'Ball',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1969-08-18',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['3223 Hanover St'],
            city: 'Palo Alto',
            state: 'CA',
            postalCode: '94304',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '300050005',
          },
        ],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '6503532444',
        },
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          documentRequestIds: ['68805'],
        },
      ],
    },
  ],
  partyId: '2000000111',
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

/** GET /document-requests/68803 — org party aligns with client parties above. */
export const documentUploadStepFormTestOrganizationDocumentRequest = {
  createdAt: '2025-01-10T14:32:21.456Z',
  id: '68803',
  clientId: '0030000133',
  partyId: '2000000111',
  status: 'ACTIVE',
  description:
    'To verify your identity, please provide requested documents.\n1. Formation Document - Listing the legal name and address of the company. Acceptable documents are Articles of Incorporation [OR] Certificate of Good Standing [OR] Certificate of Incumbency [OR] Memorandum/Articles of Association [OR] Constitutional document [OR] LLC Agreement [OR] Filing receipt from state of organization [OR] Operating Agreement',
  outstanding: {
    documentTypes: [
      'OPERATING_AGREEMENT',
      'INCUMBENCY_CERTIFICATE',
      'ARTICLES_OF_ASSOCIATION',
      'ARTICLES_OF_INCORPORATION',
      'LLC_AGREEMENT',
      'CERTIFICATE_OF_GOOD_STANDING',
      'CONSTITUTIONAL_DOCUMENT',
      'FILING_RECEIPT',
    ],
  },
  requirements: [
    {
      documentTypes: [
        'ARTICLES_OF_INCORPORATION',
        'CERTIFICATE_OF_GOOD_STANDING',
        'INCUMBENCY_CERTIFICATE',
        'ARTICLES_OF_ASSOCIATION',
        'CONSTITUTIONAL_DOCUMENT',
        'LLC_AGREEMENT',
        'FILING_RECEIPT',
        'OPERATING_AGREEMENT',
      ],
      level: 'PRIMARY',
      minRequired: 1,
    },
  ],
  validForDays: 120,
};

/** GET /document-requests/68804 and 68805 — individual party 2000000112 (controller). */
export const documentUploadStepFormTestIndividualDocumentRequest = {
  id: '68430',
  createdAt: '2022-11-18T12:28:11.232Z',
  description:
    'To verify your identity, please provide any one of the below unexpired document which has Full Legal name, Address and Date of Birth.\n1. Drivers license\n2. Passport\n3. Government issued identity card\nIf address on your identification document is not current, please additionally provide a Utility Bill or Bank Statement dated within last 6 months.',
  partyId: '2000000112',
  status: 'ACTIVE',
  requirements: [
    {
      documentTypes: ['PASSPORT', 'DRIVERS_LICENSE', 'GOV_ISSUED_ID_CARD'],
      minRequired: 1,
    },
    {
      documentTypes: ['BANK_STATEMENT', 'UTILITY_BILL'],
      minRequired: 0,
    },
  ],
  outstanding: {
    documentTypes: [
      'PASSPORT',
      'DRIVERS_LICENSE',
      'GOV_ISSUED_ID_CARD',
      'BANK_STATEMENT',
      'UTILITY_BILL',
    ],
  },
  validForDays: 120,
};
