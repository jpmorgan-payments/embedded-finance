import { EBThemeVariables } from './config.types';

/**
 * Transformation types for token values
 */
export type TokenTransform = 'colorToHsl' | 'string' | 'number' | 'boolean';

/**
 * Token mapping definition
 */
export interface TokenMapping {
  /** New Salt-aligned token property name */
  newToken: keyof EBThemeVariables;
  /** Legacy token property name for backward compatibility */
  legacyToken?: keyof EBThemeVariables;
  /** CSS variable name (without --eb- prefix) */
  cssVar: string;
  /** Transformation to apply to the value */
  transform?: TokenTransform;
  /** Fallback value if both tokens are undefined */
  fallback?: string | number | boolean;
  /** For color tokens, alpha modifier to apply */
  alphaModifier?: number;
}

/**
 * Token category definition
 */
export interface TokenCategory {
  [key: string]: TokenMapping;
}

/**
 * Complete token mapping configuration
 * Maps Salt Design System tokens → Legacy tokens → CSS variables
 */
export const TOKEN_MAPPINGS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // Typography (Content Characteristic)
  // ═══════════════════════════════════════════════════════════════════════════
  typography: {
    fontFamily: {
      newToken: 'contentFontFamily',
      legacyToken: 'fontFamily',
      cssVar: 'font-family',
      transform: 'string',
    },
    headerFontFamily: {
      newToken: 'textHeadingFontFamily',
      legacyToken: 'headerFontFamily',
      cssVar: 'header-font-family',
      transform: 'string',
    },
    buttonFontFamily: {
      newToken: 'actionableFontFamily',
      legacyToken: 'buttonFontFamily',
      cssVar: 'button-font-family',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Container Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  container: {
    background: {
      newToken: 'containerPrimaryBackground',
      legacyToken: 'backgroundColor',
      cssVar: 'background',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'contentPrimaryForeground',
      legacyToken: 'foregroundColor',
      cssVar: 'foreground',
      transform: 'colorToHsl',
    },
    cardBackground: {
      newToken: 'containerCardBackground',
      legacyToken: 'cardColor',
      cssVar: 'card',
      transform: 'colorToHsl',
    },
    cardForeground: {
      newToken: 'containerPrimaryForeground',
      legacyToken: 'cardForegroundColor',
      cssVar: 'card-foreground',
      transform: 'colorToHsl',
    },
    mutedBackground: {
      newToken: 'containerSecondaryBackground',
      legacyToken: 'mutedColor',
      cssVar: 'muted',
      transform: 'colorToHsl',
    },
    mutedForeground: {
      newToken: 'containerSecondaryForeground',
      legacyToken: 'mutedForegroundColor',
      cssVar: 'muted-foreground',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Actionable Characteristic - Common Properties
  // ═══════════════════════════════════════════════════════════════════════════
  actionableCommon: {
    fontWeight: {
      newToken: 'actionableFontWeight',
      legacyToken: 'buttonFontWeight',
      cssVar: 'button-font-weight',
      transform: 'string',
    },
    fontSize: {
      newToken: 'actionableFontSize',
      legacyToken: 'buttonFontSize',
      cssVar: 'button-font-size',
      transform: 'string',
    },
    lineHeight: {
      newToken: 'actionableLineHeight',
      legacyToken: 'buttonLineHeight',
      cssVar: 'button-line-height',
      transform: 'string',
    },
    textTransform: {
      newToken: 'actionableTextTransform',
      legacyToken: 'buttonTextTransform',
      cssVar: 'button-text-transform',
      transform: 'string',
    },
    letterSpacing: {
      newToken: 'actionableLetterSpacing',
      legacyToken: 'buttonLetterSpacing',
      cssVar: 'button-letter-spacing',
      transform: 'string',
    },
    borderRadius: {
      newToken: 'actionableBorderRadius',
      legacyToken: 'buttonBorderRadius',
      cssVar: 'button-radius',
      transform: 'string',
    },
    shiftOnActive: {
      newToken: 'actionableShiftOnActive',
      legacyToken: 'shiftButtonOnActive',
      cssVar: 'button-translate-y-active',
      transform: 'boolean',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Actionable - Accented Bold (Primary)
  // ═══════════════════════════════════════════════════════════════════════════
  actionableAccentedBold: {
    background: {
      newToken: 'actionableAccentedBoldBackground',
      legacyToken: 'primaryColor',
      cssVar: 'primary',
      transform: 'colorToHsl',
    },
    backgroundHover: {
      newToken: 'actionableAccentedBoldBackgroundHover',
      legacyToken: 'primaryHoverColor',
      cssVar: 'primary-hover',
      transform: 'colorToHsl',
    },
    backgroundActive: {
      newToken: 'actionableAccentedBoldBackgroundActive',
      legacyToken: 'primaryActiveColor',
      cssVar: 'primary-active',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'actionableAccentedBoldForeground',
      legacyToken: 'primaryForegroundColor',
      cssVar: 'primary-foreground',
      transform: 'colorToHsl',
    },
    foregroundHover: {
      newToken: 'actionableAccentedBoldForegroundHover',
      legacyToken: 'primaryForegroundHoverColor',
      cssVar: 'primary-foreground-hover',
      transform: 'colorToHsl',
    },
    foregroundActive: {
      newToken: 'actionableAccentedBoldForegroundActive',
      legacyToken: 'primaryForegroundActiveColor',
      cssVar: 'primary-foreground-active',
      transform: 'colorToHsl',
    },
    borderWidth: {
      newToken: 'actionableAccentedBoldBorderWidth',
      legacyToken: 'primaryBorderWidth',
      cssVar: 'primary-border-width',
      transform: 'string',
    },
    fontWeight: {
      newToken: 'actionableAccentedBoldFontWeight',
      legacyToken: 'primaryButtonFontWeight',
      cssVar: 'button-primary-font-weight',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Actionable - Subtle (Secondary)
  // ═══════════════════════════════════════════════════════════════════════════
  actionableSubtle: {
    background: {
      newToken: 'actionableSubtleBackground',
      legacyToken: 'secondaryColor',
      cssVar: 'secondary',
      transform: 'colorToHsl',
    },
    backgroundHover: {
      newToken: 'actionableSubtleBackgroundHover',
      legacyToken: 'secondaryHoverColor',
      cssVar: 'secondary-hover',
      transform: 'colorToHsl',
    },
    backgroundActive: {
      newToken: 'actionableSubtleBackgroundActive',
      legacyToken: 'secondaryActiveColor',
      cssVar: 'secondary-active',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'actionableSubtleForeground',
      legacyToken: 'secondaryForegroundColor',
      cssVar: 'secondary-foreground',
      transform: 'colorToHsl',
    },
    foregroundHover: {
      newToken: 'actionableSubtleForegroundHover',
      legacyToken: 'secondaryForegroundHoverColor',
      cssVar: 'secondary-foreground-hover',
      transform: 'colorToHsl',
    },
    foregroundActive: {
      newToken: 'actionableSubtleForegroundActive',
      legacyToken: 'secondaryForegroundActiveColor',
      cssVar: 'secondary-foreground-active',
      transform: 'colorToHsl',
    },
    borderWidth: {
      newToken: 'actionableSubtleBorderWidth',
      legacyToken: 'secondaryBorderWidth',
      cssVar: 'secondary-border-width',
      transform: 'string',
    },
    fontWeight: {
      newToken: 'actionableSubtleFontWeight',
      legacyToken: 'secondaryButtonFontWeight',
      cssVar: 'button-secondary-font-weight',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Actionable - Negative Bold (Destructive)
  // ═══════════════════════════════════════════════════════════════════════════
  actionableNegativeBold: {
    background: {
      newToken: 'actionableNegativeBoldBackground',
      legacyToken: 'destructiveColor',
      cssVar: 'destructive',
      transform: 'colorToHsl',
    },
    backgroundHover: {
      newToken: 'actionableNegativeBoldBackgroundHover',
      legacyToken: 'destructiveHoverColor',
      cssVar: 'destructive-hover',
      transform: 'colorToHsl',
    },
    backgroundActive: {
      newToken: 'actionableNegativeBoldBackgroundActive',
      legacyToken: 'destructiveActiveColor',
      cssVar: 'destructive-active',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'actionableNegativeBoldForeground',
      legacyToken: 'destructiveForegroundColor',
      cssVar: 'destructive-foreground',
      transform: 'colorToHsl',
    },
    foregroundHover: {
      newToken: 'actionableNegativeBoldForegroundHover',
      legacyToken: 'destructiveForegroundHoverColor',
      cssVar: 'destructive-foreground-hover',
      transform: 'colorToHsl',
    },
    foregroundActive: {
      newToken: 'actionableNegativeBoldForegroundActive',
      legacyToken: 'destructiveForegroundActiveColor',
      cssVar: 'destructive-foreground-active',
      transform: 'colorToHsl',
    },
    borderWidth: {
      newToken: 'actionableNegativeBoldBorderWidth',
      legacyToken: 'destructiveBorderWidth',
      cssVar: 'destructive-border-width',
      transform: 'string',
    },
    fontWeight: {
      newToken: 'actionableNegativeBoldFontWeight',
      legacyToken: 'destructiveButtonFontWeight',
      cssVar: 'button-destructive-font-weight',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Editable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  editable: {
    background: {
      newToken: 'editableBackground',
      legacyToken: 'inputColor',
      cssVar: 'input',
      transform: 'colorToHsl',
    },
    borderColor: {
      newToken: 'editableBorderColor',
      legacyToken: 'inputBorderColor',
      cssVar: 'input-border',
      transform: 'colorToHsl',
    },
    borderRadius: {
      newToken: 'editableBorderRadius',
      legacyToken: 'inputBorderRadius',
      cssVar: 'input-radius',
      transform: 'string',
    },
    labelFontSize: {
      newToken: 'editableLabelFontSize',
      legacyToken: 'formLabelFontSize',
      cssVar: 'form-label-font-size',
      transform: 'string',
    },
    labelLineHeight: {
      newToken: 'editableLabelLineHeight',
      legacyToken: 'formLabelLineHeight',
      cssVar: 'form-label-line-height',
      transform: 'string',
    },
    labelFontWeight: {
      newToken: 'editableLabelFontWeight',
      legacyToken: 'formLabelFontWeight',
      cssVar: 'form-label-font-weight',
      transform: 'string',
    },
    labelForeground: {
      newToken: 'editableLabelForeground',
      legacyToken: 'formLabelForegroundColor',
      cssVar: 'form-label-foreground',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Overlayable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  overlayable: {
    background: {
      newToken: 'overlayableBackground',
      legacyToken: 'popoverColor',
      cssVar: 'popover',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'overlayableForeground',
      legacyToken: 'popoverForegroundColor',
      cssVar: 'popover-foreground',
      transform: 'colorToHsl',
    },
    zIndex: {
      newToken: 'overlayableZIndex',
      legacyToken: 'zIndexOverlay',
      cssVar: 'z-overlay',
      transform: 'number',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  navigable: {
    background: {
      newToken: 'navigableBackground',
      legacyToken: 'sidebarBackgroundColor',
      cssVar: 'sidebar-background',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'navigableForeground',
      legacyToken: 'sidebarForegroundColor',
      cssVar: 'sidebar-foreground',
      transform: 'colorToHsl',
    },
    accentBackground: {
      newToken: 'navigableAccentBackground',
      legacyToken: 'sidebarAccentColor',
      cssVar: 'sidebar-accent',
      transform: 'colorToHsl',
    },
    accentForeground: {
      newToken: 'navigableAccentForeground',
      legacyToken: 'sidebarAccentForegroundColor',
      cssVar: 'sidebar-accent-foreground',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Separable Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  separable: {
    borderColor: {
      newToken: 'separableBorderColor',
      legacyToken: 'borderColor',
      cssVar: 'border',
      transform: 'colorToHsl',
    },
    borderRadius: {
      newToken: 'separableBorderRadius',
      legacyToken: 'borderRadius',
      cssVar: 'radius',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Focused Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  focused: {
    ringColor: {
      newToken: 'focusedRingColor',
      legacyToken: 'ringColor',
      cssVar: 'ring',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Sentiment Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  sentiment: {
    negativeAccentBackground: {
      newToken: 'sentimentNegativeAccentBackground',
      legacyToken: 'destructiveAccentColor',
      cssVar: 'destructive-accent',
      transform: 'colorToHsl',
    },
    positiveForeground: {
      newToken: 'sentimentPositiveForeground',
      legacyToken: 'successColor',
      cssVar: 'success',
      transform: 'colorToHsl',
    },
    positiveAccentBackground: {
      newToken: 'sentimentPositiveAccentBackground',
      legacyToken: 'successAccentColor',
      cssVar: 'success-accent',
      transform: 'colorToHsl',
    },
    cautionForeground: {
      newToken: 'sentimentCautionForeground',
      legacyToken: 'warningColor',
      cssVar: 'warning',
      transform: 'colorToHsl',
    },
    cautionAccentBackground: {
      newToken: 'sentimentCautionAccentBackground',
      legacyToken: 'warningAccentColor',
      cssVar: 'warning-accent',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Status Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  status: {
    infoForeground: {
      newToken: 'statusInfoForeground',
      legacyToken: 'informativeColor',
      cssVar: 'informative',
      transform: 'colorToHsl',
    },
    infoAccentBackground: {
      newToken: 'statusInfoAccentBackground',
      legacyToken: 'informativeAccentColor',
      cssVar: 'informative-accent',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Accent Characteristic
  // ═══════════════════════════════════════════════════════════════════════════
  accent: {
    background: {
      newToken: 'accentBackground',
      legacyToken: 'accentColor',
      cssVar: 'accent',
      transform: 'colorToHsl',
    },
    foreground: {
      newToken: 'contentAccentForeground',
      legacyToken: 'accentForegroundColor',
      cssVar: 'accent-foreground',
      transform: 'colorToHsl',
    },
    metricBackground: {
      newToken: 'accentMetricBackground',
      legacyToken: 'metricAccentColor',
      cssVar: 'metric-accent',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Layout & Spacing
  // ═══════════════════════════════════════════════════════════════════════════
  layout: {
    spacingUnit: {
      newToken: 'spacingUnit',
      cssVar: 'spacing-unit',
      transform: 'string',
    },
  } satisfies TokenCategory,

  // ═══════════════════════════════════════════════════════════════════════════
  // Alert (Backward Compatibility)
  // ═══════════════════════════════════════════════════════════════════════════
  alert: {
    foreground: {
      newToken: 'alertForegroundColor',
      cssVar: 'alert-foreground',
      transform: 'colorToHsl',
    },
  } satisfies TokenCategory,
} as const;

/**
 * Flattened list of all token mappings for easier iteration
 */
export const ALL_TOKEN_MAPPINGS = Object.values(TOKEN_MAPPINGS).flatMap(
  (category) => Object.values(category)
);
