import {
  EBComponentsProvider,
  OnboardingWizardBasic,
} from '@jpmorgan-payments/embedded-finance-components';
import { Badge, Collapse, Group, Select, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { useEffect, useState } from 'react';

const demoClientIds = new Map([
  ['scenario1', '0030000132'],
  ['scenario2', '0030000133'],
]);

export const OnboardingNextPageV2 = () => {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');

  const [props, setProps] = useState({
    clientId: '',
    baseURL: '',
    gatewayID: '',
    useCase: 'CanadaMS',
  });

  const form = useForm({
    initialValues: {
      clientId: '0030000132',
      baseURL: '/ef/do/v1/',
      gatewayID: '',
      useCase: 'CanadaMS',
    },
  });

  useEffect(() => {
    setProps({
      clientId: form.values.clientId,
      baseURL: form.values.baseURL,
      gatewayID: form.values.gatewayID,
      useCase: form.values.useCase,
    });
  }, [form.values.clientId, form.values.baseURL, form.values.gatewayID]);

  useEffect(() => {
    if (demo && demoClientIds.has(demo)) {
      setDemoScenario(demo);
    }
  }, [demo]);

  function setDemoScenario(demoScenarioName: string): void {
    form.setFieldValue('clientId', demoClientIds.get(demoScenarioName) || '');
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

      <details>
        <summary>Tech Details</summary>
        <Group>
          <TextInput label="Client ID" {...form.getInputProps('clientId')} />
          <TextInput label="Base URL" {...form.getInputProps('baseURL')} />
          <TextInput label="gateway" {...form.getInputProps('gatewayID')} />
          <TextInput label="use case" {...form.getInputProps('useCase')} />
        </Group>
      </details>

      <Select
        label="Demo Scenarios"
        placeholder="Select a scenario"
        onChange={setDemoScenario}
        defaultValue={'scenario1'}
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
        key={props.clientId}
        apiBaseUrl={props.baseURL}
        headers={{
          api_gateway_client_id: props.gatewayID,
        }}
      >
        <OnboardingWizardBasic
          key={props.clientId + props.baseURL + props.gatewayID}
          title={`Onboarding Wizard`}
          clientId={props.clientId}
          useCase="CanadaMS"
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
