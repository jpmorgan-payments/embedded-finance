/**
 * Centralized theme configurations for Storybook stories
 *
 * This file contains theme configurations that can be imported and used
 * across all component stories for consistent theming.
 */

import { defaultTheme } from '@/core/EBComponentsProvider/defaultTheme';

import { EBTheme } from '../src/core/EBComponentsProvider/config.types';

/**
 * Salt Theme Configuration
 *
 * Uses official Salt Design System colors from JPMorgan Chase.
 * Status tokens use Salt's official color palette.
 */
export const SALT_THEME: EBTheme = {
  colorScheme: 'light',
  variables: {
    contentFontFamily: 'Open Sans',
    textHeadingFontFamily: 'Amplitude',
    actionableFontFamily: 'Amplitude',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionableAccentedBoldFontWeight: '600',
    actionableSubtleFontWeight: '600',
    actionableShiftOnActive: false,
    actionableBorderRadius: '8px',
    editableBorderRadius: '4px',
    editableLabelFontSize: '0.75rem',
    editableLabelLineHeight: '1rem',
    editableLabelFontWeight: '600',
    separableBorderRadius: '6px',
    spacingUnit: '0.25rem',
  },
  light: {
    containerPrimaryBackground: '#f6f7f8',
    containerCardBackground: '#FFFFFF',
    containerPrimaryForeground: '#4C5157',
    containerSecondaryBackground: '#f6f7f8',
    containerSecondaryForeground: '#6B7280',
    contentPrimaryForeground: '#4C5157',
    overlayableBackground: '#FFFFFF',
    overlayableForeground: '#1e293b',
    accentBackground: '#f1f5f9',
    accentForeground: '#475569',
    editableBackground: '#FFFFFF',
    editableBorderColor: '#0000004D',
    editableLabelForeground: '#4C5157',
    actionableAccentedBoldBackground: '#1A7B99',
    actionableAccentedBoldBackgroundHover: '#166b85',
    actionableAccentedBoldBackgroundActive: '#145a71',
    actionableAccentedBoldForeground: '#FFFFFF',
    actionableAccentedBoldBorderWidth: '0px',
    actionableSubtleBackground: 'white',
    actionableSubtleBackgroundHover: '#f1f2f480',
    actionableSubtleBackgroundActive: '#f1f2f4cc',
    actionableSubtleForeground: '#1A7B99',
    actionableSubtleForegroundHover: '#166b85',
    actionableSubtleForegroundActive: '#145a71',
    actionableSubtleBorderWidth: '1px',
    focusedRingColor: '#1A7B99',
    actionableNegativeBoldBackground: '#ef4444',
    actionableNegativeBoldBackgroundHover: '#dc2626',
    actionableNegativeBoldBackgroundActive: '#b91c1c',
    actionableNegativeBoldForeground: '#FFFFFF',
    sentimentNegativeAccentBackground: '#FFECEA',
    sentimentPositiveForeground: '#00875D',
    sentimentPositiveAccentBackground: '#EAF5F2',
    sentimentCautionForeground: '#C75300',
    sentimentCautionAccentBackground: '#FFECD9',
    statusInfoForeground: '#1A7B99',
    statusInfoAccentBackground: '#e6f3f7',
    statusSuccessForeground: '#00875D',
    statusSuccessAccentBackground: '#EAF5F2',
    statusWarningForeground: '#C75300',
    statusWarningAccentBackground: '#FFECD9',
    separableBorderColor: '#0000004D',
  },
};

/**
 * SellSense Theme Configuration
 *
 * Aligned with the original SellSense theme from use-sellsense-themes.ts
 * Features: Orange primary (#f55727), Inter font, warm teal accents
 */
export const SELLSENSE_THEME: EBTheme = {
  colorScheme: 'light',
  variables: {
    contentFontFamily: 'Inter',
    textHeadingFontFamily: 'Inter',
    actionableFontFamily: 'Inter',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionableAccentedBoldFontWeight: '600',
    actionableSubtleFontWeight: '600',
    actionableShiftOnActive: false,
    actionableBorderRadius: '8px',
    editableBorderRadius: '4px',
    editableLabelFontSize: '0.875rem',
    editableLabelFontWeight: '600',
    editableLabelLineHeight: '1.25rem',
    separableBorderRadius: '8px',
    spacingUnit: '0.25rem',
    overlayableZIndex: 1000,
  },
  light: {
    containerPrimaryBackground: '#f7fafc',
    containerCardBackground: '#FFFFFF',
    containerPrimaryForeground: '#1e293b',
    containerSecondaryBackground: '#f8fafc',
    containerSecondaryForeground: '#64748b',
    contentPrimaryForeground: '#1e293b',
    overlayableBackground: '#FFFFFF',
    overlayableForeground: '#1e293b',
    accentBackground: '#f1f5f9',
    accentForeground: '#475569',
    accentMetricBackground: '#2cb9ac',
    editableBackground: '#FFFFFF',
    editableBorderColor: '#0000004d',
    editableLabelForeground: '#1e293b',
    actionableAccentedBoldBackground: '#f55727',
    actionableAccentedBoldBackgroundHover: '#e14d1f',
    actionableAccentedBoldBackgroundActive: '#cc4319',
    actionableAccentedBoldForeground: '#ffffff',
    actionableAccentedBoldBorderWidth: '0px',
    actionableSubtleBackground: '#FDF7F0',
    actionableSubtleBackgroundHover: 'hsla(240, 4.8%, 95.9%, 0.5)',
    actionableSubtleBackgroundActive: '#2CB9AC',
    actionableSubtleForeground: '#f55727',
    actionableSubtleForegroundHover: '#e14d1f',
    actionableSubtleForegroundActive: '#2CB9AC',
    actionableSubtleBorderWidth: '1px',
    focusedRingColor: '#f55727',
    actionableNegativeBoldBackground: '#ef4444',
    actionableNegativeBoldBackgroundHover: '#dc2626',
    actionableNegativeBoldBackgroundActive: '#b91c1c',
    actionableNegativeBoldForeground: '#ffffff',
    actionableNegativeBoldForegroundHover: '#fef2f2',
    actionableNegativeBoldForegroundActive: '#fee2e2',
    sentimentCautionForeground: '#f59e0b',
    sentimentCautionAccentBackground: '#fef3c7',
    sentimentPositiveForeground: '#10b981',
    sentimentPositiveAccentBackground: '#d1fae5',
    statusInfoForeground: '#2cb9ac',
    statusInfoAccentBackground: '#f0fffd',
    statusSuccessForeground: '#10b981',
    statusSuccessAccentBackground: '#d1fae5',
    statusWarningForeground: '#f59e0b',
    statusWarningAccentBackground: '#fef3c7',
    separableBorderColor: '#0000004d',
  },
};

/**
 * Default Blue Theme Configuration
 *
 * Clean blue-focused theme with modern styling
 */
export const DEFAULT_BLUE_THEME: EBTheme = {
  colorScheme: 'light',
  variables: {
    contentFontFamily:
      'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
    textHeadingFontFamily:
      'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
    actionableFontFamily:
      'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
    actionableFontWeight: '500',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'none',
    actionableLetterSpacing: '0em',
    actionableAccentedBoldFontWeight: '600',
    actionableSubtleFontWeight: '500',
    actionableShiftOnActive: true,
    actionableBorderRadius: '.313em',
    editableBorderRadius: '6px',
    editableLabelFontSize: '0.875rem',
    editableLabelFontWeight: '500',
    editableLabelLineHeight: '1.25rem',
    separableBorderRadius: '8px',
    spacingUnit: '0.25rem',
    overlayableZIndex: 1000,
  },
  light: {
    containerPrimaryBackground: '#ffffff',
    containerCardBackground: '#ffffff',
    containerPrimaryForeground: '#1e293b',
    containerSecondaryBackground: '#f8fafc',
    containerSecondaryForeground: '#64748b',
    contentPrimaryForeground: '#1e293b',
    overlayableBackground: '#ffffff',
    overlayableForeground: '#1e293b',
    accentBackground: '#f1f5f9',
    accentForeground: '#475569',
    editableBackground: '#ffffff',
    editableBorderColor: '#d1d5db',
    actionableAccentedBoldBackground: '#0060f0',
    actionableAccentedBoldBackgroundHover: '#0a4386',
    actionableAccentedBoldBackgroundActive: '#083366',
    actionableAccentedBoldForeground: '#ffffff',
    actionableAccentedBoldForegroundHover: '#f8fafc',
    actionableAccentedBoldForegroundActive: '#f1f5f9',
    actionableAccentedBoldBorderWidth: '0px',
    actionableSubtleBackground: '#00000000',
    actionableSubtleBackgroundHover: '#0060f014',
    actionableSubtleBackgroundActive: '#0060f01f',
    actionableSubtleForeground: '#0060f0',
    actionableSubtleForegroundHover: '#0a4386',
    actionableSubtleForegroundActive: '#083366',
    actionableSubtleBorderWidth: '1px',
    focusedRingColor: '#0060f0',
    actionableNegativeBoldBackground: '#ef4444',
    actionableNegativeBoldBackgroundHover: '#dc2626',
    actionableNegativeBoldBackgroundActive: '#b91c1c',
    actionableNegativeBoldForeground: '#ffffff',
    actionableNegativeBoldForegroundHover: '#fef2f2',
    actionableNegativeBoldForegroundActive: '#fee2e2',
    sentimentCautionForeground: '#f59e0b',
    sentimentCautionAccentBackground: '#fef3c7',
    sentimentPositiveForeground: '#10b981',
    sentimentPositiveAccentBackground: '#d1fae5',
    statusInfoForeground: '#0ea5e9',
    statusInfoAccentBackground: '#e0f2fe',
    statusSuccessForeground: '#10b981',
    statusSuccessAccentBackground: '#d1fae5',
    statusWarningForeground: '#f59e0b',
    statusWarningAccentBackground: '#fef3c7',
    separableBorderColor: '#e2e8f0',
  },
};

/**
 * Create Commerce Theme Configuration
 *
 * Dark, sophisticated theme with coral/salmon accents
 * Features a teal-gray background with warm coral primary color
 */
export const CREATE_COMMERCE_THEME: EBTheme = {
  colorScheme: 'light', // Still light mode but with dark container colors
  variables: {
    contentFontFamily: 'Open Sans',
    textHeadingFontFamily: 'Open Sans',
    actionableFontFamily: 'Open Sans',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionableAccentedBoldFontWeight: '600',
    actionableSubtleFontWeight: '600',
    actionableShiftOnActive: false,
    actionableBorderRadius: '8px',
    editableBorderRadius: '4px',
    editableLabelFontSize: '0.875rem',
    editableLabelFontWeight: '500',
    editableLabelLineHeight: '1.25rem',
    separableBorderRadius: '8px',
    spacingUnit: '0.25rem',
    overlayableZIndex: 1000,
  },
  light: {
    containerPrimaryBackground: '#3D5C6B',
    containerCardBackground: '#3D5C6B',
    containerPrimaryForeground: '#EDEFF7',
    containerSecondaryBackground: '#38474E',
    containerSecondaryForeground: '#98A2CD',
    contentPrimaryForeground: '#EDEFF7',
    overlayableBackground: '#38474E',
    overlayableForeground: '#EDEFF7',
    accentBackground: '#38474E',
    accentForeground: '#EDEFF7',
    editableBackground: '#38474E',
    editableBorderColor: '#0000004D',
    editableLabelForeground: '#EDEFF7',
    actionableAccentedBoldBackground: '#FD8172',
    actionableAccentedBoldBackgroundHover: '#fd6b5a',
    actionableAccentedBoldBackgroundActive: '#fc5441',
    actionableAccentedBoldForeground: '#EDEFF7',
    actionableAccentedBoldForegroundHover: '#EDEFF7',
    actionableAccentedBoldForegroundActive: '#EDEFF7',
    actionableAccentedBoldBorderWidth: '0px',
    actionableSubtleBackground: '#EDEFF7',
    actionableSubtleBackgroundHover: '#d5d9e9',
    actionableSubtleBackgroundActive: '#2CB9AC',
    actionableSubtleForeground: '#3D5C6B',
    actionableSubtleForegroundHover: '#3D5C6B',
    actionableSubtleForegroundActive: '#2CB9AC',
    actionableSubtleBorderWidth: '1px',
    focusedRingColor: '#FD8172',
    actionableNegativeBoldBackground: '#FC8181',
    actionableNegativeBoldBackgroundHover: '#F56565',
    actionableNegativeBoldBackgroundActive: '#E53E3E',
    actionableNegativeBoldForeground: '#EDEFF7',
    actionableNegativeBoldForegroundHover: '#EDEFF7',
    actionableNegativeBoldForegroundActive: '#EDEFF7',
    sentimentCautionForeground: '#FBBF24',
    sentimentCautionAccentBackground: '#38474E',
    sentimentPositiveForeground: '#34D399',
    sentimentPositiveAccentBackground: '#38474E',
    statusInfoForeground: '#60A5FA',
    statusInfoAccentBackground: '#B3C9CC',
    statusSuccessForeground: '#34D399',
    statusSuccessAccentBackground: '#38474E',
    statusWarningForeground: '#FBBF24',
    statusWarningAccentBackground: '#38474E',
    separableBorderColor: '#0000004D',
  },
};

/**
 * PayFicient Theme Configuration
 *
 * Warm, professional theme with forest green primary
 * Features cream/warm white backgrounds with green accents
 */
export const PAYFICIENT_THEME: EBTheme = {
  colorScheme: 'light',
  variables: {
    contentFontFamily: 'Manrope',
    textHeadingFontFamily: 'Manrope',
    actionableFontFamily: 'Manrope',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionableAccentedBoldFontWeight: '600',
    actionableSubtleFontWeight: '600',
    actionableShiftOnActive: false,
    actionableBorderRadius: '8px',
    editableBorderRadius: '4px',
    editableLabelFontSize: '0.875rem',
    editableLabelFontWeight: '500',
    editableLabelLineHeight: '1.25rem',
    separableBorderRadius: '5px',
    spacingUnit: '0.25rem',
    overlayableZIndex: 1000,
  },
  light: {
    containerPrimaryBackground: '#FFFCF6',
    containerCardBackground: '#F7F3F0',
    containerPrimaryForeground: '#1e293b',
    containerSecondaryBackground: '#f8fafc',
    containerSecondaryForeground: '#64748b',
    contentPrimaryForeground: '#1e293b',
    overlayableBackground: '#FFFFFF',
    overlayableForeground: '#1e293b',
    accentBackground: '#f1f5f9',
    accentForeground: '#475569',
    editableBackground: '#FFFFFF',
    editableBorderColor: '#0000004d',
    editableLabelForeground: '#1e293b',
    actionableAccentedBoldBackground: '#177556',
    actionableAccentedBoldBackgroundHover: '#145f47',
    actionableAccentedBoldBackgroundActive: '#114a38',
    actionableAccentedBoldForeground: '#ffffff',
    actionableAccentedBoldBorderWidth: '0px',
    actionableSubtleBackground: '#FFFCF6',
    actionableSubtleBackgroundHover: 'hsla(240, 4.8%, 95.9%, 0.5)',
    actionableSubtleBackgroundActive: '#d6e8d1',
    actionableSubtleForeground: '#177556',
    actionableSubtleForegroundHover: '#145f47',
    actionableSubtleForegroundActive: '#114a38',
    actionableSubtleBorderWidth: '1px',
    focusedRingColor: '#177556',
    actionableNegativeBoldBackground: '#ef4444',
    actionableNegativeBoldBackgroundHover: '#dc2626',
    actionableNegativeBoldBackgroundActive: '#b91c1c',
    actionableNegativeBoldForeground: '#ffffff',
    actionableNegativeBoldForegroundHover: '#fef2f2',
    actionableNegativeBoldForegroundActive: '#fee2e2',
    sentimentCautionForeground: '#f59e0b',
    sentimentCautionAccentBackground: '#fef3c7',
    sentimentPositiveForeground: '#177556',
    sentimentPositiveAccentBackground: '#d6e8d1',
    statusInfoForeground: '#177556',
    statusInfoAccentBackground: '#e6f2ed',
    statusSuccessForeground: '#177556',
    statusSuccessAccentBackground: '#d6e8d1',
    statusWarningForeground: '#f59e0b',
    statusWarningAccentBackground: '#fef3c7',
    separableBorderColor: '#0000004d',
  },
};

/**
 * Retro Arcade Theme Configuration
 *
 * A fun, fictional theme inspired by 80s arcade aesthetics
 * Features neon pink, electric cyan, and dark purple
 * Perfect for demonstrating how drastically different a theme can look
 */
export const RETRO_ARCADE_THEME: EBTheme = {
  colorScheme: 'light',
  variables: {
    contentFontFamily: '"Press Start 2P", "Courier New", monospace',
    textHeadingFontFamily: '"Press Start 2P", "Courier New", monospace',
    actionableFontFamily: '"Press Start 2P", "Courier New", monospace',
    actionableFontWeight: '400',
    actionableFontSize: '0.75rem',
    actionableLineHeight: '1.5rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.1em',
    actionableAccentedBoldFontWeight: '400',
    actionableSubtleFontWeight: '400',
    actionableShiftOnActive: true,
    actionableBorderRadius: '0px', // Sharp corners for retro feel
    editableBorderRadius: '0px',
    editableLabelFontSize: '0.75rem',
    editableLabelFontWeight: '400',
    editableLabelLineHeight: '1.25rem',
    separableBorderRadius: '0px',
    spacingUnit: '0.25rem',
    overlayableZIndex: 1000,
  },
  light: {
    // Dark purple background like old CRT monitors
    containerPrimaryBackground: '#1a0a2e',
    containerCardBackground: '#16082a',
    containerPrimaryForeground: '#00ffff', // Cyan text
    containerSecondaryBackground: '#0d0221',
    containerSecondaryForeground: '#ff00ff', // Magenta
    contentPrimaryForeground: '#00ffff',
    overlayableBackground: '#16082a',
    overlayableForeground: '#00ffff',
    accentBackground: '#2d1b4e',
    accentForeground: '#ffff00', // Yellow for accents
    accentMetricBackground: '#ff00ff',
    editableBackground: '#0d0221',
    editableBorderColor: '#ff00ff',
    editableLabelForeground: '#00ffff',
    // Neon pink primary buttons
    actionableAccentedBoldBackground: '#ff006e',
    actionableAccentedBoldBackgroundHover: '#ff3385',
    actionableAccentedBoldBackgroundActive: '#cc0058',
    actionableAccentedBoldForeground: '#ffffff',
    actionableAccentedBoldForegroundHover: '#ffffff',
    actionableAccentedBoldForegroundActive: '#ffffff',
    actionableAccentedBoldBorderWidth: '2px',
    // Cyan secondary buttons
    actionableSubtleBackground: 'transparent',
    actionableSubtleBackgroundHover: '#00ffff22',
    actionableSubtleBackgroundActive: '#00ffff44',
    actionableSubtleForeground: '#00ffff',
    actionableSubtleForegroundHover: '#66ffff',
    actionableSubtleForegroundActive: '#00cccc',
    actionableSubtleBorderWidth: '2px',
    focusedRingColor: '#ffff00',
    // Red for errors (game over!)
    actionableNegativeBoldBackground: '#ff0000',
    actionableNegativeBoldBackgroundHover: '#ff3333',
    actionableNegativeBoldBackgroundActive: '#cc0000',
    actionableNegativeBoldForeground: '#ffffff',
    actionableNegativeBoldForegroundHover: '#ffffff',
    actionableNegativeBoldForegroundActive: '#ffffff',
    sentimentNegativeAccentBackground: '#330000',
    // Yellow for warnings (caution!)
    sentimentCautionForeground: '#ffff00',
    sentimentCautionAccentBackground: '#333300',
    // Green for success (high score!)
    sentimentPositiveForeground: '#00ff00',
    sentimentPositiveAccentBackground: '#003300',
    // Status colors - neon arcade style
    statusInfoForeground: '#00ffff', // Cyan
    statusInfoAccentBackground: '#003333',
    statusSuccessForeground: '#00ff00', // Neon green
    statusSuccessAccentBackground: '#003300',
    statusWarningForeground: '#ffff00', // Yellow
    statusWarningAccentBackground: '#333300',
    separableBorderColor: '#ff00ff',
  },
};

/**
 * Available themes for use in stories
 */
export const THEMES = {
  Salt: SALT_THEME,
  SellSense: SELLSENSE_THEME,
  DefaultBlue: DEFAULT_BLUE_THEME,
  CreateCommerce: CREATE_COMMERCE_THEME,
  PayFicient: PAYFICIENT_THEME,
  RetroArcade: RETRO_ARCADE_THEME,
} as const;

export type ThemeName = keyof typeof THEMES;
