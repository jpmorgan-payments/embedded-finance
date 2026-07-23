import { describe, expect, it } from 'vitest';

import { resolvePartyFormOverlay } from './flowUtils';

describe('resolvePartyFormOverlay', () => {
  it('returns flat savedFormValues unchanged when no nested owners bag (non-delta)', () => {
    const saved = {
      birthDate: '1990-01-01',
      controllerFirstName: 'Ada',
      question_30005: ['100'],
    };

    expect(resolvePartyFormOverlay({ id: 'party-1' }, saved)).toEqual(saved);
    expect(resolvePartyFormOverlay(undefined, saved)).toEqual(saved);
  });

  it('returns empty object when savedFormValues is undefined', () => {
    expect(resolvePartyFormOverlay({ id: 'party-1' }, undefined)).toEqual({});
  });

  it('applies nested owners.{partyId} overlay for that owner only (delta)', () => {
    const saved = {
      birthDate: '1990-01-01',
      owners: {
        'owner-a': { birthDate: '2000-02-02', controllerIds: [] },
        'owner-b': { birthDate: '2001-03-03' },
      },
      question_30005: ['100'],
    };

    expect(resolvePartyFormOverlay({ id: 'owner-a' }, saved)).toEqual({
      birthDate: '2000-02-02',
      controllerIds: [],
    });
    expect(resolvePartyFormOverlay({ id: 'owner-b' }, saved)).toEqual({
      birthDate: '2001-03-03',
    });
  });

  it('strips owners bag and question_* for org/controller under delta overlay', () => {
    const saved = {
      organizationIdEin: '12-3456789',
      birthDate: '1990-01-01',
      owners: {
        'owner-a': { birthDate: '2000-02-02' },
      },
      question_30005: ['100'],
    };

    expect(resolvePartyFormOverlay({ id: 'controller-1' }, saved)).toEqual({
      organizationIdEin: '12-3456789',
      birthDate: '1990-01-01',
    });
    expect(resolvePartyFormOverlay(undefined, saved)).toEqual({
      organizationIdEin: '12-3456789',
      birthDate: '1990-01-01',
    });
  });
});
