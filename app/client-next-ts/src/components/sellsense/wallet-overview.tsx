'use client';

import { useEffect, useState } from 'react';
import {
  Accounts,
  ClientDetails,
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
import { Columns, Grid3X3, Square } from 'lucide-react';

import { useSearch } from '@tanstack/react-router';

import { DatabaseResetUtils } from '@/lib/database-reset-utils';

import { Button } from '../ui/button';
import { AutomationTrigger } from './automation';
import {
  AVAILABLE_COMPONENTS,
  getClientIdForScenario,
  getGridDimensions,
  getHeaderDescriptionForScenario,
  getHeaderTitleForScenario,
  getScenarioDisplayNames,
  getScenarioNumber,
  getVisibleComponentsForScenario,
  type ComponentConfig,
  type ComponentName,
} from './scenarios-config';
import { createFullscreenUrl, EmbeddedComponentCard } from './shared';
import { useThemeStyles } from './theme-utils';
import { useSellSenseThemes } from './use-sellsense-themes';
import type { ThemeOption } from './use-sellsense-themes';

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

interface WalletOverviewProps {
  theme?: ThemeOption;
  customThemeVariables?: EBThemeVariables;
  contentTokens?: EBConfig['contentTokens'];
}

const DEFAULT_FULL_WIDTH_COMPONENTS = [
  'TransactionsDisplay',
  'Recipients',
  'ClientDetails',
];

export function WalletOverview({
  theme,
  customThemeVariables = {},
  contentTokens,
}: WalletOverviewProps) {
  const [layout, setLayout] = useState<'grid' | 'full-width' | 'columns'>(
    'columns'
  );
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  // State for RecipientsWidget mode/viewMode
  const [recipientsMode, setRecipientsMode] = useState<'list' | 'single'>(
    'list'
  );
  const [recipientsViewMode, setRecipientsViewMode] = useState<
    'cards' | 'compact-cards' | 'table'
  >('table');
  // State for LinkedAccountWidget mode/viewMode
  const [linkedAccountMode, setLinkedAccountMode] = useState<'list' | 'single'>(
    'single'
  );
  const [linkedAccountViewMode, setLinkedAccountViewMode] = useState<
    'cards' | 'compact-cards' | 'table'
  >('compact-cards');
  const searchParams = useSearch({ from: '/sellsense-demo' });

  // Get all parameters from URL to ensure components respond to all changes
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

  // Apply scenario default viewModes on scenario change (user can still toggle via card tooltip)
  useEffect(() => {
    const components = getVisibleComponentsForScenario(currentScenario) || [];
    components.forEach((c: ComponentConfig) => {
      if (c.component === AVAILABLE_COMPONENTS.LINKED_ACCOUNTS && c.viewMode)
        setLinkedAccountViewMode(c.viewMode);
      if (c.component === AVAILABLE_COMPONENTS.RECIPIENTS && c.viewMode)
        setRecipientsViewMode(c.viewMode);
    });
  }, [currentScenario]);

  // Get clientId for the current scenario (if defined)
  const scenarioClientId = getClientIdForScenario(currentScenario);

  // Get grid dimensions for the current scenario
  const { maxRows, maxColumns } = getGridDimensions(currentScenario);

  // Use theme from props or fallback to URL search params
  const currentTheme = theme || searchParams.theme || 'SellSense';

  // Get theme-aware styles
  const themeStyles = useThemeStyles(currentTheme as ThemeOption);
  const { mapThemeOption } = useSellSenseThemes();

  // Create theme object using the proper theme system with custom variables
  const themeObject = mapThemeOption(
    currentTheme as ThemeOption,
    customThemeVariables
  );

  // Create base content tokens that respond to tone changes
  // Merge with contentTokens from props if provided
  const baseContentTokens = contentTokens || {
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

  // Handle transaction settlement - trigger component refetch
  const handleTransactionSettled = () => {
    // Add a small delay to ensure the transaction is processed
    setTimeout(() => {
      console.log('Transaction settled - triggering component refetch');
      DatabaseResetUtils.emulateTabSwitch();
    }, 1000);
  };

  // Handle linked account settlement - trigger component refetch
  const handleLinkedAccountSettled = (recipient?: unknown, error?: unknown) => {
    // Add a small delay to ensure the linked account is processed
    setTimeout(() => {
      console.log('Linked account settled - triggering component refetch', {
        recipient,
        error,
      });
      DatabaseResetUtils.emulateTabSwitch();
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
        <div className={`rounded-lg border p-6 ${themeStyles.getCardStyles()}`}>
          <h2
            className={`mb-4 text-xl font-semibold ${themeStyles.getHeaderTextStyles()}`}
          >
            Make Payment
          </h2>
          <PaymentFlow
            onTransactionComplete={handleTransactionSettled}
            trigger={<Button>Make Payment</Button>}
          />
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
          clientId={scenarioClientId || '0030000131'}
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
      component: null, // Will be rendered dynamically with state
      contentTokens: {
        name: 'enUS',
        tokens: {
          'make-payment': {
            buttons: {
              makePayment: 'PAY OUT',
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
      component: <TransactionsDisplay accountIds={['0030000131']} />,
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
      component: null, // Will be rendered dynamically with state
      contentTokens: {
        name: 'enUS',
        tokens: {
          'make-payment': {
            buttons: {
              makePayment: 'Send Money',
            },
          },
        },
      },
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
        <div className={`rounded-lg border p-6 ${themeStyles.getCardStyles()}`}>
          <h2
            className={`mb-4 text-xl font-semibold ${themeStyles.getHeaderTextStyles()}`}
          >
            Onboarding Flow
          </h2>
          <div
            className={`py-8 text-center ${themeStyles.getHeaderLabelStyles()}`}
          >
            <p>OnboardingFlow component would be rendered here</p>
            <p className="mt-2 text-sm">
              This component is available but not yet implemented in this demo
            </p>
          </div>
        </div>
      ),
    },
    [AVAILABLE_COMPONENTS.CLIENT_DETAILS]: {
      title: 'Client Details',
      description: 'View your client details and information.',
      componentName: 'ClientDetails',
      componentDescription:
        'A comprehensive widget for displaying client details and information.',
      componentFeatures: ['View client details and information'],
      component: scenarioClientId ? (
        <ClientDetails clientId={scenarioClientId} />
      ) : (
        <div className={`rounded-lg border p-6 ${themeStyles.getCardStyles()}`}>
          <h2
            className={`mb-4 text-xl font-semibold ${themeStyles.getHeaderTextStyles()}`}
          >
            Client Details
          </h2>
          <div className={`py-4 text-sm ${themeStyles.getHeaderLabelStyles()}`}>
            Client details are not available for this scenario.
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
    })
  );

  // Get header content from scenario configuration
  const headerTitle = getHeaderTitleForScenario(currentScenario);
  const headerDescription = getHeaderDescriptionForScenario(currentScenario);

  // Helper function to render a component with its own provider
  const renderComponentWithProvider = (
    componentConfig: any,
    key: string,
    isFullWidth = false
  ) => {
    const { component, contentTokens: componentContentTokens = {} } =
      componentConfig;

    // Render dynamic components with state
    let renderedComponent = component;
    if (componentConfig.componentName === 'LinkedAccountWidget') {
      renderedComponent = (
        <LinkedAccountWidget
          onAccountLinked={handleLinkedAccountSettled}
          mode={linkedAccountMode}
          viewMode={linkedAccountViewMode}
          onPaymentComplete={handleTransactionSettled}
        />
      );
    } else if (componentConfig.componentName === 'Recipients') {
      renderedComponent = (
        <RecipientsWidget
          onRecipientAdded={handleLinkedAccountSettled}
          mode={recipientsMode}
          viewMode={recipientsViewMode}
          onPaymentComplete={handleTransactionSettled}
        />
      );
    }

    // Merge component-specific content tokens with base tokens
    const mergedContentTokens = {
      ...baseContentTokens,
      ...componentContentTokens,
      tokens: {
        ...baseContentTokens.tokens,
        ...componentContentTokens.tokens,
      },
    };

    const isWidgetWithToggles =
      componentConfig.componentName === 'LinkedAccountWidget' ||
      componentConfig.componentName === 'Recipients';

    // Get current mode/viewMode based on component
    const currentMode =
      componentConfig.componentName === 'LinkedAccountWidget'
        ? linkedAccountMode
        : componentConfig.componentName === 'Recipients'
          ? recipientsMode
          : undefined;
    const currentViewMode =
      componentConfig.componentName === 'LinkedAccountWidget'
        ? linkedAccountViewMode
        : componentConfig.componentName === 'Recipients'
          ? recipientsViewMode
          : undefined;

    // Get change handlers based on component
    const handleModeChange =
      componentConfig.componentName === 'LinkedAccountWidget'
        ? setLinkedAccountMode
        : componentConfig.componentName === 'Recipients'
          ? setRecipientsMode
          : undefined;
    const handleViewModeChange =
      componentConfig.componentName === 'LinkedAccountWidget'
        ? setLinkedAccountViewMode
        : componentConfig.componentName === 'Recipients'
          ? setRecipientsViewMode
          : undefined;

    return (
      <div key={key} className={isFullWidth ? 'lg:col-span-2' : undefined}>
        <EBComponentsProvider
          apiBaseUrl="/ef/do/v1/"
          theme={themeObject}
          headers={headers}
          contentTokens={mergedContentTokens}
        >
          <EmbeddedComponentCard
            component={renderedComponent}
            componentName={componentConfig.componentName}
            componentDescription={componentConfig.componentDescription}
            componentFeatures={componentConfig.componentFeatures}
            isAnyTooltipOpen={openTooltip !== null}
            onTooltipToggle={handleTooltipToggle}
            onFullScreen={() => {
              const fullscreenUrl = createFullscreenUrl(
                componentConfig.componentName,
                currentTheme
              );
              window.open(fullscreenUrl, '_blank');
            }}
            supportsModeToggle={isWidgetWithToggles}
            supportsViewModeToggle={isWidgetWithToggles}
            currentMode={currentMode}
            currentViewMode={currentViewMode}
            onModeChange={handleModeChange}
            onViewModeChange={handleViewModeChange}
          />
        </EBComponentsProvider>
      </div>
    );
  };

  const isFullWidthComponent = (
    componentName: string,
    componentConfig?: { fullWidth?: boolean }
  ) =>
    componentConfig?.fullWidth ??
    DEFAULT_FULL_WIDTH_COMPONENTS.includes(componentName);

  // Helper function to render components in grid layout
  const renderGridLayout = () => {
    // Create a 2D grid array based on maxRows and maxColumns
    const grid: ((typeof componentConfigsWithInfo)[0] | null)[][] = Array(
      maxRows
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

    const flattenedComponents = grid.flat().filter(Boolean) as Array<
      (typeof componentConfigsWithInfo)[0]
    >;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {flattenedComponents.map((componentConfig, index) =>
          renderComponentWithProvider(
            componentConfig,
            `grid-${index}`,
            isFullWidthComponent(componentConfig.componentName, componentConfig)
          )
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sortedComponents.map((componentConfig, index) =>
          renderComponentWithProvider(
            componentConfig,
            `columns-${index}`,
            isFullWidthComponent(componentConfig.componentName, componentConfig)
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1
          className={`mb-2 text-2xl font-bold ${themeStyles.getHeaderTextStyles()}`}
        >
          {headerTitle}
          <span className="ml-2 text-sm font-normal opacity-60">
            (Scenario #{getScenarioNumber(currentScenario)})
          </span>
        </h1>
        <p className={themeStyles.getHeaderLabelStyles()}>
          {headerDescription}
        </p>

        {/* Layout Controls */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${themeStyles.getHeaderLabelStyles()}`}>
              Layout:
            </span>
            <button
              onClick={() => setLayout('grid')}
              className={`rounded p-2 transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'grid')}`}
              title="Grid Layout"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setLayout('columns')}
              className={`rounded p-2 transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'columns')}`}
              title="Columns Layout"
            >
              <Columns size={16} />
            </button>
            <button
              onClick={() => setLayout('full-width')}
              className={`rounded p-2 transition-colors ${themeStyles.getLayoutButtonStyles(layout === 'full-width')}`}
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
            renderComponentWithProvider(componentConfig, `full-width-${index}`)
          )}
        </div>
      )}

      {componentConfigsWithInfo.length === 0 && (
        <div className="py-8 text-center">
          <p className={themeStyles.getHeaderLabelStyles()}>
            No components available for the current scenario. This may be due to
            a database reset.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 rounded px-4 py-2 transition-colors ${themeStyles.getLayoutButtonStyles(true)}`}
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
