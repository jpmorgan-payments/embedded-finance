import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import {
  refinePersonalDetailsFormSchema,
  usePersonalDetailsFormSchema,
} from './PersonalDetailsForm.schema';

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

function useRefinedPersonalDetailsSchema() {
  return refinePersonalDetailsFormSchema(usePersonalDetailsFormSchema());
}

function validBase() {
  return {
    countryOfResidence: 'US',
    controllerFirstName: 'Jordan',
    controllerMiddleName: '',
    controllerLastName: 'Morgan',
    controllerNameSuffix: 'Jr',
    controllerJobTitle: 'CEO',
    controllerJobTitleDescription: '',
    natureOfOwnership: 'Direct',
  };
}

describe('PersonalDetailsForm schema (invalidOption & Other description)', () => {
  test('rejects job title not in enum', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Associate',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) => i.path?.[0] === 'controllerJobTitle')
    ).toBe(true);
  });

  test('rejects natureOfOwnership not in enum', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      natureOfOwnership: 'Imaginary',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) => i.path?.[0] === 'natureOfOwnership')
    ).toBe(true);
  });

  test('requires controllerJobTitleDescription when title is Other', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: '',
    });
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((i) =>
        i.path.includes('controllerJobTitleDescription')
      )
    ).toBe(true);
  });

  test('accepts Other title with description', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: 'Operations lead',
    });
    expect(parsed.success).toBe(true);
  });

  test('accepts non-Other title with empty job title description', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse(validBase());
    expect(parsed.success).toBe(true);
  });

  test('accepts backslash in job title description when title is Other', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: 'Dept\\Lead',
    });
    expect(parsed.success).toBe(true);
  });

  test('accepts common job-description punctuation when title is Other', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: `VP/Treasurer (Interim): Ops & IT; Sr. #2 - 100%`,
    });
    expect(parsed.success).toBe(true);
  });

  test('accepts typography slash and dash pasted from Word when title is Other', () => {
    const { result } = renderHook(() => useRefinedPersonalDetailsSchema());
    const parsed = result.current.safeParse({
      ...validBase(),
      controllerJobTitle: 'Other',
      // U+2215 division slash, U+2013 en dash (distinct from ASCII / and -)
      controllerJobTitleDescription: 'Owner\u2215Operator\u2013123',
    });
    expect(parsed.success).toBe(true);
  });
});
