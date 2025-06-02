'use client';

import type { ClientScenario, View, ThemeOption } from './dashboard-layout';

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
  const getButtonStyles = () => {
    if (selected) {
      switch (theme) {
        case 'Dark':
          return 'text-blue-400 font-semibold bg-slate-700 border-l-4 border-blue-400';
        case 'Partner A':
          return 'text-blue-200 font-semibold bg-blue-800 border-l-4 border-blue-200';
        case 'S&P Theme':
          return 'text-teal-600 font-semibold bg-teal-50 border-l-4 border-teal-600';
        default:
          return 'text-sellsense-primary font-semibold bg-sellsense-primary-bg border-l-4 border-sellsense-primary';
      }
    } else {
      switch (theme) {
        case 'Dark':
          return 'text-gray-300 font-normal border-l-4 border-transparent hover:bg-slate-700 hover:text-blue-400';
        case 'Partner A':
          return 'text-blue-100 font-normal border-l-4 border-transparent hover:bg-blue-800 hover:text-blue-200';
        case 'S&P Theme':
          return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-teal-50 hover:text-teal-600';
        default:
          return 'text-gray-600 font-normal border-l-4 border-transparent hover:bg-sellsense-primary-bg hover:text-sellsense-primary';
      }
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 transition-colors ${getButtonStyles()}`}
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
  // Determine if this is an onboarding scenario
  const isOnboardingScenario = [
    'New Seller - Onboarding',
    'Onboarding - Docs Needed',
    'Onboarding - In Review',
  ].includes(clientScenario);

  // Choose appropriate menu based on scenario
  const menuItems = isOnboardingScenario ? onboardingMenu : fullSidebarMenu;

  const getSidebarStyles = () => {
    switch (theme) {
      case 'Dark':
        return 'bg-slate-800 border-slate-700';
      case 'Partner A':
        return 'bg-blue-900 border-blue-800';
      case 'S&P Theme':
        return 'bg-gray-50 border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`w-60 border-r h-full flex flex-col ${getSidebarStyles()}`}>
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
            className={`text-xs uppercase tracking-wide font-medium mb-2 ${
              theme === 'Dark'
                ? 'text-gray-400'
                : theme === 'Partner A'
                  ? 'text-blue-300'
                  : theme === 'S&P Theme'
                    ? 'text-gray-500'
                    : 'text-gray-500'
            }`}
          >
            Current Mode
          </div>
          <div
            className={`text-sm font-medium ${
              theme === 'Dark'
                ? 'text-gray-200'
                : theme === 'Partner A'
                  ? 'text-blue-100'
                  : theme === 'S&P Theme'
                    ? 'text-gray-700'
                    : 'text-gray-700'
            }`}
          >
            {isOnboardingScenario ? 'Onboarding Flow' : 'Seller Dashboard'}
          </div>
        </div>
      </nav>
    </div>
  );
}
