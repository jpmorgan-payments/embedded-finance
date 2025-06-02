import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import type { ThemeOption } from './dashboard-layout';

export const useSellSenseThemes = () => {
  const getThemeVariables = (themeOption: ThemeOption): EBThemeVariables => {
    switch (themeOption) {
      case 'Default':
        // Enhanced Modern Purple/Indigo theme with v0.6.13 improvements
        return {
          // Typography - using modern font stack
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          headerFontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          buttonFontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

          // Main colors - Enhanced modern palette
          backgroundColor: '#fafafa',
          foregroundColor: '#0f172a',

          // Card styling
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',

          // Popover styling
          popoverColor: '#ffffff',
          popoverForegroundColor: '#1e293b',

          // Primary colors - Modern indigo with enhanced states
          primaryColor: '#6366f1', // indigo-500
          primaryHoverColor: '#4f46e5', // indigo-600
          primaryActiveColor: '#4338ca', // indigo-700
          primaryForegroundColor: '#ffffff',
          primaryForegroundHoverColor: '#f8fafc',
          primaryForegroundActiveColor: '#f1f5f9',

          // Secondary colors - Enhanced outline button support
          secondaryColor: 'transparent', // Modern transparent secondary
          secondaryHoverColor: 'rgba(99, 102, 241, 0.08)', // Subtle primary tint
          secondaryActiveColor: 'rgba(99, 102, 241, 0.12)', // Slightly more prominent
          secondaryForegroundColor: '#6366f1', // Primary color for text
          secondaryForegroundHoverColor: '#4f46e5', // Hover state
          secondaryForegroundActiveColor: '#4338ca', // Active state
          secondaryBorderWidth: '1px', // Enhanced outline button border

          // Muted colors
          mutedColor: '#f8fafc', // slate-50
          mutedForegroundColor: '#64748b', // slate-500

          // Accent colors - For hover states and highlights
          accentColor: '#f1f5f9', // slate-100
          accentForegroundColor: '#475569', // slate-600

          // Destructive colors - Enhanced with better states
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

          // Spacing and layout
          spacingUnit: '0.25rem', // 4px base unit
          zIndexOverlay: 1000,

          // Enhanced button styling with v0.6.13 improvements
          buttonFontWeight: '500', // medium
          buttonFontSize: '0.875rem', // 14px
          buttonLineHeight: '1.25rem', // 20px
          buttonTextTransform: 'none', // Modern clean style
          buttonLetterSpacing: '0px', // No letter spacing

          // Button weights for different variants
          primaryButtonFontWeight: '600', // semibold for primary
          secondaryButtonFontWeight: '500', // medium for secondary
          destructiveButtonFontWeight: '600', // semibold for destructive

          // Border widths - Enhanced outline button support
          primaryBorderWidth: '0px', // No border for filled primary
          destructiveBorderWidth: '0px', // No border for filled destructive

          // Modern interaction effects
          shiftButtonOnActive: false, // Flat modern design
        };
      case 'SellSense':
        // Enhanced SellSense theme with v0.6.13 improvements
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          headerFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          buttonFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          
          // SellSense brand colors
          primaryColor: '#f55727', // SellSense orange
          primaryHoverColor: '#e14d1f', // Darker orange for hover
          primaryActiveColor: '#cc4319', // Even darker for active
          primaryForegroundColor: '#ffffff',
          
          // Enhanced secondary button with outline support
          secondaryColor: 'transparent',
          secondaryHoverColor: 'rgba(245, 87, 39, 0.08)', // Orange tint
          secondaryActiveColor: '#2CB9AC', // SellSense teal for active
          secondaryForegroundColor: '#f55727', // Orange text
          secondaryForegroundHoverColor: '#e14d1f',
          secondaryForegroundActiveColor: '#2CB9AC',
          secondaryBorderWidth: '1px', // Outline button border
          
          // Background and layout
          backgroundColor: '#F8FAFC',
          foregroundColor: '#1e293b',
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',
          
          // Enhanced input styling
          inputColor: '#FFFFFF',
          inputBorderColor: 'rgba(0, 0, 0, 0.3)', // More subtle border
          borderColor: 'rgba(0, 0, 0, 0.3)',
          
          // Modern border radius
          borderRadius: '6px',
          inputBorderRadius: '4px',
          buttonBorderRadius: '8px',
          
          // Enhanced button styling
          buttonFontWeight: '600', // SellSense brand weight
          buttonFontSize: '0.875rem',
          buttonLineHeight: '1.25rem',
          buttonTextTransform: 'uppercase', // Brand style
          buttonLetterSpacing: '0.6px', // Brand spacing
          
          // Button weights
          primaryButtonFontWeight: '600',
          secondaryButtonFontWeight: '600',
          destructiveButtonFontWeight: '600',
          
          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',
          
          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };
      case 'S&P Theme':
        // Enhanced S&P Theme with v0.6.13 improvements (matching the new story)
        return {
          fontFamily: 'Open Sans',
          headerFontFamily: 'Amplitude',
          buttonFontFamily: 'Amplitude',
          
          // S&P brand colors
          primaryColor: '#1B7F9E', // S&P teal
          primaryHoverColor: '#166b85', // Darker teal
          primaryActiveColor: '#145a71', // Even darker
          primaryForegroundColor: '#ffffff',
          
          // Enhanced secondary styling with proper outline button support
          secondaryColor: 'white',
          secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)', // Subtle gray hover
          secondaryActiveColor: 'hsla(240, 4.8%, 95.9%, 0.8)', // More prominent active
          secondaryForegroundColor: '#1B7F9E', // S&P teal text
          secondaryForegroundHoverColor: '#166b85',
          secondaryForegroundActiveColor: '#145a71',
          secondaryBorderWidth: '1px', // Outline button border
          
          // Background and layout
          backgroundColor: '#f6f7f8',
          foregroundColor: '#1e293b',
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',
          
          // Input styling
          inputColor: '#FFFFFF',
          inputBorderColor: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(0, 0, 0, 0.3)',
          
          // Border radius
          borderRadius: '6px',
          inputBorderRadius: '4px',
          buttonBorderRadius: '8px',
          
          // Enhanced button styling
          buttonFontWeight: '600', // S&P brand weight
          buttonFontSize: '0.875rem',
          buttonLineHeight: '1.25rem',
          buttonTextTransform: 'uppercase', // Brand style
          buttonLetterSpacing: '0.6px', // Brand spacing
          
          // Button weights
          primaryButtonFontWeight: '600',
          secondaryButtonFontWeight: '600',
          destructiveButtonFontWeight: '600',
          
          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',
          
          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };
      case 'Dark':
        // Enhanced Dark theme with v0.6.13 improvements
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          headerFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          buttonFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          
          // Dark theme colors
          backgroundColor: '#1e293b', // slate-800
          foregroundColor: '#f1f5f9', // slate-100
          cardColor: '#334155', // slate-700
          cardForegroundColor: '#f1f5f9',
          popoverColor: '#334155',
          popoverForegroundColor: '#f1f5f9',
          
          // Primary colors (keeping SellSense orange for brand consistency)
          primaryColor: '#f55727',
          primaryHoverColor: '#e14d1f',
          primaryActiveColor: '#cc4319',
          primaryForegroundColor: '#ffffff',
          
          // Enhanced secondary for dark mode
          secondaryColor: 'transparent',
          secondaryHoverColor: 'rgba(245, 87, 39, 0.1)', // Subtle orange in dark
          secondaryActiveColor: '#2CB9AC', // SellSense teal
          secondaryForegroundColor: '#f55727',
          secondaryForegroundHoverColor: '#e14d1f',
          secondaryForegroundActiveColor: '#2CB9AC',
          secondaryBorderWidth: '1px',
          
          // Muted colors for dark theme
          mutedColor: '#475569', // slate-600
          mutedForegroundColor: '#94a3b8', // slate-400
          accentColor: '#475569',
          accentForegroundColor: '#f1f5f9',
          
          // Enhanced dark theme inputs
          inputColor: '#475569', // slate-600
          inputBorderColor: '#64748b', // slate-500
          borderColor: '#64748b',
          ringColor: '#f55727', // Orange focus ring
          
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
          
          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',
          
          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };
      case 'Partner A':
        // Enhanced Partner A theme with v0.6.13 improvements
        return {
          fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          headerFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          buttonFontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
          
          // JP Morgan brand colors
          primaryColor: '#1c2752', // JP Morgan blue
          primaryHoverColor: '#15203d', // Darker blue
          primaryActiveColor: '#0f1729', // Even darker
          primaryForegroundColor: '#ffffff',
          
          // Enhanced secondary with JP Morgan brown accent
          secondaryColor: 'transparent',
          secondaryHoverColor: 'rgba(28, 39, 82, 0.08)', // Blue tint
          secondaryActiveColor: '#936846', // JP Morgan brown
          secondaryForegroundColor: '#1c2752', // Blue text
          secondaryForegroundHoverColor: '#15203d',
          secondaryForegroundActiveColor: '#936846',
          secondaryBorderWidth: '1px',
          
          // Background and layout
          backgroundColor: '#f0f2f8', // Light blue-gray
          foregroundColor: '#1e293b',
          cardColor: '#ffffff',
          cardForegroundColor: '#1e293b',
          
          // Input styling
          inputColor: '#FFFFFF',
          inputBorderColor: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(0, 0, 0, 0.3)',
          
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
          
          // Border widths
          primaryBorderWidth: '0px',
          destructiveBorderWidth: '0px',
          
          // Spacing and effects
          spacingUnit: '0.25rem',
          shiftButtonOnActive: false,
          zIndexOverlay: 1000,
        };
      default:
        // Enhanced default fallback
        return {
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          primaryColor: '#6366f1',
          primaryHoverColor: '#4f46e5',
          primaryForegroundColor: '#ffffff',
          backgroundColor: '#fafafa',
          foregroundColor: '#0f172a',
          buttonBorderRadius: '6px',
          borderRadius: '8px',
          buttonFontWeight: '500',
          buttonTextTransform: 'none',
          shiftButtonOnActive: false,
          spacingUnit: '0.25rem',
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
