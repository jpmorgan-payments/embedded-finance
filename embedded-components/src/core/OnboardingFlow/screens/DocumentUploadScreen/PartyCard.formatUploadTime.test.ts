import { describe, expect, test } from 'vitest';

import { formatPartyCardUploadTime } from './PartyCard';

describe('formatPartyCardUploadTime', () => {
  test('returns empty string for empty input', () => {
    expect(formatPartyCardUploadTime('')).toBe('');
  });

  test('returns raw string when timestamp is not parseable', () => {
    expect(formatPartyCardUploadTime('not-an-iso-date')).toBe(
      'not-an-iso-date'
    );
  });

  test('formats valid ISO timestamps', () => {
    const out = formatPartyCardUploadTime('2024-01-15T14:30:00.000Z');
    expect(out.length).toBeGreaterThan(4);
    expect(out).toMatch(/2024/);
  });
});
