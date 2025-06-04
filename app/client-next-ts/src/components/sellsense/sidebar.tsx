'use client';

import type { ClientScenario, View } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';

interface SidebarProps {
  clientScenario: ClientScenario;
  activeView: View;
  onViewChange: (view: View) => void;
  theme: ThemeOption;
}

const onboardingMenu = [{ key: 'onboarding' as View, label: 'Onboarding' }];

const fullSidebarMenu = [
  { key: 'overview' as View, label: 'Home' },
  { key: 'wallet' as View, label: 'Wallet' },
  { key: 'transactions' as View, label: 'Transactions' },
  { key: 'linked-accounts' as View, label: 'Linked Bank Accounts' },
  { key: 'payout' as View, label: 'Payout Settings' },
  { key: 'catalog' as View, label: 'Catalog' },
  { key: 'pricing' as View, label: 'Pricing' },
  { key: 'orders' as View, label: 'Orders' },
  { key: 'payments' as View, label: 'Payments' },
  { key: 'performance' as View, label: 'Performance' },
  { key: 'analytics' as View, label: 'Analytics' },
  { key: 'growth' as View, label: 'Growth Tools' },
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
      className={`w-full text-left px-4 py-2.5 transition-colors ${themeStyles.getSidebarButtonStyles(selected)}`}
    >
      {label}
    </button>
  );
}

export function Sidebar({
  clientScenario,
  activeView,
  onViewChange,
  theme,
}: SidebarProps) {
  const themeStyles = useThemeStyles(theme);

  // Determine if this is an onboarding scenario
  const isOnboardingScenario = [
    'New Seller - Onboarding',
    'Onboarding - Docs Needed',
    'Onboarding - In Review',
  ].includes(clientScenario);

  // Choose appropriate menu based on scenario
  const menuItems = isOnboardingScenario ? onboardingMenu : fullSidebarMenu;

  return (
    <div
      className={`w-60 border-r h-full flex flex-col ${themeStyles.getSidebarStyles()}`}
    >
      <nav className="flex-1 pt-4">
        {/* Scenario-specific Menu */}
        <div className="space-y-0">
          {menuItems.map((item) => (
            <SidebarButton
              key={item.key}
              label={item.label}
              selected={activeView === item.key}
              onClick={() => onViewChange(item.key)}
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
  );
}
