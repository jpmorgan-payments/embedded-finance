'use client';

import { useEffect, useState } from 'react';
import {
  Accounts,
  EBComponentsProvider,
  LinkedAccountWidget,
  PaymentFlow,
  RecipientsWidget,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';
import type {
  EBConfig,
  EBThemeVariables,
} from '@jpmorgan-payments/embedded-finance-components';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { usePingService } from '@/hooks/use-ping-service';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';

import { Button } from '../ui/button';
import { ContentTokenEditorDrawer } from './content-token-editor-drawer';
import { DashboardOverview } from './dashboard-overview';
import { Footer } from './footer';
import { Header } from './header';
import { InfoModal } from './info-modal';
import { KycOnboarding } from './kyc-onboarding';
import { LoadingSkeleton } from './loading-skeleton';
import { PayoutSettings } from './payout-settings';
import {
  getResetDbScenario,
  getScenarioByKey,
  getScenarioDisplayNames,
  getScenarioKeyByDisplayName,
  hasResetDbScenario,
} from './scenarios-config';
import { SettingsDrawer } from './settings-drawer';
import { Sidebar } from './sidebar';
import { useThemeStyles } from './theme-utils';
import { TransactionHistory } from './transaction-history';
import { useSellSenseThemes, type ThemeOption } from './use-sellsense-themes';
import { WalletOverview } from './wallet-overview';

// Use display names from centralized scenario configuration
export type ClientScenario = ReturnType<typeof getScenarioDisplayNames>[number];

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

// View utilities
const ViewUtils = {
  // Get initial view based on scenario
  getInitialView: (scenario: ClientScenario): View => {
    const scenarioKey = getScenarioKeyByDisplayName(scenario);
    if (scenarioKey) {
      const config = getScenarioByKey(scenarioKey);
      return config.category === 'onboarding' ? 'onboarding' : 'wallet';
    }

    // Fallback for legacy scenarios
    switch (scenario) {
      case 'New Seller - Onboarding':
      case 'Onboarding - Docs Needed':
      case 'Onboarding - In Review':
        return 'onboarding';
      default:
        return 'wallet';
    }
  },

  // Check if scenario is onboarding type
  isOnboardingScenario: (scenario: ClientScenario): boolean => {
    const scenarioKey = getScenarioKeyByDisplayName(scenario);
    if (scenarioKey) {
      const config = getScenarioByKey(scenarioKey);
      return config.category === 'onboarding';
    }

    // Fallback for legacy scenarios
    return [
      'New Seller - Onboarding',
      'Onboarding - Docs Needed',
      'Onboarding - In Review',
    ].includes(scenario);
  },
};

export function DashboardLayout() {
  // Router hooks
  const searchParams = useSearch({ from: '/sellsense-demo' });
  const navigate = useNavigate({ from: '/sellsense-demo' });

  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isContentTokenEditorOpen, setIsContentTokenEditorOpen] =
    useState(false);
  const [contentTokens, setContentTokens] = useState<EBConfig['contentTokens']>(
    {
      name: 'enUS',
    }
  );
  const [hasProcessedInitialLoad, setHasProcessedInitialLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize customThemeVariables from URL if present
  const getInitialCustomThemeVariables = (): EBThemeVariables => {
    if (searchParams.theme === 'Custom' && searchParams.customTheme) {
      try {
        const parsed = JSON.parse(searchParams.customTheme as string);

        // Check if it's the new structure with baseTheme and variables
        if (parsed.baseTheme && parsed.variables) {
          // New structure - return just the variables for backward compatibility
          return parsed.variables;
        } else {
          // Legacy structure - return the entire object
          return parsed;
        }
      } catch (error) {
        console.error('Failed to parse custom theme from URL:', error);
        return {};
      }
    }
    return {};
  };

  // Store the full custom theme data for the theme drawer
  const getInitialCustomThemeData = (): any => {
    if (searchParams.theme === 'Custom' && searchParams.customTheme) {
      try {
        const parsed = JSON.parse(searchParams.customTheme as string);
        return parsed;
      } catch (error) {
        console.error('Failed to parse custom theme from URL:', error);
        return {};
      }
    }
    return {};
  };

  const [customThemeVariables, setCustomThemeVariables] =
    useState<EBThemeVariables>(getInitialCustomThemeVariables());

  // Store the full custom theme data for the theme drawer
  const [customThemeData, setCustomThemeData] = useState<any>(
    getInitialCustomThemeData()
  );

  // Initialize state from search params with defaults
  const [clientScenario, setClientScenario] = useState<ClientScenario>(
    (searchParams.scenario as ClientScenario) || 'New Seller - Onboarding'
  );
  const [theme, setTheme] = useState<ThemeOption>(
    searchParams.theme || 'SellSense'
  );
  // When theme is Custom, use baseTheme for portal styling (logo, colors) so e.g. Empty stays Empty
  const themeForDisplay: ThemeOption =
    theme === 'Custom' && customThemeData?.baseTheme
      ? customThemeData.baseTheme
      : theme === 'Custom'
        ? 'SellSense'
        : theme;
  const themeStyles = useThemeStyles(themeForDisplay);
  const [contentTone, setContentTone] = useState<ContentTone>(
    searchParams.contentTone || 'Standard'
  );
  const [activeView, setActiveView] = useState<View>(
    searchParams.view ||
      ViewUtils.getInitialView(
        (searchParams.scenario as ClientScenario) || 'New Seller - Onboarding'
      )
  );
  const [showMswAlert, setShowMswAlert] = useState<boolean>(true);
  const pingQuery = usePingService();

  // Event handlers
  const handleScenarioChange = (scenario: ClientScenario) => {
    const newView = ViewUtils.getInitialView(scenario);
    setClientScenario(scenario);
    setActiveView(newView);

    updateSearchParams({
      scenario,
      view: newView,
    });

    // Reset database for the new scenario
    if (hasResetDbScenario(scenario)) {
      const resetScenario = getResetDbScenario(scenario);
      if (resetScenario) {
        DatabaseResetUtils.resetDatabaseForScenario(
          resetScenario,
          setIsLoading
        );
      } else {
        // Just trigger component refetch without database reset
        setTimeout(() => {
          DatabaseResetUtils.emulateTabSwitch();
        }, 300);
      }
    } else {
      // Just trigger component refetch without database reset
      setTimeout(() => {
        DatabaseResetUtils.emulateTabSwitch();
      }, 300);
    }
  };

  const handleThemeChange = (
    newTheme: ThemeOption,
    customVariables?: EBThemeVariables | any
  ) => {
    setTheme(newTheme);

    // Handle CustomThemeData structure
    if (customVariables && typeof customVariables === 'object') {
      if (customVariables.baseTheme && customVariables.variables) {
        // This is a CustomThemeData structure
        setCustomThemeVariables(customVariables.variables);
        setCustomThemeData(customVariables); // Store the full structure
        // Store the base theme information in the URL
        const customThemeData = {
          baseTheme: customVariables.baseTheme,
          variables: customVariables.variables,
        };
        const updates: Record<string, any> = { theme: newTheme };
        updates.customTheme = JSON.stringify(customThemeData);
        updateSearchParams(updates);
        return;
      } else if (Object.keys(customVariables).length > 0) {
        // This is just variables (legacy structure)
        setCustomThemeVariables(customVariables);
        setCustomThemeData({ variables: customVariables }); // Legacy structure
      }
    }

    // Clear custom variables if switching to a predefined theme or no custom variables
    if (!customVariables || Object.keys(customVariables || {}).length === 0) {
      setCustomThemeVariables({});
      setCustomThemeData({});
    }

    // Update URL with theme and custom variables if present
    const updates: Record<string, any> = { theme: newTheme };
    if (customVariables && Object.keys(customVariables).length > 0) {
      updates.customTheme = JSON.stringify(customVariables);
    } else {
      // Remove customTheme from URL if switching to predefined theme or no custom variables
      updates.customTheme = undefined;
    }
    // test

    updateSearchParams(updates);
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

  // Helper function to update search params
  const updateSearchParams = (
    updates: Record<string, any>,
    replace = false
  ) => {
    navigate({
      search: (prev) => {
        const newSearch = { ...prev } as Record<string, any>;

        // Apply updates, removing parameters that are undefined
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined) {
            delete newSearch[key];
          } else {
            newSearch[key] = value;
          }
        });

        return newSearch;
      },
      replace,
    });
  };

  // Show MSW alert if ping fails
  useEffect(() => {
    if (!pingQuery.isSuccess) {
      setShowMswAlert(true);
    }
  }, [pingQuery.isSuccess]);

  // MSW readiness check for fullscreen mode - simple delay approach
  useEffect(() => {
    if (searchParams.fullscreen) {
      setTimeout(() => {
        DatabaseResetUtils.emulateTabSwitch();
      }, 300);
    }
  }, [searchParams.fullscreen]);

  // Effects
  // Handle initial load with URL parameters
  useEffect(() => {
    if (!hasProcessedInitialLoad && searchParams.scenario) {
      const scenarioFromUrl = searchParams.scenario as ClientScenario;
      console.log('Processing initial load with scenario:', scenarioFromUrl);

      // Reset database for the scenario from URL
      DatabaseResetUtils.resetDatabaseForScenario(
        scenarioFromUrl,
        setIsLoading
      );

      // Mark as processed to avoid duplicate resets
      setHasProcessedInitialLoad(true);
    }
  }, [searchParams.scenario, hasProcessedInitialLoad]);

  // Sync state with search params on change
  useEffect(() => {
    if (searchParams.scenario && searchParams.scenario !== clientScenario) {
      setClientScenario(searchParams.scenario as ClientScenario);
      setActiveView(
        searchParams.view ||
          ViewUtils.getInitialView(searchParams.scenario as ClientScenario)
      );
    }
    if (searchParams.theme && searchParams.theme !== theme) {
      setTheme(searchParams.theme);

      // Handle custom theme variables from URL
      if (searchParams.theme === 'Custom' && searchParams.customTheme) {
        try {
          const customTheme = JSON.parse(searchParams.customTheme as string);

          // Check if it's the new structure with baseTheme and variables
          if (customTheme.baseTheme && customTheme.variables) {
            // New structure - extract just the variables
            setCustomThemeVariables(customTheme.variables);
            setCustomThemeData(customTheme); // Store the full structure
          } else {
            // Legacy structure - use the entire object as variables
            setCustomThemeVariables(customTheme);
            setCustomThemeData({ variables: customTheme }); // Legacy structure
          }
        } catch (error) {
          console.error('Failed to parse custom theme from URL:', error);
          setCustomThemeVariables({});
          setCustomThemeData({});
        }
      } else if (searchParams.theme !== 'Custom') {
        setCustomThemeVariables({});
        setCustomThemeData({});
      }
    }
    if (searchParams.contentTone && searchParams.contentTone !== contentTone) {
      setContentTone(searchParams.contentTone);
    }
    if (searchParams.view && searchParams.view !== activeView) {
      setActiveView(searchParams.view);
    }
  }, [searchParams]);

  // Render functions
  const renderMainContent = () => {
    // Show loading skeleton if database reset is in progress
    if (isLoading) {
      return <LoadingSkeleton theme={theme} />;
    }

    if (
      ViewUtils.isOnboardingScenario(clientScenario) &&
      activeView === 'onboarding'
    ) {
      return (
        <KycOnboarding
          clientScenario={clientScenario}
          theme={theme}
          customThemeVariables={customThemeVariables}
          contentTokens={contentTokens}
        />
      );
    }

    switch (activeView) {
      case 'overview':
        return (
          <DashboardOverview
            clientScenario={clientScenario}
            theme={theme}
            customThemeVariables={customThemeVariables}
            contentTone={contentTone}
            onViewChange={handleViewChange}
          />
        );
      case 'wallet':
        return (
          <WalletOverview
            theme={theme}
            customThemeVariables={customThemeVariables}
            contentTokens={contentTokens}
          />
        );
      case 'transactions':
        return <TransactionHistory />;
      case 'payout':
        return <PayoutSettings />;
      case 'payments':
        return <PaymentFlow />;
      default:
        return (
          <DashboardOverview
            clientScenario={clientScenario}
            theme={theme}
            customThemeVariables={customThemeVariables}
            contentTone={contentTone}
            onViewChange={handleViewChange}
          />
        );
    }
  };

  const renderFullscreenComponent = () => {
    // Use theme from URL params for fullscreen mode, fallback to current theme
    const fullscreenTheme = searchParams.theme || theme;

    const { mapThemeOption } = useSellSenseThemes();
    const themeObject = mapThemeOption(fullscreenTheme);

    switch (searchParams.component) {
      case 'onboarding':
        return (
          <KycOnboarding
            clientScenario={clientScenario}
            theme={fullscreenTheme}
          />
        );
      case 'recipients':
        return (
          <div className="h-screen p-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-bold">Recipients</h1>
              <div className="rounded-lg border bg-white p-6">
                <EBComponentsProvider
                  apiBaseUrl="/ef/do/v1/"
                  theme={themeObject}
                  headers={{
                    'Content-Type': 'application/json',
                  }}
                  contentTokens={{
                    name: 'enUS',
                  }}
                >
                  <RecipientsWidget mode="list" viewMode="table" />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="h-screen p-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-bold">Transaction History</h1>
              <div className="rounded-lg border bg-white p-6">
                <EBComponentsProvider
                  apiBaseUrl="/ef/do/v1/"
                  theme={themeObject}
                  headers={{
                    'Content-Type': 'application/json',
                  }}
                  contentTokens={{
                    name: 'enUS',
                  }}
                >
                  <TransactionsDisplay accountIds={['0030000131']} />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'accounts':
        return (
          <div className="h-screen p-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-bold">Accounts</h1>
              <div className="rounded-lg border bg-white p-6">
                <EBComponentsProvider
                  apiBaseUrl="/ef/do/v1/"
                  theme={themeObject}
                  headers={{
                    'Content-Type': 'application/json',
                  }}
                  contentTokens={{
                    name: 'enUS',
                  }}
                >
                  <Accounts
                    allowedCategories={['LIMITED_DDA_PAYMENTS']}
                    clientId="0030000131"
                  />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'make-payment':
        return (
          <div className="h-screen p-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-bold">Make Payment</h1>
              <div className="rounded-lg border bg-white p-6">
                <EBComponentsProvider
                  apiBaseUrl="/ef/do/v1/"
                  theme={themeObject}
                  headers={{
                    'Content-Type': 'application/json',
                  }}
                  contentTokens={{
                    name: 'enUS',
                  }}
                >
                  <PaymentFlow trigger={<Button>Make Payment</Button>} />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'linked-accounts':
        return (
          <div className="h-screen p-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-bold">Linked Accounts</h1>
              <div className="rounded-lg border bg-white p-6">
                <EBComponentsProvider
                  apiBaseUrl="/ef/do/v1/"
                  theme={themeObject}
                  headers={{
                    'Content-Type': 'application/json',
                  }}
                  contentTokens={{
                    name: 'enUS',
                  }}
                >
                  <LinkedAccountWidget
                    mode="list"
                    viewMode="table"
                    hideCreateButton={false}
                  />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex h-screen items-center justify-center text-gray-500">
            Component not found: {searchParams.component}
          </div>
        );
    }
  };

  // Fullscreen mode - render only the component
  if (searchParams.fullscreen) {
    return <div className="h-screen">{renderFullscreenComponent()}</div>;
  }

  // Normal dashboard layout - responsive design
  return (
    <div className="h-screen overflow-hidden bg-sellsense-background-light">
      {/* Global Demo Notice Alert Banner - Above Header */}
      {showMswAlert && (
        <div className="relative z-20 bg-sellsense-background-light">
          <div className="px-4 pb-2 pt-4">
            <div
              className={`mb-3 flex items-start gap-3 rounded-lg p-4 ${themeStyles.getAlertStyles()}`}
            >
              <div className="flex-1">
                <div
                  className={`mb-2 text-base font-semibold ${themeStyles.getAlertTextStyles()}`}
                >
                  🚨 DEMO NOTICE
                </div>
                <div className={`text-sm ${themeStyles.getAlertTextStyles()}`}>
                  This web application is a <strong>demo showcase</strong> for
                  the{' '}
                  <a
                    href="https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline hover:text-amber-800"
                  >
                    J.P.Morgan Payments - Embedded Payments APIs
                  </a>
                  . <strong>This is not a real product</strong>
                </div>
                <div
                  className={`mt-2 text-sm ${themeStyles.getAlertTextStyles()}`}
                >
                  Any data you enter stays within your browser and is handled by
                  our{' '}
                  <a
                    href="https://mswjs.io"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline hover:text-amber-800"
                  >
                    Mock Service Worker
                  </a>
                  . No data is sent to any external services.{' '}
                  {pingQuery.isSuccess
                    ? 'Mock service is currently active. '
                    : 'Service worker may have been terminated by the browser. '}
                  <button
                    onClick={() => window.location.reload()}
                    className="font-medium underline hover:text-amber-800 focus:underline focus:outline-none"
                  >
                    Reload mock data
                  </button>{' '}
                  to reset the demo state.
                </div>
              </div>
              <div className="flex items-start">
                <button
                  onClick={() => setShowMswAlert(false)}
                  className={`rounded-full p-1 text-xl font-bold leading-none text-amber-800 transition-colors hover:bg-amber-100 hover:text-amber-900`}
                  aria-label="Dismiss demo notice"
                  title="Dismiss demo notice"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header
        clientScenario={clientScenario}
        setClientScenario={handleScenarioChange}
        theme={theme}
        themeForDisplay={themeForDisplay}
        setTheme={handleThemeChange}
        contentTone={contentTone}
        setContentTone={handleContentToneChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isInfoModalOpen={isInfoModalOpen}
        setIsInfoModalOpen={setIsInfoModalOpen}
        customThemeData={customThemeData}
        isContentTokenEditorOpen={isContentTokenEditorOpen}
        setIsContentTokenEditorOpen={setIsContentTokenEditorOpen}
      />

      {/* Mobile-first responsive layout */}
      <div
        className={`flex ${showMswAlert ? 'h-[calc(100vh-4rem-9rem)]' : 'h-[calc(100vh-4rem)]'} relative ${themeStyles.getContentAreaStyles()} ${
          isContentTokenEditorOpen ? 'pr-[600px]' : ''
        } transition-all duration-300`}
      >
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
        <main className="w-full min-w-0 flex-1 overflow-auto">
          {/* Add padding for mobile to account for fixed bottom navigation and footer */}
          <div className="pb-32 md:pb-8">
            {renderMainContent()}
            <Footer themeForDisplay={themeForDisplay} />
          </div>
        </main>
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
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

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        theme={theme}
      />

      {/* Content Token Editor Drawer */}
      <ContentTokenEditorDrawer
        isOpen={isContentTokenEditorOpen}
        onClose={() => setIsContentTokenEditorOpen(false)}
        onContentTokensChange={setContentTokens}
      />
    </div>
  );
}
