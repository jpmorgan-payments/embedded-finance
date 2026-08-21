import type {
  ClientResponse,
  PartyResponse,
} from '@/components/client-maintenance/models/maintenance-api';

export const MAINTENANCE_DEMO_CLIENT_ID = '1000010400';
export const MAINTENANCE_ATTESTATION_DOCUMENT_ID =
  'c4e4739f-33ed-47f6-82fa-0b1c5c992d0b';

export function createMaintenanceDemoClient(): ClientResponse {
  return {
    id: MAINTENANCE_DEMO_CLIENT_ID,
    partyId: '2000000555',
    products: ['MERCHANT_SERVICES'],
    status: 'APPROVED',
    outstanding: {
      attestationDocumentIds: [MAINTENANCE_ATTESTATION_DOCUMENT_ID],
      documentRequestIds: [],
      partyIds: [],
      partyRoles: [],
      questionIds: [],
    },
    parties: [
      {
        id: '2000000555',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        profileStatus: 'APPROVED',
        active: true,
        email: 'profile@marketplacevendor.example',
        organizationDetails: {
          organizationName: 'Marketplace Vendor LLC',
          dbaName: 'Marketplace Vendor',
          organizationDescription:
            'Independent vendor of home, office, and lifestyle goods.',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          countryOfFormation: 'US',
          yearOfFormation: '2019',
          industryCategory: 'Retail Trade',
          industryType: 'Electronic Shopping and Mail-Order Houses',
          website: 'https://marketplacevendor.example',
          addresses: [
            {
              addressType: 'BUSINESS_ADDRESS',
              addressLines: ['85 Mercer Street', 'Suite 410'],
              city: 'New York',
              state: 'NY',
              postalCode: '10012',
              country: 'US',
            },
          ],
          phone: {
            phoneType: 'BUSINESS_PHONE',
            countryCode: '+1',
            phoneNumber: '2125550188',
          },
          organizationIds: [
            { idType: 'EIN', issuer: 'US', value: '000000001' },
          ],
        },
      },
      {
        id: '2000000556',
        parentPartyId: '2000000555',
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
        profileStatus: 'APPROVED',
        active: true,
        email: 'jane.doe@marketplacevendor.example',
        individualDetails: {
          firstName: 'Jane',
          lastName: 'Doe',
          birthDate: '1988-06-14',
          countryOfResidence: 'US',
          jobTitle: 'Treasurer',
          natureOfOwnership: 'Direct',
          addresses: [
            {
              addressType: 'RESIDENTIAL_ADDRESS',
              addressLines: ['10 Market Street', 'Apt 8'],
              city: 'Brooklyn',
              state: 'NY',
              postalCode: '11201',
              country: 'US',
            },
          ],
          phone: {
            phoneType: 'MOBILE_PHONE',
            countryCode: '+1',
            phoneNumber: '9175550104',
          },
          individualIds: [{ idType: 'SSN', issuer: 'US', value: '100010001' }],
        },
      },
      {
        id: '2000000557',
        parentPartyId: '2000000555',
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
        profileStatus: 'APPROVED',
        active: true,
        email: 'alex.smith@marketplacevendor.example',
        individualDetails: {
          firstName: 'Alex',
          lastName: 'Smith',
          countryOfResidence: 'US',
          jobTitle: 'Head of product',
          natureOfOwnership: 'Direct',
        },
      },
    ],
  };
}

export function createMaintenanceDemoProposals(): PartyResponse[] {
  return [
    {
      id: '2000000556',
      individualDetails: { jobTitle: 'Finance director' },
      updateRequest: {
        status: 'REVIEW_IN_PROGRESS',
        action: 'MODIFY',
        requestId: '4000001042',
        submittedAt: '2026-04-08T10:00:00.000Z',
      },
    },
    {
      id: '2000000556',
      individualDetails: {
        jobTitle: 'Chief financial officer',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['28 Pine Avenue'],
            city: 'Brooklyn',
            state: 'NY',
            postalCode: '11217',
            country: 'US',
          },
        ],
      },
      updateRequest: {
        status: 'INFORMATION_REQUESTED',
        action: 'MODIFY',
        requestId: '4000001048',
        submittedAt: '2026-04-10T10:00:00.000Z',
      },
    },
    {
      id: '2000000555',
      organizationDetails: {
        website: 'https://shop.marketplacevendor.example',
      },
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: '4000001049',
        submittedAt: '2026-04-11T10:00:00.000Z',
      },
    },
    {
      id: '2000000556',
      individualDetails: {
        individualIds: [{ idType: 'SSN', issuer: 'US', value: '999999999' }],
      },
      updateRequest: {
        status: 'APPROVED',
        action: 'MODIFY',
        requestId: '4000001010',
        submittedAt: '2026-02-02T10:00:00.000Z',
      },
    },
    {
      id: '2000000555',
      email: 'retired-change@marketplacevendor.example',
      updateRequest: {
        status: 'TERMINATED',
        action: 'MODIFY',
        requestId: '4000001020',
        submittedAt: '2026-03-02T10:00:00.000Z',
      },
    },
  ];
}
