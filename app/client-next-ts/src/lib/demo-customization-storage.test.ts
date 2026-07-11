import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearDemoCustomization,
  countContentTokenOverrides,
  countThemeVariableOverrides,
  flattenContentTokenOverrides,
  getDemoCustomization,
  setDemoCustomization,
} from '@/lib/demo-customization-storage';

describe('demo-customization-storage', () => {
  beforeEach(() => {
    clearDemoCustomization();
  });

  afterEach(() => {
    clearDemoCustomization();
  });

  it('persists and reads customization patches', () => {
    setDemoCustomization({
      onboardingFlowPropOverrides: { hideLinkedAccountRemoval: true },
      contentTokens: {
        name: 'enUS',
        tokens: { common: { errors: { footnote: 'x' } } },
      },
    });

    const stored = getDemoCustomization();
    expect(stored.onboardingFlowPropOverrides).toEqual({
      hideLinkedAccountRemoval: true,
    });
    expect(stored.contentTokens?.tokens).toEqual({
      common: { errors: { footnote: 'x' } },
    });
  });

  it('counts nested content token leaf overrides', () => {
    expect(
      countContentTokenOverrides({
        common: { errors: { footnote: 'a', title: 'b' } },
        onboarding: { hello: 'c' },
      })
    ).toBe(3);
  });

  it('flattens nested content tokens to namespace:path keys', () => {
    expect(
      flattenContentTokenOverrides({
        common: { errors: { footnote: 'a' } },
      })
    ).toEqual({ 'common:errors.footnote': 'a' });
  });

  it('counts theme overrides that differ from base', () => {
    expect(
      countThemeVariableOverrides(
        {
          primaryColor: '#111',
          borderRadius: '0.375rem',
        },
        {
          primaryColor: '#000',
          borderRadius: '0.375rem',
        }
      )
    ).toBe(1);
  });
});
