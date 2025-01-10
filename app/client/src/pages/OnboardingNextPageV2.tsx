import {
  EBComponentsProvider,
  OnboardingWizardBasic,
} from '@jpmorgan-payments/embedded-finance-components';
import {
  Badge,
  Divider,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Text,
} from '@mantine/core';
import { Prism } from '@mantine/prism';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { onboardingScenarios } from 'data/onboardingScenarios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ThemeConfig, useThemes } from '../hooks/useThemes';
import { IconMaximize } from '@tabler/icons-react';

const mapToEBTheme = (theme?: ThemeConfig) => {
  if (!theme) return {};
  return {
    colorScheme: theme?.colorScheme ?? 'light',
    variables: Object.fromEntries(
      Object.entries(theme).filter(
        ([key, value]) =>
          !!value && key !== 'name' && key !== 'id' && key !== 'colorScheme',
      ),
    ),
  };
};

export const OnboardingNextPageV2 = () => {
  const [params, setParams] = useSearchParams();

  const fullScreen = params.get('fullScreen') === 'true';

  const scenarioId = params.get('scenario');
  const scenario = onboardingScenarios.find((s) => s.id === scenarioId);

  const { listThemes } = useThemes();

  const themeId = params.get('theme');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themeId ?? '');

  const [selectedLocale, setSelectedLocale] = useState<'enUS' | 'frCA'>('enUS');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioId || !onboardingScenarios.find((s) => s.id === scenarioId)) {
      setError('Invalid scenario selected');
      setParams({ scenario: onboardingScenarios[0].id }, { replace: true });
    } else {
      setError(null);
    }
  }, [scenarioId]);

  useEffect(() => {
    if (!onboardingScenarios.find((s) => s.id === scenarioId)) {
      if (params.size === 0) {
        setParams({ scenario: onboardingScenarios[0].id }, { replace: true });
      } else {
        const newParams = new URLSearchParams(params);
        newParams.set('scenario', onboardingScenarios[0].id);
        setParams(newParams, { replace: true });
      }
    }
  }, [params]);

  useEffect(() => {
    if (selectedThemeId) {
      const newParams = new URLSearchParams(params);
      newParams.set('theme', selectedThemeId);
      setParams(newParams);
    } else if (params.has('theme')) {
      const newParams = new URLSearchParams(params);
      newParams.delete('theme');
      setParams(newParams);
    }
  }, [selectedThemeId, params]);

  function handleScenarioIdChange(id: string): void {
    setParams({ ...params, scenario: id });
  }

  function handleThemeChange(id: string | null): void {
    setSelectedThemeId(id || '');
  }

  function handleLocaleChange(locale: 'enUS' | 'frCA'): void {
    setSelectedLocale(locale);
  }

  const code = `
<EBComponentsProvider
  apiBaseUrl="${scenario?.baseURL ?? ''}"
  headers={{
    api_gateway_client_id: "${scenario?.gatewayID ?? ''}",
  }}
  theme={${JSON.stringify(mapToEBTheme(listThemes()?.find((t) => t.id === selectedThemeId)), null, 2).replaceAll('\n', '\n  ')}}
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
            zIndex: 10,
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
        key={`provider-${scenario?.clientId}-${selectedThemeId}`}
        apiBaseUrl={scenario?.baseURL ?? ''}
        headers={{
          api_gateway_client_id: scenario?.gatewayID ?? '',
          Accept: 'application/json',
        }}
        theme={mapToEBTheme(
          listThemes()?.find((t) => t.id === selectedThemeId),
        )}
        contentTokens={{
          name: selectedLocale,
        }}
      >
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <OnboardingWizardBasic
            key={`wizard-${scenario?.clientId}`}
            // @ts-ignore
            availableProducts={scenario?.availableProducts ?? []}
            // @ts-ignore
            availableJurisdictions={scenario?.availableJurisdictions ?? []}
            title="Onboarding Wizard"
            initialClientId={scenario?.clientId}
            onPostClientResponse={(response, error) => {
              console.log('@@clientId POST', response, error);
              if (error) setError(error.title);
            }}
            onPostClientVerificationsResponse={(response, error) => {
              console.log('@@clientId GET', response, error);
              if (error) setError(error.title);
            }}
          />
        )}
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

      <Grid>
        <Grid.Col span={6}>
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
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <Select
            name="locale"
            label="Locale"
            placeholder="Select a locale"
            onChange={handleLocaleChange}
            value={selectedLocale}
            data={[
              { label: 'English (US)', value: 'enUS' },
              { label: 'French (Canada)', value: 'frCA' },
            ]}
          />
        </Grid.Col>

        {listThemes()?.length > 0 && (
          <Grid.Col span={3}>
            <Select
              clearable
              name="theme"
              label="Select Theme"
              placeholder="Select a theme"
              value={selectedThemeId}
              onChange={handleThemeChange}
              data={listThemes().map((t) => ({ value: t.id, label: t.name }))}
            />
          </Grid.Col>
        )}
      </Grid>

      <Divider my="sm" />

      {Component}

      <Prism colorScheme="dark" language="javascript">
        {code}
      </Prism>
    </PageWrapper>
  );
};
