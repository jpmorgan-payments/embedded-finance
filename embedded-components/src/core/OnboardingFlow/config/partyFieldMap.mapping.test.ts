import { describe, expect, test } from 'vitest';

import type { OrganizationType } from '@/api/generated/smbdo.schemas';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';

describe('partyFieldMap.organizationTypeHierarchy.fromResponseFn', () => {
  const mapOrgType = partyFieldMap.organizationTypeHierarchy.fromResponseFn!;

  test('maps sole proprietorship', () => {
    expect(mapOrgType('SOLE_PROPRIETORSHIP')).toEqual({
      generalOrganizationType: 'SOLE_PROPRIETORSHIP',
      specificOrganizationType: 'SOLE_PROPRIETORSHIP',
    });
  });

  test('maps LLC into the registered-business bucket', () => {
    expect(mapOrgType('LIMITED_LIABILITY_COMPANY')).toEqual({
      generalOrganizationType: 'REGISTERED_BUSINESS',
      specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
    });
  });

  test('maps non-profit into the other bucket', () => {
    expect(mapOrgType('NON_PROFIT_CORPORATION')).toEqual({
      generalOrganizationType: 'OTHER',
      specificOrganizationType: 'NON_PROFIT_CORPORATION',
    });
  });

  test('falls back when the API type is outside the grouped lists', () => {
    expect(mapOrgType('PUBLICLY_TRADED_COMPANY' as OrganizationType)).toEqual({
      generalOrganizationType: '',
      specificOrganizationType: 'PUBLICLY_TRADED_COMPANY',
    });
  });
});

describe('partyFieldMap.organizationName.fromResponseFn', () => {
  const mapName = partyFieldMap.organizationName.fromResponseFn!;

  test('maps placeholder org name to empty string', () => {
    expect(mapName('PLACEHOLDER_ORG_NAME')).toBe('');
  });

  test('preserves real organization names', () => {
    expect(mapName('Acme Fixtures LLC')).toBe('Acme Fixtures LLC');
  });
});
