import { describe, expect, it } from 'vitest';

import {
  validateClientOverrideJson,
  validateClientPatchJson,
  validateEndpointOverridesJson,
} from '@/components/test-scenario/test-scenario-mock-json-validation';

describe('test-scenario-mock-json-validation', () => {
  it('validates client patch shape', () => {
    expect(validateClientPatchJson({ status: 'APPROVED' }).valid).toBe(true);
    expect(validateClientPatchJson({}).level).toBe('warning');
  });

  it('validates client override id matches seeded client', () => {
    expect(
      validateClientOverrideJson(
        { id: '3100006997', status: 'APPROVED' },
        '3100006997'
      ).valid
    ).toBe(true);
    expect(
      validateClientOverrideJson({ id: 'wrong' }, '3100006997').valid
    ).toBe(false);
  });

  it('validates endpoint override keys and payload shapes', () => {
    expect(
      validateEndpointOverridesJson({
        'GET /ef/do/v1/recipients': { recipients: [] },
      }).valid
    ).toBe(true);
    expect(
      validateEndpointOverridesJson({
        'GET /ef/do/v1/bad-path': {},
      }).valid
    ).toBe(false);
    expect(
      validateEndpointOverridesJson({
        'GET /ef/do/v1/recipients': { recipients: 'nope' },
      }).valid
    ).toBe(false);
  });
});
