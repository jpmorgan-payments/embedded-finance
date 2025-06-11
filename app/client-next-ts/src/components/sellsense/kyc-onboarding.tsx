'use client';

import { useState } from 'react';
import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';
import { Maximize2, Info, X } from 'lucide-react';
import { useSearch } from '@tanstack/react-router';
import type { ClientScenario } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useSellSenseThemes } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';
import {
  getClientIdFromScenario,
  getScenarioData,
} from './sellsense-scenarios';

interface KycOnboardingProps {
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
  const themeStyles = useThemeStyles(theme);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`max-w-2xl w-full mx-4 rounded-lg border p-6 ${themeStyles.getDialogStyles()}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            OnboardingFlow Component Details
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
                <strong>Component:</strong> OnboardingFlow
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
              A comprehensive onboarding flow component that guides users
              through the complete client onboarding process for embedded
              finance solutions. Supports multiple organization types,
              jurisdictions, and customizable theming.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Key Features</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Multi-step onboarding wizard</li>
              <li>Support for various organization types</li>
              <li>Document upload and verification</li>
              <li>Real-time validation and error handling</li>
              <li>Customizable themes and content</li>
              <li>Event tracking and analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Integration</h4>
            <div className="text-sm bg-gray-100 bg-opacity-20 p-3 rounded font-mono">
              {`import { OnboardingFlow } from '@jpmorgan-payments/embedded-finance-components';`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KycOnboarding({
  clientScenario,
  theme = 'SellSense',
}: KycOnboardingProps) {
  const { mapThemeOption } = useSellSenseThemes();
  const themeStyles = useThemeStyles(theme);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Use TanStack Router's search and navigation APIs
  const searchParams = useSearch({ from: '/sellsense-demo' });

  const clientId = getClientIdFromScenario(clientScenario);
  const scenarioData = getScenarioData(clientScenario);
  const ebTheme = mapThemeOption(theme);

  const handleFullScreen = () => {
    // Open in new window
    window.open(
      window.location.href.replace(window.location.search, '') +
        '?fullscreen=true&component=onboarding&' +
        new URLSearchParams({
          scenario: searchParams.scenario || clientScenario,
          theme: searchParams.theme || theme,
          contentTone: searchParams.contentTone || 'Standard',
        }).toString(),
      '_blank',
    );
  };

  const handlePostClientResponse = (response?: any, error?: any) => {
    if (error) {
      console.error('Client creation error:', error);
    } else if (response) {
      console.log('Client created successfully:', response.id);
    }
  };

  const handlePostPartyResponse = (response?: any, error?: any) => {
    if (error) {
      console.error('Party creation error:', error);
    } else if (response) {
      console.log('Party created successfully:', response.id);
    }
  };

  const handlePostClientVerificationsResponse = (
    response?: any,
    error?: any,
  ) => {
    if (error) {
      console.error('Client verification error:', error);
    } else if (response) {
      console.log('Client verification successful:', response);
    }
  };

  const handleUserEvents = ({ actionName }: { actionName: string }) => {
    console.log(
      `SellSense User action: ${actionName} (Scenario: ${scenarioData.scenarioId})`,
    );
    // Here you could integrate with analytics services
  };

  // Render the core component
  const renderOnboardingComponent = () => (
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
      <OnboardingFlow
        initialClientId={clientId}
        onPostClientResponse={handlePostClientResponse}
        onPostPartyResponse={handlePostPartyResponse}
        onPostClientVerificationsResponse={
          handlePostClientVerificationsResponse
        }
        availableProducts={['EMBEDDED_PAYMENTS']}
        availableJurisdictions={['US']}
        availableOrganizationTypes={[
          'SOLE_PROPRIETORSHIP',
          'LIMITED_LIABILITY_COMPANY',
          'LIMITED_LIABILITY_PARTNERSHIP',
          'GENERAL_PARTNERSHIP',
          'LIMITED_PARTNERSHIP',
          'C_CORPORATION',
        ]}
        alertOnExit={true}
        userEventsToTrack={['click', 'submit', 'navigation']}
        userEventsHandler={handleUserEvents}
      />
    </EBComponentsProvider>
  );

  // If fullscreen, render only the component without any wrapper
  if (searchParams.fullscreen) {
    return (
      <div className="min-h-screen overflow-y-auto">
        {renderOnboardingComponent()}
      </div>
    );
  }

  // Normal mode with card wrapper and controls
  return (
    <>
      <div className={`p-6 ${themeStyles.getContentAreaStyles()}`}>
        <div
          className={`relative min-h-fit border-2 rounded-lg ${themeStyles.getCardStyles()}`}
        >
          {/* Component Control Icons */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              onClick={() => setShowTechDetails(true)}
              className={`p-2 rounded transition-colors ${themeStyles.getIconStyles()}`}
              title="Component Details"
            >
              <Info size={18} />
            </button>
            <button
              onClick={handleFullScreen}
              className={`p-2 rounded transition-colors ${themeStyles.getIconStyles()}`}
              title="Open in Full Screen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Component Content */}
          <div className="w-full">{renderOnboardingComponent()}</div>
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
