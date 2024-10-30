import {
  EBComponentsProvider,
  OnboardingWizard,
} from '@jpmorgan-payments/embedded-finance-components';
import { Badge, Group, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';
import { useEffect, useState } from 'react';

export const OnboardingNextPage = () => {
  const [props, setProps] = useState({
    clientId: '0030000132',
    baseURL: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/do/v1',
    gatewayID: '',
  });

  const form = useForm({
    initialValues: {
      clientId: '0030000132',
      baseURL: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/do/v1',
      gatewayID: '',
    },
  });

  useEffect(() => {
    setProps({
      clientId: form.values.clientId,
      baseURL: form.values.baseURL,
      gatewayID: form.values.gatewayID,
    });
  }, [form.values.clientId, form.values.baseURL, form.values.gatewayID]);

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
      <Group>
        <TextInput label="Client ID" {...form.getInputProps('clientId')} />
        <TextInput label="Base URL" {...form.getInputProps('baseURL')} />
        <TextInput label="gateway" {...form.getInputProps('gatewayID')} />
      </Group>
      <EBComponentsProvider
        key={props.clientId}
        apiBaseUrl={props.baseURL}
        headers={{
          api_gateway_client_id: props.gatewayID,
        }}
      >
        <OnboardingWizard
          key={props.clientId + props.baseURL + props.gatewayID}
          title={`Onboarding Wizard`}
          clientId={props.clientId}
          onPostClientsVerification={({ clientId }) => {
            console.log('@@clientId POST', clientId);
          }}
          onGetClientsConfirmation={({ clientId }) => {
            console.log('@@clientId GET', clientId);
          }}
        />
      </EBComponentsProvider>
    </PageWrapper>
  );
};
