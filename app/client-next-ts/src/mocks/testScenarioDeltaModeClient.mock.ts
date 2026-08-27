/**
 * MSW seed for `/test-scenario-6` — restaurant-chain sole owner-operator
 * using the same Delta-mode factory as Storybook
 * `createDeltaModeSoleOwnerOperatorClient` (outstanding sanctions questions,
 * combined controller/owner, contact + counted identity fields stripped).
 *
 * Unique ids so they never collide with SellSense `0030000132` / `0030000135`.
 */
import { cloneDeep } from 'lodash';

export const TEST_SCENARIO_BUNDLE_DELTA_MODE_CLIENT_ID = '3100007006';

const ORG_PARTY_ID = '2100535500';
const CONTROLLER_PARTY_ID = '2100535501';
const OWNER_PARTY_ID = '2100535502';

/**
 * Restaurant-chain client in the same shape as Storybook `mockClientNew`
 * (`efClientCorpEBMock`), with food-service identity instead of Neverland Books.
 */
const restaurantPresetClient = {
  id: TEST_SCENARIO_BUNDLE_DELTA_MODE_CLIENT_ID,
  attestations: [
    {
      attesterFullName: 'Jordan Hale',
      attestationTime: '2023-10-19T12:28:11.232Z',
      documentId: '62d29548-f55a-458e-b9bb-ed32a6a05a1b',
      ipAddress: '1.1.1.1',
    },
  ],
  parties: [
    {
      id: ORG_PARTY_ID,
      partyType: 'ORGANIZATION',
      externalId: 'TCU1234',
      email: 'info@brightforkkitchen.com',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Bright Fork Kitchen, LLC',
        dbaName: 'Bright Fork',
        organizationDescription:
          'Casual dining restaurant chain serving American fare across multiple locations.',
        industryCategory: 'Accommodation and Food Services',
        industryType: 'Full-Service Restaurants',
        industry: {
          code: '722511',
          codeType: 'NAICS',
        },
        jurisdiction: 'US',
        countryOfFormation: 'US',
        yearOfFormation: '2014',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['480 W Randolph St'],
            city: 'Chicago',
            state: 'IL',
            postalCode: '60661',
            country: 'US',
          },
        ],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '3125550148',
        },
        organizationIds: [
          {
            idType: 'EIN',
            issuer: 'US',
            value: '300030003',
          },
        ],
        websiteAvailable: true,
        website: 'https://www.brightforkkitchen.com',
      },
    },
    {
      id: CONTROLLER_PARTY_ID,
      partyType: 'INDIVIDUAL',
      parentPartyId: ORG_PARTY_ID,
      parentExternalId: 'TCU1234',
      externalId: 'TCU12344',
      email: 'jordan@brightforkkitchen.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Jordan',
        lastName: 'Hale',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        soleOwner: false,
        birthDate: '1982-04-16',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['221 N Green St'],
            city: 'Chicago',
            state: 'IL',
            postalCode: '60607',
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
          phoneNumber: '3125550194',
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
      id: OWNER_PARTY_ID,
      partyType: 'INDIVIDUAL',
      parentPartyId: ORG_PARTY_ID,
      parentExternalId: 'TCU1234',
      externalId: 'TCU12345',
      email: 'casey@brightforkkitchen.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Casey',
        lastName: 'Nguyen',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'Director of Operations',
        soleOwner: false,
        birthDate: '1986-09-03',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['900 S Michigan Ave'],
            city: 'Chicago',
            state: 'IL',
            postalCode: '60605',
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
          phoneNumber: '3125550172',
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
  partyId: ORG_PARTY_ID,
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    documentRequestIds: ['68803'],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [] as { questionId: string; values: string[] }[],
  status: 'NEW',
};

type RestaurantPresetClient = typeof restaurantPresetClient;

/**
 * Same transforms as Storybook sole owner-operator: drop the extra owner,
 * combine Jordan as sole controller/owner/authorized user, strip contact +
 * counted identity fields, outstanding sanctions questions only (`30158` →
 * `30162`).
 */
function createDeltaModeSoleOwnerOperatorClient(
  client: RestaurantPresetClient
): RestaurantPresetClient {
  const next = cloneDeep(client);
  next.outstanding = {
    ...next.outstanding,
    questionIds: ['30158', '30162'],
    partyIds: [],
    partyRoles: [],
  };
  next.questionResponses = [];
  next.parties = next.parties
    .filter(
      (party) =>
        !(
          party.partyType === 'INDIVIDUAL' &&
          party.roles?.includes('BENEFICIAL_OWNER') &&
          !party.roles?.includes('CONTROLLER')
        )
    )
    .map((party) => {
      if (party.partyType === 'ORGANIZATION' && party.organizationDetails) {
        return {
          ...party,
          organizationDetails: {
            ...party.organizationDetails,
            addresses: [],
            phone: undefined,
          },
        };
      }
      if (
        party.partyType === 'INDIVIDUAL' &&
        party.roles?.includes('CONTROLLER') &&
        party.individualDetails
      ) {
        return {
          ...party,
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER', 'AUTHORIZED_USER'],
          individualDetails: {
            ...party.individualDetails,
            soleOwner: true,
            birthDate: undefined,
            individualIds: [],
            addresses: [],
            phone: undefined,
          },
        };
      }
      return party;
    }) as RestaurantPresetClient['parties'];
  return next;
}

export const testScenarioDeltaModeClient =
  createDeltaModeSoleOwnerOperatorClient(restaurantPresetClient);
