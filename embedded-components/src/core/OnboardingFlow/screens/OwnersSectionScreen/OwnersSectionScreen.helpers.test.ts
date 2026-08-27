import { describe, expect, it, vi } from 'vitest';

import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  buildRecreatedOwnerPayload,
  createOrReuseIntermediaryChain,
  findActiveOrgByName,
  runPartyMutationSaga,
  type PostPartyMutate,
  type SetPartyActive,
} from './OwnersSectionScreen';

const org = (
  id: string,
  name: string,
  extra: Partial<PartyResponse> = {}
): PartyResponse =>
  ({
    id,
    partyType: 'ORGANIZATION',
    active: true,
    roles: ['INTERMEDIARY_OWNER'],
    organizationDetails: { organizationName: name },
    ...extra,
  }) as unknown as PartyResponse;

describe('findActiveOrgByName', () => {
  const parties = [
    org('o1', 'Holdco LLC'),
    org('o2', 'Inactive Co', { active: false }),
    {
      id: 'i1',
      partyType: 'INDIVIDUAL',
      active: true,
      individualDetails: { firstName: 'A', lastName: 'B' },
    } as unknown as PartyResponse,
  ];

  it('matches an active organization by name, case-insensitively', () => {
    expect(findActiveOrgByName(parties, '  holdco llc ')?.id).toBe('o1');
  });

  it('ignores inactive organizations and individuals', () => {
    expect(findActiveOrgByName(parties, 'Inactive Co')).toBeUndefined();
    expect(findActiveOrgByName(parties, 'A B')).toBeUndefined();
  });

  it('returns undefined when no match', () => {
    expect(findActiveOrgByName(parties, 'Nope')).toBeUndefined();
  });
});

describe('buildRecreatedOwnerPayload', () => {
  it('preserves individual details, defaults country, and marks Indirect', () => {
    const owner = {
      id: 'p1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
      individualDetails: {
        firstName: 'Ada',
        lastName: 'Byron',
        birthDate: '1990-01-01',
        phone: { countryCode: '+1' }, // empty stub → pruned
      },
    } as unknown as PartyResponse;

    const payload = buildRecreatedOwnerPayload(
      owner,
      'parent-1',
      'Indirect'
    ) as {
      partyType: string;
      roles: string[];
      parentPartyId: string;
      individualDetails: Record<string, unknown>;
    };

    expect(payload.partyType).toBe('INDIVIDUAL');
    expect(payload.parentPartyId).toBe('parent-1');
    // CONTROLLER role preserved
    expect(payload.roles).toEqual(['BENEFICIAL_OWNER', 'CONTROLLER']);
    expect(payload.individualDetails.firstName).toBe('Ada');
    expect(payload.individualDetails.birthDate).toBe('1990-01-01');
    expect(payload.individualDetails.natureOfOwnership).toBe('Indirect');
    expect(payload.individualDetails.countryOfResidence).toBe('US');
    // empty phone stub pruned
    expect(payload.individualDetails.phone).toBeUndefined();
  });

  it('preserves organization details and applies org defaults', () => {
    const owner = {
      id: 'p2',
      partyType: 'ORGANIZATION',
      roles: ['INTERMEDIARY_OWNER'],
      organizationDetails: { organizationName: 'Sub LLC' },
    } as unknown as PartyResponse;

    const payload = buildRecreatedOwnerPayload(
      owner,
      'parent-2',
      'Indirect'
    ) as {
      organizationDetails: Record<string, unknown>;
    };

    expect(payload.organizationDetails.organizationName).toBe('Sub LLC');
    expect(payload.organizationDetails.organizationType).toBe(
      'LIMITED_LIABILITY_COMPANY'
    );
    expect(payload.organizationDetails.countryOfFormation).toBe('US');
    expect(payload.organizationDetails.natureOfOwnership).toBe('Indirect');
  });

  it('defaults roles to BENEFICIAL_OWNER when none present', () => {
    const owner = {
      id: 'p3',
      partyType: 'INDIVIDUAL',
      individualDetails: { firstName: 'X', lastName: 'Y' },
    } as unknown as PartyResponse;
    const payload = buildRecreatedOwnerPayload(
      owner,
      'parent-3',
      'Indirect'
    ) as {
      roles: string[];
    };
    expect(payload.roles).toEqual(['BENEFICIAL_OWNER']);
  });

  it('carries top-level compatible party fields (email, externalId, etc.)', () => {
    const owner = {
      id: 'p4',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      email: 'owner@example.com',
      externalId: 'EXT-123',
      access: [{ some: 'access' }],
      preferences: { defaultLanguage: 'en-US' },
      networkRegistration: { some: 'network' },
      individualDetails: { firstName: 'Ada', lastName: 'Byron' },
    } as unknown as PartyResponse;

    const payload = buildRecreatedOwnerPayload(
      owner,
      'parent-4',
      'Indirect'
    ) as {
      email?: string;
      externalId?: string;
      access?: unknown;
      preferences?: unknown;
      networkRegistration?: unknown;
    };

    expect(payload.email).toBe('owner@example.com');
    expect(payload.externalId).toBe('EXT-123');
    expect(payload.access).toEqual([{ some: 'access' }]);
    expect(payload.preferences).toEqual({ defaultLanguage: 'en-US' });
    expect(payload.networkRegistration).toEqual({ some: 'network' });
  });

  it('omits absent top-level fields and supports Direct nature (revert)', () => {
    const owner = {
      id: 'p5',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: { firstName: 'Ada', lastName: 'Byron' },
    } as unknown as PartyResponse;

    const payload = buildRecreatedOwnerPayload(owner, 'client-1', 'Direct') as {
      email?: string;
      parentPartyId: string;
      individualDetails: { natureOfOwnership: string };
    };

    expect('email' in payload).toBe(false);
    expect(payload.parentPartyId).toBe('client-1');
    expect(payload.individualDetails.natureOfOwnership).toBe('Direct');
  });
});

describe('createOrReuseIntermediaryChain', () => {
  const makePostMock = (): PostPartyMutate => {
    let n = 0;
    return vi.fn(async () => {
      n += 1;
      return { id: `created-${n}` } as PartyResponse;
    });
  };

  it('creates the chain client-outward and returns the outermost id', async () => {
    const post = makePostMock();
    // UI order is outer→root; the builder reverses to root→outer.
    const steps = [{ entityName: 'Outer LLC' }, { entityName: 'Root LLC' }];

    const outermost = await createOrReuseIntermediaryChain(
      steps,
      'client-1',
      [],
      post
    );

    expect(post).toHaveBeenCalledTimes(2);
    // First created = chain root, parented to CLIENT, Direct.
    const first = (post as unknown as { mock: { calls: any[][] } }).mock
      .calls[0][0].data;
    expect(first.parentPartyId).toBe('client-1');
    expect(first.organizationDetails.natureOfOwnership).toBe('Direct');
    expect(first.organizationDetails.organizationName).toBe('Root LLC');
    // Second created = next layer, parented to first, Indirect.
    const second = (post as unknown as { mock: { calls: any[][] } }).mock
      .calls[1][0].data;
    expect(second.parentPartyId).toBe('created-1');
    expect(second.organizationDetails.natureOfOwnership).toBe('Indirect');
    // Outermost id returned.
    expect(outermost).toBe('created-2');
  });

  it('reuses an existing org whose parent already matches', async () => {
    const post = makePostMock();
    const existing = org('existing-root', 'Root LLC', {
      parentPartyId: 'client-1',
    });
    const outermost = await createOrReuseIntermediaryChain(
      [{ entityName: 'Root LLC' }],
      'client-1',
      [existing],
      post
    );
    expect(post).not.toHaveBeenCalled();
    expect(outermost).toBe('existing-root');
  });

  it('throws when a reused org has a conflicting parent', async () => {
    const post = makePostMock();
    const existing = org('existing-root', 'Root LLC', {
      parentPartyId: 'some-other-parent',
    });
    await expect(
      createOrReuseIntermediaryChain(
        [{ entityName: 'Root LLC' }],
        'client-1',
        [existing],
        post
      )
    ).rejects.toThrow(/different ownership relationship/i);
  });

  it('reuses an unparented org at the root step (implicit client ownership)', async () => {
    const post = makePostMock();
    const existing = org('root-unparented', 'Root LLC'); // no parentPartyId
    const outermost = await createOrReuseIntermediaryChain(
      [{ entityName: 'Root LLC' }],
      'client-1',
      [existing],
      post
    );
    expect(post).not.toHaveBeenCalled();
    expect(outermost).toBe('root-unparented');
  });

  it('rejects reusing an unparented org outside the root step', async () => {
    const post = makePostMock();
    const outerUnparented = org('outer-unparented', 'Outer LLC'); // no parent
    // Steps are outer→root; reversed the root is created first, then the
    // unparented 'Outer LLC' at a non-root position must be rejected.
    await expect(
      createOrReuseIntermediaryChain(
        [{ entityName: 'Outer LLC' }, { entityName: 'Root LLC' }],
        'client-1',
        [outerUnparented],
        post
      )
    ).rejects.toThrow(/no ownership relationship/i);
  });

  it('matches a reused party by stable id, not name', async () => {
    const post = makePostMock();
    const existing = org('by-id-1', 'Totally Different Name', {
      parentPartyId: 'client-1',
    });
    const outermost = await createOrReuseIntermediaryChain(
      [{ entityName: 'Root LLC', partyId: 'by-id-1' }],
      'client-1',
      [existing],
      post
    );
    expect(post).not.toHaveBeenCalled();
    expect(outermost).toBe('by-id-1');
  });

  it('returns null when a create returns no id', async () => {
    const post = vi.fn(async () => ({}) as PartyResponse) as PostPartyMutate;
    const outermost = await createOrReuseIntermediaryChain(
      [{ entityName: 'Root LLC' }],
      'client-1',
      [],
      post
    );
    expect(outermost).toBeNull();
  });

  it('reports each created party id via onPartyCreated (not reused ones)', async () => {
    const post = makePostMock();
    const existingRoot = org('existing-root', 'Root LLC', {
      parentPartyId: 'client-1',
    });
    const created: string[] = [];

    // Steps outer→root; root "Root LLC" is reused, "Outer LLC" is created.
    await createOrReuseIntermediaryChain(
      [{ entityName: 'Outer LLC' }, { entityName: 'Root LLC' }],
      'client-1',
      [existingRoot],
      post,
      (id) => created.push(id)
    );

    expect(post).toHaveBeenCalledTimes(1);
    expect(created).toEqual(['created-1']);
  });
});

describe('runPartyMutationSaga', () => {
  const makeSetActive = () => {
    const calls: Array<{ partyId: string; active: boolean }> = [];
    const fn: SetPartyActive = vi.fn(async (partyId, active) => {
      calls.push({ partyId, active });
    });
    return { fn, calls };
  };

  it('does not compensate when work succeeds', async () => {
    const { fn, calls } = makeSetActive();

    await runPartyMutationSaga(fn, async ({ trackCreated, deactivate }) => {
      trackCreated('created-1');
      await deactivate('orig-1');
    });

    // Only the one deactivation work asked for; no rollback.
    expect(calls).toEqual([{ partyId: 'orig-1', active: false }]);
  });

  it('deactivates created parties (newest first) and re-throws on failure', async () => {
    const { fn, calls } = makeSetActive();

    await expect(
      runPartyMutationSaga(fn, async ({ trackCreated }) => {
        trackCreated('created-1');
        trackCreated('created-2');
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    expect(calls).toEqual([
      { partyId: 'created-2', active: false },
      { partyId: 'created-1', active: false },
    ]);
  });

  it('reactivates deactivated parties then deactivates created ones on failure', async () => {
    const { fn, calls } = makeSetActive();

    await expect(
      runPartyMutationSaga(fn, async ({ trackCreated, deactivate }) => {
        const recreated = 'recreated-1';
        trackCreated(recreated);
        await deactivate('orig-1');
        throw new Error('later step failed');
      })
    ).rejects.toThrow('later step failed');

    expect(calls).toEqual([
      // work's own deactivation
      { partyId: 'orig-1', active: false },
      // compensation: reactivate what we deactivated, then undo the creation
      { partyId: 'orig-1', active: true },
      { partyId: 'recreated-1', active: false },
    ]);
  });

  it('re-throws the original error even if compensation steps fail', async () => {
    let n = 0;
    const fn: SetPartyActive = vi.fn(async () => {
      n += 1;
      // Fail the compensation call (only invoked during rollback).
      if (n >= 1) throw new Error('compensation failed');
    });

    await expect(
      runPartyMutationSaga(fn, async ({ trackCreated }) => {
        trackCreated('created-1');
        throw new Error('original');
      })
    ).rejects.toThrow('original');
  });
});
