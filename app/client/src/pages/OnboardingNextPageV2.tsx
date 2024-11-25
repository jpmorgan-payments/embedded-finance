import {
  EBComponentsProvider,
  OnboardingWizardBasic,
} from '@jpmorgan-payments/embedded-finance-components';
import { Badge, Select, Text } from '@mantine/core';
import { Prism } from '@mantine/prism';
import { ComponentSamplePanel, PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { onboardingScenarios } from 'data/onboardingScenarios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemes } from '../hooks/useThemes';

// Define or import the mapToEBTheme function
const mapToEBTheme = (theme: any) => {
  // Add your mapping logic here
  return { variables: theme };
};

export const OnboardingNextPageV2 = () => {
  const [params, setParams] = useSearchParams();
  const scenarioId = params.get('scenario');
  const scenario = onboardingScenarios.find((s) => s.id === scenarioId);

  const { themes } = useThemes();
  const theme = params.get('theme');
  const selectedTheme = themes?.find((t) => t.id === theme);

  console.log('selectedTheme', selectedTheme);

  const isFullScreen = params.get('fullScreen') === 'true';

  useEffect(() => {
    if (!onboardingScenarios.find((s) => s.id === scenarioId)) {
      setParams({ scenario: onboardingScenarios[0].id }, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (themes?.length > 0 && !themes.find((s) => s.id === theme)) {
      setParams({ theme: themes[0].id }, { replace: true });
    }
  }, []);

  function handleScenarioIdChange(id: string): void {
    setParams({ scenario: id });
  }

  function handleThemeChange(id: string): void {
    setParams({ theme: id });
  }

  const code = `
<EBComponentsProvider
  apiBaseUrl="${scenario?.baseURL ?? ''}"
  headers={{
    api_gateway_client_id: "${scenario?.gatewayID ?? ''}",
    Accept: 'application/json',
  }}
>
  <OnboardingWizardBasic
    title="Onboarding Wizard"
    clientId="${scenario?.clientId}"
    availableProducts={[${scenario?.availableProducts.map((product) => `"${product}"`).join(', ')}]}
    availableJurisdictions={[${scenario?.availableJurisdictions.map((jurisdiction) => `"${jurisdiction}"`).join(',')}]}
  />
</EBComponentsProvider>
`;

  const renderOnboardingWizard = () => (
    <EBComponentsProvider
      key={scenario?.clientId}
      apiBaseUrl={scenario?.baseURL ?? ''}
      headers={{
        api_gateway_client_id: scenario?.gatewayID ?? '',
        Accept: 'application/json',
      }}
      theme={mapToEBTheme(selectedTheme)}
    >
      <OnboardingWizardBasic
        key={
          (scenario?.clientId ?? '') +
          (scenario?.baseURL ?? '') +
          (scenario?.gatewayID ?? '')
        }
        // @ts-ignore
        availableProducts={scenario?.availableProducts}
        // @ts-ignore
        availableJurisdictions={scenario?.availableJurisdictions}
        title={`Onboarding Wizard`}
        clientId={scenario?.clientId}
        onPostClientResponse={(response, error) => {
          console.log('@@clientId POST', response, error);
        }}
        onPostClientVerificationsResponse={(response, error) => {
          console.log('@@clientId GET', response, error);
        }}
      />
    </EBComponentsProvider>
  );

  if (isFullScreen) {
    return renderOnboardingWizard();
  }

  return (
    <PageWrapper
      title="[Embedded Payments] Onboarding"
      apiEndpoint="@jpmorgan-payments/embedded-finance-components "
      githubLink={`${GITHUB_REPO}/tree/main/embedded-components`}
    >
      <div>
        <Text>
          Use the <Badge color="dark">POST /clients</Badge> call to begin the
          enrollment of a new Client to Embedded Finance.
        </Text>
        <Text>
          Once the request has been successfully made, it initiates the J.P.
          Morgan onboarding process, including the
          <b> Customer Identification Program (CIP)</b>. Standard background
          checks are run on your client and their related parties while the
          Embedded Finance profile and account is made ready.
        </Text>
      </div>

      <Select
        name="scenario"
        label="Demo Scenarios"
        placeholder="Select a scenario"
        onChange={handleScenarioIdChange}
        value={scenarioId}
        data={onboardingScenarios.map((s) => ({
          label: s.name,
          value: s.id,
        }))}
        styles={(theme) => ({
          root: {
            marginBottom: theme.spacing.md,
          },
        })}
      />

      {themes?.length > 0 && (
        <Select
          name="theme"
          label="Select Theme"
          value={selectedTheme?.id}
          onChange={handleThemeChange}
          data={themes.map((t) => ({ value: t.id, label: t.name }))}
        />
      )}

      {renderOnboardingWizard()}

      <Prism colorScheme="dark" language="javascript">
        {code}
      </Prism>
    </PageWrapper>
  );
};
