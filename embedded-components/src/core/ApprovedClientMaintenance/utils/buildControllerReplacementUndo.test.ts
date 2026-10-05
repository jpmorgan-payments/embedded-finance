import { describe, expect, test } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { buildControllerReplacementUndo } from './buildControllerReplacementUndo';
import type { MaintenanceDiscardEntry } from './buildMaintenanceDiscardContent';
import type {
  PartyChange,
  PartyFieldChange,
} from './buildMaintenanceProjection';

const fieldChange = (field: PartyFieldChange['field']) =>
  ({ field }) as unknown as PartyFieldChange;

const entry = ({
  id,
  approvedRoles,
  proposedRoles,
  fields = ['roles'],
  removesParty = false,
}: {
  id: string;
  approvedRoles: string[];
  proposedRoles: string[];
  fields?: PartyFieldChange['field'][];
  removesParty?: boolean;
}): MaintenanceDiscardEntry => ({
  id,
  entityKind: 'person',
  isOrganization: false,
  party: { id, roles: approvedRoles } as MaintenanceParty,
  proposedParty: { id, roles: proposedRoles } as MaintenanceParty,
  change: {
    partyId: id,
    removesParty,
    fieldChanges: fields.map(fieldChange),
  } as unknown as PartyChange,
  fieldChanges: [],
});

describe('buildControllerReplacementUndo', () => {
  test('discards both sides when the hand-over is all they changed', () => {
    expect(
      buildControllerReplacementUndo({
        requestId: 'request-1',
        outgoing: entry({
          id: 'jane',
          approvedRoles: ['CONTROLLER'],
          proposedRoles: [],
          removesParty: true,
        }),
        incoming: entry({
          id: 'wendy',
          approvedRoles: ['BENEFICIAL_OWNER'],
          proposedRoles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
        }),
        incomingIsAddition: false,
      })
    ).toEqual([
      { kind: 'discard', requestId: 'request-1', partyId: 'jane' },
      { kind: 'discard', requestId: 'request-1', partyId: 'wendy' },
    ]);
  });

  test("keeps the incoming person's unrelated edits and only takes back control", () => {
    const [, incomingStep] = buildControllerReplacementUndo({
      requestId: 'request-1',
      outgoing: entry({
        id: 'jane',
        approvedRoles: ['CONTROLLER'],
        proposedRoles: [],
        removesParty: true,
      }),
      incoming: entry({
        id: 'wendy',
        approvedRoles: ['BENEFICIAL_OWNER'],
        proposedRoles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
        fields: ['roles', 'lastName'],
      }),
      incomingIsAddition: false,
    });

    expect(incomingStep).toEqual({
      kind: 'update',
      partyId: 'wendy',
      requestBody: { roles: ['BENEFICIAL_OWNER'] },
    });
  });

  test('gives control back to an outgoing controller who stayed on as an owner, keeping their owner role', () => {
    const [outgoingStep, incomingStep] = buildControllerReplacementUndo({
      requestId: 'request-1',
      outgoing: entry({
        id: 'jane',
        approvedRoles: ['CONTROLLER'],
        proposedRoles: ['BENEFICIAL_OWNER'],
        fields: ['roles', 'natureOfOwnership'],
      }),
      incoming: entry({
        id: 'new-person',
        approvedRoles: [],
        proposedRoles: ['CONTROLLER'],
      }),
      incomingIsAddition: true,
    });

    expect(outgoingStep).toEqual({
      kind: 'update',
      partyId: 'jane',
      requestBody: { roles: ['CONTROLLER', 'BENEFICIAL_OWNER'] },
    });
    expect(incomingStep).toEqual({
      kind: 'discard',
      requestId: 'request-1',
      partyId: 'new-person',
    });
  });
});
