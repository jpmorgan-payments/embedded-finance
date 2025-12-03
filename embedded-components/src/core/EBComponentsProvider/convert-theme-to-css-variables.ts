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

/**
 * Resolves a token value with fallback to legacy name for backward compatibility.
 * New Salt-aligned names take precedence over legacy names.
 */
const resolve = <T>(
  newValue: T | undefined,
  legacyValue: T | undefined
): T | undefined => newValue ?? legacyValue;

const convertThemeVariablesToCssVariables = (
  variables: EBThemeVariables
): CSSVariables => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Typography (Content Characteristic)
  // ═══════════════════════════════════════════════════════════════════════════
  const fontFamily = resolve(variables.contentFontFamily, variables.fontFamily);
  const headerFontFamily = resolve(
    variables.contentHeaderFontFamily,
    variables.headerFontFamily
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Container Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const containerBg = resolve(
    variables.containerBackground,
    variables.backgroundColor
  );
  const contentFg = resolve(
    variables.contentPrimaryForeground,
    variables.foregroundColor
  );
  const containerPrimaryBg = resolve(
    variables.containerPrimaryBackground,
    variables.cardColor
  );
  const containerPrimaryFg = resolve(
    variables.containerPrimaryForeground,
    variables.cardForegroundColor
  );
  const containerSecondaryBg = resolve(
    variables.containerSecondaryBackground,
    variables.mutedColor
  );
  const containerSecondaryFg = resolve(
    variables.containerSecondaryForeground,
    variables.mutedForegroundColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Actionable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const actionableFontFamily = resolve(
    variables.actionableFontFamily,
    variables.buttonFontFamily
  );
  const actionableFontWeight = resolve(
    variables.actionableFontWeight,
    variables.buttonFontWeight
  );
  const actionableFontSize = resolve(
    variables.actionableFontSize,
    variables.buttonFontSize
  );
  const actionableLineHeight = resolve(
    variables.actionableLineHeight,
    variables.buttonLineHeight
  );
  const actionableTextTransform = resolve(
    variables.actionableTextTransform,
    variables.buttonTextTransform
  );
  const actionableLetterSpacing = resolve(
    variables.actionableLetterSpacing,
    variables.buttonLetterSpacing
  );
  const actionableBorderRadius = resolve(
    variables.actionableBorderRadius,
    variables.buttonBorderRadius
  );
  const actionableShiftOnActive = resolve(
    variables.actionableShiftOnActive,
    variables.shiftButtonOnActive
  );

  // Primary variant
  const actionablePrimaryBg = resolve(
    variables.actionablePrimaryBackground,
    variables.primaryColor
  );
  const actionablePrimaryBgHover = resolve(
    variables.actionablePrimaryBackgroundHover,
    variables.primaryHoverColor
  );
  const actionablePrimaryBgActive = resolve(
    variables.actionablePrimaryBackgroundActive,
    variables.primaryActiveColor
  );
  const actionablePrimaryFg = resolve(
    variables.actionablePrimaryForeground,
    variables.primaryForegroundColor
  );
  const actionablePrimaryFgHover = resolve(
    variables.actionablePrimaryForegroundHover,
    variables.primaryForegroundHoverColor
  );
  const actionablePrimaryFgActive = resolve(
    variables.actionablePrimaryForegroundActive,
    variables.primaryForegroundActiveColor
  );
  const actionablePrimaryBorderWidth = resolve(
    variables.actionablePrimaryBorderWidth,
    variables.primaryBorderWidth
  );
  const actionablePrimaryFontWeight = resolve(
    variables.actionablePrimaryFontWeight,
    variables.primaryButtonFontWeight
  );

  // Secondary variant
  const actionableSecondaryBg = resolve(
    variables.actionableSecondaryBackground,
    variables.secondaryColor
  );
  const actionableSecondaryBgHover = resolve(
    variables.actionableSecondaryBackgroundHover,
    variables.secondaryHoverColor
  );
  const actionableSecondaryBgActive = resolve(
    variables.actionableSecondaryBackgroundActive,
    variables.secondaryActiveColor
  );
  const actionableSecondaryFg = resolve(
    variables.actionableSecondaryForeground,
    variables.secondaryForegroundColor
  );
  const actionableSecondaryFgHover = resolve(
    variables.actionableSecondaryForegroundHover,
    variables.secondaryForegroundHoverColor
  );
  const actionableSecondaryFgActive = resolve(
    variables.actionableSecondaryForegroundActive,
    variables.secondaryForegroundActiveColor
  );
  const actionableSecondaryBorderWidth = resolve(
    variables.actionableSecondaryBorderWidth,
    variables.secondaryBorderWidth
  );
  const actionableSecondaryFontWeight = resolve(
    variables.actionableSecondaryFontWeight,
    variables.secondaryButtonFontWeight
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Editable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const editableBg = resolve(
    variables.editableBackground,
    variables.inputColor
  );
  const editableBorderColor = resolve(
    variables.editableBorderColor,
    variables.inputBorderColor
  );
  const editableBorderRadius = resolve(
    variables.editableBorderRadius,
    variables.inputBorderRadius
  );
  const editableLabelFontSize = resolve(
    variables.editableLabelFontSize,
    variables.formLabelFontSize
  );
  const editableLabelLineHeight = resolve(
    variables.editableLabelLineHeight,
    variables.formLabelLineHeight
  );
  const editableLabelFontWeight = resolve(
    variables.editableLabelFontWeight,
    variables.formLabelFontWeight
  );
  const editableLabelFg = resolve(
    variables.editableLabelForeground,
    variables.formLabelForegroundColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Overlayable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayableBg = resolve(
    variables.overlayableBackground,
    variables.popoverColor
  );
  const overlayableFg = resolve(
    variables.overlayableForeground,
    variables.popoverForegroundColor
  );
  const overlayableZIndex = resolve(
    variables.overlayableZIndex,
    variables.zIndexOverlay
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const navigableBg = resolve(
    variables.navigableBackground,
    variables.sidebarBackgroundColor
  );
  const navigableFg = resolve(
    variables.navigableForeground,
    variables.sidebarForegroundColor
  );
  const navigableAccentBg = resolve(
    variables.navigableAccentBackground,
    variables.sidebarAccentColor
  );
  const navigableAccentFg = resolve(
    variables.navigableAccentForeground,
    variables.sidebarAccentForegroundColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Separable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const separableBorderColor = resolve(
    variables.separableBorderColor,
    variables.borderColor
  );
  const separableBorderRadius = resolve(
    variables.separableBorderRadius,
    variables.borderRadius
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Focused Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const focusedRingColor = resolve(
    variables.focusedRingColor,
    variables.ringColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Sentiment Characteristic (Negative/Positive/Caution)
  // ═══════════════════════════════════════════════════════════════════════════
  // Negative (destructive)
  const sentimentNegativeBg = resolve(
    variables.sentimentNegativeBackground,
    variables.destructiveColor
  );
  const sentimentNegativeBgHover = resolve(
    variables.sentimentNegativeBackgroundHover,
    variables.destructiveHoverColor
  );
  const sentimentNegativeBgActive = resolve(
    variables.sentimentNegativeBackgroundActive,
    variables.destructiveActiveColor
  );
  const sentimentNegativeFg = resolve(
    variables.sentimentNegativeForeground,
    variables.destructiveForegroundColor
  );
  const sentimentNegativeFgHover = resolve(
    variables.sentimentNegativeForegroundHover,
    variables.destructiveForegroundHoverColor
  );
  const sentimentNegativeFgActive = resolve(
    variables.sentimentNegativeForegroundActive,
    variables.destructiveForegroundActiveColor
  );
  const sentimentNegativeAccentBg = resolve(
    variables.sentimentNegativeAccentBackground,
    variables.destructiveAccentColor
  );
  const sentimentNegativeBorderWidth = resolve(
    variables.sentimentNegativeBorderWidth,
    variables.destructiveBorderWidth
  );
  const sentimentNegativeFontWeight = resolve(
    variables.sentimentNegativeFontWeight,
    variables.destructiveButtonFontWeight
  );

  // Positive (success)
  const sentimentPositiveFg = resolve(
    variables.sentimentPositiveForeground,
    variables.successColor
  );
  const sentimentPositiveAccentBg = resolve(
    variables.sentimentPositiveAccentBackground,
    variables.successAccentColor
  );

  // Caution (warning)
  const sentimentCautionFg = resolve(
    variables.sentimentCautionForeground,
    variables.warningColor
  );
  const sentimentCautionAccentBg = resolve(
    variables.sentimentCautionAccentBackground,
    variables.warningAccentColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Status Characteristic (Info/Error/Success/Warning)
  // ═══════════════════════════════════════════════════════════════════════════
  const statusInfoFg = resolve(
    variables.statusInfoForeground,
    variables.informativeColor
  );
  const statusInfoAccentBg = resolve(
    variables.statusInfoAccentBackground,
    variables.informativeAccentColor
  );
  // Success and Warning fallback to sentiment values (Error maps directly to sentiment negative)
  const statusSuccessFg = resolve(
    variables.statusSuccessForeground,
    sentimentPositiveFg
  );
  const statusSuccessAccentBg = resolve(
    variables.statusSuccessAccentBackground,
    sentimentPositiveAccentBg
  );
  const statusWarningFg = resolve(
    variables.statusWarningForeground,
    sentimentCautionFg
  );
  const statusWarningAccentBg = resolve(
    variables.statusWarningAccentBackground,
    sentimentCautionAccentBg
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Accent Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const accentBg = resolve(variables.accentBackground, variables.accentColor);
  const accentFg = resolve(
    variables.accentForeground,
    variables.accentForegroundColor
  );
  const accentMetricBg = resolve(
    variables.accentMetricBackground,
    variables.metricAccentColor
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Alert (maps to container secondary for backward compatibility)
  // ═══════════════════════════════════════════════════════════════════════════
  const alertFg = variables.alertForegroundColor;

  // ═══════════════════════════════════════════════════════════════════════════
  // Build CSS Variables Object
  // ═══════════════════════════════════════════════════════════════════════════
  const cssVariablesObject: CSSVariables = {
    // Typography
    '--eb-font-family': fontFamily,
    '--eb-header-font-family': headerFontFamily,
    '--eb-button-font-family': actionableFontFamily,

    // Container
    '--eb-background': colorToHsl(containerBg),
    '--eb-foreground': colorToHsl(contentFg),
    '--eb-card': colorToHsl(containerPrimaryBg),
    '--eb-card-foreground': colorToHsl(containerPrimaryFg),
    '--eb-muted': colorToHsl(containerSecondaryBg),
    '--eb-muted-foreground': colorToHsl(containerSecondaryFg),

    // Actionable - Primary
    '--eb-primary': colorToHsl(actionablePrimaryBg),
    '--eb-primary-hover': actionablePrimaryBgHover
      ? colorToHsl(actionablePrimaryBgHover)
      : colorToHsl(actionablePrimaryBg, 0.9),
    '--eb-primary-active': colorToHsl(actionablePrimaryBgActive),
    '--eb-primary-foreground': colorToHsl(actionablePrimaryFg),
    '--eb-primary-foreground-hover': colorToHsl(actionablePrimaryFgHover),
    '--eb-primary-foreground-active': colorToHsl(actionablePrimaryFgActive),
    '--eb-primary-border-width': actionablePrimaryBorderWidth,
    '--eb-button-primary-font-weight':
      actionablePrimaryFontWeight ?? actionableFontWeight,

    // Actionable - Secondary
    '--eb-secondary': colorToHsl(actionableSecondaryBg),
    '--eb-secondary-hover': actionableSecondaryBgHover
      ? colorToHsl(actionableSecondaryBgHover)
      : colorToHsl(actionableSecondaryBg, 0.9),
    '--eb-secondary-active': colorToHsl(actionableSecondaryBgActive),
    '--eb-secondary-foreground': colorToHsl(actionableSecondaryFg),
    '--eb-secondary-foreground-hover': colorToHsl(actionableSecondaryFgHover),
    '--eb-secondary-foreground-active': colorToHsl(actionableSecondaryFgActive),
    '--eb-secondary-border-width': actionableSecondaryBorderWidth,
    '--eb-button-secondary-font-weight':
      actionableSecondaryFontWeight ?? actionableFontWeight,

    // Actionable - Common
    '--eb-button-font-size': actionableFontSize,
    '--eb-button-line-height': actionableLineHeight,
    '--eb-button-text-transform': actionableTextTransform,
    '--eb-button-letter-spacing': actionableLetterSpacing,
    '--eb-button-radius': actionableBorderRadius ?? separableBorderRadius,
    '--eb-button-translate-y-active': actionableShiftOnActive
      ? '1px'
      : undefined,

    // Sentiment - Negative (Destructive)
    '--eb-destructive': colorToHsl(sentimentNegativeBg),
    '--eb-destructive-hover': sentimentNegativeBgHover
      ? colorToHsl(sentimentNegativeBgHover)
      : colorToHsl(sentimentNegativeBg, 0.9),
    '--eb-destructive-active': colorToHsl(sentimentNegativeBgActive),
    '--eb-destructive-foreground': colorToHsl(sentimentNegativeFg),
    '--eb-destructive-foreground-hover': colorToHsl(sentimentNegativeFgHover),
    '--eb-destructive-foreground-active': colorToHsl(sentimentNegativeFgActive),
    '--eb-destructive-accent': colorToHsl(sentimentNegativeAccentBg),
    '--eb-destructive-border-width': sentimentNegativeBorderWidth,
    '--eb-button-destructive-font-weight':
      sentimentNegativeFontWeight ?? actionableFontWeight,

    // Status
    '--eb-informative': colorToHsl(statusInfoFg),
    '--eb-informative-accent': colorToHsl(statusInfoAccentBg),
    '--eb-warning': colorToHsl(statusWarningFg),
    '--eb-warning-accent': colorToHsl(statusWarningAccentBg),
    '--eb-success': colorToHsl(statusSuccessFg),
    '--eb-success-accent': colorToHsl(statusSuccessAccentBg),

    // Accent
    '--eb-accent': colorToHsl(accentBg),
    '--eb-accent-foreground': colorToHsl(accentFg),
    '--eb-metric-accent': colorToHsl(accentMetricBg),

    // Alert (backward compatibility)
    '--eb-alert-foreground': colorToHsl(alertFg),

    // Editable
    '--eb-input': colorToHsl(editableBg),
    '--eb-input-border': colorToHsl(editableBorderColor),
    '--eb-input-radius': editableBorderRadius ?? separableBorderRadius,
    '--eb-form-label-font-size': editableLabelFontSize,
    '--eb-form-label-line-height': editableLabelLineHeight,
    '--eb-form-label-font-weight': editableLabelFontWeight,
    '--eb-form-label-foreground': colorToHsl(editableLabelFg),

    // Overlayable
    '--eb-popover': colorToHsl(overlayableBg),
    '--eb-popover-foreground': colorToHsl(overlayableFg),
    '--eb-z-overlay': overlayableZIndex ? String(overlayableZIndex) : undefined,

    // Navigable
    '--eb-sidebar-background': colorToHsl(navigableBg),
    '--eb-sidebar-foreground': colorToHsl(navigableFg),
    '--eb-sidebar-accent': colorToHsl(navigableAccentBg),
    '--eb-sidebar-accent-foreground': colorToHsl(navigableAccentFg),

    // Separable
    '--eb-border': colorToHsl(separableBorderColor),
    '--eb-radius': separableBorderRadius,

    // Focused
    '--eb-ring': colorToHsl(focusedRingColor),

    // Spacing
    '--eb-spacing-unit': variables.spacingUnit,
  };

  // Remove undefined values
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
