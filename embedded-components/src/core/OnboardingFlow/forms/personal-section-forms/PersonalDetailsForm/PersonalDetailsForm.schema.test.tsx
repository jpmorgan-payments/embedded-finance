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
});
