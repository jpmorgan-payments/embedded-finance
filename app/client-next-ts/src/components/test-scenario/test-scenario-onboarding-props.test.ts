import { describe, expect, it } from 'vitest';

import {
  createDefaultTestScenarioConfig,
  resolveTestScenarioConfig,
} from '@/components/test-scenario/test-scenario-config';
import { buildOnboardingFlowProps } from '@/components/test-scenario/test-scenario-onboarding-props';

describe('buildOnboardingFlowProps', () => {
  it('locks the prepopulated business fields except the business address', () => {
    const resolved = resolveTestScenarioConfig(
      createDefaultTestScenarioConfig('operator80')
    );

    const props = buildOnboardingFlowProps({
      bundleConfig: resolved.bundleConfig,
      sessionScenario: resolved.loginProfile.scenario,
      activeLoginCase: resolved.activeLoginCase,
      onboardingProps: resolved.onboardingProps,
    });

    expect(props.readonlyFields).toEqual({
      fields: [
        'organizationTypeHierarchy',
        'organizationName',
        'dbaName',
        'organizationIdEin',
        'organizationDescription',
        'industry',
      ],
      mode: 'whenPopulated',
    });
    expect((props.readonlyFields as { fields: string[] }).fields).not.toContain(
      'organizationAddress'
    );
  });
});
