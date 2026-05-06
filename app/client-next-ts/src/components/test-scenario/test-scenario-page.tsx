'use client';

import { useMemo, useState } from 'react';
import { ClientStatus } from '@ef-api/smbdo-schemas';
import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';

import { useSellSenseThemes } from '@/components/sellsense/use-sellsense-themes';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';
import { TEST_DEMO_SCENARIO_CLIENT_ID } from '@/mocks/testScenarioOperator80Client.mock';
import type { TestDemoScenarioMode } from '@/msw/db';

const TEST_CLIENT_ID = TEST_DEMO_SCENARIO_CLIENT_ID;

/** Matches Operator 80 prepopulated story org (`testScenarioOperator80Client`). */
const TEST_SCENARIO_CLIENT_DISPLAY_NAME = 'Operator 80 Palo Alto CA';

/**
 * Matches Core/OnboardingFlow Prepopulated story — Operator 80 — Prepopulated LLC:
 * content token overrides and disclosure / link-account options.
 */
const TEST_SCENARIO_CONTENT_TOKENS = {
  name: 'enUS' as const,
  showTokenIds: true,
  tokens: {
    'onboarding-overview': {
      fields: {
        controllerJobTitle: {
          label: 'Occupation',
        },
        controllerJobTitleDescription: {
          label: 'Occupation Description',
        },
      },
    },
  },
};

const TEST_SCENARIO_DISCLOSURE_CONFIG = {
  platformName: 'Platform, Inc.',
} as const;

const TEST_SCENARIO_LINK_ACCOUNT_OPTIONS = {
  initialValues: {},
  completionMode: 'editable' as const,
};

const LOGIN_PROFILES: {
  email: string;
  label: string;
  scenario: TestDemoScenarioMode;
}[] = [
  {
    email: 'happy-path@demo.test',
    label: 'Happy path — prefilled onboarding',
    scenario: 'happy-path',
  },
  {
    email: 'docs-requested@demo.test',
    label: 'Documents requested — supporting docs',
    scenario: 'doc-request',
  },
  {
    email: 'linked-approved@demo.test',
    label: 'Linked account fast track — APPROVED client',
    scenario: 'linked-account-approved',
  },
];

function themeString(
  variables: Record<string, string | undefined>,
  key: string,
  fallback: string
): string {
  const v = variables[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

export function TestScenarioPage() {
  const { mapThemeOption } = useSellSenseThemes();
  const [selectedEmail, setSelectedEmail] = useState(LOGIN_PROFILES[0].email);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [sessionScenario, setSessionScenario] =
    useState<TestDemoScenarioMode | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const ebTheme = useMemo(
    () => mapThemeOption('Salt Theme', {}),
    [mapThemeOption]
  );

  const themeVars = ebTheme.variables as Record<string, string | undefined>;
  const shellBg = themeString(
    themeVars,
    'containerPrimaryBackground',
    '#f6f7f8'
  );
  const shellFont = themeString(themeVars, 'contentFontFamily', 'Open Sans');
  const saltPrimary = themeString(
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
    LOGIN_PROFILES.find((p) => p.email === selectedEmail) ?? LOGIN_PROFILES[0];

  const handleContinue = async () => {
    await DatabaseResetUtils.resetTestDemoDatabase(
      'empty',
      selectedProfile.scenario,
      setResetLoading
    );
    setSessionScenario(selectedProfile.scenario);
  };

  const handleSignOut = () => {
    setSessionScenario(null);
  };

  const providerHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(sessionScenario ? { 'X-Test-Demo-Scenario': sessionScenario } : {}),
    }),
    [sessionScenario]
  );

  return (
    <EBComponentsProvider
      apiBaseUrl="/ef/do/v1/"
      theme={ebTheme}
      headers={providerHeaders}
      contentTokens={TEST_SCENARIO_CONTENT_TOKENS}
      clientId={sessionScenario ? TEST_CLIENT_ID : undefined}
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
                  title={TEST_SCENARIO_CLIENT_DISPLAY_NAME}
                >
                  {TEST_SCENARIO_CLIENT_DISPLAY_NAME}
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
                key={`${sessionScenario}-${selectedEmail}`}
                className="mx-auto max-w-6xl"
              >
                <OnboardingFlow
                  availableProducts={['EMBEDDED_PAYMENTS']}
                  availableJurisdictions={['US']}
                  availableOrganizationTypes={[
                    'SOLE_PROPRIETORSHIP',
                    'LIMITED_LIABILITY_COMPANY',
                    'LIMITED_LIABILITY_PARTNERSHIP',
                    'GENERAL_PARTNERSHIP',
                    'LIMITED_PARTNERSHIP',
                    'C_CORPORATION',
                  ]}
                  showLinkAccountStep
                  linkAccountEnabledStatuses={
                    sessionScenario === 'linked-account-approved'
                      ? [ClientStatus.APPROVED]
                      : undefined
                  }
                  linkAccountStepOptions={TEST_SCENARIO_LINK_ACCOUNT_OPTIONS}
                  disclosureConfig={TEST_SCENARIO_DISCLOSURE_CONFIG}
                />
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
                      className="h-11 w-full rounded-lg border-neutral-300 bg-white"
                      disabled={resetLoading}
                    >
                      <SelectValue placeholder="Select a demo user" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGIN_PROFILES.map((p) => (
                        <SelectItem key={p.email} value={p.email}>
                          <span className="block font-medium">{p.email}</span>
                          <span className="block text-xs text-neutral-500">
                            {p.label}
                          </span>
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
                    style={{ accentColor: saltPrimary }}
                  />
                  <span className="text-sm text-neutral-900">
                    Remember username
                  </span>
                </label>

                <button
                  type="button"
                  disabled={resetLoading}
                  className="mt-6 h-11 w-full rounded-lg text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
                  style={{ backgroundColor: saltPrimary }}
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
