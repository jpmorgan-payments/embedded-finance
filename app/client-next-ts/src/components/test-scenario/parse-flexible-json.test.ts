import { describe, expect, it } from 'vitest';

import {
  formatFlexibleJsonSuccess,
  parseFlexibleJsonObject,
} from '@/components/test-scenario/parse-flexible-json';

describe('parseFlexibleJsonObject', () => {
  it('parses strict JSON', () => {
    const result = parseFlexibleJsonObject('{"status":"APPROVED"}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('json');
      expect(result.parsed.status).toBe('APPROVED');
    }
  });

  it('parses TS-style object literals with unquoted keys and single quotes', () => {
    const result = parseFlexibleJsonObject(`{
      priorityIndustryCodes: ['722513'],
      disclosureConfig: { platformName: 'Platform, Inc.' },
    }`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('json5');
      expect(result.parsed.disclosureConfig).toEqual({
        platformName: 'Platform, Inc.',
      });
    }
  });

  it('strips const assignment wrappers from pasted TS', () => {
    const result = parseFlexibleJsonObject(
      `const onboardingFlow = { enablePubliclyTradedCompanies: true };`
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.enablePubliclyTradedCompanies).toBe(true);
    }
  });

  it('wraps bare property lists', () => {
    const result = parseFlexibleJsonObject(
      `status: 'APPROVED',\noutstanding: { questionIds: [] }`
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.status).toBe('APPROVED');
    }
  });

  it('returns detailed errors for invalid syntax', () => {
    const result = parseFlexibleJsonObject(`{
      status: APPROVED,
    }`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Relaxed JSON');
      expect(result.hint).toContain('Strict JSON');
    }
  });

  it('rejects arrays at the top level', () => {
    const result = parseFlexibleJsonObject('["a"]');
    expect(result.ok).toBe(false);
  });

  it('formats success labels', () => {
    expect(formatFlexibleJsonSuccess('json')).toContain('Valid JSON');
    expect(formatFlexibleJsonSuccess('json5')).toContain('TS/JS');
  });
});
