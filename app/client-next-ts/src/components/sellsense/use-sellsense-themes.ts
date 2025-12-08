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
            contentAccentForeground: '#475569',
            editableBackground: '#ffffff',
            editableBorderColor: '#d1d5db',
            separableBorderColor: '#e2e8f0',

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
          };

        case 'Salt Theme':
          return {
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
            contentAccentForeground: '#475569',
            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004D',
            editableLabelForeground: '#4C5157',
            separableBorderColor: '#0000004D',

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
          };

        case 'Create Commerce':
          return {
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
            contentAccentForeground: '#EDEFF7',
            editableBackground: '#38474E',
            editableBorderColor: '#0000004D',
            editableLabelForeground: '#EDEFF7',
            separableBorderColor: '#0000004D',

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
          };

        case 'SellSense':
          return {
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
            contentAccentForeground: '#475569',
            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004d',
            editableLabelForeground: '#1e293b',
            separableBorderColor: '#0000004d',

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
          };

        case 'PayFicient':
          return {
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
            contentAccentForeground: '#475569',
            editableBackground: '#FFFFFF',
            editableBorderColor: '#0000004d',
            editableLabelForeground: '#1e293b',
            separableBorderColor: '#0000004d',

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
          };

        default:
          return {
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
            contentAccentForeground: '#475569',
            editableBackground: '#ffffff',
            editableBorderColor: '#d1d5db',
            separableBorderColor: '#e2e8f0',

            actionableAccentedBoldBackground: '#0060f0',
            actionableAccentedBoldBackgroundHover: '#0a4386',
            actionableAccentedBoldBackgroundActive: '#0a4386',
            actionableAccentedBoldForeground: '#ffffff',
            actionableAccentedBoldBorderWidth: '0px',

            actionableSubtleBackground: '#00000000',
            actionableSubtleBackgroundHover: '#0060f014',
            actionableSubtleBackgroundActive: '#0060f01f',
            actionableSubtleForeground: '#0060f0',
            actionableSubtleForegroundHover: '#0a4386',
            actionableSubtleForegroundActive: '#0a4386',
            actionableSubtleBorderWidth: '1px',

            focusedRingColor: '#0060f0',

            actionableNegativeBoldBackground: '#ef4444',
            actionableNegativeBoldForeground: '#ffffff',
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
