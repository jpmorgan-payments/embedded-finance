import { useCallback } from 'react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

// Updated ThemeOption type to include Custom theme for user-defined themes
export type ThemeOption =
  | 'Default Blue'
  | 'Salt Theme'
  | 'Create Commerce'
  | 'SellSense'
  | 'PayFicient'
  | 'Empty'
  | 'Custom';

export const useSellSenseThemes = () => {
  const getThemeVariables = useCallback(
    (
      themeOption: ThemeOption,
      customVariables?: EBThemeVariables,
    ): EBThemeVariables => {
      switch (themeOption) {
        case 'Custom':
          return customVariables || {};

        case 'Empty':
          // Empty theme - no design tokens to show component defaults
          return {};

        case 'Default Blue':
          return {
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

            containerBackground: '#ffffff',
            containerPrimaryBackground: '#ffffff',
            containerPrimaryForeground: '#1e293b',
            containerSecondaryBackground: '#f8fafc',
            containerSecondaryForeground: '#64748b',
            contentPrimaryForeground: '#1e293b',
            overlayableBackground: '#ffffff',
            overlayableForeground: '#1e293b',
            overlayableZIndex: 1000,
            accentBackground: '#f1f5f9',
            accentForeground: '#475569',
            separableBorderColor: '#e2e8f0',
            separableBorderRadius: '8px',
            spacingUnit: '0.25rem',

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

            editableBackground: '#ffffff',
            editableBorderColor: '#d1d5db',
            editableBorderRadius: '6px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '500',
            editableLabelLineHeight: '1.25rem',

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
          };

        case 'Salt Theme':
          return {
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

            containerBackground: '#f6f7f8',
            containerPrimaryBackground: '#ffffff',
            containerPrimaryForeground: '#1e293b',
            containerSecondaryBackground: '#f8fafc',
            containerSecondaryForeground: '#64748b',
            contentPrimaryForeground: '#1e293b',
            overlayableBackground: '#ffffff',
            overlayableForeground: '#1e293b',
            overlayableZIndex: 1000,
            accentBackground: '#f1f5f9',
            accentForeground: '#475569',
            separableBorderColor: '#0000004D',
            separableBorderRadius: '6px',
            spacingUnit: '0.25rem',

            actionablePrimaryBackground: '#1B7F9E',
            actionablePrimaryBackgroundHover: '#166b85',
            actionablePrimaryBackgroundActive: '#145a71',
            actionablePrimaryForeground: '#ffffff',
            actionablePrimaryBorderWidth: '0px',

            actionableSecondaryBackground: 'white',
            actionableSecondaryBackgroundHover: '#f1f2f480',
            actionableSecondaryBackgroundActive: '#f1f2f4cc',
            actionableSecondaryForeground: '#1B7F9E',
            actionableSecondaryForegroundHover: '#166b85',
            actionableSecondaryForegroundActive: '#145a71',
            actionableSecondaryBorderWidth: '1px',

            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004D',
            editableBorderRadius: '4px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '600',
            editableLabelLineHeight: '1.25rem',
            editableLabelForeground: '#1e293b',

            focusedRingColor: '#1B7F9E',

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
            statusInfoForeground: '#1B7F9E',
            statusInfoAccentBackground: '#e6f3f7',
          };

        case 'Create Commerce':
          return {
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

            containerBackground: '#3D5C6B',
            containerPrimaryBackground: '#3D5C6B',
            containerPrimaryForeground: '#EDEFF7',
            containerSecondaryBackground: '#38474E',
            containerSecondaryForeground: '#98A2CD',
            contentPrimaryForeground: '#EDEFF7',
            overlayableBackground: '#38474E',
            overlayableForeground: '#EDEFF7',
            overlayableZIndex: 1000,
            accentBackground: '#38474E',
            accentForeground: '#EDEFF7',
            separableBorderColor: '#0000004D',
            separableBorderRadius: '8px',
            spacingUnit: '0.25rem',

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

            editableBackground: '#38474E',
            editableBorderColor: '#0000004D',
            editableBorderRadius: '4px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '500',
            editableLabelLineHeight: '1.25rem',
            editableLabelForeground: '#EDEFF7',

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
          };

        case 'SellSense':
          return {
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

            containerBackground: '#f7fafc',
            containerPrimaryBackground: '#FFFFFF',
            containerPrimaryForeground: '#1e293b',
            containerSecondaryBackground: '#f8fafc',
            containerSecondaryForeground: '#64748b',
            contentPrimaryForeground: '#1e293b',
            overlayableBackground: '#FFFFFF',
            overlayableForeground: '#1e293b',
            overlayableZIndex: 1000,
            accentBackground: '#f1f5f9',
            accentForeground: '#475569',
            separableBorderColor: '#0000004d',
            separableBorderRadius: '8px',
            spacingUnit: '0.25rem',

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

            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004d',
            editableBorderRadius: '4px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '600',
            editableLabelLineHeight: '1.25rem',
            editableLabelForeground: '#1e293b',

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
          };

        case 'PayFicient':
          return {
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

            containerBackground: '#FFFCF6',
            containerPrimaryBackground: '#F7F3F0',
            containerPrimaryForeground: '#1e293b',
            containerSecondaryBackground: '#f8fafc',
            containerSecondaryForeground: '#64748b',
            contentPrimaryForeground: '#1e293b',
            overlayableBackground: '#FFFFFF',
            overlayableForeground: '#1e293b',
            overlayableZIndex: 1000,
            accentBackground: '#f1f5f9',
            accentForeground: '#475569',
            separableBorderColor: '#0000004d',
            separableBorderRadius: '5px',
            spacingUnit: '0.25rem',

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

            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004d',
            editableBorderRadius: '4px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '500',
            editableLabelLineHeight: '1.25rem',
            editableLabelForeground: '#1e293b',

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
          };

        default:
          return {
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

            containerBackground: '#ffffff',
            containerPrimaryBackground: '#ffffff',
            containerPrimaryForeground: '#1e293b',
            containerSecondaryBackground: '#f8fafc',
            containerSecondaryForeground: '#64748b',
            contentPrimaryForeground: '#1e293b',
            overlayableBackground: '#ffffff',
            overlayableForeground: '#1e293b',
            overlayableZIndex: 1000,
            accentBackground: '#f1f5f9',
            accentForeground: '#475569',
            separableBorderColor: '#e2e8f0',
            separableBorderRadius: '8px',
            spacingUnit: '0.25rem',

            actionablePrimaryBackground: '#0060f0',
            actionablePrimaryBackgroundHover: '#0a4386',
            actionablePrimaryBackgroundActive: '#0a4386',
            actionablePrimaryForeground: '#ffffff',
            actionablePrimaryBorderWidth: '0px',

            actionableSecondaryBackground: '#00000000',
            actionableSecondaryBackgroundHover: '#0060f014',
            actionableSecondaryBackgroundActive: '#0060f01f',
            actionableSecondaryForeground: '#0060f0',
            actionableSecondaryForegroundHover: '#0a4386',
            actionableSecondaryForegroundActive: '#0a4386',
            actionableSecondaryBorderWidth: '1px',

            editableBackground: '#ffffff',
            editableBorderColor: '#d1d5db',
            editableBorderRadius: '6px',
            editableLabelFontSize: '0.875rem',
            editableLabelFontWeight: '500',
            editableLabelLineHeight: '1.25rem',

            focusedRingColor: '#0060f0',

            sentimentNegativeBackground: '#ef4444',
            sentimentNegativeForeground: '#ffffff',
            sentimentCautionForeground: '#f59e0b',
            sentimentCautionAccentBackground: '#fef3c7',
            sentimentPositiveForeground: '#10b981',
            sentimentPositiveAccentBackground: '#d1fae5',
            statusInfoForeground: '#0ea5e9',
            statusInfoAccentBackground: '#e0f2fe',
          };
      }
    },
    [],
  );

  const mapThemeOption = useCallback(
    (themeOption: ThemeOption, customVariables?: EBThemeVariables) => {
      const variables = getThemeVariables(themeOption, customVariables);
      return {
        colorScheme: 'light' as const, // All themes are light mode for now
        variables,
      };
    },
    [getThemeVariables],
  );

  const mapCustomTheme = useCallback((customVariables: EBThemeVariables) => {
    return {
      colorScheme: 'light' as const,
      variables: customVariables,
    };
  }, []);

  return {
    getThemeVariables,
    mapThemeOption,
    mapCustomTheme,
  };
};

// Helper function to get theme variables directly
export const getThemeVariables = (
  themeOption: ThemeOption,
): EBThemeVariables => {
  const { getThemeVariables } = useSellSenseThemes();
  return getThemeVariables(themeOption);
};

// Helper to check if theme supports dark mode
export const isDarkTheme = (themeOption: ThemeOption): boolean => {
  return themeOption === 'Create Commerce';
};
