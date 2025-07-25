'use client';

import type { ClientScenario, View } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';
import {
  getOnboardingScenarios,
  getScenarioKeyByDisplayName,
} from './scenarios-config';

interface SidebarProps {
  clientScenario: ClientScenario;
  activeView: View;
  onViewChange: (view: View) => void;
  theme: ThemeOption;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const onboardingMenu = [{ key: 'onboarding' as View, label: 'Onboarding' }];

const fullSidebarMenu = [
  { key: 'overview' as View, label: 'Home' },
  { key: 'wallet' as View, label: 'Wallet Management' },
  { key: 'catalog' as View, label: 'Catalog' },
  { key: 'orders' as View, label: 'Orders' },
  { key: 'performance' as View, label: 'Performance' },
];

interface SidebarButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  theme: ThemeOption;
}

function SidebarButton({
  label,
  selected,
  onClick,
  theme,
}: SidebarButtonProps) {
  const themeStyles = useThemeStyles(theme);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors duration-200 ${themeStyles.getSidebarButtonStyles(selected)}`}
    >
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function Sidebar({
  clientScenario,
  activeView,
  onViewChange,
  theme,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const themeStyles = useThemeStyles(theme);

  // Determine if this is an onboarding scenario using centralized config
  const scenarioKey = getScenarioKeyByDisplayName(clientScenario);
  const isOnboardingScenario = scenarioKey
    ? getOnboardingScenarios().some((s) => s.key === scenarioKey)
    : // Fallback for legacy scenarios
      [
        'New Seller - Onboarding',
        'Onboarding - Docs Needed',
        'Onboarding - In Review',
      ].includes(clientScenario);

  // Choose appropriate menu based on scenario
  const menuItems = isOnboardingScenario ? onboardingMenu : fullSidebarMenu;

  const handleViewChange = (view: View) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Close mobile menu when changing views
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block w-60 border-r h-full flex-shrink-0 ${themeStyles.getSidebarStyles()}`}
      >
        <nav className="flex-1 pt-4">
          {/* Scenario-specific Menu */}
          <div className="space-y-0">
            {menuItems.map((item) => (
              <SidebarButton
                key={item.key}
                label={item.label}
                selected={activeView === item.key}
                onClick={() => handleViewChange(item.key)}
                theme={theme}
              />
            ))}
          </div>

          {/* Scenario indicator */}
          <div className="mt-8 px-4">
            <div
              className={`text-xs uppercase tracking-wide font-medium mb-2 ${themeStyles.getSidebarLabelStyles()}`}
            >
              Current Mode
            </div>
            <div
              className={`text-sm font-medium ${themeStyles.getSidebarTextStyles()}`}
            >
              {isOnboardingScenario ? 'Onboarding Flow' : 'Seller Dashboard'}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 ${themeStyles.getSidebarStyles()}`}
        style={{ top: '4rem' }} // Start below the header
      >
        <nav className="h-full pt-4 pb-20 overflow-y-auto">
          {/* Scenario-specific Menu */}
          <div className="space-y-0">
            {menuItems.map((item) => (
              <SidebarButton
                key={item.key}
                label={item.label}
                selected={activeView === item.key}
                onClick={() => handleViewChange(item.key)}
                theme={theme}
              />
            ))}
          </div>

          {/* Scenario indicator */}
          <div className="mt-8 px-4">
            <div
              className={`text-xs uppercase tracking-wide font-medium mb-2 ${themeStyles.getSidebarLabelStyles()}`}
            >
              Current Mode
            </div>
            <div
              className={`text-sm font-medium ${themeStyles.getSidebarTextStyles()}`}
            >
              {isOnboardingScenario ? 'Onboarding Flow' : 'Seller Dashboard'}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
