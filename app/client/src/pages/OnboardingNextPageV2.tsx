import {
  EBComponentsProvider,
  OnboardingWizardBasic,
} from '@jpmorgan-payments/embedded-finance-components';
import { Badge, Select, Text } from '@mantine/core';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { onboardingScenarios } from 'data/onboardingScenarios';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const OnboardingNextPageV2 = () => {
  const [params, setParams] = useSearchParams();
  const scenarioId = params.get('scenario');
  const scenario = onboardingScenarios.find((s) => s.id === scenarioId);

  useEffect(() => {
    if (!onboardingScenarios.find((s) => s.id === scenarioId)) {
      setParams({ scenario: onboardingScenarios[0].id }, { replace: true });
    }
  }, []);

  function handleScenarioIdChange(id: string): void {
    setParams({ scenario: id });
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
        data={[
          { value: 'scenario1', label: 'Scenario 1 - Basic Flow' },
          { value: 'scenario2', label: 'Scenario 2 - Advanced Flow' },
        ]}
        styles={(theme) => ({
          root: {
            marginBottom: theme.spacing.md,
          },
        })}
      />

      <EBComponentsProvider
        key={scenario?.clientId}
        apiBaseUrl={scenario?.baseURL ?? ''}
        headers={{
          api_gateway_client_id: scenario?.gatewayID ?? '',
        }}
      >
        <OnboardingWizardBasic
          key={
            (scenario?.clientId ?? '') +
            (scenario?.baseURL ?? '') +
            (scenario?.gatewayID ?? '')
          }
          title={`Onboarding Wizard`}
          clientId={scenario?.clientId}
          useCase={scenario?.useCase === 'CanadaMS' ? 'CanadaMS' : 'EF'}
          onPostClientResponse={(response, error) => {
            console.log('@@clientId POST', response, error);
          }}
          onPostClientVerificationsResponse={(response, error) => {
            console.log('@@clientId GET', response, error);
          }}
        />
      </EBComponentsProvider>
    </PageWrapper>
  );
};
