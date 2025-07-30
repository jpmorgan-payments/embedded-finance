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
 * Official SellSense brand colors and styling:
 * - Primary: Orange (#f55727)
 * - Background: Warm off-white (#FAF9F7)
 * - Typography: Inter font family
 * - Modern, clean design with proper contrast
 */
export const SELLSENSE_THEME: EBTheme = {
  variables: {
    fontFamily: 'Inter',
    headerFontFamily: 'Inter',
    buttonFontFamily: 'Inter',

    // SellSense brand colors
    primaryColor: '#f55727',
    primaryHoverColor: '#e14d1f',
    primaryActiveColor: '#cc4319',
    primaryForegroundColor: '#ffffff',

    // Enhanced secondary button with outline support
    secondaryColor: '#FDF7F0',
    secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
    secondaryActiveColor: '#2CB9AC',
    secondaryForegroundColor: '#f55727',
    secondaryForegroundHoverColor: '#e14d1f',
    secondaryForegroundActiveColor: '#2CB9AC',
    secondaryBorderWidth: '1px',

    // Background and layout
    backgroundColor: '#FAF9F7',
    foregroundColor: '#1e293b',
    cardColor: '#F7F3F0',
    cardForegroundColor: '#1e293b',

    // Enhanced muted and accent colors
    mutedColor: '#f8fafc',
    mutedForegroundColor: '#64748b',
    accentColor: '#f1f5f9',
    accentForegroundColor: '#475569',

    // Enhanced alert system colors
    alertColor: '#FDF7F0',
    alertForegroundColor: '#1e293b',
    informativeColor: '#0ea5e9',
    informativeAccentColor: '#e0f2fe',
    warningColor: '#f59e0b',
    warningAccentColor: '#fef3c7',
    successColor: '#10b981',
    successAccentColor: '#d1fae5',

    // Destructive colors
    destructiveColor: '#ef4444',
    destructiveHoverColor: '#dc2626',
    destructiveActiveColor: '#b91c1c',
    destructiveForegroundColor: '#ffffff',
    destructiveForegroundHoverColor: '#fef2f2',
    destructiveForegroundActiveColor: '#fee2e2',

    // Input styling
    inputColor: '#FFFFFF',
    inputBorderColor: '#0000004d',
    borderColor: '#0000004d',

    // Border radius
    borderRadius: '8px',
    inputBorderRadius: '4px',
    buttonBorderRadius: '8px',

    // Enhanced button styling
    buttonFontWeight: '600',
    buttonFontSize: '0.875rem',
    buttonLineHeight: '1.25rem',
    buttonTextTransform: 'uppercase',
    buttonLetterSpacing: '0.6px',

    // Button weights
    primaryButtonFontWeight: '600',
    secondaryButtonFontWeight: '600',
    destructiveButtonFontWeight: '600',

    // Form label design tokens
    formLabelFontSize: '0.875rem',
    formLabelFontWeight: '600',
    formLabelLineHeight: '1.25rem',

    // Border widths
    primaryBorderWidth: '0px',
    destructiveBorderWidth: '0px',

    // Spacing and effects
    spacingUnit: '0.25rem',
    shiftButtonOnActive: false,
    zIndexOverlay: 1000,
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
