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
 * Hover-color fallbacks: when an explicit hover color is not set but a base
 * background color exists, derive the hover color at 90% opacity.
 */
const HOVER_FALLBACKS: Array<{
  cssVar: EBCSSVariable;
  newBg: keyof EBThemeVariables;
  legacyBg: keyof EBThemeVariables;
  newHover: keyof EBThemeVariables;
  legacyHover: keyof EBThemeVariables;
}> = [
  {
    cssVar: '--eb-primary-hover',
    newBg: 'actionableAccentedBoldBackground',
    legacyBg: 'primaryColor',
    newHover: 'actionableAccentedBoldBackgroundHover',
    legacyHover: 'primaryHoverColor',
  },
  {
    cssVar: '--eb-secondary-hover',
    newBg: 'actionableSubtleBackground',
    legacyBg: 'secondaryColor',
    newHover: 'actionableSubtleBackgroundHover',
    legacyHover: 'secondaryHoverColor',
  },
  {
    cssVar: '--eb-destructive-hover',
    newBg: 'actionableNegativeBoldBackground',
    legacyBg: 'destructiveColor',
    newHover: 'actionableNegativeBoldBackgroundHover',
    legacyHover: 'destructiveHoverColor',
  },
];

const applyHoverFallbacks = (
  cssVariables: CSSVariables,
  variables: EBThemeVariables
): void => {
  for (const f of HOVER_FALLBACKS) {
    const bg = resolve(variables[f.newBg], variables[f.legacyBg]);
    const hover = resolve(variables[f.newHover], variables[f.legacyHover]);
    if (!hover && bg) {
      cssVariables[f.cssVar] = colorToHsl(String(bg), 0.9);
    }
  }
};

/**
 * Radius and font-weight fallbacks: apply a shared value only when the
 * specific CSS variable has not already been set by a token mapping.
 */
const applyRadiusAndFontFallbacks = (
  cssVariables: CSSVariables,
  variables: EBThemeVariables
): void => {
  const setIfAbsent = (
    cssVar: EBCSSVariable,
    value: string | number | boolean | undefined
  ): void => {
    if (!cssVariables[cssVar] && value) {
      cssVariables[cssVar] = String(value);
    }
  };

  const separableBorderRadius = resolve(
    variables.separableBorderRadius,
    variables.borderRadius
  );
  setIfAbsent('--eb-button-radius', separableBorderRadius);
  setIfAbsent('--eb-input-radius', separableBorderRadius);

  const baseFontWeight = resolve(
    variables.actionableFontWeight,
    variables.buttonFontWeight
  );
  setIfAbsent('--eb-button-primary-font-weight', baseFontWeight);
  setIfAbsent('--eb-button-secondary-font-weight', baseFontWeight);
  setIfAbsent('--eb-button-destructive-font-weight', baseFontWeight);
};

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

  // Special cases - computed or conditional fallback values
  applyHoverFallbacks(cssVariables, variables);
  applyRadiusAndFontFallbacks(cssVariables, variables);

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
