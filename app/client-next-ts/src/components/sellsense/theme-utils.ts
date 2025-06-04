import type { ThemeOption } from './use-sellsense-themes';

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
}

export function createThemeStyleUtils(theme: ThemeOption): ThemeStyleUtils {
  return {
    // Header component styles
    getHeaderStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'bg-slate-800 border-slate-700';
        case 'S&P Theme':
          return 'bg-gray-50 border-gray-300';
        default:
          return 'bg-white border-gray-200';
      }
    },

    getHeaderLabelStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-slate-400';
        case 'S&P Theme':
          return 'text-gray-600';
        default:
          return 'text-gray-500';
      }
    },

    getHeaderSelectStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'bg-slate-700 border-slate-600 text-slate-100';
        default:
          return 'border-gray-300';
      }
    },

    getHeaderButtonStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-blue-400 hover:text-blue-300 hover:bg-slate-700';
        case 'S&P Theme':
          return 'text-teal-600 hover:text-teal-500 hover:bg-teal-50';
        default:
          return 'text-sellsense-primary hover:text-sellsense-primary hover:bg-sellsense-primary-bg';
      }
    },

    getHeaderTextStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-white';
        case 'S&P Theme':
          return 'text-gray-900';
        default:
          return 'text-gray-900';
      }
    },

    // Sidebar component styles
    getSidebarStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'bg-slate-800 border-slate-700';
        case 'S&P Theme':
          return 'bg-gray-50 border-gray-300';
        default:
          return 'bg-white border-gray-200';
      }
    },

    getSidebarButtonStyles: (selected: boolean) => {
      if (selected) {
        switch (theme) {
          case 'Create Commerce':
            return 'text-blue-300 font-semibold bg-slate-700 border-l-4 border-blue-300';
          case 'S&P Theme':
            return 'text-teal-600 font-semibold bg-teal-50 border-l-4 border-teal-600';
          default:
            return 'text-sellsense-primary font-semibold bg-sellsense-primary-bg border-l-4 border-sellsense-primary';
        }
      } else {
        switch (theme) {
          case 'Create Commerce':
            return 'text-slate-100 font-normal border-l-4 border-transparent hover:bg-slate-700 hover:text-blue-300';
          case 'S&P Theme':
            return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-teal-50 hover:text-teal-600';
          default:
            return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-sellsense-primary-bg hover:text-sellsense-primary';
        }
      }
    },

    getSidebarLabelStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-slate-300';
        case 'S&P Theme':
          return 'text-gray-500';
        default:
          return 'text-gray-500';
      }
    },

    getSidebarTextStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-slate-100';
        case 'S&P Theme':
          return 'text-gray-700';
        default:
          return 'text-gray-700';
      }
    },

    // Component widget styles (for demo wrapping)
    getCardStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'bg-slate-900 border-slate-700';
        case 'S&P Theme':
          return 'bg-white border-gray-300';
        default:
          return 'bg-white border-gray-200';
      }
    },

    getIconStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'text-gray-300 hover:text-white hover:bg-slate-700';
        case 'S&P Theme':
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
        default:
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
      }
    },

    // Dialog styles (for component tech details)
    getDialogStyles: () => {
      switch (theme) {
        case 'Create Commerce':
          return 'bg-slate-800 text-white border-slate-600';
        case 'S&P Theme':
          return 'bg-gray-50 text-gray-900 border-gray-300';
        default:
          return 'bg-white text-gray-900 border-gray-200';
      }
    },
  };
}

/**
 * Hook-style wrapper for easier use in components
 */
export function useThemeStyles(theme: ThemeOption): ThemeStyleUtils {
  return createThemeStyleUtils(theme);
}
