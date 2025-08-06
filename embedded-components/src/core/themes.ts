/**
 * Centralized theme configurations for Storybook stories
 *
 * This file contains theme configurations that can be imported and used
 * across all component stories for consistent theming.
 */

import { EBTheme } from './EBComponentsProvider/config.types';

/**
 * SellSense Theme Configuration
 *
 * Unified theme with light and dark mode support:
 * - Common properties in `variables` (fonts, spacing, etc.)
 * - Light mode specific colors in `light`
 * - Dark mode specific colors in `dark`
 * - Maintains SellSense brand identity across modes
 */
export const SELLSENSE_THEME: EBTheme = {
  colorScheme: 'system',
  variables: {
    // Common properties that apply to both light and dark modes
    fontFamily: 'Inter',
    headerFontFamily: 'Inter',
    buttonFontFamily: 'Inter',

    // Common spacing and layout
    borderRadius: '8px',
    inputBorderRadius: '4px',
    buttonBorderRadius: '8px',
    spacingUnit: '0.25rem',
    zIndexOverlay: 1000,

    // Common button styling
    buttonFontWeight: '600',
    buttonFontSize: '0.875rem',
    buttonLineHeight: '1.25rem',
    buttonTextTransform: 'uppercase',
    buttonLetterSpacing: '0.6px',

    // Common button weights
    primaryButtonFontWeight: '600',
    secondaryButtonFontWeight: '600',
    destructiveButtonFontWeight: '600',

    // Common form styling
    formLabelFontSize: '0.875rem',
    formLabelFontWeight: '600',
    formLabelLineHeight: '1.25rem',

    // Common border widths
    primaryBorderWidth: '0px',
    secondaryBorderWidth: '1px',
    destructiveBorderWidth: '0px',

    // Common behavior
    shiftButtonOnActive: false,
  },
  light: {
    // SellSense brand colors (light mode)
    primaryColor: 'hsl(14, 91%, 55%)',
    primaryHoverColor: 'hsl(14, 91%, 50%)',
    primaryActiveColor: 'hsl(14, 91%, 45%)',
    primaryForegroundColor: 'hsl(0, 0%, 100%)',

    // Enhanced secondary button with outline support
    secondaryColor: 'hsl(30, 100%, 98%)',
    secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
    secondaryActiveColor: 'hsl(175, 62%, 41%)',
    secondaryForegroundColor: 'hsl(14, 91%, 55%)',
    secondaryForegroundHoverColor: 'hsl(14, 91%, 50%)',
    secondaryForegroundActiveColor: 'hsl(175, 62%, 41%)',

    // Background and layout
    backgroundColor: 'hsl(30, 20%, 97%)',
    foregroundColor: 'hsl(215, 25%, 27%)',
    cardColor: 'hsl(30, 25%, 95%)',
    cardForegroundColor: 'hsl(215, 25%, 27%)',

    // Enhanced muted and accent colors
    mutedColor: 'hsl(210, 40%, 98%)',
    mutedForegroundColor: 'hsl(215, 16%, 47%)',
    accentColor: 'hsl(210, 40%, 96%)',
    accentForegroundColor: 'hsl(215, 25%, 27%)',

    // Enhanced alert system colors
    alertColor: 'hsl(30, 100%, 98%)',
    alertForegroundColor: 'hsl(215, 25%, 27%)',
    informativeColor: 'hsl(175, 62%, 41%)',
    informativeAccentColor: 'hsl(175, 100%, 98%)',
    warningColor: 'hsl(38, 92%, 50%)',
    warningAccentColor: 'hsl(48, 96%, 89%)',
    successColor: 'hsl(142, 76%, 36%)',
    successAccentColor: 'hsl(142, 76%, 93%)',

    // Destructive colors
    destructiveColor: 'hsl(0, 84%, 60%)',
    destructiveHoverColor: 'hsl(0, 84%, 56%)',
    destructiveActiveColor: 'hsl(0, 84%, 52%)',
    destructiveForegroundColor: 'hsl(0, 0%, 100%)',
    destructiveForegroundHoverColor: 'hsl(0, 100%, 98%)',
    destructiveForegroundActiveColor: 'hsl(0, 100%, 96%)',

    // Input styling
    inputColor: 'hsl(0, 0%, 100%)',
    inputBorderColor: 'hsla(0, 0%, 0%, 0.3)',
    borderColor: 'hsla(0, 0%, 0%, 0.3)',
  },
  dark: {
    // SellSense brand colors (maintained for brand consistency)
    primaryColor: 'hsl(14, 91%, 55%)',
    primaryHoverColor: 'hsl(14, 91%, 60%)',
    primaryActiveColor: 'hsl(14, 91%, 65%)',
    primaryForegroundColor: 'hsl(0, 0%, 100%)',

    // Enhanced secondary button with outline support
    secondaryColor: 'hsl(215, 25%, 15%)',
    secondaryHoverColor: 'hsl(215, 25%, 20%)',
    secondaryActiveColor: 'hsl(175, 62%, 41%)',
    secondaryForegroundColor: 'hsl(14, 91%, 55%)',
    secondaryForegroundHoverColor: 'hsl(14, 91%, 60%)',
    secondaryForegroundActiveColor: 'hsl(175, 62%, 41%)',

    // Background and layout
    backgroundColor: 'hsl(215, 25%, 10%)',
    foregroundColor: 'hsl(210, 40%, 98%)',
    cardColor: 'hsl(215, 25%, 12%)',
    cardForegroundColor: 'hsl(210, 40%, 98%)',

    // Enhanced muted and accent colors
    mutedColor: 'hsl(215, 25%, 15%)',
    mutedForegroundColor: 'hsl(215, 16%, 56%)',
    accentColor: 'hsl(215, 25%, 18%)',
    accentForegroundColor: 'hsl(210, 40%, 96%)',

    // Enhanced alert system colors
    alertColor: 'hsl(215, 25%, 15%)',
    alertForegroundColor: 'hsl(210, 40%, 98%)',
    informativeColor: 'hsl(175, 62%, 41%)',
    informativeAccentColor: 'hsl(175, 62%, 15%)',
    warningColor: 'hsl(38, 92%, 50%)',
    warningAccentColor: 'hsl(38, 92%, 15%)',
    successColor: 'hsl(142, 76%, 36%)',
    successAccentColor: 'hsl(142, 76%, 15%)',

    // Destructive colors
    destructiveColor: 'hsl(0, 84%, 60%)',
    destructiveHoverColor: 'hsl(0, 84%, 65%)',
    destructiveActiveColor: 'hsl(0, 84%, 70%)',
    destructiveForegroundColor: 'hsl(0, 0%, 100%)',
    destructiveForegroundHoverColor: 'hsl(0, 100%, 98%)',
    destructiveForegroundActiveColor: 'hsl(0, 100%, 96%)',

    // Input styling
    inputColor: 'hsl(215, 25%, 12%)',
    inputBorderColor: 'hsla(210, 40%, 98%, 0.3)',
    borderColor: 'hsla(210, 40%, 98%, 0.3)',
  },
};

/**
 * Default Theme Configuration
 *
 * Clean, neutral theme for general use
 */
export const DEFAULT_THEME: EBTheme = {
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

/**
 * Available themes for use in stories
 */
export const THEMES = {
  SELLSENSE: SELLSENSE_THEME,
  DEFAULT: DEFAULT_THEME,
} as const;

export type ThemeName = keyof typeof THEMES;
