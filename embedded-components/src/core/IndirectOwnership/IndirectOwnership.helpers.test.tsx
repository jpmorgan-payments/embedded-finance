import { describe, expect, it } from 'vitest';

import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  buildDemoOwnerParty,
  collectExistingBusinessNames,
  computeChainUsages,
  computeCompletedRemovals,
  deriveAllOwners,
  getOwnershipTypeAriaLabel,
  getValidationStatusMessage,
  ownerHasCollectedDetails,
} from './IndirectOwnership';
import type {
  BeneficialOwner,
  ValidationSummary,
} from './IndirectOwnership.types';

const owner = (o: Partial<BeneficialOwner>): BeneficialOwner =>
  o as unknown as BeneficialOwner;

describe('buildDemoOwnerParty', () => {
  it('builds a direct individual with no parent', () => {
    const p = buildDemoOwnerParty({
      entityType: 'INDIVIDUAL',
      firstName: 'Ada',
      lastName: 'Byron',
      ownershipType: 'DIRECT',
    });
    expect(p.partyType).toBe('INDIVIDUAL');
    expect(p.parentPartyId).toBeUndefined();
    expect(p.individualDetails?.natureOfOwnership).toBe('Direct');
    expect(p.roles).toEqual(['BENEFICIAL_OWNER']);
  });

  it('builds an indirect business with a temp parent', () => {
    const p = buildDemoOwnerParty({
      entityType: 'BUSINESS',
      businessName: 'Holdco',
      ownershipType: 'INDIRECT',
    });
    expect(p.partyType).toBe('ORGANIZATION');
    expect(p.parentPartyId).toBe('temp-parent');
    expect(p.organizationDetails?.organizationName).toBe('Holdco');
  });
});

describe('deriveAllOwners', () => {
  const individual: PartyResponse = {
    id: 'ind-1',
    partyType: 'INDIVIDUAL',
    active: true,
    roles: ['BENEFICIAL_OWNER'],
    individualDetails: { firstName: 'Ann', lastName: 'Lee' },
  } as unknown as PartyResponse;

  it('transforms parties and leaves direct owners direct', () => {
    const result = deriveAllOwners(
      [individual],
      [individual],
      new Map(),
      new Set()
    );
    expect(result[0].ownershipType).toBe('DIRECT');
  });

  it('applies the pending-indirect override for flagged owners', () => {
    const result = deriveAllOwners(
      [individual],
      [individual],
      new Map(),
      new Set(['ind-1'])
    );
    expect(result[0].ownershipType).toBe('INDIRECT');
    expect(result[0].status).toBe('PENDING_HIERARCHY');
  });
});

describe('collectExistingBusinessNames', () => {
  it('collects lower-cased names from business owners and individual chains', () => {
    const businessOwners = [
      owner({ organizationDetails: { organizationName: 'Holdco LLC' } }),
    ];
    const individualOwners = [
      owner({
        ownershipHierarchy: { steps: [{ entityName: 'Sub Co' }] } as never,
      }),
    ];
    const names = collectExistingBusinessNames(
      businessOwners,
      individualOwners
    );
    expect(names.has('holdco llc')).toBe(true);
    expect(names.has('sub co')).toBe(true);
  });
});

describe('computeChainUsages', () => {
  it('returns names of other owners whose chain reuses the entity', () => {
    const target = owner({
      id: 'biz-1',
      partyType: 'ORGANIZATION',
      organizationDetails: { organizationName: 'Shared LLC' },
    });
    const user = owner({
      id: 'ind-1',
      partyType: 'INDIVIDUAL',
      individualDetails: { firstName: 'Ann', lastName: 'Lee' },
      ownershipHierarchy: { steps: [{ entityName: 'Shared LLC' }] } as never,
    });
    expect(computeChainUsages([target, user], 'biz-1')).toEqual(['Ann Lee']);
  });

  it('returns [] for a non-organization owner', () => {
    const ind = owner({ id: 'x', partyType: 'INDIVIDUAL' });
    expect(computeChainUsages([ind], 'x')).toEqual([]);
  });
});

describe('computeCompletedRemovals', () => {
  it('returns pending ids that are gone from current', () => {
    const pending = new Set(['a', 'b', 'c']);
    const current = new Set(['b']);
    expect(computeCompletedRemovals(pending, current).sort()).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('getValidationStatusMessage', () => {
  const s = (o: Partial<ValidationSummary>): ValidationSummary =>
    o as ValidationSummary;

  it('reports the no-owner attestation state', () => {
    expect(getValidationStatusMessage(s({ totalOwners: 0 }), true)).toMatch(
      /ready to continue/i
    );
  });
  it('prompts to add the first owner', () => {
    expect(getValidationStatusMessage(s({ totalOwners: 0 }), false)).toMatch(
      /first beneficial owner/i
    );
  });
  it('reports complete', () => {
    expect(
      getValidationStatusMessage(
        s({ totalOwners: 2, canComplete: true }),
        false
      )
    ).toMatch(/complete information/i);
  });
  it('reports pending count with pluralization', () => {
    expect(
      getValidationStatusMessage(
        s({ totalOwners: 2, canComplete: false, pendingHierarchies: 1 }),
        false
      )
    ).toMatch(/^1 owner pending/);
    expect(
      getValidationStatusMessage(
        s({ totalOwners: 3, canComplete: false, pendingHierarchies: 2 }),
        false
      )
    ).toMatch(/^2 owners pending/);
  });
});

describe('ownerHasCollectedDetails', () => {
  it('individual: true when birthDate/address/id present', () => {
    expect(
      ownerHasCollectedDetails(
        owner({
          partyType: 'INDIVIDUAL',
          individualDetails: { birthDate: '2000-01-01' },
        })
      )
    ).toBe(true);
    expect(
      ownerHasCollectedDetails(
        owner({ partyType: 'INDIVIDUAL', individualDetails: {} })
      )
    ).toBe(false);
  });

  it('organization: true when address or org id present', () => {
    expect(
      ownerHasCollectedDetails(
        owner({
          partyType: 'ORGANIZATION',
          organizationDetails: {
            organizationIds: [{ idType: 'EIN' }],
          } as never,
        })
      )
    ).toBe(true);
    expect(
      ownerHasCollectedDetails(
        owner({ partyType: 'ORGANIZATION', organizationDetails: {} })
      )
    ).toBe(false);
  });
});

describe('getOwnershipTypeAriaLabel', () => {
  it('covers the three variants', () => {
    expect(getOwnershipTypeAriaLabel(true, false)).toBe('Indirect owner');
    expect(getOwnershipTypeAriaLabel(false, true)).toBe('Business owner');
    expect(getOwnershipTypeAriaLabel(false, false)).toBe('Direct owner');
  });
});
