import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import type { ThemeOption } from './dashboard-layout';

export const useSellSenseThemes = () => {
  const getThemeVariables = (themeOption: ThemeOption): EBThemeVariables => {
    switch (themeOption) {
      case 'Default':
        // Comprehensive Modern Purple/Indigo theme using all available design tokens
        return {
          // Typography
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          headerFontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          buttonFontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

          // Main colors - Modern purple/indigo palette
          backgroundColor: '#fafafa',
          foregroundColor: '#0f172a',

          // Card styling
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',

          // Popover styling
          popoverColor: '#ffffff',
          popoverForegroundColor: '#1e293b',

          // Primary colors - Sophisticated indigo
          primaryColor: '#6366f1', // indigo-500
          primaryHoverColor: '#4f46e5', // indigo-600
          primaryActiveColor: '#4338ca', // indigo-700
          primaryForegroundColor: '#ffffff',
          primaryForegroundHoverColor: '#f8fafc',
          primaryForegroundActiveColor: '#f1f5f9',

          // Secondary colors - Subtle gray
          secondaryColor: '#f1f5f9', // slate-100
          secondaryHoverColor: '#e2e8f0', // slate-200
          secondaryActiveColor: '#cbd5e1', // slate-300
          secondaryForegroundColor: '#475569', // slate-600
          secondaryForegroundHoverColor: '#334155', // slate-700
          secondaryForegroundActiveColor: '#1e293b', // slate-800

          // Muted colors
          mutedColor: '#f8fafc', // slate-50
          mutedForegroundColor: '#64748b', // slate-500

          // Accent colors - Complementary purple
          accentColor: '#f3f4f6', // gray-100
          accentForegroundColor: '#6b7280', // gray-500

          // Destructive colors - Modern red
          destructiveColor: '#ef4444', // red-500
          destructiveHoverColor: '#dc2626', // red-600
          destructiveActiveColor: '#b91c1c', // red-700
          destructiveForegroundColor: '#ffffff',
          destructiveForegroundHoverColor: '#fef2f2',
          destructiveForegroundActiveColor: '#fee2e2',

          // Border and input styling
          borderRadius: '8px',
          buttonBorderRadius: '6px',
          inputBorderRadius: '6px',
          borderColor: '#e2e8f0', // slate-200
          inputColor: '#ffffff',
          inputBorderColor: '#d1d5db', // gray-300
          ringColor: '#6366f1', // indigo-500 (matches primary)

          // Spacing
          spacingUnit: '0.25rem', // 4px base unit

          // Button styling
          buttonFontWeight: '500', // medium
          buttonFontSize: '0.875rem', // 14px
          buttonLineHeight: '1.25rem', // 20px
          buttonTextTransform: 'none', // Clean, modern - no uppercase
          buttonLetterSpacing: '0px', // Normal letter spacing

          // Button weights for different variants
          primaryButtonFontWeight: '600', // semibold for primary
          secondaryButtonFontWeight: '500', // medium for secondary
          destructiveButtonFontWeight: '600', // semibold for destructive

          // Border widths
          primaryBorderWidth: '0px', // No border for modern look
          secondaryBorderWidth: '1px', // Subtle border for secondary
          destructiveBorderWidth: '0px', // No border for destructive

          // Interactive effects
          shiftButtonOnActive: false, // Modern flat design
          zIndexOverlay: 1000,
        };
      case 'SellSense':
        // SellSense theme from useThemes.ts
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          primaryColor: '#f55727',
          buttonBorderRadius: '8px',
          buttonTextTransform: 'uppercase',
          buttonLetterSpacing: '0.6px',
          secondaryActiveColor: '#2CB9AC',
          backgroundColor: '#F8FAFC',
          inputColor: '#FFFFFF',
          inputBorderColor: '#0000004D',
          borderColor: '#0000004D',
          borderRadius: '6px',
          inputBorderRadius: '4px',
        };
      case 'S&P Theme':
        // S&P Theme from useThemes.ts
        return {
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
          secondaryColor: 'white',
          secondaryForegroundColor: '#1B7F9E',
          secondaryBorderWidth: '1px',
        };
      case 'Dark':
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          primaryColor: '#f55727',
          backgroundColor: '#1e293b',
          foregroundColor: '#f1f5f9',
          cardColor: '#334155',
          cardForegroundColor: '#f1f5f9',
          buttonBorderRadius: '8px',
          buttonTextTransform: 'uppercase',
          buttonLetterSpacing: '0.6px',
          secondaryActiveColor: '#2CB9AC',
          inputColor: '#475569',
          inputBorderColor: '#64748b',
          borderColor: '#64748b',
          borderRadius: '6px',
          inputBorderRadius: '4px',
        };
      case 'Partner A':
        // Partner A theme (keeping the existing JP Morgan style)
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          primaryColor: '#1c2752', // JP Morgan blue
          backgroundColor: '#f0f2f8',
          buttonBorderRadius: '8px',
          buttonTextTransform: 'uppercase',
          buttonLetterSpacing: '0.6px',
          secondaryActiveColor: '#936846', // JP Morgan brown
          inputColor: '#FFFFFF',
          inputBorderColor: '#0000004D',
          borderColor: '#0000004D',
          borderRadius: '6px',
          inputBorderRadius: '4px',
        };
      default:
        return {
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          primaryColor: '#6366f1',
          buttonBorderRadius: '6px',
          backgroundColor: '#fafafa',
        };
    }
  };

  const mapThemeOption = (themeOption: ThemeOption) => {
    const variables = getThemeVariables(themeOption);
    return {
      colorScheme:
        themeOption === 'Dark' ? ('dark' as const) : ('light' as const),
      variables,
    };
  };

  return {
    getThemeVariables,
    mapThemeOption,
  };
};
