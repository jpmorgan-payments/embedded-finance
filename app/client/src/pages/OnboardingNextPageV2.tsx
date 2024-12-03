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
import { IconMaximize } from '@tabler/icons-react';
import { set } from 'remeda';

// Define or import the mapToEBTheme function
const mapToEBTheme = (theme: any) => {
  // Add your mapping logic here
  return { variables: theme };
};

export const OnboardingNextPageV2 = () => {
  const [params, setParams] = useSearchParams();

  const fullScreen = params.get('fullScreen') === 'true';

  const scenarioId = params.get('scenario');
  const scenario = onboardingScenarios.find((s) => s.id === scenarioId);

  const { themes } = useThemes();
  const themeId = params.get('theme');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themeId ?? '');

  useEffect(() => {
    if (!onboardingScenarios.find((s) => s.id === scenarioId)) {
      setParams(
        { ...params, scenario: onboardingScenarios[0].id },
        { replace: true },
      );
    }
  }, []);

  useEffect(() => {
    if (selectedThemeId) {
      console.log('@@selectedThemeId', selectedThemeId);
      const newParams = new URLSearchParams(params);
      newParams.set('theme', selectedThemeId);
      setParams(newParams);
    }
  }, [selectedThemeId]);

  function handleScenarioIdChange(id: string): void {
    setParams({ ...params, scenario: id });
  }

  function handleThemeChange(id: string): void {
    setSelectedThemeId(id);
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

  const Component = (
    <div style={{ position: 'relative' }}>
      {!fullScreen && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1000,
            cursor: 'pointer',
          }}
          onClick={() => {
            const newParams = new URLSearchParams(params);
            newParams.set('fullScreen', 'true');
            const newUrl = `${window.location.pathname}?${newParams.toString()}`;
            window.open(newUrl, '_blank');
          }}
        >
          <IconMaximize size={20} />
        </div>
      )}
      <EBComponentsProvider
        key={scenario?.clientId}
        apiBaseUrl={scenario?.baseURL ?? ''}
        headers={{
          api_gateway_client_id: scenario?.gatewayID ?? '',
          Accept: 'application/json',
        }}
        theme={mapToEBTheme(themes?.find((t) => t.id === selectedThemeId))}
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
    </div>
  );

  if (fullScreen) {
    return Component;
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
          placeholder="Select a theme"
          value={selectedThemeId}
          onChange={handleThemeChange}
          data={themes.map((t) => ({ value: t.id, label: t.name }))}
        />
      )}

      {Component}

      <Prism colorScheme="dark" language="javascript">
        {code}
      </Prism>
    </PageWrapper>
  );
};
