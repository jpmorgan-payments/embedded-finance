// =============================================================================
// Test personas published in the Embedded Payments core concepts guide
// =============================================================================

import type { ClientRequest, RecipientRequest, PersonaId, PersonaSummary } from '../types';

export const personaSummaries: PersonaSummary[] = [
  {
    id: 'FAIRY_TALE',
    name: 'Fairy Tale Book Shop',
    subtitle: 'LLC · marketplace seller',
    difficulty: 'STANDARD',
    blurb:
      'A bookstore joining an online marketplace. It has an EIN and different people listed as controller and owner.',
    quirks: [
      'Tax ID is an EIN',
      'Controller and beneficial owner are different people',
      'Bank account ownership check completes immediately',
    ],
  },
  {
    id: 'MONICA_GELLAR',
    name: 'Monica Gellar',
    subtitle: 'Sole proprietor · rental host',
    difficulty: 'HARD',
    blurb:
      'A teacher renting out her apartment on weekends. She uses her own name and SSN, and confirms her bank account with two small deposits.',
    quirks: [
      'Tax ID is an SSN, not an EIN',
      'One person holds every role',
      'Bank account requires two small deposits ($0.07 and $0.08)',
    ],
  },
];

export function getPersonaSummary(id: PersonaId): PersonaSummary {
  return personaSummaries.find((p) => p.id === id) ?? personaSummaries[0];
}

// Fairy Tale Book Shop — LLC persona
export const fairyTaleBookShopClient: ClientRequest = {
  parties: [
    {
      partyType: 'ORGANIZATION',
      externalId: 'FTB1989',
      email: 'hello@fairytalebooks500.com',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Fairy Tale Book Shop',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        dbaName: 'FT Books',
        organizationDescription: 'Step into a world of stories and imagination',
        industryCategory: 'Sporting Goods, Hobby, Musical Instrument, and Book Stores',
        industryType: 'Book Retailers and News Dealers',
        yearOfFormation: '1989',
        significantOwnership: true,
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
            value: '300030003',
            issuer: 'US',
          },
        ],
        websiteAvailable: true,
        website: 'https://example.com',
      },
    },
    {
      partyType: 'INDIVIDUAL',
      externalId: 'FTB-CTRL',
      email: 'Peiter@fairytalebooks500.com',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Peiter',
        lastName: 'Pan',
        birthDate: '1945-01-30',
        countryOfResidence: 'US',
        jobTitle: 'CFO',
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
            value: '300040004',
            issuer: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '7606810558',
        },
      },
    },
    {
      partyType: 'INDIVIDUAL',
      externalId: 'FTB-BO',
      email: 'Tinker@fairytalebooks500.com',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Tinker',
        lastName: 'Ball',
        birthDate: '1969-08-18',
        countryOfResidence: 'US',
        jobTitle: 'CEO',
        natureOfOwnership: 'Direct',
        soleOwner: true,
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
            value: '300050005',
            issuer: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '6503532444',
        },
      },
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
};

export const fairyTaleExternalAccount: RecipientRequest = {
  type: 'LINKED_ACCOUNT',
  clientId: '', // filled at runtime
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Fairy Tale Book Shop',
  },
  account: {
    type: 'CHECKING',
    number: '93993289375',
    countryCode: 'US',
    routingInformation: [
      { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'ACH' },
      { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'WIRE' },
    ],
  },
};

// Monica Gellar — Sole Proprietor persona
export const monicaGellarClient: ClientRequest = {
  parties: [
    {
      partyType: 'ORGANIZATION',
      externalId: 'CPG2023',
      email: 'monica@cpgetaways.com',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Monica Gellar',
        organizationType: 'SOLE_PROPRIETORSHIP',
        countryOfFormation: 'US',
        dbaName: 'CP Getaways',
        organizationDescription:
          'Relax, unwind and experience the comforting charm of our apartment',
        industryCategory: 'Accommodation and Food Services',
        industryType: 'All Other Traveler Accommodation',
        yearOfFormation: '2023',
        significantOwnership: true,
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
            idType: 'SSN',
            value: '000000001',
            issuer: 'US',
          },
        ],
      },
    },
    {
      partyType: 'INDIVIDUAL',
      externalId: 'CPG-OWNER',
      email: 'monicagellar@gmail.com',
      // A sole proprietor holds every role herself.
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Monica',
        lastName: 'Gellar',
        birthDate: '1990-10-09',
        countryOfResidence: 'US',
        jobTitle: 'Other',
        jobTitleDescription: 'Owner',
        natureOfOwnership: 'Direct',
        soleOwner: true,
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
            value: '000000001',
            issuer: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2126215110',
        },
      },
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
};

export const monicaGellarExternalAccount: RecipientRequest = {
  type: 'LINKED_ACCOUNT',
  clientId: '', // filled at runtime
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Monica',
    lastName: 'Gellar',
  },
  account: {
    type: 'CHECKING',
    number: '111285162118',
    countryCode: 'US',
    routingInformation: [
      { routingCodeType: 'USABA', routingNumber: '722166625', transactionType: 'ACH' },
    ],
  },
};

/** Published micro-deposit amounts for the sole proprietor's linked account. */
export const monicaGellarMicrodeposits = [0.07, 0.08];

export function getPersonaClient(id: PersonaId): ClientRequest {
  return id === 'MONICA_GELLAR' ? monicaGellarClient : fairyTaleBookShopClient;
}

export function getPersonaExternalAccount(id: PersonaId): RecipientRequest {
  return id === 'MONICA_GELLAR' ? monicaGellarExternalAccount : fairyTaleExternalAccount;
}
