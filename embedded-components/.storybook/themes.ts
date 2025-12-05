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
    contentHeaderFontFamily: 'Amplitude',
    actionableFontFamily: 'Amplitude',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '600',
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
    containerBackground: '#f6f7f8',
    containerPrimaryBackground: '#FFFFFF',
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
    actionablePrimaryBackground: '#1B7F9E',
    actionablePrimaryBackgroundHover: '#166b85',
    actionablePrimaryBackgroundActive: '#145a71',
    actionablePrimaryForeground: '#FFFFFF',
    actionablePrimaryBorderWidth: '0px',
    actionableSecondaryBackground: 'white',
    actionableSecondaryBackgroundHover: '#f1f2f480',
    actionableSecondaryBackgroundActive: '#f1f2f4cc',
    actionableSecondaryForeground: '#1B7F9E',
    actionableSecondaryForegroundHover: '#166b85',
    actionableSecondaryForegroundActive: '#145a71',
    actionableSecondaryBorderWidth: '1px',
    focusedRingColor: '#1B7F9E',
    sentimentNegativeBackground: '#ef4444',
    sentimentNegativeBackgroundHover: '#dc2626',
    sentimentNegativeBackgroundActive: '#b91c1c',
    sentimentNegativeForeground: '#FFFFFF',
    sentimentNegativeAccentBackground: '#FFECEA',
    sentimentPositiveForeground: '#00875D',
    sentimentPositiveAccentBackground: '#EAF5F2',
    sentimentCautionForeground: '#C75300',
    sentimentCautionAccentBackground: '#FFECD9',
    statusInfoForeground: '#1B7F9E',
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
    contentHeaderFontFamily: 'Inter',
    actionableFontFamily: 'Inter',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '600',
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
    containerBackground: '#f7fafc',
    containerPrimaryBackground: '#FFFFFF',
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
    actionablePrimaryBackground: '#f55727',
    actionablePrimaryBackgroundHover: '#e14d1f',
    actionablePrimaryBackgroundActive: '#cc4319',
    actionablePrimaryForeground: '#ffffff',
    actionablePrimaryBorderWidth: '0px',
    actionableSecondaryBackground: '#FDF7F0',
    actionableSecondaryBackgroundHover: 'hsla(240, 4.8%, 95.9%, 0.5)',
    actionableSecondaryBackgroundActive: '#2CB9AC',
    actionableSecondaryForeground: '#f55727',
    actionableSecondaryForegroundHover: '#e14d1f',
    actionableSecondaryForegroundActive: '#2CB9AC',
    actionableSecondaryBorderWidth: '1px',
    focusedRingColor: '#f55727',
    sentimentNegativeBackground: '#ef4444',
    sentimentNegativeBackgroundHover: '#dc2626',
    sentimentNegativeBackgroundActive: '#b91c1c',
    sentimentNegativeForeground: '#ffffff',
    sentimentNegativeForegroundHover: '#fef2f2',
    sentimentNegativeForegroundActive: '#fee2e2',
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
    contentHeaderFontFamily:
      'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
    actionableFontFamily:
      'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
    actionableFontWeight: '500',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'none',
    actionableLetterSpacing: '0em',
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '500',
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
    containerBackground: '#ffffff',
    containerPrimaryBackground: '#ffffff',
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
    actionablePrimaryBackground: '#0060f0',
    actionablePrimaryBackgroundHover: '#0a4386',
    actionablePrimaryBackgroundActive: '#083366',
    actionablePrimaryForeground: '#ffffff',
    actionablePrimaryForegroundHover: '#f8fafc',
    actionablePrimaryForegroundActive: '#f1f5f9',
    actionablePrimaryBorderWidth: '0px',
    actionableSecondaryBackground: '#00000000',
    actionableSecondaryBackgroundHover: '#0060f014',
    actionableSecondaryBackgroundActive: '#0060f01f',
    actionableSecondaryForeground: '#0060f0',
    actionableSecondaryForegroundHover: '#0a4386',
    actionableSecondaryForegroundActive: '#083366',
    actionableSecondaryBorderWidth: '1px',
    focusedRingColor: '#0060f0',
    sentimentNegativeBackground: '#ef4444',
    sentimentNegativeBackgroundHover: '#dc2626',
    sentimentNegativeBackgroundActive: '#b91c1c',
    sentimentNegativeForeground: '#ffffff',
    sentimentNegativeForegroundHover: '#fef2f2',
    sentimentNegativeForegroundActive: '#fee2e2',
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
    contentHeaderFontFamily: 'Open Sans',
    actionableFontFamily: 'Open Sans',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '600',
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
    containerBackground: '#3D5C6B',
    containerPrimaryBackground: '#3D5C6B',
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
    actionablePrimaryBackground: '#FD8172',
    actionablePrimaryBackgroundHover: '#fd6b5a',
    actionablePrimaryBackgroundActive: '#fc5441',
    actionablePrimaryForeground: '#EDEFF7',
    actionablePrimaryForegroundHover: '#EDEFF7',
    actionablePrimaryForegroundActive: '#EDEFF7',
    actionablePrimaryBorderWidth: '0px',
    actionableSecondaryBackground: '#EDEFF7',
    actionableSecondaryBackgroundHover: '#d5d9e9',
    actionableSecondaryBackgroundActive: '#2CB9AC',
    actionableSecondaryForeground: '#3D5C6B',
    actionableSecondaryForegroundHover: '#3D5C6B',
    actionableSecondaryForegroundActive: '#2CB9AC',
    actionableSecondaryBorderWidth: '1px',
    focusedRingColor: '#FD8172',
    sentimentNegativeBackground: '#FC8181',
    sentimentNegativeBackgroundHover: '#F56565',
    sentimentNegativeBackgroundActive: '#E53E3E',
    sentimentNegativeForeground: '#EDEFF7',
    sentimentNegativeForegroundHover: '#EDEFF7',
    sentimentNegativeForegroundActive: '#EDEFF7',
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
    contentHeaderFontFamily: 'Manrope',
    actionableFontFamily: 'Manrope',
    actionableFontWeight: '600',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.6px',
    actionablePrimaryFontWeight: '600',
    actionableSecondaryFontWeight: '600',
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
    containerBackground: '#FFFCF6',
    containerPrimaryBackground: '#F7F3F0',
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
    actionablePrimaryBackground: '#177556',
    actionablePrimaryBackgroundHover: '#145f47',
    actionablePrimaryBackgroundActive: '#114a38',
    actionablePrimaryForeground: '#ffffff',
    actionablePrimaryBorderWidth: '0px',
    actionableSecondaryBackground: '#FFFCF6',
    actionableSecondaryBackgroundHover: 'hsla(240, 4.8%, 95.9%, 0.5)',
    actionableSecondaryBackgroundActive: '#d6e8d1',
    actionableSecondaryForeground: '#177556',
    actionableSecondaryForegroundHover: '#145f47',
    actionableSecondaryForegroundActive: '#114a38',
    actionableSecondaryBorderWidth: '1px',
    focusedRingColor: '#177556',
    sentimentNegativeBackground: '#ef4444',
    sentimentNegativeBackgroundHover: '#dc2626',
    sentimentNegativeBackgroundActive: '#b91c1c',
    sentimentNegativeForeground: '#ffffff',
    sentimentNegativeForegroundHover: '#fef2f2',
    sentimentNegativeForegroundActive: '#fee2e2',
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
    contentHeaderFontFamily: '"Press Start 2P", "Courier New", monospace',
    actionableFontFamily: '"Press Start 2P", "Courier New", monospace',
    actionableFontWeight: '400',
    actionableFontSize: '0.75rem',
    actionableLineHeight: '1.5rem',
    actionableTextTransform: 'uppercase',
    actionableLetterSpacing: '0.1em',
    actionablePrimaryFontWeight: '400',
    actionableSecondaryFontWeight: '400',
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
    containerBackground: '#1a0a2e',
    containerPrimaryBackground: '#16082a',
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
    actionablePrimaryBackground: '#ff006e',
    actionablePrimaryBackgroundHover: '#ff3385',
    actionablePrimaryBackgroundActive: '#cc0058',
    actionablePrimaryForeground: '#ffffff',
    actionablePrimaryForegroundHover: '#ffffff',
    actionablePrimaryForegroundActive: '#ffffff',
    actionablePrimaryBorderWidth: '2px',
    // Cyan secondary buttons
    actionableSecondaryBackground: 'transparent',
    actionableSecondaryBackgroundHover: '#00ffff22',
    actionableSecondaryBackgroundActive: '#00ffff44',
    actionableSecondaryForeground: '#00ffff',
    actionableSecondaryForegroundHover: '#66ffff',
    actionableSecondaryForegroundActive: '#00cccc',
    actionableSecondaryBorderWidth: '2px',
    focusedRingColor: '#ffff00',
    // Red for errors (game over!)
    sentimentNegativeBackground: '#ff0000',
    sentimentNegativeBackgroundHover: '#ff3333',
    sentimentNegativeBackgroundActive: '#cc0000',
    sentimentNegativeForeground: '#ffffff',
    sentimentNegativeForegroundHover: '#ffffff',
    sentimentNegativeForegroundActive: '#ffffff',
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
