import { describe, expect, test } from 'vitest';

import type { MaintenanceClient } from '../models/maintenanceApi.types';
import { resolveClientExperience } from './resolveClientExperience';

const approvedClient: MaintenanceClient = {
  id: 'client-1',
  status: 'APPROVED',
};

const complete = {
  isClientComplete: true,
  isMaintenanceComplete: true,
};

describe('resolveClientExperience', () => {
  test('selects maintenance from a client-level active update request', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: {
          ...approvedClient,
          status: 'REVIEW_IN_PROGRESS',
          updateRequest: { status: 'REVIEW_IN_PROGRESS' },
        },
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'maintenance' });
  });

  test('selects maintenance from a party-only active request after relogin', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: { ...approvedClient, status: 'INFORMATION_REQUESTED' },
        maintenanceParties: [
          { updateRequest: { status: 'INFORMATION_REQUESTED' } },
        ],
      })
    ).toEqual({ kind: 'maintenance' });
  });

  test('returns terminal maintenance to the approved profile with history', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: approvedClient,
        maintenanceParties: [{ updateRequest: { status: 'TERMINATED' } }],
      })
    ).toEqual({ kind: 'approved-profile', hasMaintenanceHistory: true });
  });

  test('blocks classification when party-maintenance discovery is incomplete', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: approvedClient,
        maintenanceParties: [],
        isMaintenanceComplete: false,
      })
    ).toEqual({ kind: 'discovery-error', reason: 'incomplete' });
  });

  test('selects onboarding for a review status after complete maintenance discovery finds no request', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: { ...approvedClient, status: 'REVIEW_IN_PROGRESS' },
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'onboarding' });
  });

  test('selects maintenance for an approved client with a request for information', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: { ...approvedClient, outstanding: { questionIds: ['500096'] } },
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'maintenance' });
    const withPartyDocument = {
      ...approvedClient,
      parties: [
        {
          id: 'person-1',
          validationResponse: [{ documentRequestIds: ['document-1'] }],
        },
      ],
    };
    expect(
      resolveClientExperience({
        ...complete,
        client: {
          ...withPartyDocument,
          outstanding: { partyIds: ['person-1'] },
        },
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'maintenance' });
    // Without the party in outstanding.partyIds, its document request isn't current.
    expect(
      resolveClientExperience({
        ...complete,
        client: withPartyDocument,
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'approved-profile', hasMaintenanceHistory: false });
  });

  test('keeps an information request during onboarding review in onboarding', () => {
    expect(
      resolveClientExperience({
        ...complete,
        client: {
          ...approvedClient,
          status: 'INFORMATION_REQUESTED',
          outstanding: { questionIds: ['30158'] },
        },
        maintenanceParties: [],
      })
    ).toEqual({ kind: 'onboarding' });
  });
});
