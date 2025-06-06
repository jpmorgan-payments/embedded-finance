import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

// Updated ThemeOption type to include Empty theme for showing defaults
export type ThemeOption =
  | 'Default Blue'
  | 'S&P Theme'
  | 'Create Commerce'
  | 'SellSense'
  | 'PayFicient'
  | 'Empty';

export const useSellSenseThemes = () => {
  const getThemeVariables = (themeOption: ThemeOption): EBThemeVariables => {
    switch (themeOption) {
      case 'Empty':
        // Empty theme - no design tokens to show component defaults
        return {};

      case 'Default Blue':
        // Default Blue theme with v0.6.15 design tokens
        return {
          // Typography - modern font stack
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          headerFontFamily:
            'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          buttonFontFamily:
            'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',

          // Main colors
          backgroundColor: '#ffffff',
          foregroundColor: '#1e293b',
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',
          popoverColor: '#ffffff',
          popoverForegroundColor: '#1e293b',

          // Primary colors - Default Blue
          primaryColor: '#0060f0',
          primaryHoverColor: '#0a4386',
          primaryActiveColor: '#083366',
          primaryForegroundColor: '#ffffff',
          primaryForegroundHoverColor: '#f8fafc',
          primaryForegroundActiveColor: '#f1f5f9',

          // Secondary colors - Enhanced outline button support
          secondaryColor: '#00000000', // Transparent
          secondaryHoverColor: '#0060f014', // Blue tint (8% opacity)
          secondaryActiveColor: '#0060f01f', // Slightly more prominent (12% opacity)
          secondaryForegroundColor: '#0060f0',
          secondaryForegroundHoverColor: '#0a4386',
          secondaryForegroundActiveColor: '#083366',
          secondaryBorderWidth: '1px',

          // Muted colors
          mutedColor: '#f8fafc',
          mutedForegroundColor: '#64748b',
          accentColor: '#f1f5f9',
          accentForegroundColor: '#475569',

          // Destructive colors
          destructiveColor: '#ef4444',
          destructiveHoverColor: '#dc2626',
          destructiveActiveColor: '#b91c1c',
          destructiveForegroundColor: '#ffffff',
          destructiveForegroundHoverColor: '#fef2f2',
          destructiveForegroundActiveColor: '#fee2e2',

          // Enhanced alert system colors (v0.6.15)
          alertColor: '#f1f5f9', // Default alert background
          alertForegroundColor: '#1e293b', // Default alert text
          informativeColor: '#0ea5e9', // Information alerts
          informativeAccentColor: '#e0f2fe', // Information alert background
          warningColor: '#f59e0b', // Warning alerts
          warningAccentColor: '#fef3c7', // Warning alert background
          successColor: '#10b981', // Success alerts
          successAccentColor: '#d1fae5', // Success alert background

          // Border and input styling
          borderRadius: '8px',
          buttonBorderRadius: '.313em', // Matching useThemes.ts
          inputBorderRadius: '6px',
          borderColor: '#e2e8f0',
          inputColor: '#ffffff',
          inputBorderColor: '#d1d5db',
          ringColor: '#0060f0',

          // Enhanced button styling with v0.6.15 improvements
          buttonFontWeight: '500',
          buttonFontSize: '0.875rem',
          buttonLineHeight: '1.25rem',
          buttonTextTransform: 'none',
          buttonLetterSpacing: '0em',

          // Button weights for different variants
          primaryButtonFontWeight: '600',
          secondaryButtonFontWeight: '500',
          destructiveButtonFontWeight: '600',

          // New v0.6.15 form label design tokens
          formLabelFontSize: '0.875rem', // 14px - consistent label sizing
          formLabelFontWeight: '500', // Medium weight for readability
          formLabelLineHeight: '1.25rem', // Proper line height for labels

          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',

          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: true, // Matching useThemes.ts
          zIndexOverlay: 1000,
        };

      case 'S&P Theme':
        // S&P Theme with v0.6.15 design tokens (matching useThemes.ts)
        return {
          fontFamily: 'Open Sans',
          headerFontFamily: 'Amplitude',
          buttonFontFamily: 'Amplitude',

          // S&P brand colors
          primaryColor: '#1B7F9E',
          primaryHoverColor: '#166b85',
          primaryActiveColor: '#145a71',
          primaryForegroundColor: '#ffffff',

          // Secondary styling with proper outline button support
          secondaryColor: 'white', // Matching useThemes.ts
          secondaryHoverColor: '#f1f2f480',
          secondaryActiveColor: '#f1f2f4cc',
          secondaryForegroundColor: '#1B7F9E',
          secondaryForegroundHoverColor: '#166b85',
          secondaryForegroundActiveColor: '#145a71',
          secondaryBorderWidth: '1px',

          // Background and layout
          backgroundColor: '#f6f7f8',
          foregroundColor: '#1e293b',
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',

          // Enhanced muted colors
          mutedColor: '#f8fafc',
          mutedForegroundColor: '#64748b',
          accentColor: '#f1f5f9',
          accentForegroundColor: '#475569',

          // Enhanced alert system colors (v0.6.15)
          alertColor: '#f6f7f8', // S&P themed alert background
          alertForegroundColor: '#1e293b',
          informativeColor: '#1B7F9E', // Using S&P primary for info
          informativeAccentColor: '#e6f3f7', // S&P themed info background
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
          inputBorderColor: '#0000004D', // Matching useThemes.ts
          borderColor: '#0000004D',

          // Border radius
          borderRadius: '6px',
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

          // New v0.6.15 form label design tokens - S&P styling
          formLabelFontSize: '0.875rem',
          formLabelFontWeight: '600', // Slightly heavier for S&P brand
          formLabelLineHeight: '1.25rem',

          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',

          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };

      case 'Create Commerce':
        // Create Commerce theme with v0.6.15 design tokens (matching useThemes.ts)
        return {
          fontFamily: 'Open Sans',
          headerFontFamily: 'Open Sans',
          buttonFontFamily: 'Open Sans',

          // Create Commerce brand colors
          primaryColor: '#FD8172',
          primaryHoverColor: '#fd6b5a',
          primaryActiveColor: '#fc5441',
          primaryForegroundColor: '#ffffff', // Changed to white for better contrast

          // Secondary styling with improved contrast
          secondaryColor: '#4A5568', // Improved secondary background
          secondaryHoverColor: '#2D3748', // Darker hover for better contrast
          secondaryActiveColor: '#2CB9AC', // Keeping the accent color
          secondaryForegroundColor: '#E2E8F0', // Light text for dark backgrounds
          secondaryForegroundHoverColor: '#F7FAFC', // Even lighter on hover
          secondaryForegroundActiveColor: '#2CB9AC',
          secondaryBorderWidth: '1px',

          // Background and layout (improved dark theme)
          backgroundColor: '#2D3748', // Lighter dark background for better readability
          foregroundColor: '#F7FAFC', // Very light text for maximum contrast
          cardColor: '#4A5568', // Card background with good contrast
          cardForegroundColor: '#F7FAFC', // Light text on cards

          // Muted and accent colors with better contrast
          mutedColor: '#4A5568', // Consistent with card color
          mutedForegroundColor: '#CBD5E0', // Better contrast for muted text
          accentColor: '#4A5568',
          accentForegroundColor: '#F7FAFC',

          // Enhanced alert system colors for dark theme (v0.6.15)
          alertColor: '#4A5568', // Dark theme alert background
          alertForegroundColor: '#F7FAFC',
          informativeColor: '#60A5FA', // Lighter blue for dark theme
          informativeAccentColor: '#1E3A8A', // Dark blue background
          warningColor: '#FBBF24', // Lighter yellow for dark theme
          warningAccentColor: '#92400E', // Dark yellow background
          successColor: '#34D399', // Lighter green for dark theme
          successAccentColor: '#065F46', // Dark green background

          // Input styling with improved visibility
          inputColor: '#4A5568', // Dark but readable input background
          inputBorderColor: '#718096', // Visible border
          borderColor: '#718096', // Consistent border color

          // Enhanced destructive colors for dark theme
          destructiveColor: '#FC8181', // Lighter red for dark backgrounds
          destructiveHoverColor: '#F56565',
          destructiveActiveColor: '#E53E3E',
          destructiveForegroundColor: '#ffffff',
          destructiveForegroundHoverColor: '#2D3748',
          destructiveForegroundActiveColor: '#1A202C',

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

          // New v0.6.15 form label design tokens - Dark theme optimized
          formLabelFontSize: '0.875rem',
          formLabelFontWeight: '500', // Medium weight for dark theme readability
          formLabelLineHeight: '1.25rem',

          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',

          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };

      case 'SellSense':
        // SellSense theme with v0.6.15 design tokens (matching useThemes.ts)
        return {
          fontFamily: 'Inter', // Matching useThemes.ts
          headerFontFamily: 'Inter',
          buttonFontFamily: 'Inter',

          // SellSense brand colors
          primaryColor: '#f55727',
          primaryHoverColor: '#e14d1f',
          primaryActiveColor: '#cc4319',
          primaryForegroundColor: '#ffffff',

          // Enhanced secondary button with outline support
          secondaryColor: '#FDF7F0', // Matching useThemes.ts
          secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)', // Matching useThemes.ts
          secondaryActiveColor: '#2CB9AC',
          secondaryForegroundColor: '#f55727',
          secondaryForegroundHoverColor: '#e14d1f',
          secondaryForegroundActiveColor: '#2CB9AC',
          secondaryBorderWidth: '1px',

          // Background and layout
          backgroundColor: '#FAF9F7', // Matching useThemes.ts
          foregroundColor: '#1e293b',
          cardColor: '#F7F3F0', // Matching useThemes.ts
          cardForegroundColor: '#1e293b',

          // Enhanced muted and accent colors
          mutedColor: '#f8fafc',
          mutedForegroundColor: '#64748b',
          accentColor: '#f1f5f9',
          accentForegroundColor: '#475569',

          // Enhanced alert system colors (v0.6.15) - SellSense themed
          alertColor: '#FDF7F0', // SellSense themed alert background
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

          // New v0.6.15 form label design tokens - SellSense styling
          formLabelFontSize: '0.875rem',
          formLabelFontWeight: '600', // Bold for SellSense brand consistency
          formLabelLineHeight: '1.25rem',

          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',

          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };

      case 'PayFicient':
        // PayFicient theme with v0.6.15 design tokens (matching useThemes.ts)
        return {
          fontFamily: 'Manrope',
          headerFontFamily: 'Manrope',
          buttonFontFamily: 'Manrope',

          // PayFicient brand colors
          primaryColor: '#177556',
          primaryHoverColor: '#145f47',
          primaryActiveColor: '#114a38',
          primaryForegroundColor: '#ffffff',

          // Secondary styling
          secondaryColor: '#FFFCF6', // Matching useThemes.ts
          secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)', // Matching useThemes.ts
          secondaryActiveColor: '#d6e8d1',
          secondaryForegroundColor: '#177556',
          secondaryForegroundHoverColor: '#145f47',
          secondaryForegroundActiveColor: '#114a38',
          secondaryBorderWidth: '1px',

          // Background and layout
          backgroundColor: '#FFFCF6',
          foregroundColor: '#1e293b',
          cardColor: '#F7F3F0', // Matching useThemes.ts
          cardForegroundColor: '#1e293b',

          // Enhanced muted and accent colors
          mutedColor: '#f8fafc',
          mutedForegroundColor: '#64748b',
          accentColor: '#f1f5f9',
          accentForegroundColor: '#475569',

          // Enhanced alert system colors (v0.6.15) - PayFicient themed
          alertColor: '#FFFCF6', // PayFicient themed alert background
          alertForegroundColor: '#1e293b',
          informativeColor: '#177556', // Using PayFicient primary for info
          informativeAccentColor: '#e6f2ed', // PayFicient themed info background
          warningColor: '#f59e0b',
          warningAccentColor: '#fef3c7',
          successColor: '#177556', // Using brand green for success
          successAccentColor: '#d6e8d1', // PayFicient themed success background

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
          borderRadius: '5px', // Matching useThemes.ts
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

          // New v0.6.15 form label design tokens - PayFicient styling
          formLabelFontSize: '0.875rem',
          formLabelFontWeight: '500', // Medium weight for PayFicient's clean aesthetic
          formLabelLineHeight: '1.25rem',

          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',

          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };

      default:
        // Enhanced default fallback with v0.6.15 design tokens
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          primaryColor: '#0060f0',
          primaryHoverColor: '#0a4386',
          primaryForegroundColor: '#ffffff',
          backgroundColor: '#ffffff',
          foregroundColor: '#1e293b',
          buttonBorderRadius: '.313em',
          borderRadius: '8px',
          buttonFontWeight: '500',
          buttonTextTransform: 'none',
          shiftButtonOnActive: true,
          spacingUnit: '0.25rem',

          // New v0.6.15 form label defaults
          formLabelFontSize: '0.875rem',
          formLabelFontWeight: '500',
          formLabelLineHeight: '1.25rem',

          // Enhanced alert defaults
          alertColor: '#f1f5f9',
          alertForegroundColor: '#1e293b',
          informativeColor: '#0ea5e9',
          informativeAccentColor: '#e0f2fe',
          warningColor: '#f59e0b',
          warningAccentColor: '#fef3c7',
          successColor: '#10b981',
          successAccentColor: '#d1fae5',
        };
    }
  };

  const mapThemeOption = (themeOption: ThemeOption) => {
    const variables = getThemeVariables(themeOption);
    return {
      colorScheme: 'light' as const, // All themes are light mode for now
      variables,
    };
  };

  return {
    getThemeVariables,
    mapThemeOption,
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
