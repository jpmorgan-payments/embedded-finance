import { describe, expect, test } from 'vitest';

import { getMaintenanceRoleState } from './getMaintenanceRoleState';

describe('getMaintenanceRoleState', () => {
  test.each([
    {
      approved: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      proposed: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      expected: 'active',
    },
    {
      approved: ['CONTROLLER'],
      proposed: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      expected: 'pending-addition',
    },
    {
      approved: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      proposed: ['CONTROLLER'],
      expected: 'pending-removal',
    },
    {
      approved: ['CONTROLLER'],
      proposed: ['CONTROLLER'],
      expected: 'absent',
    },
  ])(
    'returns $expected from approved and proposed membership',
    ({ approved, proposed, expected }) => {
      expect(
        getMaintenanceRoleState(approved, proposed, 'BENEFICIAL_OWNER')
      ).toBe(expected);
    }
  );
});
