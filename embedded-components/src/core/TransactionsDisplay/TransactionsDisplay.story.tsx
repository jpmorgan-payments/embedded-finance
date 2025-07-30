import { mockTransactionsResponse } from '@/mocks/transactions.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { SELLSENSE_THEME } from '@/core/themes';

import { TransactionsDisplay } from './TransactionsDisplay';

const TransactionsDisplayWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  accountId,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  theme: Record<string, unknown>;
  accountId: string;
}) => {
  return (
    <>
      <EBComponentsProvider
        apiBaseUrl={apiBaseUrl}
        headers={headers}
        theme={theme}
      >
        <TransactionsDisplay accountId={accountId} />
      </EBComponentsProvider>
    </>
  );
};

const meta: Meta<typeof TransactionsDisplayWithProvider> = {
  title: 'Core/TransactionsDisplay',
  component: TransactionsDisplayWithProvider,
  tags: ['@core', '@transactions'],
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () => {
          return HttpResponse.json(mockTransactionsResponse);
        }),
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof TransactionsDisplayWithProvider>;

export const Default: Story = {
  name: 'Default',
  args: {
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    accountId: 'debtor-acc-001',
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    accountId: 'debtor-acc-001',
  },
  parameters: {
    msw: {
      handlers: [http.get('*/transactions', () => new Promise(() => {}))],
    },
  },
};

export const Error: Story = {
  name: 'Error',
  args: {
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    accountId: 'debtor-acc-001',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        ),
      ],
    },
  },
};

export const SellSenseTheme: Story = {
  name: 'SellSense Theme',
  args: {
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    accountId: 'debtor-acc-001',
    theme: SELLSENSE_THEME,
  },
  tags: ['@sellsense', '@theme'],
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () => {
          return HttpResponse.json(mockTransactionsResponse);
        }),
      ],
    },
  },
};
