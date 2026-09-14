import { describe, expect, test } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import { buildMaintenanceEntityTasks } from './buildMaintenanceEntityTasks';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';

const client: MaintenanceClient = {
  id: 'client-1',
  partyId: 'organization-1',
  status: 'APPROVED',
  outstanding: { documentRequestIds: ['business-document'] },
  parties: [
    {
      id: 'organization-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
    },
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      individualDetails: { firstName: 'Jane', lastName: 'Doe' },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          documentRequestIds: ['person-document'],
        },
      ],
    },
  ],
};

const proposal = {
  id: 'person-1',
  individualDetails: {
    firstName: 'Jane',
    lastName: 'Diaz',
  },
  updateRequest: {
    status: 'NEW' as const,
    action: 'MODIFY' as const,
    requestId: 'change-set-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
};

const documentRequest = (
  id: string,
  partyId?: string
): DocumentRequestResponse => ({
  id,
  partyId,
  status: 'ACTIVE',
  requirements: [],
});

describe('buildMaintenanceEntityTasks', () => {
  test('attaches party and business documents to their owning entities', () => {
    const projection = buildMaintenanceProjection(client, [proposal]);
    const tasks = buildMaintenanceEntityTasks(client, projection, [
      documentRequest('person-document', 'person-1'),
      documentRequest('business-document', 'organization-1'),
    ]);

    expect(tasks.parties[0]).toEqual(
      expect.objectContaining({
        partyId: 'person-1',
        change: expect.objectContaining({ partyId: 'person-1' }),
        documentRequests: [expect.objectContaining({ id: 'person-document' })],
        unresolvedDocumentRequestIds: [],
      })
    );
    expect(tasks.organization.documentRequests).toEqual([
      expect.objectContaining({ id: 'business-document' }),
    ]);
  });

  test('keeps a mismatched party association unresolved on the expected owner', () => {
    const projection = buildMaintenanceProjection(client, [proposal]);
    const tasks = buildMaintenanceEntityTasks(client, projection, [
      documentRequest('person-document', 'person-2'),
      documentRequest('business-document', 'organization-1'),
    ]);

    expect(tasks.parties[0]?.documentRequests).toEqual([]);
    expect(tasks.parties[0]?.unresolvedDocumentRequestIds).toEqual([
      'person-document',
    ]);
  });

  test('keeps unaffected people in the stable profile model', () => {
    const projection = buildMaintenanceProjection(
      {
        ...client,
        parties: [
          ...(client.parties ?? []),
          {
            id: 'person-2',
            partyType: 'INDIVIDUAL',
            individualDetails: { firstName: 'Alex', lastName: 'Smith' },
          },
        ],
      },
      [proposal]
    );
    const tasks = buildMaintenanceEntityTasks(
      projection.approvedClient,
      projection,
      []
    );

    expect(tasks.parties.map((task) => task.partyId)).toEqual([
      'person-1',
      'person-2',
    ]);
    expect(tasks.parties[1]?.change).toBeUndefined();
  });

  test('includes pending additions and retains approved parties pending removal', () => {
    const addedParty: MaintenanceParty = {
      id: 'person-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: { firstName: 'Wendy', lastName: 'Darling' },
      updateRequest: {
        status: 'NEW',
        action: 'ADD',
        requestId: 'request-1',
        submittedAt: '2026-08-27T12:00:00.000Z',
      },
    };
    const additionProjection = buildMaintenanceProjection(client, [
      proposal,
      addedParty,
    ]);
    const removalProjection = buildMaintenanceProjection(client, [
      { ...proposal, individualDetails: undefined, active: false },
    ]);

    expect(
      buildMaintenanceEntityTasks(client, additionProjection, []).parties
    ).toEqual([
      expect.objectContaining({
        partyId: 'person-1',
        isPendingAddition: false,
      }),
      expect.objectContaining({
        partyId: 'person-2',
        isPendingAddition: true,
        proposedParty: expect.objectContaining({ id: 'person-2' }),
      }),
    ]);
    expect(
      buildMaintenanceEntityTasks(client, removalProjection, []).parties
    ).toEqual([
      expect.objectContaining({
        partyId: 'person-1',
        isPendingAddition: false,
        change: expect.objectContaining({ removesParty: true }),
      }),
    ]);
  });

  test('does not mark an approved party pending from an inconsistent ADD action', () => {
    const projection = buildMaintenanceProjection(client, [proposal]);
    const approvedPartyChange = projection.partyChanges[0];
    if (!approvedPartyChange)
      throw new Error('Expected an approved party change');
    approvedPartyChange.action = 'ADD';

    const task = buildMaintenanceEntityTasks(client, projection, []).parties[0];

    expect(task?.isPendingAddition).toBe(false);
  });
});
