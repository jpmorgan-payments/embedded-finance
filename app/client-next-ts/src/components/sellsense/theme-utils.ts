import { useMemo } from 'react';
import type { ThemeOption } from './use-sellsense-themes';

/**
 * Centralized theme utilities for SellSense demo portal
 * Eliminates code duplication across components
 *
 * NOTE: These hardcoded Tailwind classes correspond to design tokens in use-sellsense-themes.ts
 * Comments indicate which token each class represents for easier maintenance
 */

export interface ThemeStyleUtils {
  getHeaderStyles: () => string;
  getHeaderLabelStyles: () => string;
  getHeaderSelectStyles: () => string;
  getHeaderButtonStyles: () => string;
  getHeaderTextStyles: () => string;
  getHeaderCompanyTextStyles: () => string;
  getHeaderSettingsButtonStyles: () => string;
  getSidebarStyles: () => string;
  getSidebarButtonStyles: (selected: boolean) => string;
  getSidebarLabelStyles: () => string;
  getSidebarTextStyles: () => string;
  getCardStyles: () => string;
  getIconStyles: () => string;
  getTagStyles: () => string;
  getDialogStyles: () => string;
  getModalStyles: () => string;
  getContentAreaStyles: () => string;
  getLogoPath: () => string;
  getLogoAlt: () => string;
  getLogoStyles: () => string;
  getLayoutButtonStyles: (active: boolean) => string;
}

export function createThemeStyleUtils(theme: ThemeOption): ThemeStyleUtils {
  return {
    // Header component styles
    getHeaderStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-gray-50 border-gray-200'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-white border-slate-200'; // backgroundColor: '#ffffff', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-[#f6f7f8] border-[#0000004D]'; // backgroundColor: '#f6f7f8', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'bg-[#3D5C6B] border-[#0000001A]'; // backgroundColor: '#3D5C6B', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'bg-[#F7F3F0] border-[#0000004d]'; // Updated background color to #F7F3F0
        case 'PayFicient':
          return 'bg-[#FFFCF6] border-[#0000004d]'; // backgroundColor: '#FFFCF6', borderColor: '#0000004d'
        default:
          return 'bg-white border-gray-200';
      }
    },
    getHeaderLabelStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600'; // Neutral styling for showing component defaults
        case 'Default Blue':
        case 'S&P Theme':
        case 'SellSense':
        case 'PayFicient':
          return 'text-slate-500'; // mutedForegroundColor: '#64748b'
        case 'Create Commerce':
          return 'text-[#98A2CD]'; // mutedForegroundColor: '#98A2CD'
        default:
          return 'text-gray-600';
      }
    },
    getHeaderSelectStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300 text-gray-900'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-white border-gray-300 text-slate-800'; // inputColor: '#ffffff', inputBorderColor: '#d1d5db', foregroundColor: '#1e293b'
        case 'S&P Theme':
          return 'bg-white border-[#0000004D] text-slate-800'; // inputColor: '#FFFFFF', inputBorderColor: '#0000004D', foregroundColor: '#1e293b'
        case 'Create Commerce':
          return 'bg-[#38474E] border-[#0000004D] text-[#EDEFF7]'; // inputColor: '#38474E', inputBorderColor: '#0000004D', foregroundColor: '#EDEFF7'
        case 'SellSense':
        case 'PayFicient':
          return 'bg-white border-[#0000004d] text-slate-800'; // inputColor: '#FFFFFF', inputBorderColor: '#0000004d', foregroundColor: '#1e293b'
        default:
          return 'bg-white border-gray-300 text-gray-900';
      }
    },
    getHeaderButtonStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'text-[#0060f0] hover:text-[#0a4386] hover:bg-transparent'; // primaryColor: '#0060f0', primaryHoverColor: '#0a4386', secondaryColor: '#00000000'
        case 'S&P Theme':
          return 'text-[#1B7F9E] hover:text-[#166b85] hover:bg-white'; // primaryColor: '#1B7F9E', primaryHoverColor: '#166b85', secondaryColor: 'white'
        case 'Create Commerce':
          return 'text-[#FD8172] hover:text-[#fd6b5a] hover:bg-[#EDEFF7]'; // primaryColor: '#FD8172', primaryHoverColor: '#fd6b5a', secondaryColor: '#EDEFF7'
        case 'SellSense':
          return 'text-[#f55727] hover:text-[#e14d1f] hover:bg-[#FDF7F0]'; // primaryColor: '#f55727', primaryHoverColor: '#e14d1f', secondaryColor: '#FDF7F0'
        case 'PayFicient':
          return 'text-[#177556] hover:text-[#145f47] hover:bg-[#FFFCF6]'; // primaryColor: '#177556', primaryHoverColor: '#145f47', secondaryColor: '#FFFCF6'
        default:
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
      }
    },
    getHeaderSettingsButtonStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300'; // borderColor: '#e2e8f0', backgroundColor: '#ffffff'
        case 'S&P Theme':
          return 'border-[#0000004D] bg-white hover:bg-slate-100 hover:border-[#0000004D]'; // borderColor: '#0000004D', backgroundColor: '#ffffff'
        case 'Create Commerce':
          return 'border-[#0000004D] bg-[#38474E] hover:bg-[#4A5A6B] hover:border-[#0000004D]'; // borderColor: '#0000004D', backgroundColor: '#38474E'
        case 'SellSense':
          return 'border-[#0000004d] bg-white hover:bg-slate-100 hover:border-[#0000004d]'; // borderColor: '#0000004d', backgroundColor: '#ffffff'
        case 'PayFicient':
          return 'border-[#0000004d] bg-white hover:bg-slate-100 hover:border-[#0000004d]'; // borderColor: '#0000004d', backgroundColor: '#ffffff'
        default:
          return 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300';
      }
    },
    getHeaderTextStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-900'; // Neutral styling for showing component defaults
        case 'Default Blue':
        case 'S&P Theme':
        case 'SellSense':
        case 'PayFicient':
          return 'text-slate-800'; // foregroundColor: '#1e293b'
        case 'Create Commerce':
          return 'text-[#EDEFF7]'; // foregroundColor: '#EDEFF7'
        default:
          return 'text-gray-900';
      }
    },
    getHeaderCompanyTextStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-500'; // Neutral styling for showing component defaults
        case 'Default Blue':
        case 'S&P Theme':
        case 'SellSense':
        case 'PayFicient':
          return 'text-slate-500'; // mutedForegroundColor: '#64748b'
        case 'Create Commerce':
          return 'text-[#98A2CD]'; // mutedForegroundColor: '#98A2CD'
        default:
          return 'text-gray-500';
      }
    },

    // Sidebar component styles
    getSidebarStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-gray-50 border-gray-200'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-white border-slate-200'; // backgroundColor: '#ffffff', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-[#f6f7f8] border-[#0000004D]'; // backgroundColor: '#f6f7f8', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'bg-[#3D5C6B] border-[#0000001A]'; // backgroundColor: '#3D5C6B', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'bg-[#FAF9F7] border-[#0000004d]'; // backgroundColor: '#FAF9F7', borderColor: '#0000004d'
        case 'PayFicient':
          return 'bg-[#FFFCF6] border-[#0000004d]'; // backgroundColor: '#FFFCF6', borderColor: '#0000004d'
        default:
          return 'bg-gray-50 border-gray-200';
      }
    },

    getSidebarButtonStyles: (selected: boolean) => {
      if (selected) {
        switch (theme) {
          case 'Empty':
            return 'text-gray-900 font-semibold bg-gray-200 border-l-4 border-gray-600'; // Neutral styling for showing component defaults
          case 'Default Blue':
            return 'text-[#0060f0] font-semibold bg-slate-100 border-l-4 border-[#0060f0]'; // primaryColor: '#0060f0', accentColor: '#f1f5f9'
          case 'S&P Theme':
            return 'text-[#1B7F9E] font-semibold bg-slate-100 border-l-4 border-[#1B7F9E]'; // primaryColor: '#1B7F9E', accentColor: '#f1f5f9'
          case 'Create Commerce':
            return 'text-[#FD8172] font-semibold bg-[#38474E] border-l-4 border-[#FD8172]'; // primaryColor: '#FD8172', accentColor: '#38474E'
          case 'SellSense':
            return 'text-[#f55727] font-semibold bg-slate-100 border-l-4 border-[#f55727]'; // primaryColor: '#f55727', accentColor: '#f1f5f9'
          case 'PayFicient':
            return 'text-[#177556] font-semibold bg-slate-100 border-l-4 border-[#177556]'; // primaryColor: '#177556', accentColor: '#f1f5f9'
          default:
            return 'text-gray-900 font-semibold bg-gray-200 border-l-4 border-gray-600';
        }
      } else {
        switch (theme) {
          case 'Empty':
            return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-gray-200 hover:text-gray-900'; // Neutral styling for showing component defaults
          case 'Default Blue':
            return 'text-slate-800 font-normal border-l-4 border-transparent hover:bg-slate-100 hover:text-[#0060f0]'; // foregroundColor: '#1e293b', accentColor: '#f1f5f9', primaryColor: '#0060f0'
          case 'S&P Theme':
            return 'text-slate-800 font-normal border-l-4 border-transparent hover:bg-slate-100 hover:text-[#1B7F9E]'; // foregroundColor: '#1e293b', accentColor: '#f1f5f9', primaryColor: '#1B7F9E'
          case 'Create Commerce':
            return 'text-[#EDEFF7] font-normal border-l-4 border-transparent hover:bg-[#38474E] hover:text-[#FD8172]'; // foregroundColor: '#EDEFF7', accentColor: '#38474E', primaryColor: '#FD8172'
          case 'SellSense':
            return 'text-slate-800 font-normal border-l-4 border-transparent hover:bg-slate-100 hover:text-[#f55727]'; // foregroundColor: '#1e293b', accentColor: '#f1f5f9', primaryColor: '#f55727'
          case 'PayFicient':
            return 'text-slate-800 font-normal border-l-4 border-transparent hover:bg-slate-100 hover:text-[#177556]'; // foregroundColor: '#1e293b', accentColor: '#f1f5f9', primaryColor: '#177556'
          default:
            return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-gray-200 hover:text-gray-900';
        }
      }
    },

    getSidebarLabelStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-500'; // Neutral styling for showing component defaults
        case 'Default Blue':
        case 'S&P Theme':
        case 'SellSense':
        case 'PayFicient':
          return 'text-slate-500'; // mutedForegroundColor: '#64748b'
        case 'Create Commerce':
          return 'text-[#98A2CD]'; // mutedForegroundColor: '#98A2CD'
        default:
          return 'text-gray-500';
      }
    },

    getSidebarTextStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-700'; // Neutral styling for showing component defaults
        case 'Default Blue':
        case 'S&P Theme':
        case 'SellSense':
        case 'PayFicient':
          return 'text-slate-800'; // foregroundColor: '#1e293b'
        case 'Create Commerce':
          return 'text-[#EDEFF7]'; // foregroundColor: '#EDEFF7'
        default:
          return 'text-gray-700';
      }
    },

    // Component widget styles (for demo wrapping)
    getCardStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'h-fit bg-white border-slate-200'; // popoverColor: '#ffffff', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'h-fit bg-white border-[#0000004D]'; // cardColor: '#ffffff', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'h-fit bg-[#38474E] border-[#0000001A]'; // popoverColor: '#38474E', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'h-fit bg-[#FFFFFF] border-[#0000004d]'; // Updated cardColor to match use-sellsense-themes.ts
        case 'PayFicient':
          return 'h-fit bg-[#F7F3F0] border-[#0000004d]'; // cardColor: '#F7F3F0', borderColor: '#0000004d'
        default:
          return 'bg-white border-gray-300';
      }
    },

    getContentAreaStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return ' bg-white border-slate-200'; // backgroundColor: '#ffffff', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-[#f6f7f8] border-[#0000004D]'; // backgroundColor: '#f6f7f8', borderColor: '#0000004D'
        case 'Create Commerce':
          return ' bg-[#3D5C6B] border-[#0000001A]'; // backgroundColor: '#3D5C6B', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return ' bg-[#FAF9F7]'; // backgroundColor: '#FAF9F7', borderColor: '#0000004d'
        case 'PayFicient':
          return ' bg-[#FFFCF6]'; // backgroundColor: '#FFFCF6', borderColor: '#0000004d'
        default:
          return 'bg-white border-gray-300';
      }
    },

    getIconStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'text-[#0060f0] hover:text-[#0a4386] hover:bg-transparent'; // primaryColor: '#0060f0', primaryHoverColor: '#0a4386', secondaryColor: '#00000000'
        case 'S&P Theme':
          return 'text-[#1B7F9E] hover:text-[#166b85] hover:bg-white'; // primaryColor: '#1B7F9E', primaryHoverColor: '#166b85', secondaryColor: 'white'
        case 'Create Commerce':
          return 'text-[#FD8172] hover:text-[#fd6b5a] hover:bg-[#EDEFF7]'; // primaryColor: '#FD8172', primaryHoverColor: '#fd6b5a', secondaryColor: '#EDEFF7'
        case 'SellSense':
          return 'text-[#f55727] hover:text-[#e14d1f] hover:bg-[#FDF7F0]'; // primaryColor: '#f55727', primaryHoverColor: '#e14d1f', secondaryColor: '#FDF7F0'
        case 'PayFicient':
          return 'text-[#177556] hover:text-[#145f47] hover:bg-[#FFFCF6]'; // primaryColor: '#177556', primaryHoverColor: '#145f47', secondaryColor: '#FFFCF6'
        default:
          return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
      }
    },

    // Component tag styles (for component identification)
    getTagStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-gray-100 text-gray-700 border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-slate-50 text-[#0060f0] border-slate-200'; // accentColor: '#f1f5f9', primaryColor: '#0060f0', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-slate-50 text-[#1B7F9E] border-[#0000004D]'; // accentColor: '#f1f5f9', primaryColor: '#1B7F9E', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'bg-[#38474E] text-[#FD8172] border-[#0000001A]'; // accentColor: '#38474E', primaryColor: '#FD8172', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'bg-[#FDF7F0] text-[#f55727] border-[#0000004d]'; // secondaryColor: '#FDF7F0', primaryColor: '#f55727', borderColor: '#0000004d'
        case 'PayFicient':
          return 'bg-[#FFFCF6] text-[#177556] border-[#0000004d]'; // secondaryColor: '#FFFCF6', primaryColor: '#177556', borderColor: '#0000004d'
        default:
          return 'bg-gray-100 text-gray-700 border-gray-300';
      }
    },

    // Dialog styles (for component tech details)
    getDialogStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white text-gray-900 border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-white text-slate-800 border-slate-200'; // backgroundColor: '#ffffff', foregroundColor: '#1e293b', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-[#f6f7f8] text-slate-800 border-[#0000004D]'; // backgroundColor: '#f6f7f8', foregroundColor: '#1e293b', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'bg-[#3D5C6B] text-[#EDEFF7] border-[#0000001A]'; // backgroundColor: '#3D5C6B', foregroundColor: '#EDEFF7', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'bg-[#FAF9F7] text-slate-800 border-[#0000004d]'; // backgroundColor: '#FAF9F7', foregroundColor: '#1e293b', borderColor: '#0000004d'
        case 'PayFicient':
          return 'bg-[#FFFCF6] text-slate-800 border-[#0000004d]'; // backgroundColor: '#FFFCF6', foregroundColor: '#1e293b', borderColor: '#0000004d'
        default:
          return 'bg-white text-gray-900 border-gray-300';
      }
    },

    // Modal styles (for info modal)
    getModalStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'bg-white text-gray-900 border-gray-300'; // Neutral styling for showing component defaults
        case 'Default Blue':
          return 'bg-white text-slate-800 border-slate-200'; // backgroundColor: '#ffffff', foregroundColor: '#1e293b', borderColor: '#e2e8f0'
        case 'S&P Theme':
          return 'bg-[#f6f7f8] text-slate-800 border-[#0000004D]'; // backgroundColor: '#f6f7f8', foregroundColor: '#1e293b', borderColor: '#0000004D'
        case 'Create Commerce':
          return 'bg-[#3D5C6B] text-[#EDEFF7] border-[#0000001A]'; // backgroundColor: '#3D5C6B', foregroundColor: '#EDEFF7', borderColor: '#0000001A' (10% opacity)
        case 'SellSense':
          return 'bg-[#FAF9F7] text-slate-800 border-[#0000004d]'; // backgroundColor: '#FAF9F7', foregroundColor: '#1e293b', borderColor: '#0000004d'
        case 'PayFicient':
          return 'bg-[#FFFCF6] text-slate-800 border-[#0000004d]'; // backgroundColor: '#FFFCF6', foregroundColor: '#1e293b', borderColor: '#0000004d'
        default:
          return 'bg-white text-gray-900 border-gray-300';
      }
    },

    // Logo utility functions
    getLogoPath: () => {
      switch (theme) {
        case 'Empty':
          return ''; // No logo for empty theme - shows component defaults
        case 'PayFicient':
          return '/payficientlogo.svg';
        case 'Default Blue':
          return '/bluelogo.svg';
        case 'S&P Theme':
          return '/logo-jpm-brown.svg';
        case 'Create Commerce':
          return '/CreateCommerceLogo.svg';
        case 'SellSense':
        default:
          return '/sellSense.svg'; // SellSense logo for all other themes
      }
    },

    getLogoAlt: () => {
      switch (theme) {
        case 'Empty':
          return ''; // No alt text for empty theme
        case 'PayFicient':
          return 'PayFicient Logo'; // Alt text for PayFicient placeholder
        case 'Default Blue':
        case 'S&P Theme':
        case 'Create Commerce':
          return 'Create Commerce Logo'; // Create Commerce alt text
        case 'SellSense':
        default:
          return 'SellSense Logo'; // SellSense alt text for all other themes
      }
    },

    getLogoStyles: () => {
      switch (theme) {
        case 'Empty':
          return 'hidden'; // Hide logo completely for empty theme
        case 'PayFicient':
          return 'mt-5 h-[80px] w-auto max-w-[300px] object-contain'; // Even larger sizing for PayFicient logo
        case 'Default Blue':
          return 'h-12 w-auto max-w-[250px] object-contain'; // Standard sizing for Default Blue logo
        case 'S&P Theme':
          return 'h-9 w-auto max-w-[250px] object-contain'; // Standard sizing for S&P Theme logo
        case 'Create Commerce':
          return 'h-9 w-auto max-w-[250px]';
        case 'SellSense':
        default:
          return 'h-8 w-auto max-w-[150px] object-contain'; // Consistent responsive sizing for SellSense logo
      }
    },

    getLayoutButtonStyles: (active: boolean) => {
      if (active) {
        switch (theme) {
          case 'Empty':
            return 'bg-gray-600 text-white font-medium'; // Neutral styling for showing component defaults
          case 'Default Blue':
            return 'bg-[#0060f0] text-white font-medium'; // primaryColor: '#0060f0'
          case 'S&P Theme':
            return 'bg-[#1B7F9E] text-white font-medium'; // primaryColor: '#1B7F9E'
          case 'Create Commerce':
            return 'bg-[#FD8172] text-white font-medium'; // primaryColor: '#FD8172'
          case 'SellSense':
            return 'bg-[#f55727] text-white font-medium'; // primaryColor: '#f55727'
          case 'PayFicient':
            return 'bg-[#177556] text-white font-medium'; // primaryColor: '#177556'
          default:
            return 'bg-gray-600 text-white font-medium';
        }
      } else {
        switch (theme) {
          case 'Empty':
            return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'; // Neutral styling for showing component defaults
          case 'Default Blue':
            return 'text-[#0060f0] hover:text-[#0a4386] hover:bg-transparent'; // primaryColor: '#0060f0', primaryHoverColor: '#0a4386'
          case 'S&P Theme':
            return 'text-[#1B7F9E] hover:text-[#166b85] hover:bg-white'; // primaryColor: '#1B7F9E', primaryHoverColor: '#166b85'
          case 'Create Commerce':
            return 'text-[#FD8172] hover:text-[#fd6b5a] hover:bg-[#EDEFF7]'; // primaryColor: '#FD8172', primaryHoverColor: '#fd6b5a'
          case 'SellSense':
            return 'text-[#f55727] hover:text-[#e14d1f] hover:bg-[#FDF7F0]'; // primaryColor: '#f55727', primaryHoverColor: '#e14d1f'
          case 'PayFicient':
            return 'text-[#177556] hover:text-[#145f47] hover:bg-[#FFFCF6]'; // primaryColor: '#177556', primaryHoverColor: '#145f47'
          default:
            return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
        }
      }
    },
  };
}

/**
 * Hook-style wrapper for easier use in components
 */
export function useThemeStyles(theme: ThemeOption): ThemeStyleUtils {
  return useMemo(() => createThemeStyleUtils(theme), [theme]);
}
