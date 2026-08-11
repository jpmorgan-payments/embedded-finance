'use client';

import { useState, type ReactNode } from 'react';
import {
  BarChart3,
  ClipboardList,
  Home,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  UserRoundCheck,
  Wallet,
} from 'lucide-react';

import type { ClientScenario, View } from './dashboard-layout';
import {
  getOnboardingScenarios,
  getScenarioKeyByDisplayName,
} from './scenarios-config';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

interface SidebarProps {
  clientScenario: ClientScenario;
  activeView: View;
  onViewChange: (view: View) => void;
  theme: ThemeOption;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const VIEW_ICONS: Partial<Record<View, ReactNode>> = {
  overview: <Home className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
  catalog: <Package className="h-4 w-4" />,
  orders: <ClipboardList className="h-4 w-4" />,
  performance: <BarChart3 className="h-4 w-4" />,
  onboarding: <UserRoundCheck className="h-4 w-4" />,
};

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
  icon: ReactNode;
  selected: boolean;
  collapsed: boolean;
  onClick: () => void;
  theme: ThemeOption;
}

function SidebarButton({
  label,
  icon,
  selected,
  collapsed,
  onClick,
  theme,
}: SidebarButtonProps) {
  const themeStyles = useThemeStyles(theme);

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={`flex w-full items-center transition-colors duration-200 ${
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left'
      } ${themeStyles.getSidebarButtonStyles(selected)}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
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
  /** Collapsed by default to give the demo content more horizontal space. */
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Determine if this is an onboarding scenario using centralized config
  const scenarioKey = getScenarioKeyByDisplayName(clientScenario);
  const isOnboardingScenario = scenarioKey
    ? getOnboardingScenarios().some((s) => s.key === scenarioKey)
    : // Fallback when display name is not in scenarios-config (keep in sync with onboarding display names)
      [
        'New Seller - Onboarding',
        'Onboarding - Docs Needed',
        'Onboarding - Seller with prefilled data',
        'Onboarding - Seller with prefilled data (Delta)',
        'Onboarding - Link account in review',
      ].includes(clientScenario);

  // Choose appropriate menu based on scenario
  const menuItems = isOnboardingScenario ? onboardingMenu : fullSidebarMenu;
  const modeLabel = isOnboardingScenario
    ? 'Onboarding Flow'
    : 'Seller Dashboard';

  const handleViewChange = (view: View) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Close mobile menu when changing views
  };

  const renderNav = (collapsed: boolean) => (
    <>
      <div className="space-y-0">
        {menuItems.map((item) => (
          <SidebarButton
            key={item.key}
            label={item.label}
            icon={VIEW_ICONS[item.key] ?? <Home className="h-4 w-4" />}
            selected={activeView === item.key}
            collapsed={collapsed}
            onClick={() => handleViewChange(item.key)}
            theme={theme}
          />
        ))}
      </div>

      {!collapsed && (
        <div className="mt-8 px-4">
          <div
            className={`mb-2 text-xs font-medium uppercase tracking-wide ${themeStyles.getSidebarLabelStyles()}`}
          >
            Current Mode
          </div>
          <div
            className={`text-sm font-medium ${themeStyles.getSidebarTextStyles()}`}
          >
            {modeLabel}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar — collapsed by default */}
      <div
        className={`hidden h-full flex-shrink-0 border-r transition-[width] duration-200 ease-in-out lg:flex lg:flex-col ${
          isCollapsed ? 'w-14' : 'w-60'
        } ${themeStyles.getSidebarStyles()}`}
      >
        <div
          className={`flex items-center border-b border-black/5 px-2 py-2 ${
            isCollapsed ? 'justify-center' : 'justify-end'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={`rounded-md p-1.5 transition-colors ${themeStyles.getSidebarButtonStyles(false)}`}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={
              isCollapsed ? 'Expand navigation' : 'Collapse navigation'
            }
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto pt-2"
          aria-label="Demo navigation"
        >
          {renderNav(isCollapsed)}
        </nav>
        {isCollapsed && (
          <div
            className={`border-t border-black/5 px-1 py-2 text-center text-[9px] font-medium uppercase leading-tight tracking-wide ${themeStyles.getSidebarLabelStyles()}`}
            title={modeLabel}
          >
            {isOnboardingScenario ? 'Onb.' : 'Seller'}
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 ${themeStyles.getSidebarStyles()}`}
        style={{ top: '4rem' }} // Start below the header
      >
        <nav className="h-full overflow-y-auto pb-20 pt-4">
          {renderNav(false)}
        </nav>
      </div>
    </>
  );
}
