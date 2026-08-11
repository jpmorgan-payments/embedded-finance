/**
 * Compact theme tokens — mirrors hosted `ebDesignTokens` (7 legacy keys).
 * Simple mode authors these; expandCompactTheme maps them into Salt semantic tokens.
 */

import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

/** Production-shaped compact keys from hosted contentOverride.ebDesignTokens */
export type CompactThemeTokens = {
  primaryColor: string;
  ringColor: string;
  destructiveColor: string;
  borderColor: string;
  fontFamily: string;
  borderRadius: string;
  buttonBorderRadius: string;
};

export type CompactThemeKey = keyof CompactThemeTokens;

/** Keys shown in Simple mode UI (ringColor is derived from brand). */
export const SIMPLE_THEME_KEYS: CompactThemeKey[] = [
  'primaryColor',
  'destructiveColor',
  'borderColor',
  'fontFamily',
  'borderRadius',
  'buttonBorderRadius',
];

/** @deprecated Prefer SIMPLE_THEME_KEYS — includes derived ringColor for hosted parity. */
export const COMPACT_THEME_KEYS: CompactThemeKey[] = [
  'primaryColor',
  'ringColor',
  'destructiveColor',
  'borderColor',
  'fontFamily',
  'borderRadius',
  'buttonBorderRadius',
];

/** Friendly labels for non-technical users */
export const COMPACT_THEME_LABELS: Record<CompactThemeKey, string> = {
  primaryColor: 'Brand color',
  ringColor: 'Focus highlight',
  destructiveColor: 'Destructive color',
  borderColor: 'Borders',
  fontFamily: 'Font',
  borderRadius: 'Corner roundness',
  buttonBorderRadius: 'Button shape',
};

export const COMPACT_THEME_HINTS: Record<CompactThemeKey, string> = {
  primaryColor: 'Primary buttons, links, accents, and focus outline',
  ringColor: 'Derived from brand color in Simple mode',
  destructiveColor: 'Delete / irreversible action buttons',
  borderColor: 'Lines around cards, inputs, and dividers',
  fontFamily: 'Text across the experience',
  borderRadius: 'How round cards and inputs look',
  buttonBorderRadius: 'How round buttons look',
};

/** Defaults aligned with hosted CFA / Oracle ebDesignTokens */
export const COMPACT_THEME_DEFAULTS: CompactThemeTokens = {
  primaryColor: '#1B7F9E',
  ringColor: '#1B7F9E',
  destructiveColor: '#dc2626',
  borderColor: '#e5e7eb',
  fontFamily: 'Open Sans',
  borderRadius: '0.375rem',
  buttonBorderRadius: '0.375rem',
};

export const RADIUS_PRESETS = [
  { id: 'sharp', label: 'Sharp', value: '2px' },
  { id: 'soft', label: 'Soft', value: '0.375rem' },
  { id: 'round', label: 'Round', value: '12px' },
] as const;

export const BUTTON_RADIUS_PRESETS = [
  { id: 'sharp', label: 'Sharp', value: '2px' },
  { id: 'soft', label: 'Soft', value: '0.375rem' },
  { id: 'pill', label: 'Pill', value: '9999px' },
] as const;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHexRgb(
  color: string
): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();
  if (!trimmed.startsWith('#')) return null;
  const hex = trimmed.slice(1);
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b]
    .map((c) => clampByte(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Darken a hex color by mixing toward black (amount 0–1). */
export function darkenHex(color: string, amount: number): string {
  const rgb = parseHexRgb(color);
  if (!rgb) return color;
  const t = Math.max(0, Math.min(1, amount));
  return toHex({
    r: rgb.r * (1 - t),
    g: rgb.g * (1 - t),
    b: rgb.b * (1 - t),
  });
}

/** Approximate relative luminance for contrast-aware foreground picking. */
function relativeLuminance(color: string): number {
  const rgb = parseHexRgb(color);
  if (!rgb) return 0.5;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

export function pickContrastingForeground(background: string): string {
  return relativeLuminance(background) > 0.45 ? '#111827' : '#ffffff';
}

function withAlpha(color: string, alpha: number): string {
  const rgb = parseHexRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function firstString(
  ...candidates: Array<string | number | boolean | undefined>
): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}

/**
 * Expand compact (hosted ebDesignTokens) keys into Salt semantic tokens.
 * Only keys present on `compact` are expanded — callers merge into existing theme.
 */
export function expandCompactTheme(
  compact: Partial<CompactThemeTokens>
): EBThemeVariables {
  const out: EBThemeVariables = {};

  if (compact.primaryColor) {
    const primary = compact.primaryColor;
    const hover = darkenHex(primary, 0.1);
    const active = darkenHex(primary, 0.18);
    const fg = pickContrastingForeground(primary);

    out.actionableAccentedBoldBackground = primary;
    out.actionableAccentedBoldBackgroundHover = hover;
    out.actionableAccentedBoldBackgroundActive = active;
    out.actionableAccentedBoldForeground = fg;
    out.actionableAccentedBoldForegroundHover = fg;
    out.actionableAccentedBoldForegroundActive = fg;

    out.actionableSubtleBackground = 'transparent';
    out.actionableSubtleBackgroundHover = withAlpha(primary, 0.08);
    out.actionableSubtleBackgroundActive = withAlpha(primary, 0.12);
    out.actionableSubtleForeground = primary;
    out.actionableSubtleForegroundHover = hover;
    out.actionableSubtleForegroundActive = active;

    out.contentAccentForeground = primary;
    out.statusInfoForeground = primary;
    out.navigableAccentForeground = primary;
    // Focus ring follows brand — no separate Simple-mode control
    out.focusedRingColor = primary;
  }

  // Explicit ringColor only when set without primary (e.g. hosted import / Advanced)
  if (compact.ringColor && !compact.primaryColor) {
    out.focusedRingColor = compact.ringColor;
  }

  if (compact.destructiveColor) {
    const destructive = compact.destructiveColor;
    const hover = darkenHex(destructive, 0.1);
    const active = darkenHex(destructive, 0.18);
    const fg = pickContrastingForeground(destructive);

    out.actionableNegativeBoldBackground = destructive;
    out.actionableNegativeBoldBackgroundHover = hover;
    out.actionableNegativeBoldBackgroundActive = active;
    out.actionableNegativeBoldForeground = fg;
    out.actionableNegativeBoldForegroundHover = fg;
    out.actionableNegativeBoldForegroundActive = fg;
    out.sentimentNegativeAccentBackground = withAlpha(destructive, 0.12);
    out.statusErrorForegroundInformative = hover;
  }

  if (compact.borderColor) {
    out.separableBorderColor = compact.borderColor;
    out.editableBorderColor = compact.borderColor;
  }

  if (compact.fontFamily) {
    out.contentFontFamily = compact.fontFamily;
    out.textHeadingFontFamily = compact.fontFamily;
    out.actionableFontFamily = compact.fontFamily;
  }

  if (compact.borderRadius) {
    out.separableBorderRadius = compact.borderRadius;
    out.editableBorderRadius = compact.borderRadius;
  }

  if (compact.buttonBorderRadius) {
    out.actionableBorderRadius = compact.buttonBorderRadius;
  }

  return out;
}

/** Salt keys written by expandCompactTheme — useful for “affects N settings” UI. */
export function getExpandedKeysForCompact(
  key: CompactThemeKey
): (keyof EBThemeVariables)[] {
  return Object.keys(
    expandCompactTheme({ [key]: 'placeholder' })
  ) as (keyof EBThemeVariables)[];
}

/**
 * Reverse-approximate compact tokens from a (possibly Salt-only) theme.
 * Prefers Salt semantic names, falls back to legacy ebDesignTokens names.
 */
export function deriveCompactTheme(
  variables: EBThemeVariables = {}
): CompactThemeTokens {
  return {
    primaryColor:
      firstString(
        variables.actionableAccentedBoldBackground,
        variables.primaryColor
      ) ?? COMPACT_THEME_DEFAULTS.primaryColor,
    ringColor:
      firstString(variables.focusedRingColor, variables.ringColor) ??
      COMPACT_THEME_DEFAULTS.ringColor,
    destructiveColor:
      firstString(
        variables.actionableNegativeBoldBackground,
        variables.destructiveColor
      ) ?? COMPACT_THEME_DEFAULTS.destructiveColor,
    borderColor:
      firstString(
        variables.separableBorderColor,
        variables.borderColor,
        variables.editableBorderColor
      ) ?? COMPACT_THEME_DEFAULTS.borderColor,
    fontFamily:
      firstString(
        variables.contentFontFamily,
        variables.fontFamily,
        variables.actionableFontFamily
      ) ?? COMPACT_THEME_DEFAULTS.fontFamily,
    borderRadius:
      firstString(
        variables.separableBorderRadius,
        variables.borderRadius,
        variables.editableBorderRadius
      ) ?? COMPACT_THEME_DEFAULTS.borderRadius,
    buttonBorderRadius:
      firstString(
        variables.actionableBorderRadius,
        variables.buttonBorderRadius,
        variables.separableBorderRadius
      ) ?? COMPACT_THEME_DEFAULTS.buttonBorderRadius,
  };
}

/**
 * Apply one compact key change: expand that key and merge into current variables.
 * Does not remove unrelated Advanced-mode overrides.
 */
export function applyCompactKeyChange(
  current: EBThemeVariables,
  key: CompactThemeKey,
  value: string
): EBThemeVariables {
  const expanded = expandCompactTheme({ [key]: value });
  return { ...current, ...expanded };
}
