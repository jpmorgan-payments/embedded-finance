import { describe, expect, it } from 'vitest';

import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats USD with two decimals by default', () => {
    expect(formatCurrency(25)).toBe('$25.00');
  });

  it('adds thousands separators', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-5.5)).toBe('-$5.50');
  });

  it('honors an explicit currency code', () => {
    const eur = formatCurrency(25, 'EUR');
    expect(eur).toContain('25.00');
    expect(eur).not.toContain('$');
  });
});
