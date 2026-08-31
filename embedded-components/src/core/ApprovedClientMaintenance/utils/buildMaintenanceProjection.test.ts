import { describe, expect, test } from 'vitest';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';

const approvedClient: MaintenanceClient = {
  id: 'client-1',
  partyId: 'org-1',
  status: 'APPROVED',
  parties: [
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      individualDetails: {
        firstName: 'Jane',
        middleName: 'R',
        lastName: 'Doe',
      },
    },
  ],
};

const proposal = (
  overrides: Partial<MaintenanceParty> = {}
): MaintenanceParty => ({
  id: 'person-1',
  partyType: 'INDIVIDUAL',
  individualDetails: { lastName: 'Diaz' },
  updateRequest: {
    status: 'NEW',
    action: 'MODIFY',
    requestId: 'request-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
  ...overrides,
});

describe('buildMaintenanceProjection', () => {
  test('builds a name change without mutating the approved client', () => {
    const before = structuredClone(approvedClient);
    const projection = buildMaintenanceProjection(approvedClient, [proposal()]);

    expect(projection.partyChanges[0]?.fieldChanges).toEqual([
      expect.objectContaining({
        field: 'lastName',
        approvedValue: 'Doe',
        proposedValue: 'Diaz',
      }),
    ]);
    expect(projection.activeRequestId).toBe('request-1');
    expect(projection.canReview).toBe(true);
    expect(approvedClient).toEqual(before);
  });

  test('blocks proposals without required correlation', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({ id: undefined }),
    ]);

    expect(projection.unresolvedProposals).toHaveLength(1);
    expect(projection.canReview).toBe(false);
  });

  test('blocks more than one active request ID', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal(),
      proposal({
        updateRequest: {
          ...proposal().updateRequest,
          requestId: 'request-2',
        },
      }),
    ]);

    expect(projection.hasConflicts).toBe(true);
    expect(projection.canReview).toBe(false);
  });

  test('excludes terminal proposals from the active overlay', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({
        updateRequest: {
          ...proposal().updateRequest,
          status: 'APPROVED',
        },
      }),
    ]);

    expect(projection.partyChanges).toEqual([]);
  });

  test('composes multiple party proposals and validation tasks under one request', () => {
    const client: MaintenanceClient = {
      id: '3002022212',
      status: 'APPROVED',
      updateRequest: { status: 'NEW', requestId: '400000320' },
      outstanding: { partyIds: ['person-1', 'person-2'] },
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { firstName: 'Controller', lastName: 'One' },
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: ['document-1'],
            },
          ],
        },
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Owner', lastName: 'Two' },
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: ['document-2'],
            },
          ],
        },
      ],
    };
    const proposals: MaintenanceParty[] = [
      {
        id: 'person-1',
        individualDetails: {
          firstName: 'Controller Updated',
          lastName: 'One Updated',
        },
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: '400000320',
          submittedAt: '2026-08-26T18:16:06.21Z',
        },
      },
      {
        id: 'person-2',
        individualDetails: { lastName: 'Two Updated' },
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: '400000320',
          submittedAt: '2026-08-26T18:15:00.535Z',
        },
      },
    ];

    const projection = buildMaintenanceProjection(client, proposals);

    expect(projection.activeRequestId).toBe('400000320');
    expect(projection.partyChanges).toHaveLength(2);
    expect(projection.hasConflicts).toBe(false);
    expect(projection.validationTasks).toHaveLength(2);
    expect(projection.documentRequestIds).toEqual(['document-1', 'document-2']);
    expect(projection.outstandingPartyIds).toEqual(['person-1', 'person-2']);
  });
});
