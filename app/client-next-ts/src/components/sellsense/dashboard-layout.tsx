'use client';

import { useState, useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { SettingsDrawer } from './settings-drawer';
import { DashboardOverview } from './dashboard-overview';
import { KycOnboarding } from './kyc-onboarding';
import { WalletOverview } from './wallet-overview';
import { TransactionHistory } from './transaction-history';
import { LinkedAccounts } from './linked-accounts';
import { PayoutSettings } from './payout-settings';
import type { ThemeOption } from './use-sellsense-themes';

export type ClientScenario =
  | 'New Seller - Onboarding'
  | 'Onboarding - Docs Needed'
  | 'Onboarding - In Review'
  | 'Active Seller - Fresh Start'
  | 'Active Seller - Established';

export type ContentTone = 'Standard' | 'Friendly';
export type View =
  | 'onboarding'
  | 'overview'
  | 'wallet'
  | 'transactions'
  | 'linked-accounts'
  | 'payout'
  | 'catalog'
  | 'pricing'
  | 'orders'
  | 'payments'
  | 'performance'
  | 'analytics'
  | 'growth';

export function DashboardLayout() {
  // Use TanStack Router's search param APIs
  const searchParams = useSearch({ from: '/sellsense-demo' });
  const navigate = useNavigate({ from: '/sellsense-demo' });

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Settings drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize state from search params with defaults
  const [clientScenario, setClientScenario] = useState<ClientScenario>(
    searchParams.scenario || 'New Seller - Onboarding',
  );
  const [theme, setTheme] = useState<ThemeOption>(
    searchParams.theme || 'SellSense',
  );
  const [contentTone, setContentTone] = useState<ContentTone>(
    searchParams.contentTone || 'Standard',
  );
  const [activeView, setActiveView] = useState<View>(
    searchParams.view ||
      getInitialView(searchParams.scenario || 'New Seller - Onboarding'),
  );

  // Sync state with search params on change
  useEffect(() => {
    if (searchParams.scenario && searchParams.scenario !== clientScenario) {
      setClientScenario(searchParams.scenario);
      setActiveView(searchParams.view || getInitialView(searchParams.scenario));
    }
    if (searchParams.theme && searchParams.theme !== theme) {
      setTheme(searchParams.theme);
    }
    if (searchParams.contentTone && searchParams.contentTone !== contentTone) {
      setContentTone(searchParams.contentTone);
    }
    if (searchParams.view && searchParams.view !== activeView) {
      setActiveView(searchParams.view);
    }
  }, [searchParams]);

  // Helper function to update search params
  const updateSearchParams = (updates: Record<string, any>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  function getInitialView(scenario: ClientScenario): View {
    switch (scenario) {
      case 'New Seller - Onboarding':
      case 'Onboarding - Docs Needed':
      case 'Onboarding - In Review':
        return 'onboarding';
      default:
        return 'overview';
    }
  }

  const handleScenarioChange = (scenario: ClientScenario) => {
    const newView = getInitialView(scenario);
    setClientScenario(scenario);
    setActiveView(newView);

    updateSearchParams({
      scenario,
      view: newView,
    });
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    updateSearchParams({ theme: newTheme });
  };

  const handleContentToneChange = (newContentTone: ContentTone) => {
    setContentTone(newContentTone);
    updateSearchParams({ contentTone: newContentTone });
  };

  const handleViewChange = (newView: View) => {
    setActiveView(newView);
    setIsMobileMenuOpen(false); // Close mobile menu when changing views
    updateSearchParams({ view: newView });
  };

  const isOnboardingScenario = [
    'New Seller - Onboarding',
    'Onboarding - Docs Needed',
    'Onboarding - In Review',
  ].includes(clientScenario);

  const renderMainContent = () => {
    if (isOnboardingScenario && activeView === 'onboarding') {
      return <KycOnboarding clientScenario={clientScenario} theme={theme} />;
    }

    switch (activeView) {
      case 'overview':
        return (
          <DashboardOverview
            clientScenario={clientScenario}
            theme={theme}
            contentTone={contentTone}
            onViewChange={handleViewChange}
          />
        );
      case 'wallet':
        return <WalletOverview />;
      case 'transactions':
        return <TransactionHistory />;
      case 'linked-accounts':
        return <LinkedAccounts clientScenario={clientScenario} theme={theme} />;
      case 'payout':
        return <PayoutSettings />;
      default:
        return (
          <DashboardOverview
            clientScenario={clientScenario}
            theme={theme}
            contentTone={contentTone}
            onViewChange={handleViewChange}
          />
        );
    }
  };

  const renderFullscreenComponent = () => {
    switch (searchParams.component) {
      case 'onboarding':
        return <KycOnboarding clientScenario={clientScenario} theme={theme} />;
      case 'linked-accounts':
        return <LinkedAccounts clientScenario={clientScenario} theme={theme} />;
      default:
        return (
          <div className="flex items-center justify-center h-screen text-gray-500">
            Component not found
          </div>
        );
    }
  };

  // Fullscreen mode - render only the component
  if (searchParams.fullscreen) {
    return (
      <div className="h-screen bg-sellsense-background-light overflow-hidden">
        {renderFullscreenComponent()}
      </div>
    );
  }

  // Normal dashboard layout - responsive design
  return (
    <div className="h-screen bg-sellsense-background-light overflow-hidden">
      <Header
        clientScenario={clientScenario}
        setClientScenario={handleScenarioChange}
        theme={theme}
        setTheme={handleThemeChange}
        contentTone={contentTone}
        setContentTone={handleContentToneChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      {/* Mobile-first responsive layout */}
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Sidebar - responsive implementation */}
        <Sidebar
          clientScenario={clientScenario}
          activeView={activeView}
          onViewChange={handleViewChange}
          theme={theme}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main content area - responsive */}
        <main className="flex-1 overflow-auto w-full min-w-0">
          {/* Add padding for mobile to account for fixed bottom navigation */}
          <div className="pb-16 md:pb-0">{renderMainContent()}</div>
        </main>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clientScenario={clientScenario}
        setClientScenario={handleScenarioChange}
        theme={theme}
        setTheme={handleThemeChange}
        contentTone={contentTone}
        setContentTone={handleContentToneChange}
      />
    </div>
  );
}
