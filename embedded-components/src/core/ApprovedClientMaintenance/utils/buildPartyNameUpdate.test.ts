import { describe, expect, test } from 'vitest';

import { buildPartyNameUpdate } from './buildPartyNameUpdate';

const approvedName = {
  firstName: 'Jane',
  middleName: 'R',
  lastName: 'Doe',
};

describe('buildPartyNameUpdate', () => {
  test('returns unchanged when no name field changed', () => {
    expect(buildPartyNameUpdate(approvedName, approvedName)).toEqual({
      kind: 'unchanged',
    });
  });

  test('includes only changed allowlisted fields', () => {
    expect(
      buildPartyNameUpdate(approvedName, {
        ...approvedName,
        lastName: 'Diaz',
      })
    ).toEqual({
      kind: 'changed',
      request: { individualDetails: { lastName: 'Diaz' } },
    });
  });

  test('blocks an intentional clear until the API clear contract is known', () => {
    expect(
      buildPartyNameUpdate(approvedName, {
        ...approvedName,
        middleName: '',
      })
    ).toEqual({ kind: 'unsupported-clear', fields: ['middleName'] });
  });
});
