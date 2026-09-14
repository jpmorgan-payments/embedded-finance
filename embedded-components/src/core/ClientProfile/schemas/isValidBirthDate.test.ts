import { describe, expect, test } from 'vitest';

import { isValidBirthDate } from './isValidBirthDate';

describe('isValidBirthDate', () => {
  const today = new Date('2026-09-02T12:00:00.000Z');

  test('accepts real dates on or before today', () => {
    expect(isValidBirthDate('1990-05-12', today)).toBe(true);
    expect(isValidBirthDate('2026-09-02', today)).toBe(true);
  });

  test('rejects malformed, impossible, and future dates', () => {
    expect(isValidBirthDate('2026-99-99', today)).toBe(false);
    expect(isValidBirthDate('2025-02-29', today)).toBe(false);
    expect(isValidBirthDate('09/02/1990', today)).toBe(false);
    expect(isValidBirthDate('2026-09-03', today)).toBe(false);
  });
});
