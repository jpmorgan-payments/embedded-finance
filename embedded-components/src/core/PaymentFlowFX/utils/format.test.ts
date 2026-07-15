import { describe, expect, it } from 'vitest';

import { currencyToFlag, formatTargetCurrency, isFxCurrency } from './format';

describe('formatTargetCurrency', () => {
  it('formats EUR with two minor units', () => {
    expect(formatTargetCurrency(1234.5, 'EUR', 'en-US')).toBe('€1,234.50');
  });

  it('formats zero-decimal currencies (JPY) without minor units', () => {
    expect(formatTargetCurrency(1234, 'JPY', 'en-US')).toBe('¥1,234');
  });

  it('falls back to number + code for an unknown currency', () => {
    const result = formatTargetCurrency(1000, 'ZZZ', 'en-US');
    expect(result).toContain('ZZZ');
    expect(result).toContain('1,000');
  });
});

describe('currencyToFlag', () => {
  it('returns a flag emoji for a mapped currency', () => {
    // GBP -> GB flag
    expect(currencyToFlag('GBP')).toBe('🇬🇧');
  });

  it('returns empty string for EUR (no single-country flag)', () => {
    expect(currencyToFlag('EUR')).toBe('');
  });

  it('returns empty string for undefined/unknown currency', () => {
    expect(currencyToFlag(undefined)).toBe('');
    expect(currencyToFlag('ZZZ')).toBe('');
  });
});

describe('isFxCurrency', () => {
  it('is true for a supported non-USD currency', () => {
    expect(isFxCurrency('EUR', ['EUR', 'GBP'])).toBe(true);
  });

  it('is false for USD, undefined, or unsupported currency', () => {
    expect(isFxCurrency('USD', ['EUR'])).toBe(false);
    expect(isFxCurrency(undefined, ['EUR'])).toBe(false);
    expect(isFxCurrency('JPY', ['EUR'])).toBe(false);
  });
});
