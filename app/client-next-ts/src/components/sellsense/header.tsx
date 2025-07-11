'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, Settings, Menu, X, ChevronDown } from 'lucide-react';
import type { ClientScenario, ContentTone } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';

interface HeaderProps {
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  contentTone: ContentTone;
  setContentTone: (tone: ContentTone) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export function Header({
  clientScenario,
  setClientScenario,
  theme,
  setTheme,
  contentTone,
  setContentTone,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSettingsOpen,
  setIsSettingsOpen,
}: HeaderProps) {
  const themeStyles = useThemeStyles(theme);

  // Helper function to get shortened names for mobile
  const getShortScenario = (scenario: ClientScenario) => {
    if (scenario.includes('Onboarding')) return 'Onboarding';
    if (scenario.includes('Fresh Start')) return 'Fresh Start';
    if (scenario.includes('Established')) return 'Established';
    return 'Active';
  };

  const getShortTheme = (themeName: ThemeOption) => {
    if (themeName === 'Default Blue') return 'Default';
    if (themeName === 'Create Commerce') return 'Dark';
    return themeName;
  };

  return (
    <header
      className={`border-b shadow-sm h-16 flex items-center justify-between sticky top-0 z-10 px-4 lg:px-6 ${themeStyles.getHeaderStyles()}`}
    >
      {/* Left side - Logo and Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        {themeStyles.getLogoPath() && (
          <img
            src={themeStyles.getLogoPath()}
            alt={themeStyles.getLogoAlt()}
            className={`${themeStyles.getLogoStyles()} hidden sm:block`}
          />
        )}
      </div>

      {/* Center - Demo Settings Summary */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-4">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`flex items-center gap-2 text-sm transition-all duration-200 rounded-full px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 shadow-sm hover:shadow-md ${
            isSettingsOpen ? 'bg-gray-100 border-gray-300 shadow-md' : ''
          }`}
          title="Click to open demo settings"
        >
          {/* Mobile summary - minimal */}
          <div className="flex items-center gap-1.5 sm:hidden text-gray-700">
            <span className="font-medium">
              {getShortScenario(clientScenario)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="font-medium">{getShortTheme(theme)}</span>
            <span className="text-gray-400">•</span>
            <span className="font-medium">{contentTone}</span>
            <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
          </div>

          {/* Desktop summary - detailed */}
          <div className="hidden sm:flex items-center gap-3 text-gray-700">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Scenario:</span>
              <span className="font-medium">{clientScenario}</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Theme:</span>
              <span className="font-medium">{theme}</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Tone:</span>
              <span className="font-medium">{contentTone}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 ml-2" />
          </div>
        </button>
      </div>

      {/* Right side - User section and Settings */}
      <div className="flex items-center space-x-2 lg:space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
        >
          <Globe className="h-4 w-4 lg:h-5 lg:w-5" />
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-full p-1 ${
            isSettingsOpen ? 'bg-gray-100 bg-opacity-20' : ''
          } ${themeStyles.getHeaderButtonStyles()}`}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-sellsense-primary">
            <AvatarFallback className="text-white text-sm font-medium">
              JD
            </AvatarFallback>
          </Avatar>
          <span
            className={`text-sm font-medium hidden sm:block ${themeStyles.getHeaderTextStyles()}`}
          >
            John Doe
          </span>
        </div>
      </div>
    </header>
  );
}
