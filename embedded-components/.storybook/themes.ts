/**
 * Centralized theme configurations for Storybook stories
 *
 * This file contains theme configurations that can be imported and used
 * across all component stories for consistent theming.
 */

import { defaultTheme } from '@/core/EBComponentsProvider/defaultTheme';

import { EBTheme } from '../src/core/EBComponentsProvider/config.types';

/**
 * SellSense Theme Configuration
 *
 * Unified theme with light and dark mode support using Salt Design System semantic tokens:
 * - Common properties in `variables` (fonts, spacing, etc.)
 * - Light mode specific colors in `light`
 * - Dark mode specific colors in `dark`
 * - Maintains SellSense brand identity across modes
 */
export const SELLSENSE_THEME: EBTheme = {
  colorScheme: 'light', // Force light mode to match SellSense demo
  variables: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTENT CHARACTERISTIC - Typography
    // ═══════════════════════════════════════════════════════════════════════════
    contentFontFamily: 'Inter',
    contentHeaderFontFamily: 'Inter',

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC - Borders
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderRadius: '8px',
    spacingUnit: '0.25rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableZIndex: 1000,

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Buttons
    // ═══════════════════════════════════════════════════════════════════════════
    actionableFontFamily: 'Inter',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionableBorderRadius: '8px',
    actionableShiftOnActive: false,
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '600',
    actionablePrimaryBorderWidth: '0px',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative (Destructive)
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeFontWeight: '600',
    sentimentNegativeBorderWidth: '0px',

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC - Form Inputs
    // ═══════════════════════════════════════════════════════════════════════════
    editableBorderRadius: '4px',
    editableLabelFontSize: '0.875rem',
    editableLabelFontWeight: '600',
    editableLabelLineHeight: '1.25rem',
  },
  light: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTAINER CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    containerBackground: 'hsl(30, 20%, 97%)', // #FAF9F7
    contentPrimaryForeground: 'hsl(215, 25%, 27%)', // #1e293b
    containerPrimaryBackground: 'hsl(30, 25%, 95%)', // #F7F3F0
    containerPrimaryForeground: 'hsl(215, 25%, 27%)', // #1e293b
    containerSecondaryBackground: 'hsl(210, 40%, 98%)', // #f8fafc
    containerSecondaryForeground: 'hsl(215, 16%, 47%)', // #64748b

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    editableBackground: 'hsl(0, 0%, 100%)', // #FFFFFF
    editableBorderColor: 'hsla(0, 0%, 0%, 0.3)', // #0000004d
    editableLabelForeground: 'hsl(215, 25%, 27%)', // #1e293b

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableBackground: 'hsl(0, 0%, 100%)',
    overlayableForeground: 'hsl(215, 25%, 27%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Primary Variant (SellSense Orange)
    // ═══════════════════════════════════════════════════════════════════════════
    actionablePrimaryBackground: 'hsl(14, 91%, 55%)', // #f55727
    actionablePrimaryBackgroundHover: 'hsl(14, 91%, 50%)', // #e14d1f
    actionablePrimaryBackgroundActive: 'hsl(14, 91%, 45%)', // #cc4319
    actionablePrimaryForeground: 'hsl(0, 0%, 100%)', // #ffffff

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Secondary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSecondaryBackground: 'hsl(30, 100%, 98%)', // #FDF7F0
    actionableSecondaryBackgroundHover: 'hsla(240, 4.8%, 95.9%, 0.5)',
    actionableSecondaryBackgroundActive: 'hsl(175, 62%, 41%)', // #2CB9AC
    actionableSecondaryForeground: 'hsl(14, 91%, 55%)', // #f55727
    actionableSecondaryForegroundHover: 'hsl(14, 91%, 50%)', // #e14d1f
    actionableSecondaryForegroundActive: 'hsl(175, 62%, 41%)', // #2CB9AC
    actionableSecondaryBorderWidth: '1px',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(210, 40%, 96%)', // #f1f5f9
    accentForeground: 'hsl(215, 25%, 27%)', // #475569
    accentMetricBackground: 'hsl(175, 62%, 41%)', // #2FB9A9 - Teal for balance values

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative (Destructive)
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeBackground: 'hsl(0, 84%, 60%)', // #ef4444
    sentimentNegativeBackgroundHover: 'hsl(0, 84%, 56%)', // #dc2626
    sentimentNegativeBackgroundActive: 'hsl(0, 84%, 52%)', // #b91c1c
    sentimentNegativeForeground: 'hsl(0, 0%, 100%)', // #ffffff
    sentimentNegativeForegroundHover: 'hsl(0, 100%, 98%)', // #fef2f2
    sentimentNegativeForegroundActive: 'hsl(0, 100%, 96%)', // #fee2e2

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Positive (Success)
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentPositiveForeground: 'hsl(142, 76%, 36%)', // #10b981
    sentimentPositiveAccentBackground: 'hsl(142, 76%, 93%)', // #d1fae5

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Caution (Warning)
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentCautionForeground: 'hsl(38, 92%, 50%)', // #f59e0b
    sentimentCautionAccentBackground: 'hsl(48, 96%, 89%)', // #fef3c7

    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS CHARACTERISTIC - Info
    // ═══════════════════════════════════════════════════════════════════════════
    statusInfoForeground: 'hsl(175, 62%, 41%)', // #2cb9ac - SellSense teal
    statusInfoAccentBackground: 'hsl(175, 100%, 98%)', // #f0fffd

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderColor: 'hsla(0, 0%, 0%, 0.3)', // #0000004d

    // ═══════════════════════════════════════════════════════════════════════════
    // FOCUSED CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    focusedRingColor: 'hsl(215, 25%, 27%)', // #1e293b

    // ═══════════════════════════════════════════════════════════════════════════
    // LEGACY ALERT TOKENS (for backward compatibility)
    // ═══════════════════════════════════════════════════════════════════════════
    alertColor: 'hsl(30, 100%, 98%)', // #FDF7F0
    alertForegroundColor: 'hsl(215, 25%, 27%)', // #1e293b
  },
  dark: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTAINER CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    containerBackground: 'hsl(215, 25%, 10%)',
    contentPrimaryForeground: 'hsl(210, 40%, 98%)',
    containerPrimaryBackground: 'hsl(215, 25%, 12%)',
    containerPrimaryForeground: 'hsl(210, 40%, 98%)',
    containerSecondaryBackground: 'hsl(215, 25%, 15%)',
    containerSecondaryForeground: 'hsl(215, 16%, 56%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    editableBackground: 'hsl(215, 25%, 12%)',
    editableBorderColor: 'hsla(210, 40%, 98%, 0.3)',
    editableLabelForeground: 'hsl(210, 40%, 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableBackground: 'hsl(215, 25%, 12%)',
    overlayableForeground: 'hsl(210, 40%, 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Primary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionablePrimaryBackground: 'hsl(14, 91%, 55%)', // Maintain brand color
    actionablePrimaryBackgroundHover: 'hsl(14, 91%, 60%)',
    actionablePrimaryBackgroundActive: 'hsl(14, 91%, 65%)',
    actionablePrimaryForeground: 'hsl(0, 0%, 100%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Secondary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSecondaryBackground: 'hsl(215, 25%, 15%)',
    actionableSecondaryBackgroundHover: 'hsl(215, 25%, 20%)',
    actionableSecondaryBackgroundActive: 'hsl(175, 62%, 41%)',
    actionableSecondaryForeground: 'hsl(14, 91%, 55%)',
    actionableSecondaryForegroundHover: 'hsl(14, 91%, 60%)',
    actionableSecondaryForegroundActive: 'hsl(175, 62%, 41%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(215, 25%, 18%)',
    accentForeground: 'hsl(210, 40%, 96%)',
    accentMetricBackground: 'hsl(175, 62%, 41%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeBackground: 'hsl(0, 84%, 60%)',
    sentimentNegativeBackgroundHover: 'hsl(0, 84%, 65%)',
    sentimentNegativeBackgroundActive: 'hsl(0, 84%, 70%)',
    sentimentNegativeForeground: 'hsl(0, 0%, 100%)',
    sentimentNegativeForegroundHover: 'hsl(0, 100%, 98%)',
    sentimentNegativeForegroundActive: 'hsl(0, 100%, 96%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Positive
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentPositiveForeground: 'hsl(142, 76%, 36%)',
    sentimentPositiveAccentBackground: 'hsl(142, 76%, 15%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Caution
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentCautionForeground: 'hsl(38, 92%, 50%)',
    sentimentCautionAccentBackground: 'hsl(38, 92%, 15%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS CHARACTERISTIC - Info
    // ═══════════════════════════════════════════════════════════════════════════
    statusInfoForeground: 'hsl(175, 62%, 41%)',
    statusInfoAccentBackground: 'hsl(175, 62%, 15%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderColor: 'hsla(210, 40%, 98%, 0.3)',

    // ═══════════════════════════════════════════════════════════════════════════
    // FOCUSED CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    focusedRingColor: 'hsl(210, 40%, 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // LEGACY ALERT TOKENS
    // ═══════════════════════════════════════════════════════════════════════════
    alertColor: 'hsl(215, 25%, 15%)',
    alertForegroundColor: 'hsl(210, 40%, 98%)',
  },
};

/**
 * Default Theme Configuration
 *
 * Clean, neutral theme for general use
 */
export const NEUTRAL_THEME: EBTheme = {
  variables: {
    fontFamily: 'Inter',
    headerFontFamily: 'Inter',
    buttonFontFamily: 'Inter',

    // Default colors
    primaryColor: '#3b82f6',
    primaryHoverColor: '#2563eb',
    primaryActiveColor: '#1d4ed8',
    primaryForegroundColor: '#ffffff',

    secondaryColor: '#f8fafc',
    secondaryHoverColor: '#f1f5f9',
    secondaryActiveColor: '#e2e8f0',
    secondaryForegroundColor: '#374151',
    secondaryForegroundHoverColor: '#1f2937',
    secondaryForegroundActiveColor: '#111827',
    secondaryBorderWidth: '1px',

    backgroundColor: '#ffffff',
    foregroundColor: '#111827',
    cardColor: '#ffffff',
    cardForegroundColor: '#111827',

    mutedColor: '#f9fafb',
    mutedForegroundColor: '#6b7280',
    accentColor: '#f3f4f6',
    accentForegroundColor: '#374151',

    alertColor: '#fef2f2',
    alertForegroundColor: '#991b1b',
    informativeColor: '#eff6ff',
    informativeAccentColor: '#dbeafe',
    warningColor: '#fffbeb',
    warningAccentColor: '#fef3c7',
    successColor: '#f0fdf4',
    successAccentColor: '#dcfce7',
    metricAccentColor: '#3b82f6', // Metric accent color - using primary for Default theme

    destructiveColor: '#ef4444',
    destructiveHoverColor: '#dc2626',
    destructiveActiveColor: '#b91c1c',
    destructiveForegroundColor: '#ffffff',
    destructiveForegroundHoverColor: '#fef2f2',
    destructiveForegroundActiveColor: '#fee2e2',

    inputColor: '#ffffff',
    inputBorderColor: '#d1d5db',
    borderColor: '#d1d5db',

    borderRadius: '6px',
    inputBorderRadius: '4px',
    buttonBorderRadius: '6px',

    buttonFontWeight: '500',
    buttonFontSize: '0.875rem',
    buttonLineHeight: '1.25rem',
    buttonTextTransform: 'none',
    buttonLetterSpacing: '0.025em',

    primaryButtonFontWeight: '500',
    secondaryButtonFontWeight: '500',
    destructiveButtonFontWeight: '500',

    formLabelFontSize: '0.875rem',
    formLabelFontWeight: '500',
    formLabelLineHeight: '1.25rem',

    primaryBorderWidth: '0px',
    destructiveBorderWidth: '0px',

    spacingUnit: '0.25rem',
    shiftButtonOnActive: false,
    zIndexOverlay: 1000,
  },
};

export const SALT_THEME: EBTheme = {
  variables: {
    fontFamily: 'Open Sans',
    headerFontFamily: 'Amplitude',
    backgroundColor: '#f6f7f8',
    inputColor: '#FFFFFF',
    inputBorderColor: '#0000004D',
    borderColor: '#0000004D',
    borderRadius: '6px',
    inputBorderRadius: '4px',
    buttonBorderRadius: '8px',
    buttonFontFamily: 'Amplitude',
    buttonTextTransform: 'uppercase',
    buttonLetterSpacing: '0.6px',
    primaryColor: '#1B7F9E',
    secondaryColor: '#f6f7f8',
    secondaryForegroundColor: '#1B7F9E',
    secondaryBorderWidth: '1px',
    secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
    formLabelFontSize: '0.75rem',
    formLabelLineHeight: '1rem',
    formLabelFontWeight: '600',
    formLabelForegroundColor: '#4C5157',
  },
};

/**
 * Available themes for use in stories
 */
export const THEMES = {
  Default: defaultTheme,
  SellSense: SELLSENSE_THEME,
  Neutral: NEUTRAL_THEME,
  Salt: SALT_THEME,
} as const;

export type ThemeName = keyof typeof THEMES;
