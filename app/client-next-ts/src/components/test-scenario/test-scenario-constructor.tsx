'use client';

import { useMemo, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';

import { MOCK_API_EDITOR_ENDPOINTS } from '@/components/sellsense/mock-api-editor-config';
import {
  buildTestScenarioPlayUrl,
  createDefaultTestScenarioConfig,
  getPresetMeta,
  resolveLayoutForLoginCase,
  resolveTestScenarioConfig,
  TEST_SCENARIO_PRESETS,
  type TestScenarioConfig,
  type TestScenarioLoginCaseConfig,
  type TestScenarioPresetId,
} from '@/components/test-scenario/test-scenario-config';
import { TestScenarioJsonField } from '@/components/test-scenario/test-scenario-json-field';
import { TestScenarioLoginCasesEditor } from '@/components/test-scenario/test-scenario-login-cases-editor';
import type { JsonValidationResult } from '@/components/test-scenario/test-scenario-mock-json-validation';
import {
  validateClientOverrideJson,
  validateClientPatchJson,
  validateEndpointOverridesJson,
} from '@/components/test-scenario/test-scenario-mock-json-validation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ENDPOINT_KEY_HINTS = MOCK_API_EDITOR_ENDPOINTS.map(
  (endpoint) => `GET ${endpoint.pathPattern}`
).join('\n');

function stringifyJson(value: unknown): string {
  if (
    !value ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  ) {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

export function TestScenarioConstructor() {
  const [config, setConfig] = useState<TestScenarioConfig>(() =>
    createDefaultTestScenarioConfig('operator80')
  );
  const [copied, setCopied] = useState(false);

  const [clientPatchJson, setClientPatchJson] = useState('');
  const [clientOverrideJson, setClientOverrideJson] = useState('');
  const [endpointOverridesJson, setEndpointOverridesJson] = useState('');
  const [onboardingPropsJson, setOnboardingPropsJson] = useState('');
  const [dashboardPropsJson, setDashboardPropsJson] = useState('');
  const [uiOnboardingJson, setUiOnboardingJson] = useState('');
  const [mockValidation, setMockValidation] = useState({
    clientPatch: null as JsonValidationResult | null,
    clientOverride: null as JsonValidationResult | null,
    endpoints: null as JsonValidationResult | null,
  });

  const presetMeta = useMemo(
    () => getPresetMeta(config.preset),
    [config.preset]
  );
  const resolved = useMemo(() => resolveTestScenarioConfig(config), [config]);
  const playUrl = useMemo(() => buildTestScenarioPlayUrl(config), [config]);
  const hasMockValidationErrors = Object.values(mockValidation).some(
    (result) => result?.valid === false
  );
  const absolutePlayUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${playUrl}`
      : playUrl;

  const updateConfig = (patch: Partial<TestScenarioConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  const handlePresetChange = (preset: TestScenarioPresetId) => {
    setConfig(createDefaultTestScenarioConfig(preset));
    setClientPatchJson('');
    setClientOverrideJson('');
    setEndpointOverridesJson('');
    setOnboardingPropsJson('');
    setDashboardPropsJson('');
    setUiOnboardingJson('');
    setMockValidation({
      clientPatch: null,
      clientOverride: null,
      endpoints: null,
    });
  };

  const setMockValidationResult = (
    field: keyof typeof mockValidation,
    result: JsonValidationResult | null
  ) => {
    setMockValidation((current) => ({ ...current, [field]: result }));
  };

  const handleLoginCasesChange = (
    loginCases: TestScenarioLoginCaseConfig[]
  ) => {
    updateConfig({
      loginCases,
      loginCaseId: loginCases[0]?.id,
      loginCase: loginCases[0]?.scenario,
    });
  };

  const syncMocks = (
    patch: Partial<NonNullable<TestScenarioConfig['mocks']>>
  ) => {
    updateConfig({
      mocks: {
        ...(config.mocks ?? {}),
        ...patch,
      },
    });
  };

  const syncComponents = (
    patch: Partial<NonNullable<TestScenarioConfig['components']>>
  ) => {
    updateConfig({
      components: {
        ...(config.components ?? {}),
        ...patch,
      },
    });
  };

  const syncUi = (patch: Partial<NonNullable<TestScenarioConfig['ui']>>) => {
    updateConfig({
      ui: {
        ...(config.ui ?? {}),
        ...patch,
      },
    });
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(absolutePlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleLaunch = () => {
    window.location.assign(playUrl);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Test scenario builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Configure a demo
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Compose login cases, MSW mock payloads, and embedded component props.
          The full configuration is encoded as base64 JSON in the play URL hash.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="ts-preset"
              className="text-sm font-medium text-neutral-900"
            >
              Base organization mock
            </label>
            <Select
              value={config.preset}
              onValueChange={(value) =>
                handlePresetChange(value as TestScenarioPresetId)
              }
            >
              <SelectTrigger id="ts-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_SCENARIO_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              {presetMeta.orgDisplayName}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ts-default-login"
              className="text-sm font-medium text-neutral-900"
            >
              Default login case
            </label>
            <Select
              value={config.loginCaseId ?? config.loginCases?.[0]?.id}
              onValueChange={(value) => updateConfig({ loginCaseId: value })}
            >
              <SelectTrigger id="ts-default-login">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(config.loginCases ?? []).map((loginCase) => (
                  <SelectItem key={loginCase.id} value={loginCase.id}>
                    {loginCase.email} — {loginCase.scenario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={['login', 'ui', 'mocks']}>
          <AccordionItem value="login">
            <AccordionTrigger className="text-sm font-semibold text-neutral-900">
              Login cases
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <TestScenarioLoginCasesEditor
                loginCases={config.loginCases ?? []}
                onChange={handleLoginCasesChange}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ui">
            <AccordionTrigger className="text-sm font-semibold text-neutral-900">
              Shell &amp; onboarding defaults
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Header organization name
                </label>
                <p className="text-xs text-neutral-500">
                  Updates the shell header and syncs{' '}
                  <span className="font-mono">organizationName</span> on the
                  seeded CLIENT organization party after reset.
                </p>
                <Input
                  value={config.ui?.headerOrgDisplayName ?? ''}
                  placeholder={presetMeta.orgDisplayName}
                  onChange={(e) =>
                    syncUi({
                      headerOrgDisplayName: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Show link account step
                  </p>
                  <p className="text-xs text-neutral-500">
                    Overrides preset default ({presetMeta.linkAccountMode})
                  </p>
                </div>
                <Switch
                  checked={
                    config.ui?.showLinkAccountStep ??
                    resolved.bundleConfig.showLinkAccountStep
                  }
                  onCheckedChange={(checked) =>
                    syncUi({ showLinkAccountStep: checked })
                  }
                />
              </div>

              <TestScenarioJsonField
                id="ui-onboarding-flow"
                optional
                label="Bundle onboarding flow props"
                description="Merged into OnboardingFlow for every login (e.g. priorityIndustryCodes, disclosureConfig)."
                value={
                  uiOnboardingJson || stringifyJson(config.ui?.onboardingFlow)
                }
                onChange={(value, parsed) => {
                  setUiOnboardingJson(value);
                  syncUi({ onboardingFlow: parsed ?? undefined });
                }}
                placeholder='{"priorityIndustryCodes":["722513"]}'
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="components">
            <AccordionTrigger className="text-sm font-semibold text-neutral-900">
              Component props
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <TestScenarioJsonField
                id="onboarding-props"
                optional
                label="OnboardingFlow props"
                description="Spread onto OnboardingFlow after bundle/login defaults (showLinkAccountStep, linkAccountStepOptions, enablePubliclyTradedCompanies, etc.)."
                value={
                  onboardingPropsJson ||
                  stringifyJson(config.components?.onboarding)
                }
                onChange={(value, parsed) => {
                  setOnboardingPropsJson(value);
                  syncComponents({ onboarding: parsed ?? undefined });
                }}
              />

              <TestScenarioJsonField
                id="dashboard-props"
                optional
                label="Dashboard props"
                description='Nested keys: accounts, recipients, transactions, accountIds. Example: {"accountIds":["ts5-acc-payments"],"recipients":{"viewMode":"compact-cards"}}'
                value={
                  dashboardPropsJson ||
                  stringifyJson(config.components?.dashboard)
                }
                onChange={(value, parsed) => {
                  setDashboardPropsJson(value);
                  syncComponents({ dashboard: parsed ?? undefined });
                }}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mocks">
            <AccordionTrigger className="text-sm font-semibold text-neutral-900">
              MSW mock payloads
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <TestScenarioJsonField
                id="client-patch"
                optional
                label="Client patch (partial)"
                description={`Deep-merged into seeded client ${resolved.bundleConfig.clientId} after scenario seed. Use for status, outstanding.questionIds, etc.`}
                value={
                  clientPatchJson || stringifyJson(config.mocks?.clientPatch)
                }
                validate={validateClientPatchJson}
                onValidationChange={(result) =>
                  setMockValidationResult('clientPatch', result)
                }
                onChange={(value, parsed) => {
                  setClientPatchJson(value);
                  syncMocks({ clientPatch: parsed ?? undefined });
                }}
                placeholder='{"status":"APPROVED"}'
              />

              <TestScenarioJsonField
                id="client-override"
                optional
                label="Client override (full)"
                description={`Complete GET /ef/do/v1/clients/${resolved.bundleConfig.clientId} response. Replaces seeded client when reset runs.`}
                value={
                  clientOverrideJson || stringifyJson(config.mocks?.client)
                }
                validate={(parsed) =>
                  validateClientOverrideJson(
                    parsed,
                    resolved.bundleConfig.clientId
                  )
                }
                onValidationChange={(result) =>
                  setMockValidationResult('clientOverride', result)
                }
                onChange={(value, parsed) => {
                  setClientOverrideJson(value);
                  syncMocks({ client: parsed ?? undefined });
                }}
              />

              <TestScenarioJsonField
                id="endpoint-overrides"
                optional
                label="Other endpoint overrides"
                description={`JSON object keyed by MSW override paths. Supported keys include:\n${ENDPOINT_KEY_HINTS}`}
                value={
                  endpointOverridesJson ||
                  stringifyJson(config.mocks?.endpoints)
                }
                validate={validateEndpointOverridesJson}
                onValidationChange={(result) =>
                  setMockValidationResult('endpoints', result)
                }
                onChange={(value, parsed) => {
                  setEndpointOverridesJson(value);
                  syncMocks({ endpoints: parsed ?? undefined });
                }}
                placeholder='{"GET /ef/do/v1/recipients":{"recipients":[]}}'
                minRows={10}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Resolved preview
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Layout (default login)</dt>
              <dd className="font-medium text-neutral-900">
                {resolveLayoutForLoginCase(resolved.activeLoginCase)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Client id</dt>
              <dd className="font-mono text-xs text-neutral-900">
                {resolved.bundleConfig.clientId}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Login cases</dt>
              <dd className="font-mono text-xs text-neutral-900">
                {resolved.loginCases.length} configured
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">Encoded URL</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800">
              {absolutePlayUrl}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={handleCopyUrl}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {hasMockValidationErrors ? (
          <p className="text-xs text-red-600">
            Fix mock JSON validation errors before opening the scenario.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            type="button"
            className="gap-1.5"
            onClick={handleLaunch}
            disabled={hasMockValidationErrors}
          >
            <ExternalLink className="h-4 w-4" />
            Open scenario
          </Button>
          {hasMockValidationErrors ? (
            <Button type="button" variant="outline" disabled>
              Open in new tab
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <a href={playUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
