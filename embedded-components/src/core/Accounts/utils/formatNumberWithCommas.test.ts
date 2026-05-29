import { describe, expect, test } from 'vitest';

import { formatNumberWithCommas } from './formatNumberWithCommas';

describe('formatNumberWithCommas', () => {
  test('formats whole numbers correctly', () => {
    const result = formatNumberWithCommas(1000);
    expect(result.whole).toBe('1,000');
    expect(result.decimal).toBe('00');
  });

  test('formats decimal numbers correctly', () => {
    const result = formatNumberWithCommas(5558.42);
    expect(result.whole).toBe('5,558');
    expect(result.decimal).toBe('42');
  });

  test('formats large numbers correctly', () => {
    const result = formatNumberWithCommas(1234567.89);
    expect(result.whole).toBe('1,234,567');
    expect(result.decimal).toBe('89');
  });

  test('formats small numbers correctly', () => {
    const result = formatNumberWithCommas(42.5);
    expect(result.whole).toBe('42');
    expect(result.decimal).toBe('50');
  });

  test('formats zero correctly', () => {
    const result = formatNumberWithCommas(0);
    expect(result.whole).toBe('0');
    expect(result.decimal).toBe('00');
  });

  test('formats negative numbers correctly', () => {
    const result = formatNumberWithCommas(-1234.56);
    expect(result.whole).toBe('-1,234');
    expect(result.decimal).toBe('56');
  });

  test('uses default en-US locale when not provided', () => {
    const result = formatNumberWithCommas(1234.56);
    expect(result.whole).toBe('1,234');
    expect(result.decimal).toBe('56');
  });

  test('formats with fr-CA locale correctly', () => {
    const result = formatNumberWithCommas(1234.56, 'fr-CA');
    // French-Canadian uses space as thousands separator
    expect(result.whole).toBe('1\u00a0234'); // \u00a0 is non-breaking space
    expect(result.decimal).toBe('56');
  });

  test('formats with es-US locale correctly', () => {
    const result = formatNumberWithCommas(1234.56, 'es-US');
    // Spanish-US uses comma as thousands separator (same as en-US)
    expect(result.whole).toBe('1,234');
    expect(result.decimal).toBe('56');
  });
});
