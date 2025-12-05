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
    variables.textHeadingFontFamily,
    variables.headerFontFamily
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Container Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const containerBg = resolve(
    variables.containerPrimaryBackground,
    variables.backgroundColor
  );
  const contentFg = resolve(
    variables.contentPrimaryForeground,
    variables.foregroundColor
  );
  const containerCardBg = resolve(
    variables.containerCardBackground,
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

  // Accented Bold variant (maps to --eb-primary)
  const actionableAccentedBoldBg = resolve(
    variables.actionableAccentedBoldBackground,
    variables.primaryColor
  );
  const actionableAccentedBoldBgHover = resolve(
    variables.actionableAccentedBoldBackgroundHover,
    variables.primaryHoverColor
  );
  const actionableAccentedBoldBgActive = resolve(
    variables.actionableAccentedBoldBackgroundActive,
    variables.primaryActiveColor
  );
  const actionableAccentedBoldFg = resolve(
    variables.actionableAccentedBoldForeground,
    variables.primaryForegroundColor
  );
  const actionableAccentedBoldFgHover = resolve(
    variables.actionableAccentedBoldForegroundHover,
    variables.primaryForegroundHoverColor
  );
  const actionableAccentedBoldFgActive = resolve(
    variables.actionableAccentedBoldForegroundActive,
    variables.primaryForegroundActiveColor
  );
  const actionableAccentedBoldBorderWidth = resolve(
    variables.actionableAccentedBoldBorderWidth,
    variables.primaryBorderWidth
  );
  const actionableAccentedBoldFontWeight = resolve(
    variables.actionableAccentedBoldFontWeight,
    variables.primaryButtonFontWeight
  );

  // Subtle variant (maps to --eb-secondary)
  const actionableSubtleBg = resolve(
    variables.actionableSubtleBackground,
    variables.secondaryColor
  );
  const actionableSubtleBgHover = resolve(
    variables.actionableSubtleBackgroundHover,
    variables.secondaryHoverColor
  );
  const actionableSubtleBgActive = resolve(
    variables.actionableSubtleBackgroundActive,
    variables.secondaryActiveColor
  );
  const actionableSubtleFg = resolve(
    variables.actionableSubtleForeground,
    variables.secondaryForegroundColor
  );
  const actionableSubtleFgHover = resolve(
    variables.actionableSubtleForegroundHover,
    variables.secondaryForegroundHoverColor
  );
  const actionableSubtleFgActive = resolve(
    variables.actionableSubtleForegroundActive,
    variables.secondaryForegroundActiveColor
  );
  const actionableSubtleBorderWidth = resolve(
    variables.actionableSubtleBorderWidth,
    variables.secondaryBorderWidth
  );
  const actionableSubtleFontWeight = resolve(
    variables.actionableSubtleFontWeight,
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
  // Actionable Negative Bold (destructive buttons - maps to --eb-destructive)
  // ═══════════════════════════════════════════════════════════════════════════
  const actionableNegativeBoldBg = resolve(
    variables.actionableNegativeBoldBackground,
    variables.destructiveColor
  );
  const actionableNegativeBoldBgHover = resolve(
    variables.actionableNegativeBoldBackgroundHover,
    variables.destructiveHoverColor
  );
  const actionableNegativeBoldBgActive = resolve(
    variables.actionableNegativeBoldBackgroundActive,
    variables.destructiveActiveColor
  );
  const actionableNegativeBoldFg = resolve(
    variables.actionableNegativeBoldForeground,
    variables.destructiveForegroundColor
  );
  const actionableNegativeBoldFgHover = resolve(
    variables.actionableNegativeBoldForegroundHover,
    variables.destructiveForegroundHoverColor
  );
  const actionableNegativeBoldFgActive = resolve(
    variables.actionableNegativeBoldForegroundActive,
    variables.destructiveForegroundActiveColor
  );
  const actionableNegativeBoldBorderWidth = resolve(
    variables.actionableNegativeBoldBorderWidth,
    variables.destructiveBorderWidth
  );
  const actionableNegativeBoldFontWeight = resolve(
    variables.actionableNegativeBoldFontWeight,
    variables.destructiveButtonFontWeight
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Sentiment Characteristic (Negative/Positive/Caution - non-actionable)
  // ═══════════════════════════════════════════════════════════════════════════
  // Negative accent (for alerts, error messages - non-actionable)
  const sentimentNegativeAccentBg = resolve(
    variables.sentimentNegativeAccentBackground,
    variables.destructiveAccentColor
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
  // Error status (maps to sentiment negative)

  // ═══════════════════════════════════════════════════════════════════════════
  // Accent Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  const accentBg = resolve(variables.accentBackground, variables.accentColor);
  const accentFg = resolve(
    variables.contentAccentForeground,
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
    '--eb-card': colorToHsl(containerCardBg),
    '--eb-card-foreground': colorToHsl(containerPrimaryFg),
    '--eb-muted': colorToHsl(containerSecondaryBg),
    '--eb-muted-foreground': colorToHsl(containerSecondaryFg),

    // Actionable - Accented Bold (maps to primary)
    '--eb-primary': colorToHsl(actionableAccentedBoldBg),
    '--eb-primary-hover': actionableAccentedBoldBgHover
      ? colorToHsl(actionableAccentedBoldBgHover)
      : colorToHsl(actionableAccentedBoldBg, 0.9),
    '--eb-primary-active': colorToHsl(actionableAccentedBoldBgActive),
    '--eb-primary-foreground': colorToHsl(actionableAccentedBoldFg),
    '--eb-primary-foreground-hover': colorToHsl(actionableAccentedBoldFgHover),
    '--eb-primary-foreground-active': colorToHsl(
      actionableAccentedBoldFgActive
    ),
    '--eb-primary-border-width': actionableAccentedBoldBorderWidth,
    '--eb-button-primary-font-weight':
      actionableAccentedBoldFontWeight ?? actionableFontWeight,

    // Actionable - Subtle (maps to secondary)
    '--eb-secondary': colorToHsl(actionableSubtleBg),
    '--eb-secondary-hover': actionableSubtleBgHover
      ? colorToHsl(actionableSubtleBgHover)
      : colorToHsl(actionableSubtleBg, 0.9),
    '--eb-secondary-active': colorToHsl(actionableSubtleBgActive),
    '--eb-secondary-foreground': colorToHsl(actionableSubtleFg),
    '--eb-secondary-foreground-hover': colorToHsl(actionableSubtleFgHover),
    '--eb-secondary-foreground-active': colorToHsl(actionableSubtleFgActive),
    '--eb-secondary-border-width': actionableSubtleBorderWidth,
    '--eb-button-secondary-font-weight':
      actionableSubtleFontWeight ?? actionableFontWeight,

    // Actionable - Common
    '--eb-button-font-size': actionableFontSize,
    '--eb-button-line-height': actionableLineHeight,
    '--eb-button-text-transform': actionableTextTransform,
    '--eb-button-letter-spacing': actionableLetterSpacing,
    '--eb-button-radius': actionableBorderRadius ?? separableBorderRadius,
    '--eb-button-translate-y-active': actionableShiftOnActive
      ? '1px'
      : undefined,

    // Actionable - Negative Bold (maps to destructive)
    '--eb-destructive': colorToHsl(actionableNegativeBoldBg),
    '--eb-destructive-hover': actionableNegativeBoldBgHover
      ? colorToHsl(actionableNegativeBoldBgHover)
      : colorToHsl(actionableNegativeBoldBg, 0.9),
    '--eb-destructive-active': colorToHsl(actionableNegativeBoldBgActive),
    '--eb-destructive-foreground': colorToHsl(actionableNegativeBoldFg),
    '--eb-destructive-foreground-hover': colorToHsl(
      actionableNegativeBoldFgHover
    ),
    '--eb-destructive-foreground-active': colorToHsl(
      actionableNegativeBoldFgActive
    ),
    '--eb-destructive-accent': colorToHsl(sentimentNegativeAccentBg),
    '--eb-destructive-border-width': actionableNegativeBoldBorderWidth,
    '--eb-button-destructive-font-weight':
      actionableNegativeBoldFontWeight ?? actionableFontWeight,

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
