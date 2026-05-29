import { ColorTranslator } from 'colortranslator';
import merge from 'deepmerge';

import { EBTheme, EBThemeVariables } from './config.types';
import { EBCSSVariable } from './css-variables.types';
import { defaultTheme } from './defaultTheme';
import {
  ALL_TOKEN_MAPPINGS,
  TokenMapping,
  TokenTransform,
} from './token-mappings';

export type CSSVariable = `--${string}`;

export type CSSVariables = Partial<Record<EBCSSVariable, string>>;

function colorToHsl(colorString?: string, alphaModifier?: number) {
  if (colorString === undefined) return undefined;
  try {
    const color = new ColorTranslator(colorString);
    const alpha = color.A * (alphaModifier ?? 1);
    return alpha !== 1
      ? `${color.H} ${color.S}% ${color.L}% / ${alpha}`
      : `${color.H} ${color.S}% ${color.L}%`;
  } catch {
    return undefined;
  }
}

/**
 * Resolves a token value with fallback to legacy name for backward compatibility.
 * New Salt-aligned names take precedence over legacy names.
 */
const resolve = <T>(
  newValue: T | undefined,
  legacyValue: T | undefined
): T | undefined => newValue ?? legacyValue;

/**
 * Apply transformation to a token value based on its type
 */
function applyTransform(
  value: string | number | boolean | undefined,
  transform?: TokenTransform,
  alphaModifier?: number
): string | undefined {
  if (value === undefined) return undefined;

  switch (transform) {
    case 'colorToHsl':
      return colorToHsl(String(value), alphaModifier);
    case 'boolean':
      return value ? '1px' : undefined; // For button shift animation
    case 'number':
      return String(value);
    case 'string':
    default:
      return String(value);
  }
}

/**
 * Process a single token mapping and return the CSS variable
 */
function processTokenMapping(
  mapping: TokenMapping,
  variables: EBThemeVariables
): [EBCSSVariable, string | undefined] {
  const newValue = variables[mapping.newToken];
  const legacyValue = mapping.legacyToken
    ? variables[mapping.legacyToken]
    : undefined;
  const resolvedValue = resolve(newValue, legacyValue) ?? mapping.fallback;

  const cssVarName = `--eb-${mapping.cssVar}` as EBCSSVariable;
  const cssVarValue = applyTransform(
    resolvedValue,
    mapping.transform,
    mapping.alphaModifier
  );

  return [cssVarName, cssVarValue];
}

/**
 * Converts theme variables to CSS custom properties using configuration-driven approach.
 * This reduces ~300 lines of repetitive code to a single loop over token mappings.
 */
const convertThemeVariablesToCssVariables = (
  variables: EBThemeVariables
): CSSVariables => {
  const cssVariables: CSSVariables = {};

  // Process all token mappings
  for (const mapping of ALL_TOKEN_MAPPINGS) {
    const [cssVarName, cssVarValue] = processTokenMapping(mapping, variables);
    if (cssVarValue !== undefined) {
      cssVariables[cssVarName] = cssVarValue;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Special Cases - Computed or Conditional Values
  // ═══════════════════════════════════════════════════════════════════════════

  // Primary hover fallback (90% opacity if not explicitly set)
  const primaryBg = resolve(
    variables.actionableAccentedBoldBackground,
    variables.primaryColor
  );
  const primaryHover = resolve(
    variables.actionableAccentedBoldBackgroundHover,
    variables.primaryHoverColor
  );
  if (!primaryHover && primaryBg) {
    cssVariables['--eb-primary-hover'] = colorToHsl(primaryBg, 0.9);
  }

  // Secondary hover fallback (90% opacity if not explicitly set)
  const secondaryBg = resolve(
    variables.actionableSubtleBackground,
    variables.secondaryColor
  );
  const secondaryHover = resolve(
    variables.actionableSubtleBackgroundHover,
    variables.secondaryHoverColor
  );
  if (!secondaryHover && secondaryBg) {
    cssVariables['--eb-secondary-hover'] = colorToHsl(secondaryBg, 0.9);
  }

  // Destructive hover fallback (90% opacity if not explicitly set)
  const destructiveBg = resolve(
    variables.actionableNegativeBoldBackground,
    variables.destructiveColor
  );
  const destructiveHover = resolve(
    variables.actionableNegativeBoldBackgroundHover,
    variables.destructiveHoverColor
  );
  if (!destructiveHover && destructiveBg) {
    cssVariables['--eb-destructive-hover'] = colorToHsl(destructiveBg, 0.9);
  }

  // Button radius fallback to general border radius
  const separableBorderRadius = resolve(
    variables.separableBorderRadius,
    variables.borderRadius
  );
  if (!cssVariables['--eb-button-radius'] && separableBorderRadius) {
    cssVariables['--eb-button-radius'] = separableBorderRadius;
  }

  // Input radius fallback to general border radius
  if (!cssVariables['--eb-input-radius'] && separableBorderRadius) {
    cssVariables['--eb-input-radius'] = separableBorderRadius;
  }

  // Font weight fallbacks for button variants
  const baseFontWeight = resolve(
    variables.actionableFontWeight,
    variables.buttonFontWeight
  );
  if (!cssVariables['--eb-button-primary-font-weight'] && baseFontWeight) {
    cssVariables['--eb-button-primary-font-weight'] = baseFontWeight;
  }
  if (!cssVariables['--eb-button-secondary-font-weight'] && baseFontWeight) {
    cssVariables['--eb-button-secondary-font-weight'] = baseFontWeight;
  }
  if (!cssVariables['--eb-button-destructive-font-weight'] && baseFontWeight) {
    cssVariables['--eb-button-destructive-font-weight'] = baseFontWeight;
  }

  return cssVariables;
};

const cssVariablesObjectToString = (variables: CSSVariables) =>
  Object.entries(variables)
    .map(([name, value]) => `${name}: ${value};`)
    .join('');

export const convertThemeToCssString = (theme: EBTheme) => {
  const cssVariables = {
    variables: convertThemeVariablesToCssVariables(
      merge(defaultTheme.variables ?? {}, theme.variables ?? {})
    ),
    light: convertThemeVariablesToCssVariables(
      merge.all([
        defaultTheme.light ?? {},
        theme.variables ?? {},
        theme.light ?? {},
      ])
    ),
    dark: convertThemeVariablesToCssVariables(
      merge.all([
        defaultTheme.dark ?? {},
        theme.variables ?? {},
        theme.dark ?? {},
      ])
    ),
  };

  const shared = `:root{${cssVariablesObjectToString(cssVariables.variables)}}`;
  const light = `.eb-light{${cssVariablesObjectToString(cssVariables.light)}}`;
  const dark = `.eb-dark{${cssVariablesObjectToString(cssVariables.dark)}}`;

  return `${shared}${light}${dark}`;
};
