import { describe, expect, it } from 'vitest';

import { generateTransactionReferenceId } from './referenceId';

describe('generateTransactionReferenceId', () => {
  it('starts with the PHUI_ prefix', () => {
    expect(generateTransactionReferenceId()).toMatch(/^PHUI_/);
  });

  it('never exceeds the API max of 35 chars', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(generateTransactionReferenceId().length).toBeLessThanOrEqual(35);
    }
  });

  it('matches the allowed [_0-9A-Za-z] pattern (no dashes)', () => {
    const id = generateTransactionReferenceId();
    expect(id).toMatch(/^[_0-9A-Za-z]+$/);
    expect(id).not.toContain('-');
  });

  it('produces unique ids', () => {
    const ids = new Set(
      Array.from({ length: 500 }, () => generateTransactionReferenceId())
    );
    expect(ids.size).toBe(500);
  });
});
