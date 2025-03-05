import { ColorTranslator } from 'colortranslator';
import merge from 'deepmerge';

import { EBTheme, EBThemeVariables } from './config.types';
import { defaultTheme } from './defaultTheme';

export type CSSVariable = `--${string}`;

export type CSSVariables = Record<CSSVariable, string | undefined>;

function colorToHsl(colorString?: string) {
  if (colorString === undefined) return undefined;
  try {
    const color = new ColorTranslator(colorString);
    return `${color.H} ${color.S}% ${color.L}%`;
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
    '--eb-background': colorToHsl(variables.backgroundColor),
    '--eb-foreground': colorToHsl(variables.foregroundColor),
    '--eb-card': colorToHsl(variables.cardColor),
    '--eb-card-foreground': colorToHsl(variables.cardForegroundColor),
    '--eb-popover': colorToHsl(variables.popoverColor),
    '--eb-popover-foreground': colorToHsl(variables.popoverForegroundColor),
    '--eb-primary': colorToHsl(variables.primaryColor),
    '--eb-primary-foreground': colorToHsl(variables.primaryForegroundColor),
    '--eb-secondary': colorToHsl(variables.secondaryColor),
    '--eb-secondary-foreground': colorToHsl(variables.secondaryForegroundColor),
    '--eb-muted': colorToHsl(variables.mutedColor),
    '--eb-muted-foreground': colorToHsl(variables.mutedForegroundColor),
    '--eb-accent': colorToHsl(variables.accentColor),
    '--eb-accent-foreground': colorToHsl(variables.accentForegroundColor),
    '--eb-destructive': colorToHsl(variables.destructiveColor),
    '--eb-destructive-foreground': colorToHsl(
      variables.destructiveForegroundColor
    ),
    '--eb-radius': variables.borderRadius,
    '--eb-button-radius':
      variables.buttonBorderRadius ?? variables.borderRadius,
    '--eb-spacing-unit': variables.spacingUnit,
    '--eb-border': colorToHsl(variables.borderColor),
    '--eb-input': colorToHsl(variables.inputColor),
    '--eb-ring': colorToHsl(variables.ringColor),
    '--eb-z-overlay': variables.zIndexOverlay
      ? String(variables.zIndexOverlay)
      : undefined,
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
