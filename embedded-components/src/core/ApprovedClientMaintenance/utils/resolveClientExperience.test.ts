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
});
