import { describe, expect, it } from 'vitest';

import { enrichInitialValuesWithPartyName } from './enrichInitialValues';

describe('enrichInitialValuesWithPartyName', () => {
  it('fills individual name and account type from the party when absent', () => {
    const result = enrichInitialValuesWithPartyName(
      {},
      {
        partyType: 'INDIVIDUAL',
        individualDetails: { firstName: 'Jane', lastName: 'Doe' },
      }
    );

    expect(result).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      accountType: 'INDIVIDUAL',
    });
  });

  it('does not overwrite values the host already provided', () => {
    const result = enrichInitialValuesWithPartyName(
      { firstName: 'Existing', accountType: 'ORGANIZATION' },
      {
        partyType: 'INDIVIDUAL',
        individualDetails: { firstName: 'Jane', lastName: 'Doe' },
      }
    );

    expect(result.firstName).toBe('Existing');
    expect(result.lastName).toBe('Doe');
    expect(result.accountType).toBe('ORGANIZATION');
  });

  it('defaults missing individual name parts to empty strings', () => {
    const result = enrichInitialValuesWithPartyName(
      {},
      { partyType: 'INDIVIDUAL', individualDetails: {} }
    );

    expect(result).toEqual({
      firstName: '',
      lastName: '',
      accountType: 'INDIVIDUAL',
    });
  });

  it('sets only the account type when the individual party has no details', () => {
    const result = enrichInitialValuesWithPartyName(
      {},
      { partyType: 'INDIVIDUAL' }
    );

    expect(result).toEqual({ accountType: 'INDIVIDUAL' });
  });

  it('fills business name and account type for an organization party', () => {
    const result = enrichInitialValuesWithPartyName(
      {},
      {
        partyType: 'ORGANIZATION',
        organizationDetails: { organizationName: 'Acme Inc' },
      }
    );

    expect(result).toEqual({
      businessName: 'Acme Inc',
      accountType: 'ORGANIZATION',
    });
  });

  it('does not overwrite an existing business name', () => {
    const result = enrichInitialValuesWithPartyName(
      { businessName: 'Existing Co' },
      {
        partyType: 'ORGANIZATION',
        organizationDetails: { organizationName: 'Acme Inc' },
      }
    );

    expect(result.businessName).toBe('Existing Co');
    expect(result.accountType).toBe('ORGANIZATION');
  });

  it('returns an unchanged copy for an unknown party type', () => {
    const result = enrichInitialValuesWithPartyName(
      { firstName: 'Keep' },
      { partyType: 'TRUST' }
    );

    expect(result).toEqual({ firstName: 'Keep' });
  });

  it('does not mutate the input values', () => {
    const input = {};
    enrichInitialValuesWithPartyName(input, {
      partyType: 'INDIVIDUAL',
      individualDetails: { firstName: 'Jane', lastName: 'Doe' },
    });

    expect(input).toEqual({});
  });
});
