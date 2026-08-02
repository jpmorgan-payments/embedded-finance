import { describe, expect, it } from 'vitest';

import {
  applyCompactKeyChange,
  COMPACT_THEME_DEFAULTS,
  darkenHex,
  deriveCompactTheme,
  expandCompactTheme,
  getExpandedKeysForCompact,
  pickContrastingForeground,
} from './compact-theme-tokens';

describe('compact-theme-tokens', () => {
  it('darkens hex colors toward black', () => {
    expect(darkenHex('#ffffff', 0)).toBe('#ffffff');
    expect(darkenHex('#0060f0', 0.1)).not.toBe('#0060f0');
    expect(darkenHex('not-a-color', 0.1)).toBe('not-a-color');
  });

  it('picks contrasting foreground for light and dark backgrounds', () => {
    expect(pickContrastingForeground('#ffffff')).toBe('#111827');
    expect(pickContrastingForeground('#111827')).toBe('#ffffff');
  });

  it('expands primaryColor into button, accent, and info Salt tokens', () => {
    const expanded = expandCompactTheme({ primaryColor: '#1B7F9E' });
    expect(expanded.actionableAccentedBoldBackground).toBe('#1B7F9E');
    expect(expanded.actionableAccentedBoldBackgroundHover).toBeDefined();
    expect(expanded.actionableSubtleForeground).toBe('#1B7F9E');
    expect(expanded.contentAccentForeground).toBe('#1B7F9E');
    expect(expanded.statusInfoForeground).toBe('#1B7F9E');
    expect(expanded.focusedRingColor).toBeUndefined();
  });

  it('expands each compact key independently', () => {
    expect(expandCompactTheme({ ringColor: '#abc123' }).focusedRingColor).toBe(
      '#abc123'
    );
    expect(expandCompactTheme({ fontFamily: 'Inter' }).contentFontFamily).toBe(
      'Inter'
    );
    expect(
      expandCompactTheme({ fontFamily: 'Inter' }).actionableFontFamily
    ).toBe('Inter');
    expect(
      expandCompactTheme({ borderRadius: '8px' }).separableBorderRadius
    ).toBe('8px');
    expect(
      expandCompactTheme({ buttonBorderRadius: '9999px' })
        .actionableBorderRadius
    ).toBe('9999px');
    expect(
      expandCompactTheme({ destructiveColor: '#dc2626' })
        .actionableNegativeBoldBackground
    ).toBe('#dc2626');
    expect(
      expandCompactTheme({ borderColor: '#e5e7eb' }).separableBorderColor
    ).toBe('#e5e7eb');
  });

  it('derives compact tokens from Salt semantic variables', () => {
    const compact = deriveCompactTheme({
      actionableAccentedBoldBackground: '#0047ab',
      focusedRingColor: '#0060f0',
      actionableNegativeBoldBackground: '#b91c1c',
      separableBorderColor: '#cbd5e1',
      contentFontFamily: 'Geist',
      separableBorderRadius: '8px',
      actionableBorderRadius: '4px',
    });
    expect(compact.primaryColor).toBe('#0047ab');
    expect(compact.ringColor).toBe('#0060f0');
    expect(compact.destructiveColor).toBe('#b91c1c');
    expect(compact.borderColor).toBe('#cbd5e1');
    expect(compact.fontFamily).toBe('Geist');
    expect(compact.borderRadius).toBe('8px');
    expect(compact.buttonBorderRadius).toBe('4px');
  });

  it('falls back to legacy ebDesignTokens names when Salt keys are absent', () => {
    const compact = deriveCompactTheme({
      primaryColor: '#1B7F9E',
      ringColor: '#1B7F9E',
      destructiveColor: '#dc2626',
      borderColor: '#e5e7eb',
      fontFamily: 'Open Sans, system-ui, sans-serif',
      borderRadius: '0.375rem',
      buttonBorderRadius: '0.375rem',
    });
    expect(compact).toEqual({
      primaryColor: '#1B7F9E',
      ringColor: '#1B7F9E',
      destructiveColor: '#dc2626',
      borderColor: '#e5e7eb',
      fontFamily: 'Open Sans, system-ui, sans-serif',
      borderRadius: '0.375rem',
      buttonBorderRadius: '0.375rem',
    });
  });

  it('uses hosted defaults when variables are empty', () => {
    expect(deriveCompactTheme({})).toEqual(COMPACT_THEME_DEFAULTS);
  });

  it('applies one compact key without wiping unrelated overrides', () => {
    const current = {
      contentFontFamily: 'Geist',
      actionableAccentedBoldBackground: '#111111',
    };
    const next = applyCompactKeyChange(current, 'primaryColor', '#1B7F9E');
    expect(next.contentFontFamily).toBe('Geist');
    expect(next.actionableAccentedBoldBackground).toBe('#1B7F9E');
  });

  it('reports expanded Salt keys per compact key', () => {
    const keys = getExpandedKeysForCompact('primaryColor');
    expect(keys).toContain('actionableAccentedBoldBackground');
    expect(keys.length).toBeGreaterThan(5);
  });
});
