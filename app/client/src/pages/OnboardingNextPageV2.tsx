import {
  EBComponentsProvider,
  OnboardingWizardBasic,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';
import {
  Badge,
  Divider,
  Grid,
  Select,
  Text,
  NumberInput,
  Accordion,
  Paper,
  List,
  ThemeIcon,
  Box,
} from '@mantine/core';
import { Prism } from '@mantine/prism';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { onboardingScenarios } from 'data/onboardingScenarios';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ThemeConfig, useThemes } from '../hooks/useThemes';
import {
  IconMaximize,
  IconInfoCircle,
  IconWand,
  IconTestPipe,
} from '@tabler/icons';
import { DevelopmentNotice } from 'components/DevelopmentNotice/DevelopmentNotice';

const mapToEBTheme = (theme?: ThemeConfig) => {
  if (!theme) return {};
  return {
    // colorScheme: theme?.colorScheme ?? 'light',
    variables: Object.fromEntries(
      Object.entries(theme).filter(
        ([key, value]) =>
          !!value && key !== 'name' && key !== 'id' && key !== 'colorScheme',
      ),
    ),
  };
};

// Add URL validation helper
const isValidApiUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    // Only allow specific domains - adjust these based on your requirements
    const allowedDomains = [
      'payments.jpmorgan.com',
      'jpmchase.net',
      'localhost',
    ];

    return allowedDomains.some((domain) => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

// Add header parsing helper
const parseHeadersFromParams = (
  searchParams: URLSearchParams,
): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Get all params that start with 'headers.'
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('headers.')) {
      const headerKey = key.replace('headers.', '');
      headers[headerKey] = value;
    }
  }

  return headers;
};

export const OnboardingNextPageV2 = () => {
  const [params, setParams] = useSearchParams();
  const [validationError, setValidationError] = useState<string | null>(null);

  const apiBaseUrlFromParams = params.get('apiBaseUrl');
  const clientIdFromParams = params.get('clientId');

  const fullScreen = params.get('fullScreen') === 'true';

  const scenarioId = params.get('scenario');
  const scenario = onboardingScenarios.find((s) => s.id === scenarioId);

  const { listThemes } = useThemes();

  const themeId = params.get('theme');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themeId ?? '');

  const [selectedLocale, setSelectedLocale] = useState<'enUS' | 'frCA'>('enUS');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialStepId = params.get('initialStep');
  const [initialStep, setInitialStep] = useState<number>(
    initialStepId ? parseInt(initialStepId) : 1,
  );

  const sanitizedApiBaseUrl = useMemo(() => {
    if (!apiBaseUrlFromParams) return scenario?.baseURL ?? '';

    if (!isValidApiUrl(apiBaseUrlFromParams)) {
      setValidationError('Invalid API URL provided');
      return scenario?.baseURL ?? '';
    }

    setValidationError(null);

    return apiBaseUrlFromParams;
  }, [apiBaseUrlFromParams, scenario?.baseURL]);

  // Get headers from URL params
  const urlHeaders = useMemo(() => parseHeadersFromParams(params), [params]);

  const [packageVersion, setPackageVersion] = useState<string>('');

  useEffect(() => {
    import('../../package.json').then((pkg) => {
      setPackageVersion(
        pkg.dependencies[
          '@jpmorgan-payments/embedded-finance-components'
        ].replace('^', ''),
      );
    });
  }, []);

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

  function handleStepChange(value: number) {
    setInitialStep(value || 0);
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
    initialClientId="${scenario?.clientId}"
    availableProducts={[${scenario?.availableProducts.map((product) => `"${product}"`).join(', ')}]}
    availableJurisdictions={[${scenario?.availableJurisdictions.map((jurisdiction) => `"${jurisdiction}"`).join(',')}]}
  />
</EBComponentsProvider>
`;
  const theme = mapToEBTheme(
    listThemes()?.find((t) => t.id === selectedThemeId),
  );

  const Component = (
    <div
      style={{
        position: 'relative',
        backgroundColor: theme.variables?.backgroundColor ?? 'white',
      }}
    >
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

      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: 4,
          right: 35,
          zIndex: 10,
          cursor: 'pointer',
        })}
      >
        <Badge size="sm" variant="light">
          v{packageVersion}
        </Badge>
      </Box>
      <EBComponentsProvider
        key={`provider-${scenario?.clientId}-${selectedThemeId}-${initialStep}`}
        apiBaseUrl={sanitizedApiBaseUrl}
        headers={{
          // Merge default headers with URL headers
          Accept: 'application/json',
          api_gateway_client_id: scenario?.gatewayID ?? '',
          ...urlHeaders,
        }}
        theme={theme}
        contentTokens={{
          name: selectedLocale,
        }}
      >
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : scenario?.component === 'OnboardingOverviewFlow' ? (
          <OnboardingFlow
            key={`wizard-${scenario?.clientId}`}
            // @ts-ignore
            availableProducts={scenario?.availableProducts ?? []}
            // @ts-ignore
            availableJurisdictions={scenario?.availableJurisdictions ?? []}
            // @ts-ignore
            availableOrganizationTypes={
              scenario?.availableOrganizationTypes ?? [
                'SOLE_PROPRIETORSHIP',
                'LIMITED_LIABILITY_COMPANY',
              ]
            }
            title="Onboarding Wizard"
            initialClientId={clientIdFromParams ?? scenario?.clientId}
            onPostClientResponse={(response, error) => {
              console.log('@@clientId POST', response, error);
              if (error) setError(error.title);
            }}
            onPostClientVerificationsResponse={(response, error) => {
              console.log('@@clientId GET', response, error);
              if (error) setError(error.title);
            }}
            height="100vh"
            {...(scenario?.docUploadOnlyMode
              ? {
                  docUploadOnlyMode: true,
                }
              : {})}
          />
        ) : (
          <OnboardingWizardBasic
            key={`wizard-${scenario?.clientId}`}
            // @ts-ignore
            availableProducts={scenario?.availableProducts ?? []}
            // @ts-ignore
            availableJurisdictions={scenario?.availableJurisdictions ?? []}
            // @ts-ignore
            availableOrganizationTypes={
              scenario?.availableOrganizationTypes ?? [
                'SOLE_PROPRIETORSHIP',
                'LIMITED_LIABILITY_COMPANY',
              ]
            }
            title="Onboarding Wizard"
            initialClientId={clientIdFromParams ?? scenario?.clientId}
            initialStep={initialStep - 1}
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
      <DevelopmentNotice />
      {validationError && (
        <div role="alert" className="text-red-600 mb-4">
          {validationError}
        </div>
      )}

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
        <Grid.Col span={12} lg={6}>
          <Select
            name="scenario"
            label="Demo Scenarios"
            placeholder="Select a scenario"
            onChange={handleScenarioIdChange}
            value={scenarioId}
            data={Object.entries(
              onboardingScenarios.reduce(
                (acc, s) => {
                  const group = s.component || 'OnboardingWizardBasic';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push({ value: s.id, label: s.name });
                  return acc;
                },
                {} as Record<string, { label: string; value: string }[]>,
              ),
            ).flatMap(([group, items]) => [
              { value: group, label: group, disabled: true },
              ...items,
            ])}
          />
          <Accordion
            variant="contained"
            styles={{
              control: {
                paddingLeft: '8px',
                border: 'none',
                background: 'transparent',
              },
              item: {
                border: 'none',
                background: 'transparent',
              },
              content: {
                padding: '8px',
              },
            }}
          >
            <Accordion.Item value="scenarios-info">
              <Accordion.Control icon={<IconInfoCircle size={16} />}>
                <Text size="xs" fw={300}>
                  Scenarios simulate different client states using mock GET
                  /clients/:id responses. Magic Values could be used to test
                  different flows.
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="xs" fw={500} mb="xs">
                  <ThemeIcon
                    color="blue"
                    size={16}
                    radius="xl"
                    style={{ marginRight: 8 }}
                  >
                    <IconTestPipe size={10} />
                  </ThemeIcon>
                  Use the below SSN/EIN "magic values" to trigger various flows:
                </Text>

                <List spacing="xs" size="xs">
                  <List.Item>
                    <code>111111111</code> - Triggers "Information Requested"
                    state with document requirements
                  </List.Item>
                  <List.Item>
                    <code>222222222</code> - Sets status to "Review in Progress"
                  </List.Item>
                  <List.Item>
                    <code>333333333</code> - Triggers "Rejected" state
                  </List.Item>
                  <List.Item>
                    <code>444444444</code> - Triggers "Approved" state
                  </List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Grid.Col>

        <Grid.Col span={4} lg={2}>
          <NumberInput
            label="Initial Step"
            placeholder="Step"
            min={1}
            max={7}
            value={initialStep}
            onChange={handleStepChange}
          />
        </Grid.Col>

        <Grid.Col span={4} lg={2}>
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
          <Grid.Col span={4} lg={2}>
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
