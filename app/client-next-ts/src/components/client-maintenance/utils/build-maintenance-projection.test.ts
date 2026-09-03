import { describe, expect, it } from 'vitest';

import type {
  ClientResponse,
  PartyResponse,
} from '@/components/client-maintenance/models/maintenance-api';

import { buildMaintenanceProjection } from './build-maintenance-projection';

const approvedClient: ClientResponse = {
  id: '1000010400',
  partyId: '2000000111',
  products: ['MERCHANT_SERVICES'],
  status: 'APPROVED',
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      email: 'profile@marketplacevendor.example',
      organizationDetails: {
        organizationName: 'Marketplace Vendor LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
    {
      id: '2000000112',
      parentPartyId: '2000000111',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      email: 'jane@marketplacevendor.example',
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
        jobTitle: 'CFO',
        individualIds: [{ idType: 'SSN', issuer: 'US', value: '100010001' }],
      },
    },
  ],
};

const proposal = (
  overrides: PartyResponse,
  request: NonNullable<PartyResponse['updateRequest']>
): PartyResponse => ({
  ...overrides,
  updateRequest: request,
});

describe('buildMaintenanceProjection', () => {
  it('applies repeated proposals in one draft request and retains provenance', () => {
    const result = buildMaintenanceProjection(approvedClient, [
      proposal(
        {
          id: '2000000112',
          individualDetails: { lastName: 'Doe-Smith' },
        },
        {
          action: 'MODIFY',
          requestId: '4000001049',
          status: 'NEW',
          submittedAt: '2026-04-08T10:00:00.000Z',
        }
      ),
      proposal(
        {
          id: '2000000112',
          individualDetails: { lastName: 'Diaz' },
        },
        {
          action: 'MODIFY',
          requestId: '4000001049',
          status: 'NEW',
          submittedAt: '2026-04-10T10:00:00.000Z',
        }
      ),
      proposal(
        {
          id: '2000000112',
          email: 'declined@example.com',
        },
        {
          action: 'MODIFY',
          requestId: '4000001030',
          status: 'DECLINED',
          submittedAt: '2026-04-01T10:00:00.000Z',
        }
      ),
      proposal(
        {
          id: '2000000112',
          individualDetails: {
            middleName: 'R.',
          },
        },
        {
          action: 'MODIFY',
          requestId: '4000001020',
          status: 'APPROVED',
          submittedAt: '2026-03-01T10:00:00.000Z',
        }
      ),
    ]);

    const jane = result.proposedClient.parties.find(
      (party) => party.id === '2000000112'
    );
    expect(jane?.individualDetails).toMatchObject({
      firstName: 'Jane',
      lastName: 'Diaz',
      jobTitle: 'CFO',
      individualIds: [{ idType: 'SSN', issuer: 'US', value: '100010001' }],
    });
    expect(jane?.email).toBe('jane@marketplacevendor.example');
    expect(result.historicalProposals).toHaveLength(2);
    expect(result.partyChanges[0].fieldChanges[0]).toMatchObject({
      path: 'individualDetails.lastName',
      source: { requestId: '4000001049' },
      supersededSources: [{ requestId: '4000001049' }],
    });
  });

  it('projects added and deleted parties without mutating the approved snapshot', () => {
    const result = buildMaintenanceProjection(approvedClient, [
      proposal(
        {
          id: '2000000112',
        },
        {
          action: 'DELETE',
          requestId: '4000001049',
          status: 'NEW',
          submittedAt: '2026-04-11T10:00:00.000Z',
        }
      ),
      proposal(
        {
          id: '2000000113',
          partyType: 'INDIVIDUAL',
          roles: ['AUTHORIZED_USER'],
          individualDetails: { firstName: 'Alex', lastName: 'Smith' },
        },
        {
          action: 'ADD',
          requestId: '4000001050',
          status: 'NEW',
          submittedAt: '2026-04-12T10:00:00.000Z',
        }
      ),
    ]);

    expect(result.approvedClient.parties.map((party) => party.id)).toEqual([
      '2000000111',
      '2000000112',
    ]);
    expect(result.proposedClient.parties.map((party) => party.id)).toEqual([
      '2000000111',
      '2000000113',
    ]);
    expect(result.partyChanges.map((change) => change.action)).toEqual([
      'DELETE',
      'ADD',
    ]);
  });

  it('projects active false as a removal while preserving the MODIFY action', () => {
    const source = structuredClone(approvedClient);
    source.parties[1].active = true;

    const result = buildMaintenanceProjection(source, [
      proposal(
        { id: '2000000112', active: false },
        {
          action: 'MODIFY',
          requestId: '4000001049',
          status: 'NEW',
          submittedAt: '2026-04-12T10:00:00.000Z',
        }
      ),
    ]);

    expect(result.proposedClient.parties).toHaveLength(1);
    expect(result.partyChanges[0]).toMatchObject({
      action: 'MODIFY',
      removesParty: true,
      fieldChanges: [
        {
          path: 'active',
          approvedValue: true,
          proposedValue: false,
        },
      ],
    });
  });

  it('joins an active client product request into the proposed snapshot', () => {
    const source: ClientResponse = {
      ...structuredClone(approvedClient),
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
      updateRequest: {
        action: 'MODIFY',
        requestId: '4000001049',
        status: 'NEW',
        submittedAt: '2026-04-12T10:00:00.000Z',
      },
    };

    const result = buildMaintenanceProjection(source, []);

    expect(result.approvedClient).toMatchObject({
      products: ['MERCHANT_SERVICES'],
      productDetails: [],
    });
    expect(result.approvedClient.updateRequest).toBeUndefined();
    expect(result.proposedClient).toMatchObject({
      products: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
    });
    expect(result.productChanges).toEqual([
      {
        product: 'EMBEDDED_PAYMENTS',
        subProduct: 'LIMITED_DDA_PAYMENTS',
        action: 'ADD',
        source: {
          requestId: '4000001049',
          status: 'NEW',
          submittedAt: '2026-04-12T10:00:00.000Z',
        },
      },
    ]);
  });

  it('preserves API order when one request has equal timestamps', () => {
    const result = buildMaintenanceProjection(approvedClient, [
      proposal(
        {
          id: '2000000112',
          individualDetails: { lastName: 'Doe-Smith' },
        },
        {
          action: 'MODIFY',
          requestId: '4000001051',
          status: 'NEW',
          submittedAt: '2026-04-12T10:00:00.000Z',
        }
      ),
      proposal(
        {
          id: '2000000112',
          individualDetails: { lastName: 'Diaz' },
        },
        {
          action: 'MODIFY',
          requestId: '4000001051',
          status: 'NEW',
          submittedAt: '2026-04-12T10:00:00.000Z',
        }
      ),
    ]);

    expect(
      result.proposedClient.parties.find((party) => party.id === '2000000112')
        ?.individualDetails?.lastName
    ).toBe('Diaz');
  });

  it('reports active proposals that cannot be correlated to an approved party', () => {
    const missingId = proposal(
      { individualDetails: { birthDate: '1988-06-15' } },
      {
        action: 'MODIFY',
        requestId: '4000001053',
        status: 'NEW',
        submittedAt: '2026-04-13T10:00:00.000Z',
      }
    );

    const result = buildMaintenanceProjection(approvedClient, [missingId]);

    expect(result.partyChanges).toHaveLength(0);
    expect(result.unresolvedProposals).toEqual([missingId]);
  });
});
