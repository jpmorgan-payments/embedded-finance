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

describe('partyFieldMap.industry', () => {
  const { fromResponseFn, toRequestFn, toStringFn } = partyFieldMap.industry;

  test('fromResponseFn extracts code from object', () => {
    expect(fromResponseFn!({ code: '541511', codeType: 'NAICS' })).toBe(
      '541511'
    );
  });

  test('toRequestFn wraps code in object', () => {
    expect(toRequestFn!('541511')).toEqual({
      codeType: 'NAICS',
      code: '541511',
    });
  });

  test('toStringFn returns undefined for undefined input', () => {
    expect(toStringFn!(undefined, {})).toBeUndefined();
  });

  test('toStringFn formats code with description', () => {
    const result = toStringFn!('541511', {});
    expect(result).toContain('541511');
  });
});

describe('partyFieldMap.organizationIdEin', () => {
  const { fromResponseFn, toRequestFn, toStringFn, modifyErrorField } =
    partyFieldMap.organizationIdEin;

  test('fromResponseFn extracts EIN value from array', () => {
    const ids = [
      { idType: 'EIN', value: '123456789', issuer: 'US' },
      { idType: 'OTHER', value: 'xxx', issuer: 'US' },
    ];
    expect(fromResponseFn!(ids)).toBe('123456789');
  });

  test('fromResponseFn returns empty string when no EIN found', () => {
    expect(fromResponseFn!([])).toBe('');
  });

  test('toRequestFn wraps value in EIN structure', () => {
    expect(toRequestFn!('123456789')).toEqual([
      { issuer: 'US', idType: 'EIN', value: '123456789' },
    ]);
  });

  test('toStringFn formats EIN with dash', () => {
    expect(toStringFn!('123456789', {})).toBe('12 - 3456789');
  });

  test('toStringFn returns undefined for undefined', () => {
    expect(toStringFn!(undefined, {})).toBeUndefined();
  });

  test('modifyErrorField collapses path to empty string', () => {
    expect(modifyErrorField!('.0.value')).toBe('');
  });
});

describe('partyFieldMap.websiteNotAvailable', () => {
  const { fromResponseFn, toRequestFn } = partyFieldMap.websiteNotAvailable as {
    fromResponseFn: (val: boolean) => boolean;
    toRequestFn: (val: boolean) => boolean;
  };

  test('fromResponseFn maps false → true (not available)', () => {
    expect(fromResponseFn!(false)).toBe(true);
  });

  test('fromResponseFn maps true → false (available)', () => {
    expect(fromResponseFn!(true)).toBe(false);
  });

  test('toRequestFn inverts: true → false', () => {
    expect(toRequestFn!(true)).toBe(false);
  });

  test('toRequestFn inverts: false → true', () => {
    expect(toRequestFn!(false)).toBe(true);
  });
});

describe('partyFieldMap.isPTCOrSubsidiary', () => {
  const { fromResponseFn } = partyFieldMap.isPTCOrSubsidiary as {
    fromResponseFn: (val: {
      publiclyTraded?: unknown;
      isSubsidiary?: boolean;
    }) => string;
  };

  test('returns empty string when no publiclyTraded', () => {
    expect(fromResponseFn!({})).toBe('');
  });

  test('returns "ptc" when publiclyTraded exists and not subsidiary', () => {
    expect(fromResponseFn!({ publiclyTraded: { stockExchange: 'XNYS' } })).toBe(
      'ptc'
    );
  });

  test('returns "subsidiary" when isSubsidiary is true', () => {
    expect(
      fromResponseFn!({
        publiclyTraded: { stockExchange: 'XNYS' },
        isSubsidiary: true,
      })
    ).toBe('subsidiary');
  });
});

describe('partyFieldMap.individualAddress', () => {
  const { fromResponseFn, toRequestFn, modifyErrorField } =
    partyFieldMap.individualAddress;

  test('fromResponseFn maps API address to form address', () => {
    const apiAddresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        addressLines: ['123 Main St', 'Apt 4B', 'Floor 2'],
      },
    ];
    const result = fromResponseFn!(apiAddresses);
    expect(result).toEqual({
      addressType: 'RESIDENTIAL_ADDRESS',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      primaryAddressLine: '123 Main St',
      secondaryAddressLine: 'Apt 4B',
      tertiaryAddressLine: 'Floor 2',
    });
  });

  test('fromResponseFn defaults to empty when no residential address', () => {
    const result = fromResponseFn!([
      { addressType: 'BUSINESS_ADDRESS', city: 'LA' },
    ]);
    expect(result!.city).toBe('');
    expect(result!.primaryAddressLine).toBe('');
  });

  test('toRequestFn assembles addressLines from named fields', () => {
    const formAddress = {
      addressType: 'RESIDENTIAL_ADDRESS' as const,
      primaryAddressLine: '456 Oak Ave',
      secondaryAddressLine: 'Suite 100',
      tertiaryAddressLine: '',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    };
    const result = toRequestFn!(formAddress);
    expect(result).toHaveLength(1);
    expect(result[0].addressLines).toEqual(['456 Oak Ave', 'Suite 100']);
    expect(result[0].city).toBe('Chicago');
  });

  test('modifyErrorField maps .addressLines.0 → .primaryAddressLine', () => {
    expect(modifyErrorField!('.0.addressLines.0')).toBe('.primaryAddressLine');
  });

  test('modifyErrorField maps .addressLines.1 → .secondaryAddressLine', () => {
    expect(modifyErrorField!('.0.addressLines.1')).toBe(
      '.secondaryAddressLine'
    );
  });

  test('modifyErrorField maps .addressLines.2 → .tertiaryAddressLine', () => {
    expect(modifyErrorField!('.0.addressLines.2')).toBe('.tertiaryAddressLine');
  });

  test('modifyErrorField strips leading array index for other fields', () => {
    expect(modifyErrorField!('.0.state')).toBe('.state');
  });
});

describe('partyFieldMap.birthDate.toStringFn', () => {
  const { toStringFn } = partyFieldMap.birthDate;

  test('formats date as long date string', () => {
    const result = toStringFn!('1990-05-15', {});
    expect(result).toContain('1990');
    expect(result).toContain('15');
  });

  test('returns undefined for undefined', () => {
    expect(toStringFn!(undefined, {})).toBeUndefined();
  });
});
