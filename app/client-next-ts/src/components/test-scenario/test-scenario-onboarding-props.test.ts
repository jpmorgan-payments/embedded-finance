import { describe, expect, it } from 'vitest';

import { TEST_SCENARIO_CORP_ORGANIZATION_TYPES } from '@/components/test-scenario/test-scenario-bundles';
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

  it('lets the selected login override PTC without shrinking corp org types', () => {
    const resolved = resolveTestScenarioConfig(
      createDefaultTestScenarioConfig('health')
    );
    const happyPathCase = resolved.loginCases.find(
      (item) => item.email === 'happy-path@demo.test'
    );
    const ptcCase = resolved.loginCases.find(
      (item) => item.email === 'happy-path-ptc@demo.test'
    );
    expect(happyPathCase).toBeDefined();
    expect(ptcCase).toBeDefined();

    const happyPathProps = buildOnboardingFlowProps({
      bundleConfig: resolved.bundleConfig,
      sessionScenario: 'happy-path',
      activeLoginCase: happyPathCase!,
      onboardingProps: resolved.onboardingProps,
    });
    const ptcProps = buildOnboardingFlowProps({
      bundleConfig: resolved.bundleConfig,
      sessionScenario: 'happy-path-ptc',
      activeLoginCase: ptcCase!,
      onboardingProps: resolved.onboardingProps,
    });

    expect(happyPathProps.availableOrganizationTypes).toEqual([
      ...TEST_SCENARIO_CORP_ORGANIZATION_TYPES,
    ]);
    expect(ptcProps.availableOrganizationTypes).toEqual([
      ...TEST_SCENARIO_CORP_ORGANIZATION_TYPES,
    ]);
    expect(happyPathProps.enablePubliclyTradedCompanies).toBe(false);
    expect(ptcProps.enablePubliclyTradedCompanies).toBe(true);
  });
});
