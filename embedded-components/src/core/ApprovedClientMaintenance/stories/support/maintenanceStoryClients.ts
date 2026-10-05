import {
  APPROVED_CLIENT_MAINTENANCE_OPERATIONS,
  type ApprovedClientMaintenanceEligibilityRule,
  type ApprovedClientMaintenanceOperation,
} from '../../ApprovedClientMaintenance.types';
import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../../models/maintenanceApi.types';
import { STORY_CLIENT_ID } from './maintenanceStoryHandlers';

export const ORGANIZATION_PARTY_ID = '2200000100';

const ORGANIZATION_TYPES = [
  'SOLE_PROPRIETORSHIP',
  'LIMITED_LIABILITY_COMPANY',
  'LIMITED_LIABILITY_PARTNERSHIP',
  'C_CORPORATION',
  'S_CORPORATION',
  'GENERAL_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'PARTNERSHIP',
  'NON_PROFIT_CORPORATION',
  'GOVERNMENT_ENTITY',
  'UNINCORPORATED_ASSOCIATION',
];

/** Every operation for every organization type in the US and Canada. */
export const FULL_ELIGIBILITY: ApprovedClientMaintenanceEligibilityRule[] =
  ORGANIZATION_TYPES.flatMap((organizationType) =>
    ['US', 'CA'].map((country) => ({
      country,
      organizationType,
      operations: APPROVED_CLIENT_MAINTENANCE_OPERATIONS,
    }))
  );

export const eligibilityFor = (
  operations: readonly ApprovedClientMaintenanceOperation[],
  country = 'US',
  organizationType = 'LIMITED_LIABILITY_COMPANY'
): ApprovedClientMaintenanceEligibilityRule[] => [
  { country, organizationType, operations },
];

type PersonOptions = {
  id: string;
  firstName?: string;
  lastName?: string;
  roles: Array<'CONTROLLER' | 'BENEFICIAL_OWNER'>;
  parentPartyId?: string;
  country?: 'US' | 'CA';
  jobTitle?: string;
};

export const person = ({
  id,
  firstName,
  lastName,
  roles,
  parentPartyId = ORGANIZATION_PARTY_ID,
  country = 'US',
  jobTitle = 'CEO',
}: PersonOptions): MaintenanceParty => ({
  id,
  parentPartyId,
  partyType: 'INDIVIDUAL',
  roles,
  email: `${(firstName ?? 'contact').toLowerCase()}@example.com`,
  individualDetails: {
    firstName,
    lastName,
    birthDate: '1984-05-21',
    countryOfResidence: country,
    jobTitle,
    ...(roles.includes('BENEFICIAL_OWNER')
      ? {
          natureOfOwnership:
            parentPartyId === ORGANIZATION_PARTY_ID ? 'Direct' : 'Indirect',
        }
      : {}),
    individualIds:
      country === 'US'
        ? [{ idType: 'SSN', value: '123456789', issuer: 'US' }]
        : [{ idType: 'PASSPORT', value: 'PA123456', issuer: 'CA' }],
    addresses: [
      country === 'US'
        ? {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['42 Second Star Road'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          }
        : {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['10 King Street West'],
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5H 1A1',
            country: 'CA',
          },
    ],
    phone: {
      phoneType: 'MOBILE_PHONE',
      countryCode: '+1',
      phoneNumber: '6465550199',
    },
  },
});

export const intermediary = ({
  id,
  name,
  parentPartyId = ORGANIZATION_PARTY_ID,
}: {
  id: string;
  name: string;
  parentPartyId?: string;
}): MaintenanceParty => ({
  id,
  parentPartyId,
  partyType: 'ORGANIZATION',
  roles: ['INTERMEDIARY_OWNER'],
  organizationDetails: {
    organizationName: name,
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    countryOfFormation: 'US',
    organizationIds: [{ idType: 'EIN', value: '987654321', issuer: 'US' }],
    addresses: [
      {
        addressType: 'LEGAL_ADDRESS',
        addressLines: ['1 Holding Plaza'],
        city: 'Wilmington',
        state: 'DE',
        postalCode: '19801',
        country: 'US',
      },
    ],
  },
});

const business = ({
  name,
  dbaName,
  organizationType,
  country = 'US',
  description,
}: {
  name: string;
  dbaName?: string;
  organizationType: string;
  country?: 'US' | 'CA';
  description: string;
}): MaintenanceParty => ({
  id: ORGANIZATION_PARTY_ID,
  partyType: 'ORGANIZATION',
  roles: ['CLIENT'],
  email: 'operations@example.com',
  organizationDetails: {
    organizationName: name,
    dbaName,
    organizationType,
    countryOfFormation: country,
    yearOfFormation: '2018',
    organizationDescription: description,
    industry: { codeType: 'NAICS', code: '459210' },
    organizationIds: [
      country === 'US'
        ? { idType: 'EIN', value: '123456789', issuer: 'US' }
        : { idType: 'BUSINESS_NUMBER', value: '123456789', issuer: 'CA' },
    ],
    addresses: [
      country === 'US'
        ? {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['14 Neverland Avenue', 'Suite 200'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          }
        : {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['200 Bay Street'],
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5J 2J5',
            country: 'CA',
          },
    ],
    phone: {
      phoneType: 'BUSINESS_PHONE',
      countryCode: '+1',
      phoneNumber: '2125550142',
    },
    website: 'https://example.com',
  },
});

const approvedClient = (
  organization: MaintenanceParty,
  parties: MaintenanceParty[],
  { withLimitedDda = true }: { withLimitedDda?: boolean } = {}
): MaintenanceClient => ({
  id: STORY_CLIENT_ID,
  partyId: ORGANIZATION_PARTY_ID,
  status: 'APPROVED',
  // Without product details, a listed product is read as approved Limited DDA.
  products: withLimitedDda ? ['EMBEDDED_PAYMENTS'] : [],
  productDetails: withLimitedDda
    ? [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA',
          onboardingStatus: 'APPROVED',
        },
      ]
    : [],
  parties: [organization, ...parties],
});

// People reused across clients so stories stay recognizable.
export const PETER = person({
  id: '2200000101',
  firstName: 'Peter',
  lastName: 'Pan',
  roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
});
export const TINKER = person({
  id: '2200000102',
  firstName: 'Tinker',
  lastName: 'Bell',
  roles: ['BENEFICIAL_OWNER'],
  jobTitle: 'Other',
});
export const WENDY = person({
  id: '2200000103',
  firstName: 'Wendy',
  lastName: 'Darling',
  roles: ['CONTROLLER'],
  jobTitle: 'COO',
});

/** LLC whose controller is also a direct owner, plus one other direct owner. */
export const LLC_WITH_DIRECT_OWNERS = approvedClient(
  business({
    name: 'Neverland Books LLC',
    dbaName: 'Neverland Books & Paper',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    description: 'Independent bookseller serving schools and families.',
  }),
  [PETER, TINKER]
);

/** One person runs the business; there is no ownership structure. */
export const SOLE_PROPRIETORSHIP = approvedClient(
  business({
    name: 'Hook Marine Repair',
    organizationType: 'SOLE_PROPRIETORSHIP',
    description: 'Boat and marine engine repair.',
  }),
  [
    person({
      id: '2200000111',
      firstName: 'James',
      lastName: 'Hook',
      roles: ['CONTROLLER'],
    }),
  ]
);

/** The controller owns nothing; four direct owners reach the owner limit. */
export const CORPORATION_AT_OWNER_LIMIT = approvedClient(
  business({
    name: 'Lost Boys Outfitters Inc.',
    organizationType: 'C_CORPORATION',
    description: 'Outdoor equipment retailer.',
  }),
  [
    person({
      id: '2200000121',
      firstName: 'Michael',
      lastName: 'Darling',
      roles: ['CONTROLLER'],
      jobTitle: 'CFO',
    }),
    ...['Slightly', 'Tootles', 'Nibs', 'Curly'].map((firstName, index) =>
      person({
        id: `22000001${22 + index}`,
        firstName,
        lastName: 'Lost',
        roles: ['BENEFICIAL_OWNER'],
        jobTitle: 'Other',
      })
    ),
  ]
);

/** Ownership held through two levels of intermediary businesses. */
export const PARTNERSHIP_WITH_INTERMEDIARY_CHAIN = approvedClient(
  business({
    name: 'Mermaid Lagoon Partners LP',
    organizationType: 'LIMITED_PARTNERSHIP',
    description: 'Coastal tourism and boat tours.',
  }),
  [
    person({
      id: '2200000131',
      firstName: 'Tiger',
      lastName: 'Lily',
      roles: ['CONTROLLER'],
    }),
    intermediary({ id: '2200000132', name: 'Lagoon Holdings LLC' }),
    intermediary({
      id: '2200000133',
      name: 'Skull Rock Capital LLC',
      parentPartyId: '2200000132',
    }),
    person({
      id: '2200000134',
      firstName: 'Mary',
      lastName: 'Darling',
      roles: ['BENEFICIAL_OWNER'],
      parentPartyId: '2200000132',
      jobTitle: 'Other',
    }),
    person({
      id: '2200000135',
      firstName: 'George',
      lastName: 'Darling',
      roles: ['BENEFICIAL_OWNER'],
      parentPartyId: '2200000133',
      jobTitle: 'Other',
    }),
  ]
);

/** A controller who is a direct owner next to an intermediary with its own owner. */
export const LLC_WITH_MIXED_OWNERSHIP = approvedClient(
  business({
    name: 'Second Star Logistics LLC',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    description: 'Regional parcel delivery.',
  }),
  [
    PETER,
    intermediary({ id: '2200000141', name: 'Star Holdings LLC' }),
    person({
      id: '2200000142',
      firstName: 'Tinker',
      lastName: 'Bell',
      roles: ['BENEFICIAL_OWNER'],
      parentPartyId: '2200000141',
      jobTitle: 'Other',
    }),
  ]
);

/** Nobody owns 25% or more, so only the controller is listed. */
export const NON_PROFIT_WITHOUT_OWNERS = approvedClient(
  business({
    name: 'Neverland Literacy Foundation',
    organizationType: 'NON_PROFIT_CORPORATION',
    description: 'Free reading programs for children.',
  }),
  [WENDY]
);

/** Canadian corporation whose people live in Canada. */
export const CANADIAN_CORPORATION = approvedClient(
  business({
    name: 'Maple Harbour Trading Corp.',
    organizationType: 'C_CORPORATION',
    country: 'CA',
    description: 'Import and export of specialty foods.',
  }),
  [
    person({
      id: '2200000151',
      firstName: 'Nana',
      lastName: 'Newfoundland',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      country: 'CA',
    }),
    person({
      id: '2200000152',
      firstName: 'Starkey',
      lastName: 'Smee',
      roles: ['BENEFICIAL_OWNER'],
      country: 'CA',
      jobTitle: 'Other',
    }),
  ]
);

/** Limited DDA has not been added yet, so the host must offer it first. */
export const LLC_WITHOUT_LIMITED_DDA = approvedClient(
  LLC_WITH_DIRECT_OWNERS.parties![0],
  [PETER, TINKER],
  { withLimitedDda: false }
);
