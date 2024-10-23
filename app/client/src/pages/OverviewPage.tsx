import { Anchor, List, Text, Title } from '@mantine/core';
import { PageWrapper } from 'components';
import { GITHUB_REPO } from 'data/constants';

export const OverviewPage = () => {
  return (
    <PageWrapper title="Embedded Finance Showcase">
      <Text>
        Embedded Finance gives you financial tools from J.P. Morgan — such as
        money movement, real-time payments, and account services — and lets you
        place them directly into your own platform.
      </Text>
      <Title order={2} mt="xs">
        In this showcase
      </Title>
      <div>
        <Text>
          This showcase application demonstrates the main use cases for each
          endpoint of the Embedded Finance API.
        </Text>
        <Text>
          Explore this app to get a general sense of the experiences you can
          create, alongside mocked API requests and responses. You can:
        </Text>
      </div>
      <List withPadding>
        <List.Item>
          <b>Onboard clients</b> - see an example flow for onboarding a client
          to Embedded Finance, including the data points you need to collect.
        </List.Item>
        <List.Item>
          <b>Link a Bank Account</b> - add a linked bank account for settlement
        </List.Item>
      </List>
      <Text>
        You can also take a closer look at this application's code at the{' '}
        <Anchor href={GITHUB_REPO} target="_blank" color="blue">
          GitHub repository
        </Anchor>
        .
      </Text>
      <Title order={2} mt="xs">
        Authentication
      </Title>
      <Text>
        In this sample app, your requests are not sent to the live Embedded
        Banking APIs. In a live environment, a token is required in the header
        of your requests.
      </Text>
      <Title order={2} mt="xs">
        Learn more
      </Title>
      <div>
        <Text>
          Learn more about Embedded Finance at:{' '}
          <Anchor
            href="https://www.jpmorgan.com/payments/solutions/embedded-finance"
            target="_blank"
            color="blue"
          >
            https://www.jpmorgan.com/payments/solutions/embedded-finance
          </Anchor>
        </Text>
        {/* <Text>
          Register and explore the full Embedded Finance APIs at:{' '}
          <Anchor
            href="https://developer-console.prod.aws.jpmchase.net/docs/embedded-banking"
            target="_blank"
            color="blue"
          >
            https://developer-console.prod.aws.jpmchase.net/docs/embedded-banking
          </Anchor>
        </Text> */}
      </div>
    </PageWrapper>
  );
};
