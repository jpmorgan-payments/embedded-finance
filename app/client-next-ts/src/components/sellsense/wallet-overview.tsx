'use client';

import { useState, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  Accounts,
  EBComponentsProvider,
  LinkedAccountWidget,
  MakePayment,
  Recipients,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';
import { Grid3X3, Square, Columns } from 'lucide-react';
import { useThemeStyles } from './theme-utils';
import { useSellSenseThemes } from './use-sellsense-themes';
import {
  getScenarioDisplayNames,
  getVisibleComponentsForScenario,
  getHeaderTitleForScenario,
  getHeaderDescriptionForScenario,
  getGridDimensions,
  AVAILABLE_COMPONENTS,
  type ComponentName,
  type ComponentConfig,
} from './scenarios-config';
import { EmbeddedComponentCard, createFullscreenUrl } from './shared';
import { AutomationTrigger } from './automation';

interface WalletOverviewProps {
  clientScenario?: any;
  theme?: any;
}

interface ComponentInfo {
  title: string;
  description: string;
  componentName: string;
  componentDescription: string;
  componentFeatures: string[];
  component: React.ReactNode;
  contentTokens?: {
    name?: 'enUS';
    tokens?: Record<string, any>;
  };
}

export function WalletOverview(props: WalletOverviewProps = {}) {
  const [layout, setLayout] = useState<'grid' | 'full-width' | 'columns'>(
    'columns',
  );
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const searchParams = useSearch({ from: '/sellsense-demo' });

  // Get all parameters from URL to ensure components respond to all changes
  const currentTheme = searchParams.theme || 'SellSense';
  const currentTone = searchParams.contentTone || 'Standard';
  const scenarioDisplayNames = getScenarioDisplayNames();
  const currentScenario =
    searchParams.scenario ||
    (scenarioDisplayNames.length > 0
      ? scenarioDisplayNames[0]
      : 'Active Seller with Direct Payouts');

  // Get visible components with positions for the current scenario
  const visibleComponents =
    getVisibleComponentsForScenario(currentScenario) || [];

  // Get grid dimensions for the current scenario
  const { maxRows, maxColumns } = getGridDimensions(currentScenario);

  // Get theme-aware styles
  const themeStyles = useThemeStyles(currentTheme as any);
  const { mapThemeOption } = useSellSenseThemes();

  // Create theme object using the proper theme system
  const themeObject = mapThemeOption(currentTheme as any);

  // Refs for component refetch functions
  const accountsRef = useRef<{ refresh: () => void } | null>(null);
  const transactionsRef = useRef<{ refresh: () => void } | null>(null);

  // Create base content tokens that respond to tone changes
  const baseContentTokens = {
    name: 'enUS' as const,
    tokens: {} as Record<string, any>,
  };

  // Create headers that might include scenario-specific information
  const headers = {
    'Content-Type': 'application/json',
    'X-Scenario': currentScenario,
    'X-Theme': currentTheme,
    'X-Tone': currentTone,
  };

  const handleTooltipToggle = (componentName: string, isOpen: boolean) => {
    setOpenTooltip(isOpen ? componentName : null);
  };

  // Handle transaction settlement - refetch accounts and transactions
  const handleTransactionSettled = () => {
    // Add a small delay to ensure the transaction is processed
    setTimeout(() => {
      console.log('Transaction settled - refetching accounts and transactions');
      accountsRef.current?.refresh();
      transactionsRef.current?.refresh();
    }, 1000);
  };

  // All available components with their configurations and custom content tokens
  const allComponents: Record<ComponentName, ComponentInfo> = {
    [AVAILABLE_COMPONENTS.MAKE_PAYMENT]: {
      title: 'Make Payment',
      description: 'Send payments to recipients using your linked accounts.',
      componentName: 'MakePayment',
      componentDescription:
        'A comprehensive widget for making payments to recipients.',
      componentFeatures: [
        'Select recipient from your list',
        'Choose payment amount and account',
        'Review and confirm payment details',
      ],
      component: (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Make Payment</h2>
          <MakePayment onTransactionSettled={handleTransactionSettled} />
        </div>
      ),
    },
    [AVAILABLE_COMPONENTS.ACCOUNTS]: {
      title: 'Accounts',
      description:
        'View your account details, balances, and routing information.',
      componentName: 'Accounts',
      componentDescription:
        'A comprehensive widget for displaying account information and balances.',
      componentFeatures: [
        'Display account categories and states',
        'Show masked account and routing information',
        'Display available and booked balances with descriptions',
        'Filter accounts by category type',
      ],
      component: (
        <Accounts
          allowedCategories={['LIMITED_DDA_PAYMENTS', 'LIMITED_DDA']}
          clientId="0030000131"
          ref={(ref) => {
            if (ref) {
              accountsRef.current = ref;
            }
          }}
        />
      ),
    },
    [AVAILABLE_COMPONENTS.LINKED_ACCOUNTS]: {
      title: 'Linked Bank Account',
      description:
        'Connect and manage your external bank accounts for payments.',
      componentName: 'LinkedAccountWidget',
      componentDescription:
        'A comprehensive widget for linking and managing external bank accounts.',
      componentFeatures: [
        'Link external bank accounts',
        'Verify accounts with microdeposits',
        'Manage linked account status',
        'Secure account verification process',
      ],
      component: (
        <LinkedAccountWidget
          makePaymentComponent={
            <MakePayment onTransactionSettled={handleTransactionSettled} />
          }
          variant="singleAccount"
        />
      ),
      contentTokens: {
        name: 'enUS',
        tokens: {
          'make-payment': {
            buttons: {
              makePayment: 'PAY NOW!!!',
            },
          },
        },
      },
    },
    [AVAILABLE_COMPONENTS.TRANSACTIONS]: {
      title: 'Transaction History',
      description: 'View and manage your payment transaction history.',
      componentName: 'TransactionsDisplay',
      componentDescription:
        'A comprehensive widget for displaying transaction history and details.',
      componentFeatures: [
        'View transaction history with pagination',
        'Filter transactions by status and type',
        'Display transaction details and status',
        'Real-time transaction updates',
      ],
      component: (
        <TransactionsDisplay
          accountId="0030000131"
          ref={(ref) => {
            if (ref) {
              transactionsRef.current = ref;
            }
          }}
        />
      ),
    },
    [AVAILABLE_COMPONENTS.RECIPIENTS]: {
      title: 'Recipients',
      description: 'Manage your payment recipients and their information.',
      componentName: 'Recipients',
      componentDescription:
        'A comprehensive widget for managing payment recipients.',
      componentFeatures: [
        'Add and manage payment recipients',
        'View recipient details and status',
        'Edit recipient information',
        'Delete recipients when needed',
      ],
      component: (
        <Recipients
          makePaymentComponent={
            <MakePayment
              onTransactionSettled={handleTransactionSettled}
              triggerButtonVariant="secondary"
            />
          }
        />
      ),
    },
    [AVAILABLE_COMPONENTS.ONBOARDING_FLOW]: {
      title: 'Onboarding Flow',
      description:
        'Complete your business onboarding and verification process.',
      componentName: 'OnboardingFlow',
      componentDescription:
        'A comprehensive widget for business onboarding and verification.',
      componentFeatures: [
        'Complete business profile setup',
        'Identity verification process',
        'Document upload and review',
        'Real-time status updates',
      ],
      component: (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Onboarding Flow</h2>
          <div className="text-gray-500 text-center py-8">
            <p>OnboardingFlow component would be rendered here</p>
            <p className="text-sm mt-2">
              This component is available but not yet implemented in this demo
            </p>
          </div>
        </div>
      ),
    },
  };

  // Create a map of component configs with their info
  const componentConfigsWithInfo = visibleComponents.map(
    (config: ComponentConfig) => ({
      ...config,
      ...allComponents[config.component],
    }),
  );

  // Get header content from scenario configuration
  const headerTitle = getHeaderTitleForScenario(currentScenario);
  const headerDescription = getHeaderDescriptionForScenario(currentScenario);

  // Helper function to render a component with its own provider
  const renderComponentWithProvider = (componentConfig: any, key: string) => {
    const { component, contentTokens: componentContentTokens = {} } =
      componentConfig;

    // Merge component-specific content tokens with base tokens
    const mergedContentTokens = {
      ...baseContentTokens,
      ...componentContentTokens,
      tokens: {
        ...baseContentTokens.tokens,
        ...componentContentTokens.tokens,
      },
    };

    return (
      <div key={key}>
        <EBComponentsProvider
          apiBaseUrl="/ef/do/v1/"
          theme={themeObject}
          headers={headers}
          contentTokens={mergedContentTokens}
        >
          <EmbeddedComponentCard
            component={component}
            componentName={componentConfig.componentName}
            componentDescription={componentConfig.componentDescription}
            componentFeatures={componentConfig.componentFeatures}
            isAnyTooltipOpen={openTooltip !== null}
            onTooltipToggle={handleTooltipToggle}
            onFullScreen={() => {
              const fullscreenUrl = createFullscreenUrl(
                componentConfig.componentName,
                currentTheme,
              );
              window.open(fullscreenUrl, '_blank');
            }}
          />
        </EBComponentsProvider>
      </div>
    );
  };

  // Helper function to render components in grid layout
  const renderGridLayout = () => {
    // Create a 2D grid array based on maxRows and maxColumns
    const grid: ((typeof componentConfigsWithInfo)[0] | null)[][] = Array(
      maxRows,
    )
      .fill(null)
      .map(() => Array(maxColumns).fill(null));

    // Place components in their positions
    componentConfigsWithInfo.forEach((componentConfig) => {
      const { x, y } = componentConfig.position;
      if (x < maxRows && y < maxColumns) {
        grid[x][y] = componentConfig;
      }
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {grid.map((row, rowIndex) =>
          row.map((componentConfig, colIndex) => {
            if (!componentConfig) return null;

            return renderComponentWithProvider(
              componentConfig,
              `grid-${rowIndex}-${colIndex}`,
            );
          }),
        )}
      </div>
    );
  };

  // Helper function to render components in column layout
  const renderColumnLayout = () => {
    // Sort components by position (x first, then y)
    const sortedComponents = [...componentConfigsWithInfo].sort((a, b) => {
      if (a.position.x !== b.position.x) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {sortedComponents
            .filter((_, index) => index % 2 === 0)
            .map((componentConfig, index) =>
              renderComponentWithProvider(componentConfig, `left-${index}`),
            )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {sortedComponents
            .filter((_, index) => index % 2 === 1)
            .map((componentConfig, index) =>
              renderComponentWithProvider(componentConfig, `right-${index}`),
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className={`text-2xl font-bold mb-2 ${themeStyles.getHeaderTextStyles()}`}
        >
          {headerTitle}
        </h1>
        <p className={themeStyles.getHeaderLabelStyles()}>
          {headerDescription}
        </p>

        {/* Layout Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${themeStyles.getHeaderLabelStyles()}`}>
              Layout:
            </span>
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'grid')}`}
              title="Grid Layout"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setLayout('columns')}
              className={`p-2 rounded transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'columns')}`}
              title="Columns Layout"
            >
              <Columns size={16} />
            </button>
            <button
              onClick={() => setLayout('full-width')}
              className={`p-2 rounded transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'full-width')}`}
              title="Full Width Layout"
            >
              <Square size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Components Grid */}
      {layout === 'grid' ? (
        renderGridLayout()
      ) : layout === 'columns' ? (
        renderColumnLayout()
      ) : (
        // Full-width layout
        <div className="space-y-6">
          {componentConfigsWithInfo.map((componentConfig, index) =>
            renderComponentWithProvider(componentConfig, `full-width-${index}`),
          )}
        </div>
      )}

      {componentConfigsWithInfo.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No components available for the current scenario. This may be due to
            a database reset.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Simple Automation Trigger */}
      <AutomationTrigger currentScenario={currentScenario} />
    </div>
  );
}
