export const LLCExistingClient = {
  id: '0030000131',
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
        industry: {
          code: '459910',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '1989',
        entitiesInOwnership: false,
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
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [
    {
      questionId: '30005',
      values: ['$10,000'],
    },
  ],
  results: {
    customerIdentityStatus: 'APPROVED',
  },
  status: 'NEW',
};

export const SoleProprietorExistingClient = {
  attestations: [],
  createdAt: '2024-12-23T14:45:41.136Z',
  id: '0030000132',
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'monica@cpgetaways.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2023-10-31T00:20:09.401Z',
      organizationDetails: {
        organizationType: 'SOLE_PROPRIETORSHIP',
        organizationName: 'Monica Gellar',
        dbaName: '',
        organizationDescription:
          'Relax, unwind and experience the comforting charm of our apartment',
        industry: {
          code: '459910',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '1990',
        // significantOwnership: true,
        entitiesInOwnership: false,
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['90 Bedford Street', 'Apt 2E'],
            city: 'New York',
            state: 'NY',
            postalCode: '10014',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2126215110',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '000000001',
          },
        ],
        websiteAvailable: false,
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'monica@ggmail.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2023-10-31T00:20:09.401Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: true,
        birthDate: '1990-10-09',
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '2126215110',
        },
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['90 Bedford Street', 'Apt 2E'],
            city: 'New York',
            state: 'NY',
            postalCode: '10014',
            country: 'US',
          },
        ],
        individualIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '000000001',
          },
        ],
      },
    },
  ],
  partyId: '2000000111',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [
    {
      questionId: '300005',
      values: ['$10,000'],
    },
  ],
  results: {
    customerIdentityStatus: 'NOT_STARTED',
  },
  status: 'NEW',
};

export const LLCExistingClientOutstandingDocuments = {
  id: '0030000136',
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
        industry: {
          code: '459910',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '1989',
        entitiesInOwnership: false,
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
          documentRequestIds: ['68430'],
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
  questionResponses: [
    {
      questionId: '30005',
      values: ['$10,000'],
    },
  ],
  results: {
    customerIdentityStatus: 'APPROVED',
  },
  status: 'INFORMATION_REQUESTED',
};
