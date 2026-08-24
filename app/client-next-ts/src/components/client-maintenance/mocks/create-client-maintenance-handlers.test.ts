import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { clientMaintenanceApi } from '@/components/client-maintenance/client-maintenance-api';
import { MAINTENANCE_DEMO_CLIENT_ID } from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import { buildMaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';
import { API_URL } from '@/data/constants';

import { createClientMaintenanceHandlers } from './create-client-maintenance-handlers';

const server = setupServer(...createClientMaintenanceHandlers(API_URL));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  server.resetHandlers();
  await clientMaintenanceApi.reset();
});
afterAll(() => server.close());

async function createFourOperationDraft() {
  const product = await clientMaintenanceApi.requestProduct(
    MAINTENANCE_DEMO_CLIENT_ID,
    {
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
        },
      ],
    }
  );
  const added = await clientMaintenanceApi.createParty({
    parentPartyId: '2000000555',
    partyType: 'INDIVIDUAL',
    roles: ['AUTHORIZED_USER'],
    email: 'sam.lee@marketplacevendor.example',
    individualDetails: {
      firstName: 'Sam',
      lastName: 'Lee',
      countryOfResidence: 'US',
    },
  });
  const modified = await clientMaintenanceApi.updateParty('2000000556', {
    individualDetails: { lastName: 'Diaz' },
  });
  const removed = await clientMaintenanceApi.updateParty('2000000557', {
    active: false,
  });
  return { product, added, modified, removed };
}

describe('client maintenance mock API', () => {
  it('groups four operations while returning persisted client and party values', async () => {
    const approvedBefore = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );

    const { product, added, modified, removed } =
      await createFourOperationDraft();
    const approvedAfter = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const maintenance = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );

    expect(product).toMatchObject({
      products: ['MERCHANT_SERVICES'],
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
      updateRequest: { requestId: '4000001049', status: 'NEW' },
    });
    expect(added).toMatchObject({
      parentPartyId: '2000000555',
      updateRequest: {
        action: 'ADD',
        requestId: '4000001049',
        status: 'NEW',
      },
    });
    expect(modified).toMatchObject({
      id: '2000000556',
      individualDetails: { lastName: 'Doe' },
      updateRequest: {
        action: 'MODIFY',
        requestId: '4000001049',
        status: 'NEW',
      },
    });
    expect(removed).toMatchObject({
      id: '2000000557',
      active: true,
      updateRequest: {
        action: 'MODIFY',
        requestId: '4000001049',
        status: 'NEW',
      },
    });
    expect(approvedAfter.products).toEqual(approvedBefore.products);
    expect(approvedAfter.parties).toEqual(approvedBefore.parties);
    const projection = buildMaintenanceProjection(
      approvedAfter,
      maintenance.parties
    );
    expect(projection.productChanges).toHaveLength(1);
    expect(projection.partyChanges).toHaveLength(3);
    expect(
      projection.partyChanges.find((change) => change.partyId === '2000000557')
    ).toMatchObject({ action: 'MODIFY', removesParty: true });
    expect(
      new Set(
        maintenance.parties
          .filter((party) => party.updateRequest?.status === 'NEW')
          .map((party) => party.updateRequest?.requestId)
      )
    ).toEqual(new Set(['4000001049']));
  });

  it('returns request-scoped proposal details', async () => {
    await createFourOperationDraft();
    const result =
      await clientMaintenanceApi.getMaintenanceRequest('4000001049');

    expect(result.parties).toHaveLength(3);
    expect(
      result.parties.every(
        (party) => party.updateRequest?.requestId === '4000001049'
      )
    ).toBe(true);
  });

  it('requires attestation, accepts verification, and applies approval later', async () => {
    await createFourOperationDraft();
    await expect(
      clientMaintenanceApi.startVerification(MAINTENANCE_DEMO_CLIENT_ID)
    ).rejects.toThrow('Complete outstanding attestations first.');

    const client = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    await clientMaintenanceApi.addAttestation(MAINTENANCE_DEMO_CLIENT_ID, {
      attester: {
        firstName: 'Jordan',
        lastName: 'Lee',
        designation: 'Chief executive officer',
      },
      attestationTime: '2026-04-12T15:00:00.000Z',
      documentId: client.outstanding.attestationDocumentIds[0],
      ipAddress: '192.0.2.10',
    });
    const accepted = await clientMaintenanceApi.startVerification(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    expect(accepted.acceptedAt).toBeTruthy();

    const submitted = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    expect(
      submitted.parties
        .filter((party) => party.updateRequest?.requestId === '4000001049')
        .every((party) => party.updateRequest?.status === 'REVIEW_IN_PROGRESS')
    ).toBe(true);
    const submittedClient = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    expect(submittedClient).toMatchObject({
      productDetails: [{ onboardingStatus: 'REVIEW_IN_PROGRESS' }],
      updateRequest: { status: 'REVIEW_IN_PROGRESS' },
    });
    await expect(
      clientMaintenanceApi.updateParty('2000000555', {
        organizationDetails: { dbaName: 'Too late to edit' },
      })
    ).rejects.toThrow(
      'No further edits are allowed after the request is submitted.'
    );

    const beforeApproval = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const maintenanceBefore = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const beforeProjection = buildMaintenanceProjection(
      beforeApproval,
      maintenanceBefore.parties
    );
    expect(beforeProjection.productChanges).toHaveLength(1);
    expect(beforeProjection.partyChanges).toHaveLength(3);

    await clientMaintenanceApi.approve();

    const approved = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const maintenanceAfter = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const projection = buildMaintenanceProjection(
      approved,
      maintenanceAfter.parties
    );
    expect(
      approved.parties.find((party) => party.id === '2000000556')
        ?.individualDetails?.lastName
    ).toBe('Diaz');
    expect(approved.products).toEqual([
      'MERCHANT_SERVICES',
      'EMBEDDED_PAYMENTS',
    ]);
    expect(approved.productDetails).toMatchObject([
      {
        product: 'EMBEDDED_PAYMENTS',
        subProduct: 'LIMITED_DDA_PAYMENTS',
        onboardingStatus: 'APPROVED',
      },
    ]);
    expect(
      approved.parties.find((party) => party.id === '2000000558')
    ).toMatchObject({
      parentPartyId: '2000000555',
      individualDetails: { firstName: 'Sam', lastName: 'Lee' },
    });
    expect(
      approved.parties.find((party) => party.id === '2000000557')
    ).toBeUndefined();
    expect(projection.productChanges).toHaveLength(0);
    expect(projection.partyChanges).toHaveLength(0);
    expect(projection.historicalProposals).toHaveLength(
      maintenanceAfter.parties.length
    );
  });
});
