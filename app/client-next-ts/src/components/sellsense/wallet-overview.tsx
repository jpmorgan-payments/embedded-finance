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
  AVAILABLE_COMPONENTS,
  type ComponentName,
} from './scenarios-config';
import { EmbeddedComponentCard, createFullscreenUrl } from './shared';

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

  // Get visible components for the current scenario
  const visibleComponents =
    getVisibleComponentsForScenario(currentScenario) || [];

  // Get theme-aware styles
  const themeStyles = useThemeStyles(currentTheme as any);
  const { mapThemeOption } = useSellSenseThemes();

  // Create theme object using the proper theme system
  const themeObject = mapThemeOption(currentTheme as any);

  // Refs for component refetch functions
  const accountsRef = useRef<{ refresh: () => void } | null>(null);
  const transactionsRef = useRef<{ refresh: () => void } | null>(null);

  // Create content tokens that respond to tone changes
  const contentTokens = {
    name: 'enUS' as const,
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

  // All available components with their configurations
  const allComponents: Record<ComponentName, ComponentInfo> = {
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
        <MakePayment onTransactionSettled={handleTransactionSettled} />
      ),
    },
    [AVAILABLE_COMPONENTS.LINKED_ACCOUNTS]: {
      title: 'Linked Bank Accounts',
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
          makePaymentComponent={<MakePayment />}
          variant="singleAccount"
        />
      ),
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
      component: <Recipients makePaymentComponent={<MakePayment />} />,
    },
  };

  // Filter components based on scenario configuration with safety checks
  const components = (visibleComponents || [])
    .map((componentName) => allComponents[componentName])
    .filter(Boolean);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className={`text-2xl font-bold mb-2 ${themeStyles.getHeaderTextStyles()}`}
        >
          Wallet Management
        </h1>
        <p className={themeStyles.getHeaderLabelStyles()}>
          Manage your embedded finance wallet, linked accounts, and
          transactions.
          {(visibleComponents || []).includes(
            AVAILABLE_COMPONENTS.RECIPIENTS,
          ) && (
            <span className="ml-1 text-green-600 font-medium">
              Recipients management available
            </span>
          )}
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
      <EBComponentsProvider
        apiBaseUrl="/ef/do/v1/"
        theme={themeObject}
        headers={headers}
        contentTokens={contentTokens}
      >
        <div
          className={
            layout === 'grid'
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
              : layout === 'columns'
                ? 'columns-1 lg:columns-2 gap-6 space-y-6'
                : 'space-y-6'
          }
        >
          {(components || []).map((componentInfo, index) => (
            <div
              key={index}
              className={layout === 'columns' ? 'break-inside-avoid mb-6' : ''}
            >
              <EmbeddedComponentCard
                component={componentInfo.component}
                componentName={componentInfo.componentName}
                componentDescription={componentInfo.componentDescription}
                componentFeatures={componentInfo.componentFeatures}
                isAnyTooltipOpen={openTooltip !== null}
                onTooltipToggle={handleTooltipToggle}
                onFullScreen={() => {
                  const fullscreenUrl = createFullscreenUrl(
                    componentInfo.componentName,
                    currentTheme,
                  );
                  window.open(fullscreenUrl, '_blank');
                }}
              />
            </div>
          ))}
          {(components || []).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No components available for the current scenario. This may be
                due to a database reset.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      </EBComponentsProvider>
    </div>
  );
}
