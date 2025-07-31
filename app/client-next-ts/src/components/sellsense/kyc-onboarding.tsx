'use client';

import { useState } from 'react';
import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';
import { useSearch } from '@tanstack/react-router';
import type { ClientScenario } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useSellSenseThemes } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';
import {
  getClientIdFromScenario,
  getScenarioData,
} from './sellsense-scenarios';
import {
  isOnboardingDocsNeededScenario,
  getHeaderTitleForScenario,
  getHeaderDescriptionForScenario,
} from './scenarios-config';
import { EmbeddedComponentCard, createFullscreenUrl } from './shared';

interface KycOnboardingProps {
  clientScenario: ClientScenario;
  theme?: ThemeOption;
}

export function KycOnboarding({
  clientScenario,
  theme = 'SellSense',
}: KycOnboardingProps) {
  const { mapThemeOption } = useSellSenseThemes();
  const themeStyles = useThemeStyles(theme);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // Use TanStack Router's search and navigation APIs
  const searchParams = useSearch({ from: '/sellsense-demo' });

  const clientId = getClientIdFromScenario(clientScenario);
  const scenarioData = getScenarioData(clientScenario);
  const ebTheme = mapThemeOption(theme);

  const handleFullScreen = () => {
    const fullscreenUrl = createFullscreenUrl(
      'OnboardingFlow',
      searchParams.theme || theme,
      {
        scenario: searchParams.scenario || clientScenario,
        contentTone: searchParams.contentTone || 'Standard',
      },
    );
    window.open(fullscreenUrl, '_blank');
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

  const handleTooltipToggle = (componentName: string, isOpen: boolean) => {
    setOpenTooltip(isOpen ? componentName : null);
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
        onPostClientSettled={handlePostClientResponse}
        onPostPartySettled={handlePostPartyResponse}
        onPostClientVerificationsSettled={handlePostClientVerificationsResponse}
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
        userEventsToTrack={['click', 'submit', 'navigation']}
        userEventsHandler={handleUserEvents}
        docUploadOnlyMode={isOnboardingDocsNeededScenario(clientScenario)}
        hideLinkAccountSection
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
    <div className="p-6 space-y-6">
      <div>
        <h1
          className={`text-2xl font-bold mb-2 ${themeStyles.getHeaderTextStyles()}`}
        >
          {getHeaderTitleForScenario(clientScenario)}
        </h1>
        <p className={themeStyles.getHeaderLabelStyles()}>
          {getHeaderDescriptionForScenario(clientScenario)}
        </p>
      </div>

      <EmbeddedComponentCard
        component={renderOnboardingComponent()}
        componentName="OnboardingFlow"
        componentDescription="A comprehensive onboarding flow component that guides users through the complete client onboarding process for embedded finance solutions. Supports multiple organization types, jurisdictions, and customizable theming."
        componentFeatures={[
          'Multi-step onboarding wizard',
          'Support for various organization types',
          'Document upload and verification',
          'Real-time validation and error handling',
          'Customizable themes and content',
          'Event tracking and analytics',
        ]}
        isAnyTooltipOpen={openTooltip !== null}
        onTooltipToggle={handleTooltipToggle}
        onFullScreen={handleFullScreen}
      />
    </div>
  );
}
