import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import { getThemeVariables, type ThemeOption } from './use-sellsense-themes';

/**
 * Centralized theme utilities for SellSense demo portal
 * Eliminates code duplication across components
 */

export interface ThemeStyleUtils {
  getHeaderStyles: () => string;
  getHeaderLabelStyles: () => string;
  getHeaderSelectStyles: () => string;
  getHeaderButtonStyles: () => string;
  getHeaderTextStyles: () => string;
  getSidebarStyles: () => string;
  getSidebarButtonStyles: (selected: boolean) => string;
  getSidebarLabelStyles: () => string;
  getSidebarTextStyles: () => string;
  getCardStyles: () => string;
  getIconStyles: () => string;
  getDialogStyles: () => string;
  getContentAreaStyles: () => string;
}

export function createThemeStyleUtils(theme: ThemeOption, themeDesingTokens: EBThemeVariables): ThemeStyleUtils {

  return {
    // Header component styles
    getHeaderStyles: () => {
      console.log('themeDesingTokens', themeDesingTokens);
      switch (theme) {
        case 'Empty':
          return 'bg-gray-50 border-gray-200'; // Neutral for showing defaults
        default:
          return `bg-[${themeDesingTokens?.backgroundColor}] border-[${themeDesingTokens?.borderColor}]`;
      }
    },
    getHeaderLabelStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600'; // Neutral for showing defaults
        default:
          return `text-[${themeDesingTokens?.mutedForegroundColor}]`;
      }
    },
    getHeaderSelectStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300 text-gray-900'; // Neutral for showing defaults
        default:
          return `bg-[${themeDesingTokens?.inputColor}] border-[${themeDesingTokens?.inputBorderColor}] text-[${themeDesingTokens?.foregroundColor}]`;
      }
    },
    getHeaderButtonStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'; // Neutral for showing defaults
        default:
          return `text-[${themeDesingTokens?.primaryColor}] hover:text-[${themeDesingTokens?.primaryHoverColor}] hover:bg-[${themeDesingTokens?.secondaryColor}]`;
      }
    },
    getHeaderTextStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-900'; // Neutral for showing defaults
        default:
          return `text-[${themeDesingTokens?.foregroundColor}]`;
      }
    },

    // Sidebar component styles
    getSidebarStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-gray-50 border-gray-200'; // Neutral for showing defaults
        default:
          return `bg-[${themeDesingTokens?.backgroundColor}] border-[${themeDesingTokens?.borderColor}]`;
      }
    },

    getSidebarButtonStyles: (selected: boolean) => {
      if (selected) {
        switch (theme) {
          case 'Empty':
            return 'text-gray-900 font-semibold bg-gray-200 border-l-4 border-gray-600'; // Neutral for showing defaults
          default:
            return `text-[${themeDesingTokens?.primaryColor}] font-semibold bg-[${themeDesingTokens?.accentColor || themeDesingTokens?.mutedColor}] border-l-4 border-[${themeDesingTokens?.primaryColor}]`;
        }
      } else {
        switch (theme) {
          case 'Empty':
            return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-gray-200 hover:text-gray-900'; // Neutral for showing defaults
          default:
            return `text-[${themeDesingTokens?.foregroundColor}] font-normal border-l-4 border-transparent hover:bg-[${themeDesingTokens?.accentColor || themeDesingTokens?.mutedColor}] hover:text-[${themeDesingTokens?.primaryColor}]`;
        }
      }
    },

    getSidebarLabelStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-500'; // Neutral for showing defaults
        default:
          return `text-[${themeDesingTokens?.mutedForegroundColor}]`;
      }
    },

    getSidebarTextStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-700'; // Neutral for showing defaults

        default:
          return `text-[${themeDesingTokens?.foregroundColor}]`;
      }
    },

    // Component widget styles (for demo wrapping)
    getCardStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300'; // Neutral for showing defaults

        default:
          return `h-fit bg-[${themeDesingTokens?.popoverColor}] border-[${themeDesingTokens?.borderColor}]`;
      }
    },

     getContentAreaStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300'; // Neutral for showing defaults

        default:
          return `h-fit min-h-full bg-[${themeDesingTokens?.backgroundColor}] border-[${themeDesingTokens?.borderColor}]`;
      }
    },

    getIconStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'; // Neutral for showing defaults

        default:
          return `text-[${themeDesingTokens?.primaryColor}] hover:text-[${themeDesingTokens?.primaryHoverColor}] hover:bg-[${themeDesingTokens?.secondaryColor}]`;
      }
    },

    // Dialog styles (for component tech details)
    getDialogStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white text-gray-900 border-gray-300'; // Neutral for showing defaults

        default:
          return `bg-[${themeDesingTokens?.backgroundColor}] text-[${themeDesingTokens?.foregroundColor}] border-[${themeDesingTokens?.borderColor}]`;
      }
    },
  };
}

/**
 * Hook-style wrapper for easier use in components
 */
export function useThemeStyles(theme: ThemeOption): ThemeStyleUtils {
  return createThemeStyleUtils(theme, getThemeVariables(theme));
}
