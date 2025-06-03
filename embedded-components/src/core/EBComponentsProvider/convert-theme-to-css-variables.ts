import { ColorTranslator } from 'colortranslator';
import merge from 'deepmerge';

import { EBTheme, EBThemeVariables } from './config.types';
import { defaultTheme } from './defaultTheme';

export type CSSVariable = `--${string}`;

export type CSSVariables = Record<CSSVariable, string | undefined>;

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

const convertThemeVariablesToCssVariables = (
  variables: EBThemeVariables
): CSSVariables => {
  const cssVariablesObject: CSSVariables = {
    '--eb-font-family': variables.fontFamily,
    '--eb-header-font-family': variables.headerFontFamily,
    '--eb-button-font-family': variables.buttonFontFamily,
    '--eb-background': colorToHsl(variables.backgroundColor),
    '--eb-foreground': colorToHsl(variables.foregroundColor),
    '--eb-card': colorToHsl(variables.cardColor),
    '--eb-card-foreground': colorToHsl(variables.cardForegroundColor),
    '--eb-popover': colorToHsl(variables.popoverColor),
    '--eb-popover-foreground': colorToHsl(variables.popoverForegroundColor),
    '--eb-primary': colorToHsl(variables.primaryColor),
    '--eb-primary-hover': variables.primaryHoverColor
      ? colorToHsl(variables.primaryHoverColor)
      : colorToHsl(variables.primaryColor, 0.9),
    '--eb-primary-active': colorToHsl(variables.primaryActiveColor),
    '--eb-primary-foreground': colorToHsl(variables.primaryForegroundColor),
    '--eb-primary-foreground-hover': colorToHsl(
      variables.primaryForegroundHoverColor
    ),
    '--eb-primary-foreground-active': colorToHsl(
      variables.primaryForegroundActiveColor
    ),
    '--eb-secondary': colorToHsl(variables.secondaryColor),
    '--eb-secondary-hover': variables.secondaryHoverColor
      ? colorToHsl(variables.secondaryHoverColor)
      : colorToHsl(variables.secondaryColor, 0.9),
    '--eb-secondary-active': colorToHsl(variables.secondaryActiveColor),
    '--eb-secondary-foreground': colorToHsl(variables.secondaryForegroundColor),
    '--eb-secondary-foreground-hover': colorToHsl(
      variables.secondaryForegroundHoverColor
    ),
    '--eb-secondary-foreground-active': colorToHsl(
      variables.secondaryForegroundActiveColor
    ),
    '--eb-muted': colorToHsl(variables.mutedColor),
    '--eb-muted-foreground': colorToHsl(variables.mutedForegroundColor),
    '--eb-accent': colorToHsl(variables.accentColor),
    '--eb-accent-foreground': colorToHsl(variables.accentForegroundColor),
    '--eb-destructive': colorToHsl(variables.destructiveColor),
    '--eb-destructive-hover': variables.destructiveHoverColor
      ? colorToHsl(variables.destructiveHoverColor)
      : colorToHsl(variables.destructiveColor, 0.9),
    '--eb-destructive-active': colorToHsl(variables.destructiveActiveColor),
    '--eb-destructive-foreground': colorToHsl(
      variables.destructiveForegroundColor
    ),
    '--eb-destructive-foreground-hover': colorToHsl(
      variables.destructiveForegroundHoverColor
    ),
    '--eb-destructive-foreground-active': colorToHsl(
      variables.destructiveForegroundActiveColor
    ),
    '--eb-radius': variables.borderRadius,
    '--eb-button-radius':
      variables.buttonBorderRadius ?? variables.borderRadius,
    '--eb-input-radius': variables.inputBorderRadius ?? variables.borderRadius,
    '--eb-spacing-unit': variables.spacingUnit,
    '--eb-border': colorToHsl(variables.borderColor),
    '--eb-input': colorToHsl(variables.inputColor),
    '--eb-input-border': colorToHsl(variables.inputBorderColor),
    '--eb-ring': colorToHsl(variables.ringColor),
    '--eb-z-overlay': variables.zIndexOverlay
      ? String(variables.zIndexOverlay)
      : undefined,
    '--eb-button-primary-font-weight':
      variables.primaryButtonFontWeight ?? variables.buttonFontWeight,
    '--eb-button-secondary-font-weight':
      variables.secondaryButtonFontWeight ?? variables.buttonFontWeight,
    '--eb-button-destructive-font-weight':
      variables.destructiveButtonFontWeight ?? variables.buttonFontWeight,
    '--eb-button-font-size': variables.buttonFontSize,
    '--eb-button-line-height': variables.buttonLineHeight,
    '--eb-primary-border-width': variables.primaryBorderWidth,
    '--eb-secondary-border-width': variables.secondaryBorderWidth,
    '--eb-destructive-border-width': variables.destructiveBorderWidth,
    '--eb-button-translate-y-active': variables.shiftButtonOnActive
      ? '1px'
      : undefined,
    '--eb-button-text-transform': variables.buttonTextTransform,
    '--eb-button-letter-spacing': variables.buttonLetterSpacing,
    '--eb-form-label-font-size': variables.formLabelFontSize,
    '--eb-form-label-line-height': variables.formLabelLineHeight,
    '--eb-form-label-font-weight': variables.formLabelFontWeight,
  };

  Object.keys(cssVariablesObject).forEach(
    (key) =>
      cssVariablesObject[key as CSSVariable] === undefined &&
      delete cssVariablesObject[key as CSSVariable]
  );

  return cssVariablesObject;
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
