'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClientStatus } from '@ef-api/smbdo-schemas';
import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';

import { useQueryClient } from '@tanstack/react-query';

import { useSellSenseThemes } from '@/components/sellsense/use-sellsense-themes';
import {
  getTestScenarioBundleConfig,
  type TestScenarioBundleConfig,
} from '@/components/test-scenario/test-scenario-bundles';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';
import type { TestDemoScenarioMode, TestScenarioBundleId } from '@/msw/db';

export type TestScenarioPageProps = {
  bundleId: TestScenarioBundleId;
};

function themeString(
  variables: Record<string, string | undefined>,
  key: string,
  fallback: string
): string {
  const v = variables[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

export function TestScenarioPage({ bundleId }: TestScenarioPageProps) {
  const queryClient = useQueryClient();
  const { mapThemeOption } = useSellSenseThemes();
  const bundleConfig = useMemo(
    () => getTestScenarioBundleConfig(bundleId),
    [bundleId]
  );

  const [selectedEmail, setSelectedEmail] = useState(
    bundleConfig.loginProfiles[0].email
  );

  useEffect(() => {
    setSelectedEmail(bundleConfig.loginProfiles[0].email);
  }, [bundleConfig]);

  const [rememberUsername, setRememberUsername] = useState(false);
  const [sessionScenario, setSessionScenario] =
    useState<TestDemoScenarioMode | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const ebTheme = useMemo(
    () =>
      bundleConfig.themeVariables
        ? mapThemeOption('Custom', bundleConfig.themeVariables)
        : mapThemeOption(bundleConfig.theme, {}),
    [mapThemeOption, bundleConfig.theme, bundleConfig.themeVariables]
  );

  const themeVars = ebTheme.variables as Record<string, string | undefined>;
  const shellBg = themeString(
    themeVars,
    'containerPrimaryBackground',
    '#f6f7f8'
  );
  const shellFont = themeString(themeVars, 'contentFontFamily', 'Open Sans');
  const primaryBtn = themeString(
    themeVars,
    'actionableAccentedBoldBackground',
    '#1A7B99'
  );
  const saltLink = themeString(
    themeVars,
    'actionableSubtleForeground',
    '#1A7B99'
  );

  const selectedProfile =
    bundleConfig.loginProfiles.find((p) => p.email === selectedEmail) ??
    bundleConfig.loginProfiles[0];

  const onboardingFlow = bundleConfig.onboardingFlow;

  const sessionBundleConfig: TestScenarioBundleConfig | null = sessionScenario
    ? bundleConfig
    : null;

  const handleContinue = async () => {
    const bundlePayload =
      bundleConfig.id === 'test-scenario' ? undefined : bundleConfig.id;
    await DatabaseResetUtils.resetTestDemoDatabase(
      'empty',
      selectedProfile.scenario,
      setResetLoading,
      bundlePayload
    );
    queryClient.clear();
    setSessionScenario(selectedProfile.scenario);
  };

  const handleSignOut = () => {
    queryClient.clear();
    setSessionScenario(null);
  };

  const providerHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(sessionScenario ? { 'X-Test-Demo-Scenario': sessionScenario } : {}),
    }),
    [sessionScenario]
  );

  const activeClientId = sessionBundleConfig?.clientId;

  return (
    <EBComponentsProvider
      apiBaseUrl="/ef/do/v1/"
      theme={ebTheme}
      headers={providerHeaders}
      contentTokens={bundleConfig.contentTokens}
      clientId={activeClientId}
    >
      <div
        className="flex min-h-screen flex-col"
        style={{
          backgroundColor: shellBg,
          fontFamily: `${shellFont}, system-ui, sans-serif`,
        }}
      >
        {sessionScenario ? (
          <>
            <header className="flex min-h-[3.25rem] shrink-0 items-center justify-between border-b border-black/10 bg-white py-2.5 pl-5 pr-5 sm:min-h-[3.75rem] sm:py-3 sm:pl-6 sm:pr-6">
              <div className="inline-flex shrink-0 items-center rounded-md p-1.5 sm:p-2">
                <img
                  src="/logo-jpm-brown.svg"
                  alt="J.P. Morgan"
                  className="h-7 w-auto sm:h-8"
                />
              </div>
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="truncate text-base font-medium text-neutral-800"
                  title={sessionBundleConfig?.headerOrgDisplayName}
                >
                  {sessionBundleConfig?.headerOrgDisplayName}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-sm"
                  style={{ color: saltLink }}
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>
            </header>
            <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
              <div
                key={`${sessionScenario}-${selectedEmail}-${bundleConfig.id}`}
                className="mx-auto max-w-6xl"
              >
                <OnboardingFlow
                  availableProducts={
                    onboardingFlow?.availableProducts ?? ['EMBEDDED_PAYMENTS']
                  }
                  availableJurisdictions={
                    onboardingFlow?.availableJurisdictions ?? ['US']
                  }
                  availableOrganizationTypes={
                    onboardingFlow?.availableOrganizationTypes ?? [
                      'SOLE_PROPRIETORSHIP',
                      'LIMITED_LIABILITY_COMPANY',
                      'LIMITED_LIABILITY_PARTNERSHIP',
                      'GENERAL_PARTNERSHIP',
                      'LIMITED_PARTNERSHIP',
                      'C_CORPORATION',
                    ]
                  }
                  showLinkAccountStep={bundleConfig.showLinkAccountStep}
                  {...(bundleConfig.showLinkAccountStep
                    ? {
                        linkAccountEnabledStatuses:
                          sessionScenario === 'linked-account-approved' ||
                          sessionScenario === 'linked-account-active' ||
                          sessionScenario === 'happy-path-approved' ||
                          sessionScenario === 'multi-linked-start-3'
                            ? [ClientStatus.APPROVED]
                            : undefined,
                        linkAccountStepOptions:
                          selectedProfile.linkAccountStepOptions ??
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
                              completionMode: 'editable' as const,
                            },
                      }
                    : {})}
                  disclosureConfig={
                    onboardingFlow?.disclosureConfig ?? {
                      platformName: 'Platform, Inc.',
                    }
                  }
                  hideLinkedAccountRemoval={
                    onboardingFlow?.hideLinkedAccountRemoval ?? true
                  }
                  priorityIndustryCodes={onboardingFlow?.priorityIndustryCodes}
                />
                <footer className="mx-auto mt-4 max-w-4xl px-4 py-4 text-center sm:px-5">
                  <p className="text-xs leading-relaxed text-neutral-500">
                    Platform, Inc. is not a bank. Banking services provided by
                    JPMorgan Chase Bank, N.A., Member FDIC (&ldquo;J.P.
                    Morgan&rdquo;).
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                    Accounts are insured by the FDIC up to $250,000 per
                    depositor for each account ownership category; availability
                    of FDIC deposit insurance coverage protects against the
                    failure of J.P. Morgan, and not of Platform, Inc.
                  </p>
                </footer>
              </div>
            </main>
          </>
        ) : (
          <>
            <header className="flex min-h-[3.25rem] shrink-0 items-center border-b border-black/10 bg-white py-2.5 pl-5 pr-5 sm:min-h-[3.75rem] sm:py-3 sm:pl-6 sm:pr-6">
              <div className="inline-flex shrink-0 items-center rounded-md p-1.5 sm:p-2">
                <img
                  src="/logo-jpm-brown.svg"
                  alt="J.P. Morgan"
                  className="h-7 w-auto sm:h-8"
                />
              </div>
            </header>

            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
              <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-8 shadow-md">
                <div
                  className="mb-5 rounded-lg border px-3 py-3 text-sm"
                  style={{
                    borderColor: themeString(
                      themeVars,
                      'sentimentCautionAccentBackground',
                      '#FFECD9'
                    ),
                    backgroundColor: themeString(
                      themeVars,
                      'sentimentCautionAccentBackground',
                      '#FFECD9'
                    ),
                    color: themeString(
                      themeVars,
                      'sentimentCautionForeground',
                      '#C75300'
                    ),
                  }}
                  role="status"
                >
                  <p className="font-semibold leading-snug">
                    Mocked login (demo only)
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-90">
                    This page does not connect to real J.P. Morgan
                    authentication. The username list only picks a local mock
                    profile in the browser (MSW) so you can try onboarding flows
                    without credentials.
                  </p>
                </div>

                <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-[2rem]">
                  Log in
                </h1>

                <div className="mt-6 space-y-2">
                  <label
                    htmlFor="test-scenario-username"
                    className="text-xs text-neutral-500"
                  >
                    Username
                  </label>
                  <Select
                    value={selectedEmail}
                    onValueChange={setSelectedEmail}
                  >
                    <SelectTrigger
                      id="test-scenario-username"
                      className="h-auto min-h-11 w-full items-start gap-2 rounded-lg border-neutral-300 bg-white py-2.5 text-left [&>span]:min-w-0 [&>span]:flex-1"
                      disabled={resetLoading}
                    >
                      <SelectValue placeholder="Select a demo user">
                        <span className="flex min-w-0 flex-col gap-0.5 text-left">
                          <span className="truncate text-sm font-medium text-neutral-900">
                            {selectedProfile.email}
                          </span>
                          <span className="line-clamp-2 text-xs leading-snug text-neutral-500">
                            {selectedProfile.label}
                          </span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-w-[min(100vw-2rem,28rem)]">
                      {bundleConfig.loginProfiles.map((p) => (
                        <SelectItem
                          key={p.email}
                          value={p.email}
                          className="items-start py-2"
                        >
                          <div className="flex min-w-0 flex-col gap-0.5 pr-1">
                            <span className="truncate font-medium text-neutral-900">
                              {p.email}
                            </span>
                            <span className="whitespace-normal text-left text-xs leading-snug text-neutral-500">
                              {p.label}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberUsername}
                    onChange={(e) => setRememberUsername(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300"
                    style={{ accentColor: primaryBtn }}
                  />
                  <span className="text-sm text-neutral-900">
                    Remember username
                  </span>
                </label>

                <button
                  type="button"
                  disabled={resetLoading}
                  className="mt-6 h-11 w-full rounded-lg text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
                  style={{ backgroundColor: primaryBtn }}
                  onClick={handleContinue}
                >
                  {resetLoading ? 'Loading…' : 'Continue'}
                </button>

                <div className="mt-6 text-right">
                  <button
                    type="button"
                    className="text-xs font-medium uppercase tracking-wide hover:underline"
                    style={{ color: saltLink }}
                  >
                    Need help logging in?
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </EBComponentsProvider>
  );
}
