import { ClientStatus } from '@ef-api/smbdo-schemas';

import type { TestScenarioBundleConfig } from '@/components/test-scenario/test-scenario-bundles';
import type {
  ResolvedTestScenarioConfig,
  TestScenarioLoginCaseConfig,
} from '@/components/test-scenario/test-scenario-config';
import type { TestDemoScenarioMode } from '@/msw/db';

export function shouldShowDashboardForSession(
  layout: ResolvedTestScenarioConfig['layout'],
  sessionScenario: TestDemoScenarioMode
): boolean {
  if (layout === 'dashboard') return true;
  return sessionScenario === 'naics-codes-dashboard';
}

export function buildOnboardingFlowProps(args: {
  bundleConfig: TestScenarioBundleConfig;
  sessionScenario: TestDemoScenarioMode;
  activeLoginCase: TestScenarioLoginCaseConfig;
  onboardingProps: Record<string, unknown>;
}): Record<string, unknown> {
  const { bundleConfig, sessionScenario, activeLoginCase, onboardingProps } =
    args;

  const profileOnboarding = activeLoginCase.onboardingFlow;
  const bundleOnboarding = bundleConfig.onboardingFlow;
  const showLinkAccountStep = bundleConfig.showLinkAccountStep;

  const base: Record<string, unknown> = {
    availableProducts: bundleOnboarding?.availableProducts ?? [
      'EMBEDDED_PAYMENTS',
    ],
    availableJurisdictions: bundleOnboarding?.availableJurisdictions ?? ['US'],
    availableOrganizationTypes: profileOnboarding?.availableOrganizationTypes ??
      bundleOnboarding?.availableOrganizationTypes ?? [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
        'LIMITED_LIABILITY_PARTNERSHIP',
        'GENERAL_PARTNERSHIP',
        'LIMITED_PARTNERSHIP',
        'C_CORPORATION',
      ],
    showLinkAccountStep,
    disclosureConfig: bundleOnboarding?.disclosureConfig ?? {
      platformName: 'Platform, Inc.',
    },
    hideLinkedAccountRemoval:
      bundleOnboarding?.hideLinkedAccountRemoval ?? true,
    enablePubliclyTradedCompanies:
      profileOnboarding?.enablePubliclyTradedCompanies ??
      bundleOnboarding?.enablePubliclyTradedCompanies ??
      false,
    priorityIndustryCodes: bundleOnboarding?.priorityIndustryCodes,
    ...onboardingProps,
  };

  if (!showLinkAccountStep) return base;

  return {
    ...base,
    linkAccountEnabledStatuses:
      sessionScenario === 'linked-account-approved' ||
      sessionScenario === 'linked-account-active' ||
      sessionScenario === 'happy-path-approved' ||
      sessionScenario === 'multi-linked-start-3'
        ? [ClientStatus.APPROVED]
        : undefined,
    linkAccountStepOptions: activeLoginCase.linkAccountStepOptions ??
      bundleConfig.linkAccountStepOptions ?? {
        initialValues: {
          paymentTypes: ['ACH'],
          routingNumbers: [
            {
              paymentType: 'ACH',
              routingNumber: '121000248',
            },
          ],
          accountNumber: '6724301068',
        },
        completionMode: 'editable',
      },
  };
}
