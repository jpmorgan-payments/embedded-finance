'use client';

import { useState, useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import {
  Accounts,
  EBComponentsProvider,
  LinkedAccountWidget,
  MakePayment,
  Recipients,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';
import { RefreshCw } from 'lucide-react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import { usePingService } from '@/hooks/use-ping-service';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { SettingsDrawer } from './settings-drawer';
import { InfoModal } from './info-modal';
import { DashboardOverview } from './dashboard-overview';
import { KycOnboarding } from './kyc-onboarding';
import { WalletOverview } from './wallet-overview';
import { TransactionHistory } from './transaction-history';
import { PayoutSettings } from './payout-settings';
import { LoadingSkeleton } from './loading-skeleton';
import type { ThemeOption } from './use-sellsense-themes';
import {
  getScenarioKeyByDisplayName,
  getScenarioByKey,
  getScenarioDisplayNames,
  hasResetDbScenario,
  getResetDbScenario,
} from './scenarios-config';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';
import { useThemeStyles } from './theme-utils';

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
  const [hasProcessedInitialLoad, setHasProcessedInitialLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMswReady, setIsMswReady] = useState(false);

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
    getInitialCustomThemeData(),
  );

  // Initialize state from search params with defaults
  const [clientScenario, setClientScenario] = useState<ClientScenario>(
    (searchParams.scenario as ClientScenario) || 'New Seller - Onboarding',
  );
  const [theme, setTheme] = useState<ThemeOption>(
    searchParams.theme || 'SellSense',
  );
  const themeStyles = useThemeStyles(theme);
  const [contentTone, setContentTone] = useState<ContentTone>(
    searchParams.contentTone || 'Standard',
  );
  const [activeView, setActiveView] = useState<View>(
    searchParams.view ||
      ViewUtils.getInitialView(
        (searchParams.scenario as ClientScenario) || 'New Seller - Onboarding',
      ),
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
          setIsLoading,
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
    customVariables?: EBThemeVariables | any,
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
  const updateSearchParams = (updates: Record<string, any>) => {
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
      replace: true,
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
    if (searchParams.fullscreen && !isMswReady) {
      setTimeout(() => {
        DatabaseResetUtils.emulateTabSwitch();
        setIsMswReady(true);
      }, 1000);
    }
  }, [searchParams.fullscreen, isMswReady]);

  // Effects
  // Handle initial load with URL parameters
  useEffect(() => {
    if (!hasProcessedInitialLoad && searchParams.scenario) {
      const scenarioFromUrl = searchParams.scenario as ClientScenario;
      console.log('Processing initial load with scenario:', scenarioFromUrl);

      // Reset database for the scenario from URL
      DatabaseResetUtils.resetDatabaseForScenario(
        scenarioFromUrl,
        setIsLoading,
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
          ViewUtils.getInitialView(searchParams.scenario as ClientScenario),
      );
    }
    if (searchParams.theme && searchParams.theme !== theme) {
      setTheme(searchParams.theme);

      // Handle custom theme variables from URL
      if (searchParams.theme === 'Custom' && searchParams.customTheme) {
        try {
          const customTheme = JSON.parse(searchParams.customTheme as string);
          setCustomThemeVariables(customTheme);
        } catch (error) {
          console.error('Failed to parse custom theme from URL:', error);
          setCustomThemeVariables({});
        }
      } else if (searchParams.theme !== 'Custom') {
        setCustomThemeVariables({});
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
          />
        );
      case 'transactions':
        return <TransactionHistory />;
      case 'payout':
        return <PayoutSettings />;
      case 'payments':
        return <MakePayment />;
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

    // Create theme object for EBComponentsProvider
    const themeObject = {
      colorScheme: 'light' as const,
      variables: {
        primaryColor: '#6366f1', // Default blue color
        backgroundColor: '#ffffff',
        foregroundColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderRadius: '8px',
      },
    };

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
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Recipients</h1>
              <div className="bg-white rounded-lg border p-6">
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
                  <Recipients />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="h-screen p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
              <div className="bg-white rounded-lg border p-6">
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
                  <TransactionsDisplay accountId="0030000131" />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'accounts':
        return (
          <div className="h-screen p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Accounts</h1>
              <div className="bg-white rounded-lg border p-6">
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
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Make Payment</h1>
              <div className="bg-white rounded-lg border p-6">
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
                  <MakePayment
                    paymentMethods={[
                      {
                        fee: 2.5,
                        id: 'ACH',
                        name: 'ACH',
                      },
                      {
                        fee: 1,
                        id: 'RTP',
                        name: 'RTP',
                      },
                      {
                        fee: 25,
                        id: 'WIRE',
                        name: 'WIRE',
                      },
                    ]}
                  />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      case 'linked-accounts':
        return (
          <div className="h-screen p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Linked Accounts</h1>
              <div className="bg-white rounded-lg border p-6">
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
                    variant="default"
                    showCreateButton={true}
                  />
                </EBComponentsProvider>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-screen text-gray-500">
            Component not found: {searchParams.component}
          </div>
        );
    }
  };

  // Fullscreen mode - render only the component
  if (searchParams.fullscreen) {
    // Show loading skeleton while MSW is initializing
    if (!isMswReady) {
      return (
        <div className="h-screen">
          <LoadingSkeleton theme={theme} />
        </div>
      );
    }

    return <div className="h-screen">{renderFullscreenComponent()}</div>;
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
        isInfoModalOpen={isInfoModalOpen}
        setIsInfoModalOpen={setIsInfoModalOpen}
        customThemeData={customThemeData}
      />

      {/* Mobile-first responsive layout */}
      <div
        className={`flex h-[calc(100vh-4rem)] relative ${themeStyles.getContentAreaStyles()}`}
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
        <main className="flex-1 overflow-auto w-full min-w-0">
          {/* MSW Alert Banner */}
          {showMswAlert && (
            <div className="px-4 pt-4">
              <div
                className={`rounded-lg p-3 mb-3 flex items-center ${themeStyles.getCardStyles()}`}
              >
                <div
                  className={`flex-1 text-sm ${themeStyles.getHeaderTextStyles()}`}
                >
                  <span>
                    API calls are being mocked using{' '}
                    <a
                      href="https://mswjs.io"
                      target="_blank"
                      rel="noreferrer"
                      className={`underline font-medium ${themeStyles.getHeaderTextStyles()}`}
                    >
                      Mock Service Worker
                    </a>
                    .{' '}
                    {pingQuery.isSuccess
                      ? ' Mock service is currently active.'
                      : ' Service worker may have been terminated by the browser. '}
                  </span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                      pingQuery.isSuccess
                        ? themeStyles.getLayoutButtonStyles(true)
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    <RefreshCw className="h-3 w-3" /> Reload Page
                  </button>
                  <button
                    onClick={() => setShowMswAlert(false)}
                    className={themeStyles.getHeaderLabelStyles()}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}
