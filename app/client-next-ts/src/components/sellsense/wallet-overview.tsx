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
import { Maximize2, Info, Grid3X3, Square, Columns } from 'lucide-react';
import { useThemeStyles } from './theme-utils';
import { useSellSenseThemes } from './use-sellsense-themes';

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

interface ComponentTooltipProps {
  componentName: string;
  componentDescription: string;
  componentFeatures: string[];
  onClose: () => void;
  onFullScreen: () => void;
}

function ComponentTooltip({
  componentName,
  componentDescription,
  componentFeatures,
  onClose,
  onFullScreen,
}: ComponentTooltipProps) {
  return (
    <div className="absolute top-6 right-0 w-96 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-lg z-50">
      <div className="space-y-4">
        {/* Header with close button */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">
            {componentName} Component Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Component Information */}
        <div>
          <h4 className="font-medium mb-2 text-gray-200">
            Component Information
          </h4>
          <div className="space-y-1 text-gray-300">
            <p>
              <strong>Package:</strong>{' '}
              @jpmorgan-payments/embedded-finance-components
            </p>
            <p>
              <strong>Version:</strong> ^0.7.6
            </p>
            <p>
              <strong>Component:</strong> {componentName}
            </p>
            <p>
              <strong>Type:</strong> React Component
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium mb-2 text-gray-200">Description</h4>
          <p className="text-gray-300">{componentDescription}</p>
        </div>

        {/* Key Features */}
        <div>
          <h4 className="font-medium mb-2 text-gray-200">Key Features</h4>
          <ul className="space-y-1 text-gray-300">
            {componentFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={onFullScreen}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            <Maximize2 size={12} />
            Open Full Screen
          </button>
        </div>
      </div>

      {/* Tooltip Arrow */}
      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
    </div>
  );
}

interface InfoIconProps {
  onClick: () => void;
  title: string;
}

function InfoIcon({ onClick, title }: InfoIconProps) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full bg-white/80 hover:bg-amber-200 flex items-center justify-center transition-colors"
      title={title}
    >
      <Info size={12} className="text-amber-700" />
    </button>
  );
}

interface EmbeddedComponentCardProps {
  componentInfo: ComponentInfo;
  isAnyTooltipOpen: boolean;
  onTooltipToggle: (componentName: string, isOpen: boolean) => void;
}

function EmbeddedComponentCard({
  componentInfo,
  isAnyTooltipOpen,
  onTooltipToggle,
}: EmbeddedComponentCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const searchParams = useSearch({ from: '/sellsense-demo' });

  const handleFullScreen = () => {
    const currentTheme = searchParams.theme || 'SellSense';
    const componentMap: Record<string, string> = {
      Accounts: 'accounts',
      LinkedAccountWidget: 'linked-accounts',
      Recipients: 'recipients',
      TransactionsDisplay: 'transactions',
      MakePayment: 'make-payment',
    };

    const fullscreenUrl =
      window.location.href.replace(window.location.search, '') +
      '?fullscreen=true&component=' +
      (componentMap[componentInfo.componentName] ||
        componentInfo.componentName.toLowerCase()) +
      '&theme=' +
      currentTheme;

    window.open(fullscreenUrl, '_blank');
    setShowTooltip(false);
    onTooltipToggle(componentInfo.componentName, false);
  };

  const handleTooltipToggle = () => {
    const newState = !showTooltip;
    setShowTooltip(newState);
    onTooltipToggle(componentInfo.componentName, newState);
  };

  const shouldShowIcon = !isAnyTooltipOpen || showTooltip;

  return (
    <div
      className={`rounded-lg border border-gray-300 bg-transparent relative ${
        showTooltip ? 'p-6' : 'p-0'
      }`}
    >
      {/* Info Icon Overlay */}
      {shouldShowIcon && (
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <InfoIcon onClick={handleTooltipToggle} title="Component Details" />

            {showTooltip && (
              <ComponentTooltip
                componentName={componentInfo.componentName}
                componentDescription={componentInfo.componentDescription}
                componentFeatures={componentInfo.componentFeatures}
                onClose={handleTooltipToggle}
                onFullScreen={handleFullScreen}
              />
            )}
          </div>
        </div>
      )}

      {/* Component Content */}
      {componentInfo.component}
    </div>
  );
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
  const currentScenario = searchParams.scenario || 'New Seller - Onboarding';

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

  const components: ComponentInfo[] = [
    {
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
          allowedCategories={['LIMITED_DDA_PAYMENTS']}
          clientId="0030000131"
          ref={(ref) => {
            if (ref) {
              accountsRef.current = ref;
            }
          }}
        />
      ),
    },

    {
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
    {
      title: 'Linked Bank Accounts',
      description: 'Manage your linked bank accounts for payments and payouts.',
      componentName: 'LinkedAccountWidget',
      componentDescription:
        'A comprehensive widget for managing linked bank accounts.',
      componentFeatures: [
        'Display linked bank accounts with status badges',
        'Link new bank accounts via secure form',
        'Microdeposit verification workflow',
      ],
      component: <LinkedAccountWidget />,
    },
    {
      title: 'Recipients',
      description: 'Manage your payment recipients and their information.',
      componentName: 'Recipients',
      componentDescription: 'A widget for managing payment recipients.',
      componentFeatures: [
        'Display list of recipients',
        'Add new recipients',
        'Edit recipient information',
      ],
      component: <Recipients />,
    },
    {
      title: 'Transaction History',
      description: 'View and manage your transaction history and payments.',
      componentName: 'TransactionsDisplay',
      componentDescription:
        'A comprehensive widget for displaying transaction history.',
      componentFeatures: [
        'Display transaction history with pagination',
        'Filter transactions by date and type',
        'View transaction details and status',
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
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className={`text-2xl font-bold mb-2 ${themeStyles.getHeaderTextStyles()}`}
        >
          Wallet Management
        </h1>
        <p className={themeStyles.getHeaderLabelStyles()}>
          Manage your embedded finance wallet, recipients, linked accounts, and
          transactions.
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
          {components.map((componentInfo, index) => (
            <div
              key={index}
              className={layout === 'columns' ? 'break-inside-avoid mb-6' : ''}
            >
              <EmbeddedComponentCard
                componentInfo={componentInfo}
                isAnyTooltipOpen={openTooltip !== null}
                onTooltipToggle={handleTooltipToggle}
              />
            </div>
          ))}
        </div>
      </EBComponentsProvider>
    </div>
  );
}
