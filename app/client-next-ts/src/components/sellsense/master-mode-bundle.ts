/**
 * Master Mode bundle: theme + content tokens + onboarding config (+ optional mocks).
 * Also parses hosted `contentOverride` / `.model.json` payloads into the same shape.
 */

import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

import {
  countContentTokenOverrides,
  countThemeVariableOverrides,
  flattenContentTokenOverrides,
  type StoredThemeCustomization,
} from '@/lib/demo-customization-storage';
import type { MockOverridesMap } from '@/lib/mock-overrides-storage';

import {
  ONBOARDING_PROP_FIELDS,
  pickOnboardingFlowConfig,
  type OnboardingFlowConfigProps,
} from './onboarding-flow-props-config';
import type { ThemeOption } from './use-sellsense-themes';

export type MasterModeBundle = {
  /** Schema marker for downloaded JSON files */
  kind?: 'sellsense-master-customization';
  version?: 1;
  name?: string;
  fileName?: string;
  theme?: StoredThemeCustomization;
  contentTokens?: {
    name?: string;
    tokens?: Record<string, unknown>;
  };
  onboardingFlowPropOverrides?: OnboardingFlowConfigProps;
  /** Optional mock API overrides map (same shape as sellsense-mock-overrides). */
  mocks?: MockOverridesMap;
};

export type MasterModeImportSummary = {
  themeVariableCount: number;
  contentTokenCount: number;
  configPropCount: number;
  mockOverrideCount: number;
  themePreviewColors: string[];
  contentTokenPreviewKeys: string[];
  configPropLabels: string[];
  sources: {
    theme: 'ebDesignTokens' | 'saltEPDesignTokens' | 'theme' | 'none';
    contentTokens: 'embeddedComponentsContentTokens' | 'contentTokens' | 'none';
    config: 'onboardingFlowConfig' | 'onboardingFlowPropOverrides' | 'none';
    mocks: 'mocks' | 'overrides' | 'none';
  };
};

/** Detected input shape — used for paste/upload feedback (UI-safe labels). */
export type MasterModeDetectedFormat =
  | 'master-bundle'
  | 'hosted-page-model'
  | 'content-override'
  | 'global-configuration'
  | 'onboarding-config'
  | 'theme-only'
  | 'content-tokens-only'
  | 'mixed';

export type MasterModeParseResult =
  | {
      ok: true;
      bundle: MasterModeBundle;
      summary: MasterModeImportSummary;
      format: MasterModeDetectedFormat;
    }
  | { ok: false; error: string };

export function describeMasterModeFormat(
  format: MasterModeDetectedFormat
): string {
  switch (format) {
    case 'master-bundle':
      return 'playground customization export';
    case 'hosted-page-model':
      return 'hosted page model';
    case 'content-override':
      return 'hosted content override';
    case 'global-configuration':
      return 'hosted global configuration';
    case 'onboarding-config':
      return 'onboarding config';
    case 'theme-only':
      return 'theme / design tokens';
    case 'content-tokens-only':
      return 'content tokens';
    case 'mixed':
      return 'customization JSON';
  }
}

function detectFormatFromBundle(
  summary: MasterModeImportSummary,
  preferred?: MasterModeDetectedFormat
): MasterModeDetectedFormat {
  if (preferred) return preferred;
  const hasTheme = summary.themeVariableCount > 0;
  const hasContent = summary.contentTokenCount > 0;
  const hasConfig = summary.configPropCount > 0;
  const categories = [hasTheme, hasContent, hasConfig].filter(Boolean).length;
  if (categories >= 2) return 'mixed';
  if (hasTheme) return 'theme-only';
  if (hasContent) return 'content-tokens-only';
  if (hasConfig) return 'onboarding-config';
  return 'mixed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/** Walk nested page-model JSON to find a string/object `contentOverride`. */
function findContentOverrideInModel(root: unknown): unknown {
  if (!isRecord(root)) return undefined;

  if ('contentOverride' in root) {
    return tryParseJson(root.contentOverride);
  }

  const queue: unknown[] = [root];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isRecord(current) || seen.has(current)) continue;
    seen.add(current);

    if ('contentOverride' in current) {
      return tryParseJson(current.contentOverride);
    }

    for (const value of Object.values(current)) {
      if (isRecord(value)) queue.push(value);
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (isRecord(item)) queue.push(item);
        }
      }
    }
  }

  return undefined;
}

function extractGlobalConfiguration(
  payload: unknown
): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;

  if (isRecord(payload.globalConfiguration)) {
    return payload.globalConfiguration;
  }

  // Already a globalConfiguration-shaped object
  if (
    isRecord(payload.ebDesignTokens) ||
    isRecord(payload.saltEPDesignTokens) ||
    isRecord(payload.embeddedComponentsContentTokens) ||
    isRecord(payload.onboardingFlowConfig)
  ) {
    return payload;
  }

  return null;
}

function asThemeVariables(value: unknown): EBThemeVariables | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(
    ([, v]) =>
      typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as EBThemeVariables;
}

function mergeThemeVariables(
  ...layers: Array<EBThemeVariables | undefined>
): EBThemeVariables | undefined {
  const merged: EBThemeVariables = {};
  let hasAny = false;
  for (const layer of layers) {
    if (!layer) continue;
    Object.assign(merged, layer);
    hasAny = true;
  }
  return hasAny ? merged : undefined;
}

/** True when contentTokens looks like nested EB namespaces, not flat hosted-UI keys. */
function looksLikeEmbeddedContentTokens(ct: Record<string, unknown>): boolean {
  if (isRecord(ct.tokens)) return true;
  if (
    typeof ct.name === 'string' &&
    (ct.name === 'enUS' || ct.name === 'frCA' || ct.name === 'esUS')
  ) {
    return Object.keys(ct).some(
      (k) => k === 'tokens' || (k !== 'name' && k !== 'showTokenIds')
    );
  }
  // Nested namespace objects (common, onboarding-overview, …) vs flat "a.b.c" string maps
  const sampleKeys = Object.keys(ct).filter(
    (k) => k !== 'name' && k !== 'showTokenIds'
  );
  if (sampleKeys.length === 0) return false;
  return sampleKeys.every((key) => {
    const value = ct[key];
    return isRecord(value) && !key.includes('.');
  });
}

function extractContentTokens(
  source: Record<string, unknown> | null | undefined
):
  | {
      name?: string;
      tokens?: Record<string, unknown>;
    }
  | undefined {
  if (!source) return undefined;

  const embedded = source.embeddedComponentsContentTokens;
  if (isRecord(embedded)) {
    const name = typeof embedded.name === 'string' ? embedded.name : undefined;
    const tokens = isRecord(embedded.tokens)
      ? (embedded.tokens as Record<string, unknown>)
      : undefined;
    if (name || tokens) return { name, tokens };
  }

  // Nested under globalConfiguration when source is contentOverride root
  if (isRecord(source.globalConfiguration)) {
    const nested = extractContentTokens(source.globalConfiguration);
    if (nested) return nested;
  }

  // Master bundle / SellSense storage shape (not hosted-UI flat contentTokens)
  if (
    isRecord(source.contentTokens) &&
    looksLikeEmbeddedContentTokens(source.contentTokens)
  ) {
    const ct = source.contentTokens;
    const name = typeof ct.name === 'string' ? ct.name : undefined;
    const tokens = isRecord(ct.tokens)
      ? (ct.tokens as Record<string, unknown>)
      : (Object.fromEntries(
          Object.entries(ct).filter(
            ([k]) => k !== 'name' && k !== 'showTokenIds'
          )
        ) as Record<string, unknown>);
    if (name || (tokens && Object.keys(tokens).length > 0)) {
      return { name, tokens };
    }
  }

  return undefined;
}

function extractTheme(source: Record<string, unknown>): {
  theme?: StoredThemeCustomization;
  source: MasterModeImportSummary['sources']['theme'];
} {
  if (isRecord(source.theme)) {
    const baseTheme =
      typeof source.theme.baseTheme === 'string'
        ? (source.theme.baseTheme as ThemeOption)
        : undefined;
    const variables =
      asThemeVariables(source.theme.variables) ??
      asThemeVariables(source.theme);
    if (variables && Object.keys(variables).length > 0) {
      return {
        theme: { baseTheme: baseTheme || 'Empty', variables },
        source: 'theme',
      };
    }
  }

  const salt = asThemeVariables(source.saltEPDesignTokens);
  const eb = asThemeVariables(source.ebDesignTokens);
  // Prefer Salt semantic tokens; layer legacy ebDesignTokens underneath.
  const variables = mergeThemeVariables(eb, salt);
  if (variables) {
    return {
      theme: { baseTheme: 'Empty', variables },
      source: salt ? 'saltEPDesignTokens' : 'ebDesignTokens',
    };
  }

  return { source: 'none' };
}

function extractConfig(source: Record<string, unknown>): {
  config?: OnboardingFlowConfigProps;
  source: MasterModeImportSummary['sources']['config'];
} {
  // Keep imported values as-authored (including ones that match SellSense
  // baseline) so Master Mode can visualize the full hosted props set.
  // Dashboard apply still prunes baseline-equal keys for storage.
  if (isRecord(source.onboardingFlowConfig)) {
    const config = pickOnboardingFlowConfig(source.onboardingFlowConfig);
    if (Object.keys(config).length > 0) {
      return { config, source: 'onboardingFlowConfig' };
    }
  }

  if (isRecord(source.onboardingFlowPropOverrides)) {
    const config = pickOnboardingFlowConfig(source.onboardingFlowPropOverrides);
    if (Object.keys(config).length > 0) {
      return { config, source: 'onboardingFlowPropOverrides' };
    }
  }

  // Bare props object (same as ComponentPropsDrawer import)
  const bare = pickOnboardingFlowConfig(source);
  if (Object.keys(bare).length > 0 && !source.globalConfiguration) {
    // Only treat as bare props when it isn't a larger hosted payload
    const knownHostedKeys = [
      'ebDesignTokens',
      'saltEPDesignTokens',
      'embeddedComponentsContentTokens',
      'hostedUILayout',
      'enabledCapabilities',
    ];
    const looksHosted = knownHostedKeys.some((k) => k in source);
    if (!looksHosted) {
      return { config: bare, source: 'onboardingFlowPropOverrides' };
    }
  }

  return { source: 'none' };
}

function extractMocks(source: Record<string, unknown>): {
  mocks?: MockOverridesMap;
  source: MasterModeImportSummary['sources']['mocks'];
} {
  if (isRecord(source.mocks)) {
    return { mocks: source.mocks as MockOverridesMap, source: 'mocks' };
  }
  if (isRecord(source.overrides)) {
    return { mocks: source.overrides as MockOverridesMap, source: 'overrides' };
  }
  return { source: 'none' };
}

function pickPreviewColors(variables: EBThemeVariables | undefined): string[] {
  if (!variables) return [];
  const preferred: Array<keyof EBThemeVariables> = [
    'actionableAccentedBoldBackground',
    'primaryColor',
    'actionableSubtleForeground',
    'focusedRingColor',
    'ringColor',
    'sentimentPositiveForeground',
    'successColor',
    'actionableNegativeBoldBackground',
    'destructiveColor',
    'containerPrimaryBackground',
    'backgroundColor',
  ];
  const colors: string[] = [];
  for (const key of preferred) {
    const value = variables[key];
    if (
      typeof value === 'string' &&
      value.startsWith('#') &&
      !colors.includes(value)
    ) {
      colors.push(value);
    }
    if (colors.length >= 5) break;
  }
  if (colors.length > 0) return colors;

  for (const value of Object.values(variables)) {
    if (typeof value === 'string' && /^#([0-9a-fA-F]{3,8})$/.test(value)) {
      if (!colors.includes(value)) colors.push(value);
      if (colors.length >= 5) break;
    }
  }
  return colors;
}

function summarizeBundle(bundle: MasterModeBundle): MasterModeImportSummary {
  const themeVars = bundle.theme?.variables;
  const flatTokens = flattenContentTokenOverrides(bundle.contentTokens?.tokens);
  const config = bundle.onboardingFlowPropOverrides ?? {};
  const propLabels = ONBOARDING_PROP_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(config, field.key)
  ).map((field) => field.label);

  // For imported hosted configs, count every recognized prop present — not only
  // those that differ from SellSense baseline — so ops/sales see the full set.
  const configPropCount = Object.keys(config).length;

  return {
    themeVariableCount: countThemeVariableOverrides(themeVars),
    contentTokenCount: countContentTokenOverrides(bundle.contentTokens?.tokens),
    configPropCount,
    mockOverrideCount: bundle.mocks ? Object.keys(bundle.mocks).length : 0,
    themePreviewColors: pickPreviewColors(themeVars),
    contentTokenPreviewKeys: Object.keys(flatTokens).slice(0, 8),
    configPropLabels: propLabels.slice(0, 8),
    sources: {
      theme: bundle.theme?.variables ? 'theme' : 'none',
      contentTokens: bundle.contentTokens?.tokens ? 'contentTokens' : 'none',
      config:
        Object.keys(config).length > 0 ? 'onboardingFlowPropOverrides' : 'none',
      mocks:
        bundle.mocks && Object.keys(bundle.mocks).length > 0 ? 'mocks' : 'none',
    },
  };
}

function buildBundleFromSource(source: Record<string, unknown>): {
  bundle: MasterModeBundle;
  summary: MasterModeImportSummary;
} {
  const themeResult = extractTheme(
    isRecord(source.globalConfiguration)
      ? (source.globalConfiguration as Record<string, unknown>)
      : source
  );
  // Prefer top-level theme if already in master-bundle shape
  const theme =
    themeResult.source === 'none' && isRecord(source.theme)
      ? extractTheme(source)
      : themeResult;

  const contentTokens = extractContentTokens(source);

  const configSource = isRecord(source.globalConfiguration)
    ? (source.globalConfiguration as Record<string, unknown>)
    : source;
  const configResult = extractConfig(configSource);
  // Also allow master-bundle prop overrides at the root
  const config =
    configResult.source === 'none' ? extractConfig(source) : configResult;

  const mocksResult = extractMocks(source);

  const bundle: MasterModeBundle = {
    kind: 'sellsense-master-customization',
    version: 1,
  };

  if (theme.theme) bundle.theme = theme.theme;
  if (contentTokens) bundle.contentTokens = contentTokens;
  if (config.config) bundle.onboardingFlowPropOverrides = config.config;
  if (mocksResult.mocks && Object.keys(mocksResult.mocks).length > 0) {
    bundle.mocks = mocksResult.mocks;
  }

  const usedEmbedded =
    isRecord(source.embeddedComponentsContentTokens) ||
    isRecord(
      (source.globalConfiguration as Record<string, unknown> | undefined)
        ?.embeddedComponentsContentTokens
    );

  const summary = summarizeBundle(bundle);
  summary.sources = {
    theme: theme.source,
    contentTokens: contentTokens
      ? usedEmbedded
        ? 'embeddedComponentsContentTokens'
        : 'contentTokens'
      : 'none',
    config: config.source,
    mocks: mocksResult.source,
  };

  return { bundle, summary };
}

/**
 * Parse uploaded / pasted JSON (playground export, hosted page model,
 * contentOverride, or globalConfiguration) into a Master Mode bundle.
 */
export function parseMasterModeImport(raw: unknown): MasterModeParseResult {
  let payload = tryParseJson(raw);

  if (typeof payload === 'string') {
    payload = tryParseJson(payload);
  }

  if (!isRecord(payload)) {
    return { ok: false, error: 'Expected a JSON object' };
  }

  const looksLikePageModel =
    ':items' in payload ||
    ':type' in payload ||
    'templateName' in payload ||
    (typeof payload.title === 'string' && 'cssClassNames' in payload);

  // Master bundle already
  if (
    payload.kind === 'sellsense-master-customization' ||
    isRecord(payload.theme) ||
    isRecord(payload.onboardingFlowPropOverrides) ||
    (isRecord(payload.contentTokens) &&
      !isRecord(payload.globalConfiguration) &&
      !('contentOverride' in payload) &&
      !looksLikePageModel)
  ) {
    const { bundle, summary } = buildBundleFromSource(payload);
    if (
      summary.themeVariableCount === 0 &&
      summary.contentTokenCount === 0 &&
      summary.configPropCount === 0 &&
      summary.mockOverrideCount === 0
    ) {
      // Fall through — might be a model file without our markers
    } else {
      const format =
        payload.kind === 'sellsense-master-customization'
          ? 'master-bundle'
          : detectFormatFromBundle(summary);
      return { ok: true, bundle, summary, format };
    }
  }

  // Page model with nested contentOverride (string or object)
  const fromModel = findContentOverrideInModel(payload);
  if (fromModel != null) {
    const parsedOverride = tryParseJson(fromModel);
    if (!isRecord(parsedOverride)) {
      return {
        ok: false,
        error: 'Customization payload is not a valid JSON object',
      };
    }
    const { bundle, summary } = buildBundleFromSource(parsedOverride);
    if (
      summary.themeVariableCount +
        summary.contentTokenCount +
        summary.configPropCount +
        summary.mockOverrideCount ===
      0
    ) {
      return {
        ok: false,
        error:
          'No theme, content tokens, or onboarding config found in that JSON',
      };
    }
    return {
      ok: true,
      bundle,
      summary,
      format: looksLikePageModel ? 'hosted-page-model' : 'content-override',
    };
  }

  // contentOverride at top level
  if ('contentOverride' in payload) {
    const parsedOverride = tryParseJson(payload.contentOverride);
    if (!isRecord(parsedOverride)) {
      return {
        ok: false,
        error: 'Customization payload is not a valid JSON object',
      };
    }
    const { bundle, summary } = buildBundleFromSource(parsedOverride);
    if (
      summary.themeVariableCount +
        summary.contentTokenCount +
        summary.configPropCount +
        summary.mockOverrideCount ===
      0
    ) {
      return {
        ok: false,
        error:
          'No theme, content tokens, or onboarding config found in that JSON',
      };
    }
    return { ok: true, bundle, summary, format: 'content-override' };
  }

  // globalConfiguration or hosted keys directly
  const globalConfig = extractGlobalConfiguration(payload);
  if (globalConfig) {
    const wrapper = isRecord(payload.globalConfiguration)
      ? payload
      : { globalConfiguration: globalConfig };
    const { bundle, summary } = buildBundleFromSource(
      wrapper as Record<string, unknown>
    );
    if (
      summary.themeVariableCount +
        summary.contentTokenCount +
        summary.configPropCount +
        summary.mockOverrideCount ===
      0
    ) {
      return {
        ok: false,
        error: 'No theme, content tokens, or onboarding config found',
      };
    }
    return {
      ok: true,
      bundle,
      summary,
      format: isRecord(payload.globalConfiguration)
        ? 'content-override'
        : 'global-configuration',
    };
  }

  const { bundle, summary } = buildBundleFromSource(payload);
  if (
    summary.themeVariableCount +
      summary.contentTokenCount +
      summary.configPropCount +
      summary.mockOverrideCount ===
    0
  ) {
    return {
      ok: false,
      error: 'No theme, content tokens, or onboarding config found',
    };
  }
  return {
    ok: true,
    bundle,
    summary,
    format: detectFormatFromBundle(summary),
  };
}

/**
 * Parse pasted / clipboard text: validates JSON, then runs smart import recognition.
 */
export function parseMasterModeText(text: string): MasterModeParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste JSON to continue' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return {
        ok: false,
        error: 'Invalid JSON — check for trailing commas or incomplete paste',
      };
    }
    return {
      ok: false,
      error:
        'Clipboard text is not JSON. Copy the full JSON object and try again.',
    };
  }

  return parseMasterModeImport(parsed);
}

export function buildMasterModeExport(
  bundle: Omit<MasterModeBundle, 'kind' | 'version'> & {
    name?: string;
    fileName?: string;
  }
): MasterModeBundle {
  return {
    kind: 'sellsense-master-customization',
    version: 1,
    ...bundle,
  };
}

export function summarizeMasterModeBundle(
  bundle: MasterModeBundle
): MasterModeImportSummary {
  return summarizeBundle(bundle);
}

export function toSafeFileName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `${base || 'master-customization'}.json`;
}

/** Group flat `namespace:path` keys by namespace for visual display. */
export function groupContentTokenKeys(
  tokens: Record<string, unknown> | undefined
): Array<{ namespace: string; keys: string[]; count: number }> {
  const flat = flattenContentTokenOverrides(tokens);
  const groups = new Map<string, string[]>();
  for (const key of Object.keys(flat)) {
    const [namespace, ...rest] = key.split(':');
    const path = rest.join(':') || key;
    const list = groups.get(namespace) ?? [];
    list.push(path);
    groups.set(namespace, list);
  }
  return Array.from(groups.entries())
    .map(([namespace, keys]) => ({
      namespace,
      keys: keys.slice(0, 6),
      count: keys.length,
    }))
    .sort((a, b) => b.count - a.count);
}
