import type { ThemeOption } from '@/components/sellsense/use-sellsense-themes';
import {
  getTestScenarioBundleConfig,
  type TestScenarioBundleConfig,
  type TestScenarioLoginProfile,
} from '@/components/test-scenario/test-scenario-bundles';
import type { TestDemoScenarioMode, TestScenarioBundleId } from '@/msw/db';

/** Universal renderer + constructor paths (share demo chrome with fixed bundle routes). */
export const TEST_SCENARIO_UNIVERSAL_PLAY_PATH = '/test-scenario/play';
export const TEST_SCENARIO_CONSTRUCTOR_PATH = '/test-scenario/constructor';

export const TEST_SCENARIO_CONFIG_VERSION = 2 as const;

export type TestScenarioPresetId =
  | 'operator80'
  | 'construction'
  | 'health'
  | 'logistics'
  | 'fundManagement';

export type TestScenarioLayoutKind =
  | 'onboarding'
  | 'onboarding-with-link'
  | 'onboarding-to-dashboard'
  | 'dashboard';

export type TestScenarioLoginCaseConfig = {
  id: string;
  email: string;
  label: string;
  scenario: TestDemoScenarioMode;
  layout?: 'auto' | 'onboarding' | 'dashboard';
  onboardingFlow?: Record<string, unknown>;
  linkAccountStepOptions?: Record<string, unknown>;
};

export type TestScenarioUiOverrides = {
  headerOrgDisplayName?: string;
  theme?: ThemeOption | 'Custom';
  themeVariables?: Record<string, string>;
  showLinkAccountStep?: boolean;
  linkAccountStepOptions?: Record<string, unknown>;
  onboardingFlow?: Record<string, unknown>;
  contentTokens?: Record<string, unknown>;
};

export type TestScenarioComponentProps = {
  onboarding?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
};

export type TestScenarioMockOverrides = {
  /** Merged into the seeded client row after `applyTestDemoScenario`. */
  clientPatch?: Record<string, unknown>;
  /** Full `GET /ef/do/v1/clients/:clientId` response shape. */
  client?: Record<string, unknown>;
  /**
   * Additional MSW overrides keyed like the mock API editor
   * (e.g. `GET /ef/do/v1/recipients`).
   */
  endpoints?: Record<string, unknown>;
};

export type TestScenarioConfig = {
  version?: typeof TEST_SCENARIO_CONFIG_VERSION;
  preset: TestScenarioPresetId;
  /** Custom login list; when omitted, preset bundle defaults are used. */
  loginCases?: TestScenarioLoginCaseConfig[];
  /** Active login id from `loginCases`; falls back to first entry. */
  loginCaseId?: string;
  /** Legacy/simple selector when `loginCases` is not customized. */
  loginCase?: TestDemoScenarioMode;
  ui?: TestScenarioUiOverrides;
  components?: TestScenarioComponentProps;
  mocks?: TestScenarioMockOverrides;
};

export type TestScenarioPresetMeta = {
  id: TestScenarioPresetId;
  label: string;
  orgDisplayName: string;
  bundleId: TestScenarioBundleId;
  themeLabel: string;
  linkAccountMode: 'off' | 'review-prefill' | 'editable' | 'editable-multi';
  industryFocus: string;
  availableLoginCases: TestDemoScenarioMode[];
};

const PRESET_TO_BUNDLE: Record<TestScenarioPresetId, TestScenarioBundleId> = {
  operator80: 'test-scenario',
  construction: 'test-scenario-2',
  health: 'test-scenario-3',
  logistics: 'test-scenario-4',
  fundManagement: 'test-scenario-5',
};

const OPERATOR_LOGIN_CASES: TestDemoScenarioMode[] = [
  'happy-path',
  'doc-request',
  'linked-account-approved',
  'linked-account-active',
];

const LOGISTICS_LOGIN_CASES: TestDemoScenarioMode[] = [
  'happy-path-ptc',
  'happy-path',
  ...OPERATOR_LOGIN_CASES.filter((m) => m !== 'happy-path'),
  'multi-linked-start-3',
];

const MULTI_LINK_LOGIN_CASES: TestDemoScenarioMode[] = [
  ...OPERATOR_LOGIN_CASES,
  'multi-linked-start-3',
];

const FUND_MGMT_LOGIN_CASES: TestDemoScenarioMode[] = [
  'naics-codes-onboarding',
  'naics-codes-doc-request',
  'naics-codes-dashboard',
];

const LEGACY_PRESET_CODE: Record<TestScenarioPresetId, string> = {
  operator80: 'o1',
  construction: 'o2',
  health: 'o3',
  logistics: 'o4',
  fundManagement: 'o5',
};

const LEGACY_LOGIN_CASE_CODE: Record<TestDemoScenarioMode, string> = {
  'happy-path': 'hp',
  'happy-path-ptc': 'ptc',
  'happy-path-approved': 'hpa',
  'doc-request': 'dr',
  'linked-account-approved': 'lam',
  'linked-account-active': 'laa',
  'multi-linked-start-3': 'm3',
  'naics-codes-onboarding': 'nao',
  'naics-codes-doc-request': 'nadr',
  'naics-codes-dashboard': 'nad',
};

const LEGACY_CODE_TO_PRESET = Object.fromEntries(
  Object.entries(LEGACY_PRESET_CODE).map(([preset, code]) => [
    code,
    preset as TestScenarioPresetId,
  ])
) as Record<string, TestScenarioPresetId>;

const LEGACY_CODE_TO_LOGIN_CASE = Object.fromEntries(
  Object.entries(LEGACY_LOGIN_CASE_CODE).map(([mode, code]) => [
    code,
    mode as TestDemoScenarioMode,
  ])
) as Record<string, TestDemoScenarioMode>;

const LOGIN_CASE_LABELS: Record<TestDemoScenarioMode, string> = {
  'happy-path': 'Happy path — no document request',
  'happy-path-ptc': 'Happy path — publicly traded company (C-corp + Nasdaq)',
  'happy-path-approved': 'Happy path — pre-approved client',
  'doc-request': 'Unhappy path — document request',
  'linked-account-approved': 'Unhappy path — linked account with microdeposit',
  'linked-account-active': 'Happy path — linked account, no microdeposit',
  'multi-linked-start-3': 'Starts with three linked bank accounts',
  'naics-codes-onboarding':
    'Onboarding → NAICS selection → fund questions → dashboard',
  'naics-codes-doc-request':
    'Unhappy path — fund document request (registration, structure, offering memo, etc.)',
  'naics-codes-dashboard': 'Pre-approved — open payments dashboard immediately',
};

export const TEST_SCENARIO_PRESETS: TestScenarioPresetMeta[] = [
  {
    id: 'operator80',
    label: 'Operator 80 (restaurant LLC)',
    orgDisplayName: 'Operator 80 Palo Alto CA',
    bundleId: 'test-scenario',
    themeLabel: 'Salt Theme',
    linkAccountMode: 'review-prefill',
    industryFocus: 'Default (broad org types)',
    availableLoginCases: OPERATOR_LOGIN_CASES,
  },
  {
    id: 'construction',
    label: 'Top Dog Construction',
    orgDisplayName: 'Top Dog Construction, LLC',
    bundleId: 'test-scenario-2',
    themeLabel: 'Custom warm neutral',
    linkAccountMode: 'editable-multi',
    industryFocus: 'Construction NAICS',
    availableLoginCases: MULTI_LINK_LOGIN_CASES,
  },
  {
    id: 'health',
    label: 'Health & Benefit Solutions',
    orgDisplayName: 'Health & Benefit Solutions, LLC',
    bundleId: 'test-scenario-3',
    themeLabel: 'Empty (component defaults)',
    linkAccountMode: 'editable',
    industryFocus: 'Health-sector NAICS',
    availableLoginCases: OPERATOR_LOGIN_CASES,
  },
  {
    id: 'logistics',
    label: 'Faster Fulfilment Corp.',
    orgDisplayName: 'Faster Fulfilment Corp.',
    bundleId: 'test-scenario-4',
    themeLabel: 'Empty (component defaults)',
    linkAccountMode: 'editable-multi',
    industryFocus: 'Logistics NAICS + optional PTC',
    availableLoginCases: LOGISTICS_LOGIN_CASES,
  },
  {
    id: 'fundManagement',
    label: 'Leap Frog Investments',
    orgDisplayName: 'Leap Frog Investments, LLC',
    bundleId: 'test-scenario-5',
    themeLabel: 'Empty (component defaults)',
    linkAccountMode: 'off',
    industryFocus: 'Fund management NAICS + assessment',
    availableLoginCases: FUND_MGMT_LOGIN_CASES,
  },
];

const PRESET_IDS = new Set(TEST_SCENARIO_PRESETS.map((p) => p.id));

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const base64 = pad > 0 ? padded + '='.repeat(4 - pad) : padded;
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecords(
  base: Record<string, unknown> | undefined,
  override: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!override) return base;
  if (!base) return override;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = merged[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      merged[key] = mergeRecords(existing, value) ?? value;
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function getPresetMeta(
  preset: TestScenarioPresetId
): TestScenarioPresetMeta {
  const meta = TEST_SCENARIO_PRESETS.find((p) => p.id === preset);
  if (!meta) {
    throw new Error(`Unknown test scenario preset: ${preset}`);
  }
  return meta;
}

export function getLoginCaseLabel(loginCase: TestDemoScenarioMode): string {
  return LOGIN_CASE_LABELS[loginCase];
}

export function resolveLayoutKind(
  loginCase: TestDemoScenarioMode
): TestScenarioLayoutKind {
  if (loginCase === 'naics-codes-dashboard') return 'dashboard';
  if (loginCase === 'naics-codes-onboarding') return 'onboarding-to-dashboard';
  if (
    loginCase === 'linked-account-approved' ||
    loginCase === 'linked-account-active' ||
    loginCase === 'multi-linked-start-3'
  ) {
    return 'onboarding-with-link';
  }
  return 'onboarding';
}

export function presetToBundleId(
  preset: TestScenarioPresetId
): TestScenarioBundleId {
  return PRESET_TO_BUNDLE[preset];
}

export function isLoginCaseValidForPreset(
  preset: TestScenarioPresetId,
  loginCase: TestDemoScenarioMode
): boolean {
  return getPresetMeta(preset).availableLoginCases.includes(loginCase);
}

export function getDefaultLoginCaseForPreset(
  preset: TestScenarioPresetId
): TestDemoScenarioMode {
  return getPresetMeta(preset).availableLoginCases[0];
}

export function getDefaultLoginCasesForPreset(
  preset: TestScenarioPresetId
): TestScenarioLoginCaseConfig[] {
  const bundle = getTestScenarioBundleConfig(presetToBundleId(preset));
  return bundle.loginProfiles.map((profile) => ({
    id: profile.email,
    email: profile.email,
    label: profile.label,
    scenario: profile.scenario,
    layout: 'auto' as const,
    ...(profile.onboardingFlow
      ? { onboardingFlow: profile.onboardingFlow as Record<string, unknown> }
      : {}),
    ...(profile.linkAccountStepOptions
      ? {
          linkAccountStepOptions: profile.linkAccountStepOptions as Record<
            string,
            unknown
          >,
        }
      : {}),
  }));
}

export function createDefaultTestScenarioConfig(
  preset: TestScenarioPresetId = 'operator80'
): TestScenarioConfig {
  const loginCases = getDefaultLoginCasesForPreset(preset);
  return {
    version: TEST_SCENARIO_CONFIG_VERSION,
    preset,
    loginCases,
    loginCaseId: loginCases[0]?.id,
  };
}

function loginCaseConfigToProfile(
  loginCase: TestScenarioLoginCaseConfig
): TestScenarioLoginProfile {
  return {
    email: loginCase.email,
    label: loginCase.label,
    scenario: loginCase.scenario,
    ...(loginCase.onboardingFlow
      ? {
          onboardingFlow:
            loginCase.onboardingFlow as TestScenarioLoginProfile['onboardingFlow'],
        }
      : {}),
    ...(loginCase.linkAccountStepOptions
      ? {
          linkAccountStepOptions:
            loginCase.linkAccountStepOptions as TestScenarioLoginProfile['linkAccountStepOptions'],
        }
      : {}),
  };
}

function resolveLoginCases(config: TestScenarioConfig): {
  loginCases: TestScenarioLoginCaseConfig[];
  loginProfiles: TestScenarioLoginProfile[];
} {
  const loginCases =
    config.loginCases && config.loginCases.length > 0
      ? config.loginCases
      : getDefaultLoginCasesForPreset(config.preset);

  return {
    loginCases,
    loginProfiles: loginCases.map(loginCaseConfigToProfile),
  };
}

function resolveActiveLoginCase(
  config: TestScenarioConfig,
  loginCases: TestScenarioLoginCaseConfig[]
): TestScenarioLoginCaseConfig {
  if (config.loginCaseId) {
    const byId = loginCases.find((item) => item.id === config.loginCaseId);
    if (byId) return byId;
  }

  if (config.loginCase) {
    const byScenario = loginCases.find(
      (item) => item.scenario === config.loginCase
    );
    if (byScenario) return byScenario;
  }

  return loginCases[0];
}

function mergeBundleWithUi(
  bundleConfig: TestScenarioBundleConfig,
  ui?: TestScenarioUiOverrides
): TestScenarioBundleConfig {
  if (!ui) return bundleConfig;

  return {
    ...bundleConfig,
    ...(ui.headerOrgDisplayName
      ? { headerOrgDisplayName: ui.headerOrgDisplayName }
      : {}),
    ...(ui.theme ? { theme: ui.theme as ThemeOption } : {}),
    ...(ui.themeVariables ? { themeVariables: ui.themeVariables } : {}),
    ...(ui.showLinkAccountStep !== undefined
      ? { showLinkAccountStep: ui.showLinkAccountStep }
      : {}),
    ...(ui.linkAccountStepOptions
      ? {
          linkAccountStepOptions: {
            ...(bundleConfig.linkAccountStepOptions ?? {}),
            ...ui.linkAccountStepOptions,
          } as TestScenarioBundleConfig['linkAccountStepOptions'],
        }
      : {}),
    ...(ui.onboardingFlow
      ? {
          onboardingFlow: {
            ...(bundleConfig.onboardingFlow ?? {}),
            ...ui.onboardingFlow,
          } as TestScenarioBundleConfig['onboardingFlow'],
        }
      : {}),
    ...(ui.contentTokens
      ? {
          contentTokens: {
            ...bundleConfig.contentTokens,
            tokens: mergeRecords(
              bundleConfig.contentTokens.tokens,
              ui.contentTokens
            ) as Record<string, unknown>,
          },
        }
      : {}),
  };
}

export function resolveLayoutForLoginCase(
  loginCase: TestScenarioLoginCaseConfig
): TestScenarioLayoutKind {
  if (loginCase.layout === 'dashboard') return 'dashboard';
  if (loginCase.layout === 'onboarding') return 'onboarding';
  return resolveLayoutKind(loginCase.scenario);
}

export function buildMockResetPayload(
  clientId: string,
  mocks?: TestScenarioMockOverrides,
  options?: {
    orgDisplayName?: string;
    presetOrgDisplayName?: string;
  }
): {
  clientPatch?: Record<string, unknown>;
  orgDisplayName?: string;
  overrides: Record<string, unknown>;
} {
  const overrides: Record<string, unknown> = {
    ...(mocks?.endpoints ?? {}),
  };

  if (mocks?.client) {
    overrides[`GET /ef/do/v1/clients/${clientId}`] = mocks.client;
  }

  const customOrgName = options?.orgDisplayName?.trim();
  const shouldSyncOrgName =
    customOrgName && customOrgName !== options?.presetOrgDisplayName?.trim();

  return {
    clientPatch: mocks?.clientPatch,
    ...(shouldSyncOrgName ? { orgDisplayName: customOrgName } : {}),
    overrides,
  };
}

export type ResolvedTestScenarioConfig = {
  config: TestScenarioConfig;
  preset: TestScenarioPresetMeta;
  bundleId: TestScenarioBundleId;
  bundleConfig: TestScenarioBundleConfig;
  loginCases: TestScenarioLoginCaseConfig[];
  loginProfiles: TestScenarioLoginProfile[];
  activeLoginCase: TestScenarioLoginCaseConfig;
  loginProfile: TestScenarioLoginProfile;
  layout: TestScenarioLayoutKind;
  onboardingProps: Record<string, unknown>;
  dashboardProps: Record<string, unknown>;
  mockReset: ReturnType<typeof buildMockResetPayload>;
};

export function resolveTestScenarioConfig(
  config: TestScenarioConfig
): ResolvedTestScenarioConfig {
  const preset = getPresetMeta(config.preset);
  const bundleId = presetToBundleId(config.preset);
  const baseBundle = getTestScenarioBundleConfig(bundleId);
  const bundleConfig = mergeBundleWithUi(baseBundle, config.ui);
  const { loginCases, loginProfiles } = resolveLoginCases(config);
  const activeLoginCase = resolveActiveLoginCase(config, loginCases);
  const loginProfile =
    loginProfiles.find((p) => p.email === activeLoginCase.email) ??
    loginCaseConfigToProfile(activeLoginCase);

  const onboardingProps =
    mergeRecords(
      bundleConfig.onboardingFlow as Record<string, unknown> | undefined,
      mergeRecords(
        activeLoginCase.onboardingFlow,
        config.components?.onboarding
      )
    ) ?? {};

  const dashboardProps = config.components?.dashboard ?? {};

  return {
    config,
    preset,
    bundleId,
    bundleConfig,
    loginCases,
    loginProfiles,
    activeLoginCase,
    loginProfile,
    layout: resolveLayoutForLoginCase(activeLoginCase),
    onboardingProps,
    dashboardProps,
    mockReset: buildMockResetPayload(bundleConfig.clientId, config.mocks, {
      orgDisplayName: bundleConfig.headerOrgDisplayName,
      presetOrgDisplayName: preset.orgDisplayName,
    }),
  };
}

function normalizeDecodedConfig(raw: unknown): TestScenarioConfig | null {
  if (!isPlainObject(raw)) return null;
  const preset = raw.preset;
  if (
    typeof preset !== 'string' ||
    !PRESET_IDS.has(preset as TestScenarioPresetId)
  ) {
    return null;
  }

  const config: TestScenarioConfig = {
    version: TEST_SCENARIO_CONFIG_VERSION,
    preset: preset as TestScenarioPresetId,
  };

  if (Array.isArray(raw.loginCases) && raw.loginCases.length > 0) {
    const loginCases = raw.loginCases.filter(
      (item): item is TestScenarioLoginCaseConfig =>
        isPlainObject(item) &&
        typeof item.id === 'string' &&
        typeof item.email === 'string' &&
        typeof item.label === 'string' &&
        typeof item.scenario === 'string'
    );
    if (loginCases.length === 0) return null;
    config.loginCases = loginCases;
    config.loginCaseId =
      typeof raw.loginCaseId === 'string' ? raw.loginCaseId : loginCases[0].id;
    const active =
      loginCases.find((item) => item.id === config.loginCaseId) ??
      loginCases[0];
    config.loginCase = active.scenario;
  } else if (typeof raw.loginCase === 'string') {
    if (
      !isLoginCaseValidForPreset(
        config.preset,
        raw.loginCase as TestDemoScenarioMode
      )
    ) {
      return null;
    }
    config.loginCase = raw.loginCase as TestDemoScenarioMode;
  } else {
    return null;
  }

  if (isPlainObject(raw.ui)) config.ui = raw.ui as TestScenarioUiOverrides;
  if (isPlainObject(raw.components)) {
    config.components = raw.components as TestScenarioComponentProps;
  }
  if (isPlainObject(raw.mocks)) {
    config.mocks = raw.mocks as TestScenarioMockOverrides;
  }

  return config;
}

export function encodeTestScenarioConfig(config: TestScenarioConfig): string {
  return toBase64Url(JSON.stringify(config));
}

function decodeLegacyCompactConfig(encoded: string): TestScenarioConfig | null {
  const dotParts = encoded.split('.');
  if (dotParts.length !== 2) return null;

  const [presetCode, loginCode] = dotParts;
  const preset = LEGACY_CODE_TO_PRESET[presetCode];
  const loginCase = LEGACY_CODE_TO_LOGIN_CASE[loginCode];
  if (preset && loginCase && isLoginCaseValidForPreset(preset, loginCase)) {
    return { preset, loginCase };
  }
  return null;
}

export function decodeTestScenarioConfig(
  encoded: string
): TestScenarioConfig | null {
  const trimmed = encoded.replace(/^#/, '').trim();
  if (!trimmed) return null;

  try {
    const json = JSON.parse(fromBase64Url(trimmed)) as unknown;
    const normalized = normalizeDecodedConfig(json);
    if (normalized) return normalized;
  } catch {
    // not base64 JSON — try legacy compact format
  }

  return decodeLegacyCompactConfig(trimmed);
}

export function buildTestScenarioPlayUrl(config: TestScenarioConfig): string {
  const encoded = encodeTestScenarioConfig(config);
  return `${TEST_SCENARIO_UNIVERSAL_PLAY_PATH}#${encoded}`;
}

export function readTestScenarioConfigFromHash(
  hash: string
): TestScenarioConfig | null {
  return decodeTestScenarioConfig(hash.startsWith('#') ? hash.slice(1) : hash);
}
