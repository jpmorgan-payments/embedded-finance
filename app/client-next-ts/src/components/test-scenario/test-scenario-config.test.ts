import { describe, expect, it } from 'vitest';

import {
  buildMockResetPayload,
  buildTestScenarioPlayUrl,
  createDefaultTestScenarioConfig,
  decodeTestScenarioConfig,
  encodeTestScenarioConfig,
  getDefaultLoginCaseForPreset,
  resolveLayoutKind,
  resolveTestScenarioConfig,
} from '@/components/test-scenario/test-scenario-config';

describe('test-scenario-config', () => {
  it('encodes and decodes v2 base64 JSON configs', () => {
    const config = createDefaultTestScenarioConfig('construction');
    const encoded = encodeTestScenarioConfig(config);
    expect(decodeTestScenarioConfig(encoded)).toMatchObject(config);
    expect(buildTestScenarioPlayUrl(config)).toBe(
      `/test-scenario/play#${encoded}`
    );
  });

  it('supports custom login cases and mock overrides', () => {
    const config = {
      version: 2 as const,
      preset: 'operator80' as const,
      loginCases: [
        {
          id: 'custom-1',
          email: 'custom@demo.test',
          label: 'Custom profile',
          scenario: 'doc-request' as const,
          layout: 'onboarding' as const,
        },
      ],
      loginCaseId: 'custom-1',
      mocks: {
        clientPatch: { status: 'INFORMATION_REQUESTED' },
        endpoints: {
          'GET /ef/do/v1/recipients': { recipients: [] },
        },
      },
      components: {
        onboarding: { enablePubliclyTradedCompanies: true },
      },
    };

    const encoded = encodeTestScenarioConfig(config);
    const decoded = decodeTestScenarioConfig(encoded);
    expect(decoded).toMatchObject(config);

    const resolved = resolveTestScenarioConfig(config);
    expect(resolved.loginProfile.email).toBe('custom@demo.test');
    expect(resolved.mockReset.clientPatch).toEqual({
      status: 'INFORMATION_REQUESTED',
    });
    expect(resolved.onboardingProps.enablePubliclyTradedCompanies).toBe(true);
  });

  it('syncs custom header org name into mock reset payload', () => {
    const payload = buildMockResetPayload('3100006997', undefined, {
      orgDisplayName: 'My Custom Org, LLC',
      presetOrgDisplayName: 'Operator 80 Palo Alto CA',
    });
    expect(payload.orgDisplayName).toBe('My Custom Org, LLC');

    const unchanged = buildMockResetPayload('3100006997', undefined, {
      orgDisplayName: 'Operator 80 Palo Alto CA',
      presetOrgDisplayName: 'Operator 80 Palo Alto CA',
    });
    expect(unchanged.orgDisplayName).toBeUndefined();
  });

  it('builds client override key for full mock replacement', () => {
    const payload = buildMockResetPayload('3100006997', {
      client: { id: '3100006997', status: 'APPROVED' },
    });
    expect(payload.overrides['GET /ef/do/v1/clients/3100006997']).toEqual({
      id: '3100006997',
      status: 'APPROVED',
    });
  });

  it('still decodes legacy v1 compact hash payloads', () => {
    expect(decodeTestScenarioConfig('o2.hp')).toEqual({
      preset: 'construction',
      loginCase: 'happy-path',
    });
  });

  it('rejects invalid preset/login combinations in legacy format', () => {
    expect(decodeTestScenarioConfig('o1.ptc')).toBeNull();
    expect(decodeTestScenarioConfig('')).toBeNull();
  });

  it('resolves layout from login case', () => {
    expect(resolveLayoutKind('naics-codes-dashboard')).toBe('dashboard');
    expect(resolveLayoutKind('happy-path')).toBe('onboarding');
  });

  it('maps preset to bundle and login profile', () => {
    const resolved = resolveTestScenarioConfig({
      preset: 'logistics',
      loginCase: 'happy-path-ptc',
    });
    expect(resolved.bundleId).toBe('test-scenario-4');
    expect(resolved.loginProfile.email).toBe('happy-path-ptc@demo.test');
  });

  it('defaults login case per preset', () => {
    expect(getDefaultLoginCaseForPreset('fundManagement')).toBe(
      'naics-codes-onboarding'
    );
  });
});
