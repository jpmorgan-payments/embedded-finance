import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import {
  refineBusinessIdentityFormSchema,
  useBusinessIdentityFormSchema,
} from './BusinessIdentityForm.schema';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/core/OnboardingFlow/utils/formUtils')
    >();
  return {
    ...actual,
    useGetValidationMessage: () => (field: string, messageKey: string) =>
      `${field}.${messageKey}`,
  };
});

function useRefinedBusinessIdentitySchema() {
  return refineBusinessIdentityFormSchema(useBusinessIdentityFormSchema());
}

function validBase() {
  return {
    organizationName: 'Acme Incorporated',
    dbaName: 'Acme',
    dbaNameNotAvailable: false,
    yearOfFormation: '2020',
    countryOfFormation: 'US',
    organizationIdEin: '125698785',
    solePropHasEin: 'no',
    website: 'https://example.com/path',
    websiteNotAvailable: false,
  };
}

describe('BusinessIdentityForm schema (website superRefine & EIN)', () => {
  test('requires https website when websiteNotAvailable is false', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      website: '',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((i) => i.path.includes('website'))).toBe(
      true
    );
  });

  test('rejects malformed website URL', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      website: 'example.com',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some(
        (i) =>
          i.path.includes('website') && i.message.includes('website.format')
      )
    ).toBe(true);
  });

  test('rejects https-looking host that is only an IPv4 literal (blocked after format)', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      website: 'https://203.0.113.10/about',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) => i.path.join('.').includes('website'))
    ).toBe(true);
  });

  test('allows website to be omitted when websiteNotAvailable is true', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      website: '',
      websiteNotAvailable: true,
    });
    expect(parsed.success).toBe(true);
  });

  test('rejects invalid EIN prefix (IRS reserved ranges)', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      organizationIdEin: '914316140',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) =>
        i.message.includes('organizationIdEin.invalidPrefix')
      )
    ).toBe(true);
  });

  test('requires DBA when dbaNameNotAvailable is false', () => {
    const { result } = renderHook(() => useRefinedBusinessIdentitySchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      dbaName: '',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((i) => i.path.includes('dbaName'))).toBe(
      true
    );
  });
});
