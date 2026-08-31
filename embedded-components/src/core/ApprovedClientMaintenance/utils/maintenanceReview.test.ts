import { describe, expect, test } from 'vitest';

import type { MaintenanceClient } from '../models/maintenanceApi.types';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';
import {
  areMaintenanceReadsStable,
  createMaintenanceReviewFingerprint,
  getMaintenanceSubmissionBlockers,
  MaintenanceSubmissionError,
  validateStableMaintenanceSubmission,
} from './maintenanceReview';

const client: MaintenanceClient = {
  id: 'client-1',
  status: 'APPROVED',
  parties: [
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      individualDetails: { firstName: 'Jane', lastName: 'Doe' },
    },
  ],
  outstanding: {},
};

const proposal = {
  id: 'person-1',
  individualDetails: { lastName: 'Diaz' },
  updateRequest: {
    status: 'NEW' as const,
    action: 'MODIFY' as const,
    requestId: 'request-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
};

describe('maintenanceReview', () => {
  test('creates a deterministic fingerprint for the complete change set', () => {
    const projection = buildMaintenanceProjection(client, [proposal]);

    expect(createMaintenanceReviewFingerprint(client, projection)).toBe(
      createMaintenanceReviewFingerprint(client, projection)
    );
  });

  test('reports every outstanding requirement category once', () => {
    const clientWithOutstanding: MaintenanceClient = {
      ...client,
      outstanding: {
        questionIds: ['question-1'],
        partyIds: ['person-1'],
        partyRoles: ['CONTROLLER'],
        attestationDocumentIds: ['attestation-1'],
      },
      parties: client.parties?.map((party) => ({
        ...party,
        validationResponse: [
          {
            validationStatus: 'NEEDS_INFO',
            documentRequestIds: ['document-1'],
          },
        ],
      })),
    };
    const projection = buildMaintenanceProjection(clientWithOutstanding, [
      proposal,
    ]);

    expect(
      getMaintenanceSubmissionBlockers(
        clientWithOutstanding,
        projection,
        [
          {
            id: 'document-1',
            partyId: 'person-1',
            status: 'ACTIVE',
            requirements: [],
          },
        ],
        false
      )
    ).toEqual([
      { type: 'questions', count: 1 },
      { type: 'roles', count: 1 },
      { type: 'attestations', count: 1 },
      { type: 'documents', count: 1 },
    ]);
  });

  test('does not duplicate document-backed parties as additional information blockers', () => {
    const clientWithTwoDocumentParties: MaintenanceClient = {
      ...client,
      outstanding: { partyIds: ['person-1', 'person-2'] },
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              documentRequestIds: ['document-1'],
            },
          ],
        },
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              documentRequestIds: ['document-2'],
            },
          ],
        },
      ],
    };
    const projection = buildMaintenanceProjection(
      clientWithTwoDocumentParties,
      [proposal]
    );

    expect(
      getMaintenanceSubmissionBlockers(
        clientWithTwoDocumentParties,
        projection,
        [
          { id: 'document-1', partyId: 'person-1', status: 'ACTIVE' },
          { id: 'document-2', partyId: 'person-2', status: 'ACTIVE' },
        ],
        false
      )
    ).toEqual([{ type: 'documents', count: 2 }]);
  });

  test('allows submission only when all work is complete', () => {
    const projection = buildMaintenanceProjection(client, [proposal]);

    expect(
      getMaintenanceSubmissionBlockers(client, projection, [], false)
    ).toEqual([]);
  });

  test('detects drift between complete reads', () => {
    expect(areMaintenanceReadsStable('first', 'second')).toBe(false);
    expect(areMaintenanceReadsStable('same', 'same')).toBe(true);
  });

  test('requires two complete reads identical to the reviewed draft', async () => {
    const projection = buildMaintenanceProjection(client, [proposal]);
    const fingerprint = createMaintenanceReviewFingerprint(client, projection);
    const readCompleteState = vi
      .fn()
      .mockResolvedValue({ client, parties: [proposal], documentRequests: [] });

    await expect(
      validateStableMaintenanceSubmission(readCompleteState, fingerprint)
    ).resolves.toEqual({ client, parties: [proposal], documentRequests: [] });
    expect(readCompleteState).toHaveBeenCalledTimes(2);
  });

  test('blocks submission when the reviewed draft changed', async () => {
    const readCompleteState = vi.fn().mockResolvedValue({
      client,
      parties: [
        {
          ...proposal,
          individualDetails: { lastName: 'Smith' },
        },
      ],
      documentRequests: [],
    });

    await expect(
      validateStableMaintenanceSubmission(readCompleteState, 'stale')
    ).rejects.toEqual(
      expect.objectContaining<Partial<MaintenanceSubmissionError>>({
        code: 'CHANGED',
      })
    );
  });

  test('blocks submission when fresh reads contain outstanding work', async () => {
    const clientWithQuestion = {
      ...client,
      outstanding: { questionIds: ['question-1'] },
    };
    const projection = buildMaintenanceProjection(client, [proposal]);
    const fingerprint = createMaintenanceReviewFingerprint(client, projection);

    await expect(
      validateStableMaintenanceSubmission(
        async () => ({
          client: clientWithQuestion,
          parties: [proposal],
          documentRequests: [],
        }),
        fingerprint
      )
    ).rejects.toEqual(
      expect.objectContaining<Partial<MaintenanceSubmissionError>>({
        code: 'BLOCKED',
      })
    );
  });

  test('accepts completed documents during stable reads', async () => {
    const clientWithDocument: MaintenanceClient = {
      ...client,
      parties: client.parties?.map((party) => ({
        ...party,
        validationResponse: [
          {
            validationStatus: 'VALIDATED',
            documentRequestIds: ['document-1'],
          },
        ],
      })),
    };
    const projection = buildMaintenanceProjection(clientWithDocument, [
      proposal,
    ]);
    const fingerprint = createMaintenanceReviewFingerprint(
      clientWithDocument,
      projection
    );

    await expect(
      validateStableMaintenanceSubmission(
        async () => ({
          client: clientWithDocument,
          parties: [proposal],
          documentRequests: [{ id: 'document-1', status: 'CLOSED' }],
        }),
        fingerprint
      )
    ).resolves.toEqual(
      expect.objectContaining({
        documentRequests: [{ id: 'document-1', status: 'CLOSED' }],
      })
    );
  });
});
