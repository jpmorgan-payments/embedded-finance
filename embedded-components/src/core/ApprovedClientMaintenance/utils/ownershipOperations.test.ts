import { describe, expect, test, vi } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  buildMoveOwnershipPlan,
  buildRemoveIntermediaryPlan,
  executeOwnershipOperations,
  getEligibleOwnershipParents,
} from './ownershipOperations';

const parties: MaintenanceParty[] = [
  {
    id: 'intermediary-1',
    parentPartyId: 'client-1',
    partyType: 'ORGANIZATION',
    roles: ['INTERMEDIARY_OWNER'],
  },
  {
    id: 'intermediary-2',
    parentPartyId: 'intermediary-1',
    partyType: 'ORGANIZATION',
    roles: ['INTERMEDIARY_OWNER'],
  },
  {
    id: 'owner-1',
    parentPartyId: 'intermediary-1',
    partyType: 'INDIVIDUAL',
    roles: ['BENEFICIAL_OWNER'],
  },
  {
    id: 'controller-owner',
    parentPartyId: 'intermediary-2',
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
  },
];

describe('ownershipOperations', () => {
  test('excludes the selected node and its descendants from move destinations', () => {
    expect(
      getEligibleOwnershipParents({
        partyId: 'intermediary-1',
        clientPartyId: 'client-1',
        parties,
      })
    ).toEqual(['client-1']);
  });

  test('moves a complete branch by writing its root parent before its ownership nature', () => {
    expect(
      buildMoveOwnershipPlan({
        party: parties[1],
        destinationPartyId: 'client-1',
        clientPartyId: 'client-1',
      })
    ).toEqual([
      { partyId: 'intermediary-2', request: { parentPartyId: 'client-1' } },
      {
        partyId: 'intermediary-2',
        request: { organizationDetails: { natureOfOwnership: 'Direct' } },
      },
    ]);
  });

  test('promotes direct children before removing an intermediary', () => {
    expect(
      buildRemoveIntermediaryPlan({
        intermediaryPartyId: 'intermediary-1',
        clientPartyId: 'client-1',
        parties,
        strategy: 'promote-children',
      })
    ).toEqual([
      { partyId: 'intermediary-2', request: { parentPartyId: 'client-1' } },
      {
        partyId: 'intermediary-2',
        request: { organizationDetails: { natureOfOwnership: 'Direct' } },
      },
      { partyId: 'owner-1', request: { parentPartyId: 'client-1' } },
      {
        partyId: 'owner-1',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('removes a branch child-first while preserving non-ownership roles', () => {
    expect(
      buildRemoveIntermediaryPlan({
        intermediaryPartyId: 'intermediary-1',
        clientPartyId: 'client-1',
        parties,
        strategy: 'remove-branch',
      })
    ).toEqual([
      { partyId: 'controller-owner', request: { parentPartyId: 'client-1' } },
      { partyId: 'controller-owner', request: { roles: ['CONTROLLER'] } },
      { partyId: 'intermediary-2', request: { active: false } },
      { partyId: 'owner-1', request: { active: false } },
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('withdraws pending additions from the branch instead of deactivating them', () => {
    expect(
      buildRemoveIntermediaryPlan({
        intermediaryPartyId: 'intermediary-1',
        clientPartyId: 'client-1',
        parties: [
          parties[0],
          {
            id: 'pending-owner',
            parentPartyId: 'intermediary-1',
            partyType: 'INDIVIDUAL',
            roles: ['BENEFICIAL_OWNER'],
            updateRequest: {
              action: 'ADD',
              status: 'NEW',
              requestId: 'request-1',
            },
          },
        ],
        strategy: 'remove-branch',
      })
    ).toEqual([
      { partyId: 'pending-owner', withdrawFromRequestId: 'request-1' },
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('withdraws a pending intermediary after moving its children up', () => {
    const pendingAddition = {
      action: 'ADD' as const,
      status: 'NEW' as const,
      requestId: 'request-1',
    };
    expect(
      buildRemoveIntermediaryPlan({
        intermediaryPartyId: 'pending-business',
        clientPartyId: 'client-1',
        parties: [
          {
            id: 'pending-business',
            parentPartyId: 'client-1',
            partyType: 'ORGANIZATION',
            roles: ['INTERMEDIARY_OWNER'],
            updateRequest: pendingAddition,
          },
          {
            id: 'pending-owner',
            parentPartyId: 'pending-business',
            partyType: 'INDIVIDUAL',
            roles: ['BENEFICIAL_OWNER'],
            updateRequest: pendingAddition,
          },
        ],
        strategy: 'promote-children',
      })
    ).toEqual([
      { partyId: 'pending-owner', request: { parentPartyId: 'client-1' } },
      {
        partyId: 'pending-owner',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
      { partyId: 'pending-business', withdrawFromRequestId: 'request-1' },
    ]);
  });

  test('retries only unfinished operations with stable idempotency keys', async () => {
    const operations = [
      { partyId: 'owner-1', request: { parentPartyId: 'client-1' } },
      { partyId: 'intermediary-1', request: { active: false as const } },
    ];
    const progress = new Map();
    const applyOperation = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);
    const createIdempotencyKey = vi
      .fn()
      .mockReturnValueOnce('move-key')
      .mockReturnValueOnce('remove-key');

    await expect(
      executeOwnershipOperations({
        operations,
        progress,
        createIdempotencyKey,
        applyOperation,
      })
    ).rejects.toThrow('network');

    await executeOwnershipOperations({
      operations,
      progress,
      createIdempotencyKey,
      applyOperation,
    });

    expect(applyOperation).toHaveBeenNthCalledWith(
      1,
      operations[0],
      'move-key'
    );
    expect(applyOperation).toHaveBeenNthCalledWith(
      2,
      operations[1],
      'remove-key'
    );
    expect(applyOperation).toHaveBeenNthCalledWith(
      3,
      operations[1],
      'remove-key'
    );
    expect(createIdempotencyKey).toHaveBeenCalledTimes(2);
  });
});
