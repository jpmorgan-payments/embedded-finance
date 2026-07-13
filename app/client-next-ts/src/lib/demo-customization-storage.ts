/**
 * localStorage persistence for SellSense demo customizations:
 * content tokens, OnboardingFlow props, and theme variable overrides.
 */

import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

import type { OnboardingFlowConfigProps } from '@/components/sellsense/onboarding-flow-props-config';
import type { ThemeOption } from '@/components/sellsense/use-sellsense-themes';

const STORAGE_KEY = 'sellsense-demo-customization';

export type StoredThemeCustomization = {
  baseTheme?: ThemeOption;
  variables?: EBThemeVariables;
};

export type SellsenseDemoCustomization = {
  contentTokens?: {
    name?: string;
    tokens?: Record<string, unknown>;
  };
  onboardingFlowPropOverrides?: OnboardingFlowConfigProps;
  theme?: StoredThemeCustomization;
};

function safeParse(raw: string): SellsenseDemoCustomization {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed as SellsenseDemoCustomization;
  } catch {
    return {};
  }
}

export function getDemoCustomization(): SellsenseDemoCustomization {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw) : {};
}

function writeDemoCustomization(next: SellsenseDemoCustomization): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const hasContent =
    (next.contentTokens?.tokens &&
      Object.keys(next.contentTokens.tokens).length > 0) ||
    (next.contentTokens?.name && next.contentTokens.name !== 'enUS') ||
    (next.onboardingFlowPropOverrides &&
      Object.keys(next.onboardingFlowPropOverrides).length > 0) ||
    (next.theme?.variables && Object.keys(next.theme.variables).length > 0);

  if (!hasContent) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function setDemoCustomization(
  patch: Partial<SellsenseDemoCustomization>
): void {
  const current = getDemoCustomization();
  writeDemoCustomization({ ...current, ...patch });
}

export function clearDemoCustomization(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function clearContentTokenCustomization(): void {
  const current = getDemoCustomization();
  delete current.contentTokens;
  writeDemoCustomization(current);
}

export function clearOnboardingFlowPropCustomization(): void {
  const current = getDemoCustomization();
  delete current.onboardingFlowPropOverrides;
  writeDemoCustomization(current);
}

export function clearThemeCustomization(): void {
  const current = getDemoCustomization();
  delete current.theme;
  writeDemoCustomization(current);
}

/** Count leaf string overrides in nested content token object. */
export function countContentTokenOverrides(
  tokens: Record<string, unknown> | undefined | null
): number {
  if (!tokens) return 0;
  let count = 0;
  const walk = (obj: Record<string, unknown>) => {
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') count += 1;
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>);
      }
    }
  };
  walk(tokens);
  return count;
}

/** Flatten `{ namespace: { a: { b: "x" } } }` → `{ "namespace:a.b": "x" }`. */
export function flattenContentTokenOverrides(
  tokens: Record<string, unknown> | undefined | null
): Record<string, string> {
  if (!tokens) return {};
  const result: Record<string, string> = {};

  const flattenNamespace = (
    obj: Record<string, unknown>,
    path: string[] = []
  ): Record<string, string> => {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...path, key];
      if (typeof value === 'string') {
        flat[newPath.join('.')] = value;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(
          flat,
          flattenNamespace(value as Record<string, unknown>, newPath)
        );
      }
    }
    return flat;
  };

  for (const [namespace, content] of Object.entries(tokens)) {
    if (content && typeof content === 'object' && !Array.isArray(content)) {
      const flatNamespace = flattenNamespace(
        content as Record<string, unknown>
      );
      for (const [path, value] of Object.entries(flatNamespace)) {
        result[`${namespace}:${path}`] = value;
      }
    }
  }
  return result;
}

export function countThemeVariableOverrides(
  variables: EBThemeVariables | undefined | null,
  baseVariables?: EBThemeVariables | null
): number {
  if (!variables) return 0;
  const keys = Object.keys(variables).filter(
    (key) => variables[key as keyof EBThemeVariables] !== undefined
  );
  if (!baseVariables) return keys.length;
  return keys.filter((key) => {
    const typedKey = key as keyof EBThemeVariables;
    return variables[typedKey] !== baseVariables[typedKey];
  }).length;
}
