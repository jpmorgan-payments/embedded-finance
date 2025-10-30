import { mockTransactionsResponse } from '@/mocks/transactions.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { SELLSENSE_THEME } from '@/core/themes';

import { TransactionsDisplay } from './TransactionsDisplay';

// --- Mock Data (aligned with Accounts.story.tsx) ---
const mockAccountsResponse = {
  items: [
    {
      id: 'account1',
      clientId: '0085199987',
      label: 'MAIN3919',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000057603919',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.792272Z',
      category: 'LIMITED_DDA',
    },
    {
      id: 'account2',
      clientId: '1000012400',
      label: 'MAIN3212',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000097603212',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.913631Z',
      category: 'LIMITED_DDA_PAYMENTS',
    },
  ],
};

const mockLimitedDDAAccountResponse = {
  items: [mockAccountsResponse.items[0]],
};

const mockLimitedDDAPaymentsAccountResponse = {
  items: [mockAccountsResponse.items[1]],
};

const mockEmptyAccountsResponse = { items: [] };

const TransactionsDisplayWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  accountIds,
  contentTokens,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  theme?: Record<string, unknown>;
  accountIds?: string[];
  contentTokens?: Record<string, string>;
}) => {
  const queryClient = new QueryClient();
  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers}
      theme={theme}
      contentTokens={contentTokens || { name: 'enUS' }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="eb-mx-auto eb-max-w-4xl eb-p-6">
          <TransactionsDisplay accountIds={accountIds} />
        </div>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof TransactionsDisplayWithProvider> = {
  title: 'Core/TransactionsDisplay',
  component: TransactionsDisplayWithProvider,
  tags: ['@core', '@transactions'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays transactions with support for filtering by account IDs. When no accountIds prop is provided, it automatically fetches and uses LIMITED_DDA and LIMITED_DDA_PAYMENTS accounts.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TransactionsDisplayWithProvider>;

// --- Stories with Account Prop ---
export const WithAccountIdsProp: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
    accountIds: ['account1', 'account2'],
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
};

// --- Stories without Account Prop (auto-fetch) ---
export const AutoFetchWithLimitedDDA: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json(mockLimitedDDAAccountResponse)
        ),
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
  argTypes: {
    accountIds: { table: { disable: true } },
  },
};

export const AutoFetchWithLimitedDDAPayments: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json(mockLimitedDDAPaymentsAccountResponse)
        ),
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
  argTypes: {
    accountIds: { table: { disable: true } },
  },
};

export const AutoFetchWithBothCategories: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () => HttpResponse.json(mockAccountsResponse)),
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
  argTypes: {
    accountIds: { table: { disable: true } },
  },
};

export const AutoFetchNoAccounts: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json(mockEmptyAccountsResponse)
        ),
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
  argTypes: {
    accountIds: { table: { disable: true } },
  },
};

// --- Additional Stories ---
export const Loading: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
    accountIds: ['account1'],
  },
  parameters: {
    msw: {
      handlers: [http.get('*/transactions', () => new Promise(() => {}))],
    },
  },
};

export const Error: Story = {
  args: {
    apiBaseUrl: '/',
    headers: {},
    accountIds: ['account1'],
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
  args: {
    apiBaseUrl: '/',
    headers: {},
    accountIds: ['account1', 'account2'],
    theme: SELLSENSE_THEME as unknown as Record<string, unknown>,
  },
  tags: ['@sellsense', '@theme'],
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
      ],
    },
  },
};
