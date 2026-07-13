'use client';

import { useState } from 'react';
import {
  Brush,
  ChevronDown,
  Database,
  Info,
  Languages,
  Menu,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ClientScenario, ContentTone } from './dashboard-layout';
import {
  getNextScenario,
  getScenarioByKey,
  getScenarioKeyByDisplayName,
  SCENARIO_ORDER,
} from './scenarios-config';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

// Company data - always the same
const getCompanyInfo = () => {
  return {
    name: 'Neverland Books',
    description: 'Step into a world of stories and imagination',
  };
};

/** Side drawers that share accordion open behavior (one at a time). */
export type DemoCustomizationDrawer =
  | 'theme'
  | 'contentTokens'
  | 'componentProps'
  | null;

interface HeaderProps {
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  theme: ThemeOption;
  /** When theme is Custom, use this for logo/portal styling (e.g. Empty stays Empty) */
  themeForDisplay: ThemeOption;
  contentTone: ContentTone;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  activeCustomizationDrawer: DemoCustomizationDrawer;
  onToggleCustomizationDrawer: (
    drawer: Exclude<DemoCustomizationDrawer, null>
  ) => void;
  contentTokenOverrideCount: number;
  componentPropsOverrideCount: number;
  themeOverrideCount: number;
  isMockApiEditorOpen: boolean;
  setIsMockApiEditorOpen: (open: boolean) => void;
  mockOverrideCount: number;
  onResetAllCustomizations: () => void;
}

function OverrideBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white"
      aria-label={`${count} ${label}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Header({
  clientScenario,
  setClientScenario,
  theme,
  themeForDisplay,
  contentTone,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isInfoModalOpen,
  setIsInfoModalOpen,
  activeCustomizationDrawer,
  onToggleCustomizationDrawer,
  contentTokenOverrideCount,
  componentPropsOverrideCount,
  themeOverrideCount,
  isMockApiEditorOpen,
  setIsMockApiEditorOpen,
  mockOverrideCount,
  onResetAllCustomizations,
}: HeaderProps) {
  const themeStyles = useThemeStyles(themeForDisplay);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const totalCustomizationOverrides =
    themeOverrideCount +
    contentTokenOverrideCount +
    componentPropsOverrideCount;

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
    <>
      <header
        className={`sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 shadow-sm lg:px-6 ${themeStyles.getHeaderStyles()}`}
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
        <div className="mx-4 flex max-w-3xl flex-1 items-center justify-center">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all duration-200 hover:shadow-md ${themeStyles.getHeaderSettingsButtonStyles()} ${
              isSettingsOpen ? 'shadow-md' : ''
            }`}
            title="Click to open demo settings"
          >
            {/* Mobile summary - minimal */}
            <div
              className={`flex items-center gap-1.5 sm:hidden ${themeStyles.getHeaderTextStyles()}`}
            >
              <span className="font-medium">
                {getShortScenario(clientScenario)}
              </span>
              <span className={themeStyles.getHeaderLabelStyles()}>•</span>
              <span className="font-medium">{getShortTheme(theme)}</span>
              <span className={themeStyles.getHeaderLabelStyles()}>•</span>
              <span className="font-medium">{contentTone}</span>
              <ChevronDown
                className={`ml-1 h-3 w-3 ${themeStyles.getHeaderLabelStyles()}`}
              />
            </div>

            {/* Desktop summary - detailed */}
            <div
              className={`hidden items-center gap-3 sm:flex ${themeStyles.getHeaderTextStyles()}`}
            >
              <div className="flex items-center gap-1">
                <span className={themeStyles.getHeaderLabelStyles()}>
                  Scenario:
                </span>
                <span className="font-medium">{clientScenario}</span>
              </div>
              <div className={themeStyles.getHeaderLabelStyles()}>•</div>
              <div className="flex items-center gap-1">
                <span className={themeStyles.getHeaderLabelStyles()}>
                  Theme:
                </span>
                <span className="font-medium">{theme}</span>
              </div>
              <div className={themeStyles.getHeaderLabelStyles()}>•</div>
              <div className="flex items-center gap-1">
                <span className={themeStyles.getHeaderLabelStyles()}>
                  Tone:
                </span>
                <span className="font-medium">{contentTone}</span>
              </div>
              <ChevronDown
                className={`ml-2 h-4 w-4 ${themeStyles.getHeaderLabelStyles()}`}
              />
            </div>
          </button>
        </div>

        {/* Right side - User section, Scenario Navigation, and Settings */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Scenario Navigation Buttons - Desktop Only */}
          <div className="hidden items-center gap-1 pr-2 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevScenario}
              disabled={isFirstScenario}
              className={`h-8 w-8 rounded-full p-1 transition-all duration-200 hover:shadow-sm ${
                isFirstScenario ? 'cursor-not-allowed opacity-50' : ''
              } ${themeStyles.getHeaderButtonStyles()}`}
              title={`Previous scenario: ${prevScenario.displayName}`}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextScenario}
              disabled={isLastScenario}
              className={`h-8 w-8 rounded-full p-1 transition-all duration-200 hover:shadow-sm ${
                isLastScenario ? 'cursor-not-allowed opacity-50' : ''
              } ${themeStyles.getHeaderButtonStyles()}`}
              title={`Next scenario: ${nextScenario.displayName}`}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Info button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => setIsInfoModalOpen(!isInfoModalOpen)}
            title="Show demo information"
          >
            <Info className="h-4 w-4 lg:h-5 lg:w-5" />
          </Button>

          {/* Theme Customization button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'theme'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('theme')}
            title="Customize theme"
          >
            <Brush className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge count={themeOverrideCount} label="theme overrides" />
          </Button>

          {/* Content Token Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'contentTokens'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('contentTokens')}
            title="Edit content tokens"
          >
            <Languages className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={contentTokenOverrideCount}
              label="token overrides"
            />
          </Button>

          {/* Component Props Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'componentProps'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('componentProps')}
            title="Edit component props"
          >
            <SlidersHorizontal className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={componentPropsOverrideCount}
              label="prop overrides"
            />
          </Button>

          {/* Mock API Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              isMockApiEditorOpen ? 'bg-gray-100 bg-opacity-20' : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => setIsMockApiEditorOpen(!isMockApiEditorOpen)}
            title="Edit mock API responses"
          >
            <Database className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge count={mockOverrideCount} label="overrides" />
          </Button>

          {/* Reset all customizations */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
            disabled={totalCustomizationOverrides === 0}
            onClick={() => setIsResetConfirmOpen(true)}
            title="Reset all theme, content token, and component prop overrides"
          >
            <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={totalCustomizationOverrides}
              label="total overrides"
            />
          </Button>

          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 bg-sellsense-primary">
              <AvatarFallback className="text-sm font-medium text-white">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col sm:flex">
              <span
                className={`text-sm font-medium ${themeStyles.getHeaderTextStyles()}`}
              >
                John Doe
              </span>
              <span
                className={`text-xs ${themeStyles.getHeaderCompanyTextStyles()}`}
                title={getCompanyInfo().description}
              >
                {getCompanyInfo().name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset all overrides?</DialogTitle>
            <DialogDescription>
              This clears saved theme, content token, and component prop
              overrides from this browser and restores SellSense defaults. Mock
              API overrides are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onResetAllCustomizations();
                setIsResetConfirmOpen(false);
              }}
            >
              Reset all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
