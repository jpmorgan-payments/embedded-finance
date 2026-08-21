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

describe('client maintenance mock API', () => {
  it('creates a sparse proposal without mutating the approved client', async () => {
    const approvedBefore = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );

    const created = await clientMaintenanceApi.updateParty('2000000556', {
      individualDetails: { jobTitle: 'Chief operating officer' },
    });
    const approvedAfter = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const maintenance = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );

    expect(created).toMatchObject({
      id: '2000000556',
      individualDetails: { jobTitle: 'Chief operating officer' },
      updateRequest: { action: 'MODIFY', status: 'NEW' },
    });
    expect(approvedAfter).toEqual(approvedBefore);
    expect(maintenance.parties).toContainEqual(created);
  });

  it('returns request-scoped proposal details', async () => {
    const result =
      await clientMaintenanceApi.getMaintenanceRequest('4000001048');

    expect(result.parties).toHaveLength(1);
    expect(result.parties[0].updateRequest?.requestId).toBe('4000001048');
  });

  it('requires attestation, accepts verification, and applies approval later', async () => {
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

    const beforeApproval = await clientMaintenanceApi.getClient(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    const maintenanceBefore = await clientMaintenanceApi.getMaintenanceRequests(
      MAINTENANCE_DEMO_CLIENT_ID
    );
    expect(
      buildMaintenanceProjection(beforeApproval, maintenanceBefore.parties)
        .partyChanges
    ).not.toHaveLength(0);

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
        ?.individualDetails?.jobTitle
    ).toBe('Chief financial officer');
    expect(projection.partyChanges).toHaveLength(0);
    expect(projection.historicalProposals).toHaveLength(
      maintenanceAfter.parties.length
    );
  });
});
