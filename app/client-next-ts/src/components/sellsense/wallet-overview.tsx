'use client';

import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  EBComponentsProvider,
  LinkedAccountWidget,
  MakePayment,
  Recipients,
  TransactionsDisplay,
  // MakePayment, // Commented out due to infinite loop issues
} from '@jpmorgan-payments/embedded-finance-components';
import { Maximize2, Info, Grid3X3, Square } from 'lucide-react';
import { useThemeStyles } from './theme-utils';
import { useSellSenseThemes } from './use-sellsense-themes';

interface WalletOverviewProps {
  clientScenario?: any;
  theme?: any;
}

interface EmbeddedComponentCardProps {
  title: string;
  description: string;
  componentName: string;
  componentDescription: string;
  componentFeatures: string[];
  children: React.ReactNode;
}

function EmbeddedComponentCard({
  componentName,
  componentDescription,
  componentFeatures,
  children,
}: EmbeddedComponentCardProps) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const searchParams = useSearch({ from: '/sellsense-demo' });

  const handleFullScreen = (componentName: string) => {
    const currentTheme = searchParams.theme || 'SellSense';
    const fullscreenUrl =
      window.location.href.replace(window.location.search, '') +
      '?fullscreen=true&component=' +
      componentName +
      '&theme=' +
      currentTheme;

    window.open(fullscreenUrl, '_blank');
  };

  return (
    <>
      <div className="p-6 rounded-lg border bg-white border-gray-300">
        {/* Component Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            {/* Package Tag */}
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1.5 text-xs rounded-md border bg-gray-100 text-gray-700 border-gray-300">
                @jpmorgan-payments/embedded-finance-components@^0.7.6
              </div>
            </div>
          </div>

          {/* Component Control Icons */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowTechDetails(true)}
              className="p-2 rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="Component Details"
            >
              <Info size={18} />
            </button>
            <button
              onClick={() => {
                const componentMap: Record<string, string> = {
                  LinkedAccountWidget: 'linked-accounts',
                  Recipients: 'recipients',
                  TransactionsDisplay: 'transactions',
                  MakePayment: 'make-payment',
                };
                handleFullScreen(
                  componentMap[componentName] || componentName.toLowerCase(),
                );
              }}
              className="p-2 rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="Open in Full Screen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Component Content */}
        <div className="border rounded-lg p-4 bg-white">{children}</div>
      </div>

      {/* Tech Details Dialog */}
      {showTechDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4 rounded-lg border p-6 bg-white text-gray-900 border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {componentName} Component Details
              </h3>
              <button
                onClick={() => setShowTechDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Component Information</h4>
                <div className="text-sm space-y-1">
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
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm">{componentDescription}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Key Features</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {componentFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function WalletOverview(props: WalletOverviewProps = {}) {
  const [layout, setLayout] = useState<'grid' | 'full-width'>('full-width');
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

  const components = [
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
      component: <MakePayment />,
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
      component: <TransactionsDisplay accountId="0030000131" />,
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
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
            : 'space-y-6'
        }
      >
        {components.map((component, index) => (
          <EmbeddedComponentCard
            key={index}
            title={component.title}
            description={component.description}
            componentName={component.componentName}
            componentDescription={component.componentDescription}
            componentFeatures={component.componentFeatures}
          >
            <EBComponentsProvider
              apiBaseUrl="/ef/do/v1/"
              theme={themeObject}
              headers={headers}
              contentTokens={contentTokens}
            >
              {component.component}
            </EBComponentsProvider>
          </EmbeddedComponentCard>
        ))}
      </div>
    </div>
  );
}
