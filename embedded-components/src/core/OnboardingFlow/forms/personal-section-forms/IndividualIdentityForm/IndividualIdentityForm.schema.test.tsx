import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import {
  refineIndividualIdentityFormSchema,
  useIndividualIdentityFormSchema,
} from './IndividualIdentityForm.schema';

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

function useRefinedIndividualIdentitySchema() {
  return refineIndividualIdentityFormSchema(useIndividualIdentityFormSchema());
}

function expiryWithinFiveYears(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().slice(0, 10);
}

const futureExpiry = expiryWithinFiveYears();

function basePayload(overrides: {
  controllerIds?: Record<string, unknown>[];
  birthDate?: string;
  solePropSsn?: string;
}) {
  return {
    birthDate: overrides.birthDate ?? '1990-06-15',
    solePropSsn: overrides.solePropSsn ?? '231231231',
    controllerIds: overrides.controllerIds ?? [
      {
        description: '',
        expiryDate: futureExpiry,
        idType: 'PASSPORT',
        issuer: 'US',
        value: 'AB1234567',
      },
    ],
  };
}

describe('IndividualIdentityForm schema (ITIN, birthDate calendar, solePropSsn)', () => {
  test('rejects ITIN when middle digits are outside IRS ranges', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({
        controllerIds: [
          {
            description: '',
            expiryDate: futureExpiry,
            idType: 'ITIN',
            issuer: 'US',
            value: '951001234',
          },
        ],
      })
    );
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some(
        (i) =>
          Array.isArray(i.path) &&
          i.path.includes('value') &&
          typeof i.message === 'string' &&
          i.message.includes('itinMiddleDigits')
      )
    ).toBe(true);
  });

  test('rejects known-invalid ITIN 987654321', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({
        controllerIds: [
          {
            description: '',
            expiryDate: futureExpiry,
            idType: 'ITIN',
            issuer: 'US',
            value: '987654321',
          },
        ],
      })
    );
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some(
        (i) =>
          typeof i.message === 'string' &&
          i.message.includes('itinKnownInvalid')
      )
    ).toBe(true);
  });

  test('rejects ITIN that does not start with 9', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({
        controllerIds: [
          {
            description: '',
            expiryDate: futureExpiry,
            idType: 'ITIN',
            issuer: 'US',
            value: '850701234',
          },
        ],
      })
    );
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some(
        (i) =>
          typeof i.message === 'string' && i.message.includes('itinStartsWith9')
      )
    ).toBe(true);
  });

  test('accepts ITIN with valid middle-digit range (70–79)', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({
        controllerIds: [
          {
            description: '',
            expiryDate: futureExpiry,
            idType: 'ITIN',
            issuer: 'US',
            value: '912751234',
          },
        ],
      })
    );
    expect(parsed.success).toBe(true);
  });

  test('rejects impossible calendar date (Feb 30)', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({ birthDate: '1990-02-30' })
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((i) => i.path.includes('birthDate'))).toBe(
      true
    );
  });

  test('solePropSsn refine rejects invalid SSN when issuer is US', () => {
    const { result } = renderHook(() => useRefinedIndividualIdentitySchema());
    const parsed = result.current.safeParse(
      basePayload({
        solePropSsn: '123456789',
        controllerIds: [
          {
            description: '',
            expiryDate: futureExpiry,
            idType: 'PASSPORT',
            issuer: 'US',
            value: 'AB1234567',
          },
        ],
      })
    );
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) => i.path.includes('solePropSsn'))
    ).toBe(true);
  });
});
