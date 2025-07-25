'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings,
  Menu,
  X,
  ChevronDown,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { ClientScenario, ContentTone } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';
import {
  SCENARIO_ORDER,
  getNextScenario,
  getScenarioByKey,
  getScenarioKeyByDisplayName,
} from './scenarios-config';

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
  contentTone,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSettingsOpen,
  setIsSettingsOpen,
}: HeaderProps) {
  const themeStyles = useThemeStyles(theme);

  // Get current scenario key and next/previous scenarios
  const currentScenarioKey = getScenarioKeyByDisplayName(clientScenario);
  const currentIndex = currentScenarioKey
    ? SCENARIO_ORDER.indexOf(currentScenarioKey)
    : 0;
  const isFirstScenario = currentIndex === 0;
  const isLastScenario = currentIndex === SCENARIO_ORDER.length - 1;

  const nextScenarioKey = currentScenarioKey
    ? getNextScenario(currentScenarioKey)
    : SCENARIO_ORDER[0];
  const nextScenario = getScenarioByKey(nextScenarioKey);

  const prevScenarioKey = isFirstScenario
    ? SCENARIO_ORDER[SCENARIO_ORDER.length - 1]
    : SCENARIO_ORDER[currentIndex - 1];
  const prevScenario = getScenarioByKey(prevScenarioKey);

  // Handle next scenario click
  const handleNextScenario = () => {
    setClientScenario(nextScenario.displayName);
  };

  // Handle previous scenario click
  const handlePrevScenario = () => {
    setClientScenario(prevScenario.displayName);
  };

  // Helper function to get shortened names for mobile
  const getShortScenario = (scenario: ClientScenario) => {
    const scenarioKey = getScenarioKeyByDisplayName(scenario);
    if (scenarioKey) {
      return getScenarioByKey(scenarioKey).shortName;
    }
    // Fallback for legacy scenarios
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
      <div className="flex-1 flex items-center justify-center max-w-3xl mx-4">
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

      {/* Right side - User section, Scenario Navigation, and Settings */}
      <div className="flex items-center space-x-2 lg:space-x-3">
        {/* Scenario Navigation Buttons - Desktop Only */}
        <div className="hidden lg:flex items-center gap-1 pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevScenario}
            disabled={isFirstScenario}
            className={`h-8 w-8 rounded-full p-1 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm ${
              isFirstScenario ? 'opacity-50 cursor-not-allowed' : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            title={`Previous scenario: ${prevScenario.displayName}`}
          >
            <SkipBack className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextScenario}
            disabled={isLastScenario}
            className={`h-8 w-8 rounded-full p-1 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm ${
              isLastScenario ? 'opacity-50 cursor-not-allowed' : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            title={`Next scenario: ${nextScenario.displayName}`}
          >
            <SkipForward className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

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
