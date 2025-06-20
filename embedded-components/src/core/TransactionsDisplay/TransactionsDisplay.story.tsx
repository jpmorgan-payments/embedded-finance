import type { Meta, StoryObj } from '@storybook/react-vite';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { TransactionsDisplay } from './TransactionsDisplay';

export const TransactionsDisplayWithProvider = ({
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
  title: 'Transactions Display / General',
  component: TransactionsDisplayWithProvider,
};
export default meta;

type Story = StoryObj<typeof TransactionsDisplayWithProvider>;

export const MockAPI: Story = {
  name: 'PDP Mock API',
  args: {
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    accountId: 'd3371713f14e423f82065c9486ebe15b',
  },
};
