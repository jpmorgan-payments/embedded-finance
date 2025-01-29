import {
  EBComponentsProvider,
  LinkedAccountWidget,
} from '@jpmorgan-payments/embedded-finance-components';
import { Badge, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { PageWrapper } from 'components';
import { DevelopmentNotice } from 'components/DevelopmentNotice/DevelopmentNotice';
import { GITHUB_REPO } from 'data/constants';

export const EPLinkedAccountPage = () => {
  const form = useForm({
    initialValues: {
      clientId: '0030000132',
    },
  });

  return (
    <PageWrapper
      title="[Embedded Payments] Linked Accounts"
      apiEndpoint="@jpmorgan-payments/embedded-finance-components "
      githubLink={`${GITHUB_REPO}/tree/main/embedded-components`}
    >
      <DevelopmentNotice />
      <EBComponentsProvider apiBaseUrl="https://api-mock.payments.jpmorgan.com/tsapi/ef/v1/">
        <LinkedAccountWidget />
      </EBComponentsProvider>
    </PageWrapper>
  );
};
