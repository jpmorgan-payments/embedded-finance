'use client';

import { useState } from 'react';
import {
  EBComponentsProvider,
  LinkedAccountWidget,
} from '@jpmorgan-payments/embedded-finance-components';
import { Maximize2, Info, X } from 'lucide-react';
import { useSearch } from '@tanstack/react-router';
import type { ClientScenario, ThemeOption } from './dashboard-layout';
import { useSellSenseThemes } from './use-sellsense-themes';

interface LinkedAccountsProps {
  clientScenario: ClientScenario;
  theme?: ThemeOption;
}

interface ComponentTechDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
}

function ComponentTechDetailsDialog({
  isOpen,
  onClose,
  theme,
}: ComponentTechDetailsDialogProps) {
  if (!isOpen) return null;

  const getDialogStyles = () => {
    switch (theme) {
      case 'Dark':
        return 'bg-slate-800 text-white border-slate-600';
      case 'Partner A':
        return 'bg-blue-900 text-white border-blue-700';
      case 'S&P Theme':
        return 'bg-gray-50 text-gray-900 border-gray-300';
      default:
        return 'bg-white text-gray-900 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`max-w-2xl w-full mx-4 rounded-lg border p-6 ${getDialogStyles()}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            LinkedAccountWidget Component Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 hover:bg-opacity-10 rounded"
          >
            <X size={20} />
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
                <strong>Component:</strong> LinkedAccountWidget
              </p>
              <p>
                <strong>Version:</strong> ^0.6.12
              </p>
              <p>
                <strong>Type:</strong> React Component
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm">
              A comprehensive widget for managing linked bank accounts. Displays
              existing linked accounts with their status, enables linking new
              accounts, and handles microdeposit verification for account
              validation.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Key Features</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Display linked bank accounts with status badges</li>
              <li>Link new bank accounts via secure form</li>
              <li>Microdeposit verification workflow</li>
              <li>Support for multiple account types (checking, savings)</li>
              <li>Real-time status updates and validation</li>
              <li>Responsive design with intuitive UI</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Status Types</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>ACTIVE:</strong> Account is verified and ready for
                transactions
              </p>
              <p>
                <strong>MICRODEPOSITS_INITIATED:</strong> Verification deposits
                sent
              </p>
              <p>
                <strong>READY_FOR_VALIDATION:</strong> Ready to verify
                microdeposit amounts
              </p>
              <p>
                <strong>REJECTED:</strong> Account verification failed
              </p>
              <p>
                <strong>INACTIVE:</strong> Account is temporarily disabled
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Integration</h4>
            <div className="text-sm bg-gray-100 bg-opacity-20 p-3 rounded font-mono">
              {`import { LinkedAccountWidget } from '@jpmorgan-payments/embedded-finance-components';`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LinkedAccounts({
  clientScenario,
  theme = 'SellSense',
}: LinkedAccountsProps) {
  const { mapThemeOption } = useSellSenseThemes();
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Use TanStack Router's search APIs
  const searchParams = useSearch({ from: '/sellsense-demo' });

  const ebTheme = mapThemeOption(theme);

  const handleFullScreen = () => {
    // Open in new window
    window.open(
      window.location.href.replace(window.location.search, '') +
        '?fullscreen=true&component=linked-accounts&' +
        new URLSearchParams({
          scenario: searchParams.scenario || clientScenario,
          theme: searchParams.theme || theme,
          contentTone: searchParams.contentTone || 'Standard',
        }).toString(),
      '_blank',
    );
  };

  const getCardStyles = () => {
    switch (theme) {
      case 'Dark':
        return 'bg-slate-900 border-slate-700';
      case 'Partner A':
        return 'bg-blue-950 border-blue-800';
      case 'S&P Theme':
        return 'bg-white border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getIconStyles = () => {
    switch (theme) {
      case 'Dark':
        return 'text-gray-300 hover:text-white hover:bg-slate-700';
      case 'Partner A':
        return 'text-blue-200 hover:text-white hover:bg-blue-800';
      case 'S&P Theme':
        return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
      default:
        return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
    }
  };

  // Render the core component
  const renderLinkedAccountsComponent = () => (
    <EBComponentsProvider
      apiBaseUrl="/ef/do/v1/"
      theme={ebTheme}
      headers={{
        'Content-Type': 'application/json',
      }}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Linked Bank Accounts</h2>
          <p className="text-sm text-gray-600">
            Manage your linked bank accounts for payments and payouts. Add new
            accounts or verify existing ones through microdeposit validation.
          </p>
        </div>
        <LinkedAccountWidget />
      </div>
    </EBComponentsProvider>
  );

  // If fullscreen, render only the component without any wrapper
  if (searchParams.fullscreen) {
    return <div className="h-screen">{renderLinkedAccountsComponent()}</div>;
  }

  // Normal mode with card wrapper and controls
  return (
    <>
      <div className="h-full p-6">
        <div
          className={`relative h-full border-2 rounded-lg ${getCardStyles()}`}
        >
          {/* Component Control Icons */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              onClick={() => setShowTechDetails(true)}
              className={`p-2 rounded transition-colors ${getIconStyles()}`}
              title="Component Details"
            >
              <Info size={18} />
            </button>
            <button
              onClick={handleFullScreen}
              className={`p-2 rounded transition-colors ${getIconStyles()}`}
              title="Open in Full Screen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Component Content */}
          <div className="h-full overflow-auto">
            {renderLinkedAccountsComponent()}
          </div>
        </div>
      </div>

      <ComponentTechDetailsDialog
        isOpen={showTechDetails}
        onClose={() => setShowTechDetails(false)}
        theme={theme}
      />
    </>
  );
}
