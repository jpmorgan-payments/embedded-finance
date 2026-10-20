import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

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

function renderSchema(overrides: Partial<OnboardingContextType> = {}) {
  const context = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientData: undefined,
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: undefined,
    ...overrides,
  } as OnboardingContextType;
  return renderHook(() => useRefinedBusinessIdentitySchema(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <OnboardingContext.Provider value={context}>
        {children}
      </OnboardingContext.Provider>
    ),
  });
}

function validBase() {
  return {
    organizationName: 'Acme Incorporated',
    dbaName: 'Acme',
    yearOfFormation: '2020',
    countryOfFormation: 'US',
    organizationIdEin: '125698785',
    solePropHasEin: 'no',
    website: 'https://example.com/path',
    websiteNotAvailable: false,
  };
}

describe('BusinessIdentityForm schema (website superRefine & EIN)', () => {
  test('accepts a one-character organization name', () => {
    const { result } = renderSchema();
    expect(
      result.current.safeParse({ ...validBase(), organizationName: 'A' })
        .success
    ).toBe(true);
  });

  test('no longer validates website when field is hidden (websiteAvailable deprecated)', () => {
    const { result } = renderSchema();
    // Empty website with websiteNotAvailable false should still pass (field hidden)
    const parsed = result.current.safeParse({
      ...validBase(),
      website: '',
    });
    expect(parsed.success).toBe(true);
  });

  test('accepts malformed website URL when field is hidden', () => {
    const { result } = renderSchema();
    const parsed = result.current.safeParse({
      ...validBase(),
      website: 'example.com',
    });
    expect(parsed.success).toBe(true);
  });

  test('accepts IPv4 website URL when field is hidden', () => {
    const { result } = renderSchema();
    const parsed = result.current.safeParse({
      ...validBase(),
      website: 'https://203.0.113.10/about',
    });
    expect(parsed.success).toBe(true);
  });

  test('allows website to be omitted when websiteNotAvailable is true', () => {
    const { result } = renderSchema();
    const parsed = result.current.safeParse({
      ...validBase(),
      website: '',
      websiteNotAvailable: true,
    });
    expect(parsed.success).toBe(true);
  });

  test('rejects blocklisted EIN values (all-same-digit, sequential)', () => {
    const { result } = renderSchema();
    const blocklisted = [
      '000000000',
      '111111111',
      '555555555',
      '999999999',
      '123456789',
      '987654321',
      '012345678',
    ];
    for (const ein of blocklisted) {
      const parsed = result.current.safeParse({
        ...validBase(),
        organizationIdEin: ein,
      });
      expect(parsed.success).toBe(false);
      expect(
        parsed.error?.issues.some((i) =>
          i.message.includes('organizationIdEin.invalidValue')
        )
      ).toBe(true);
    }
  });

  test('allows empty DBA name (optional field)', () => {
    const { result } = renderSchema();
    const parsed = result.current.safeParse({
      ...validBase(),
      dbaName: '',
    });
    expect(parsed.success).toBe(true);
  });
});

function issueMessages(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

function chinaBusiness() {
  return {
    ...validBase(),
    countryOfFormation: 'CN',
    organizationIdEin: '',
    organizationIdRegistration: '91310000MA1FL1234X',
  };
}

describe('BusinessIdentityForm schema (country of formation)', () => {
  test('rejects non-US countries by default', () => {
    const { result } = renderSchema();
    expect(issueMessages(result.current.safeParse(chinaBusiness()))).toContain(
      'countryOfFormation.usOnly'
    );
  });

  describe('with availableCountriesOfFormation', () => {
    const allowUsAndChina = {
      availableCountriesOfFormation: ['US', 'CN'],
    } as const;

    test('accepts a non-US business with a registration ID and no EIN', () => {
      const { result } = renderSchema(allowUsAndChina);
      expect(result.current.safeParse(chinaBusiness()).success).toBe(true);
    });

    test('requires the registration ID for a non-US business', () => {
      const { result } = renderSchema(allowUsAndChina);
      const parsed = result.current.safeParse({
        ...chinaBusiness(),
        organizationIdRegistration: '',
      });
      expect(parsed.error?.issues).toEqual([
        expect.objectContaining({
          path: ['organizationIdRegistration'],
          message: 'organizationIdRegistration.required',
        }),
      ]);
    });

    test('rejects unsupported characters in the registration ID', () => {
      const { result } = renderSchema(allowUsAndChina);
      const parsed = result.current.safeParse({
        ...chinaBusiness(),
        organizationIdRegistration: 'ABC#123',
      });
      expect(issueMessages(parsed)).toContain(
        'organizationIdRegistration.pattern'
      );
    });

    test('still validates the EIN for a US business', () => {
      const { result } = renderSchema(allowUsAndChina);
      expect(result.current.safeParse(validBase()).success).toBe(true);
      const parsed = result.current.safeParse({
        ...validBase(),
        organizationIdEin: '',
      });
      expect(issueMessages(parsed)).toContain('organizationIdEin.required');
      expect(parsed.error?.issues.map((issue) => issue.path)).toEqual(
        parsed.error?.issues.map(() => ['organizationIdEin'])
      );
    });

    test('rejects countries outside the allowed list', () => {
      const { result } = renderSchema(allowUsAndChina);
      expect(
        issueMessages(
          result.current.safeParse({
            ...chinaBusiness(),
            countryOfFormation: 'GB',
          })
        )
      ).toContain('countryOfFormation.notAvailable');
    });

    test('keeps sole proprietorships US-only', () => {
      const { result } = renderSchema({
        ...allowUsAndChina,
        clientData: {
          parties: [
            {
              active: true,
              partyType: 'ORGANIZATION',
              roles: ['CLIENT'],
              organizationDetails: { organizationType: 'SOLE_PROPRIETORSHIP' },
            },
          ],
        } as unknown as ClientResponse,
      });
      expect(
        issueMessages(result.current.safeParse(chinaBusiness()))
      ).toContain('countryOfFormation.usOnly');
    });
  });
});
