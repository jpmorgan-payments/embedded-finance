import {
  mockTransactions,
  mockTransactionsResponse,
} from '@/mocks/transactions.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { TransactionsDisplay } from './TransactionsDisplay';

// Helper to get transaction by ID for details endpoint
const getTransactionById = (id: string) => {
  const transaction = mockTransactions.find((t) => t.id === id);
  if (transaction) {
    return transaction;
  }
  // Fallback to first transaction if not found
  return mockTransactions[0] || null;
};

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
  metadata: {
    limit: 25,
    page: 1,
    total_items: 2,
  },
};

const mockLimitedDDAAccountResponse = {
  items: [mockAccountsResponse.items[0]],
  metadata: {
    limit: 25,
    page: 1,
    total_items: 1,
  },
};

const mockLimitedDDAPaymentsAccountResponse = {
  items: [mockAccountsResponse.items[1]],
  metadata: {
    limit: 25,
    page: 1,
    total_items: 1,
  },
};

const mockEmptyAccountsResponse = {
  items: [],
  metadata: {
    limit: 25,
    page: 1,
    total_items: 0,
  },
};

/**
 * Story args interface extending base provider args
 */
interface TransactionsDisplayStoryArgs extends BaseStoryArgs {
  accountIds?: string[];
  apiBaseUrls?: Record<string, string>;
}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const TransactionsDisplayStory = ({
  accountIds,
}: {
  accountIds?: string[];
}) => {
  return (
    <div className="eb-mx-auto eb-max-w-4xl eb-p-6">
      <TransactionsDisplay accountIds={accountIds} />
    </div>
  );
};

const meta: Meta<TransactionsDisplayStoryArgs> = {
  title: 'Core/TransactionsDisplay',
  component: TransactionsDisplayStory,
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
  render: (args) => <TransactionsDisplayStory accountIds={args.accountIds} />,
};
export default meta;

type Story = StoryObj<TransactionsDisplayStoryArgs>;

// --- Stories with Account Prop ---
export const WithAccountIdsProp: Story = {
  args: {
    apiBaseUrl: '/',
    apiBaseUrls: {
      transactions: '/v2/',
    },
    headers: {},
    accountIds: ['account1', 'account2'],
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
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
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
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
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
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
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
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
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
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

// Error stories are organized in stories/TransactionsDisplay.errors.story.tsx

/**
 * Story with SellSense theme preset.
 * Theme is applied via themePreset arg which is handled by the global decorator.
 */
export const SellSenseTheme: Story = {
  args: {
    apiBaseUrl: '/',
    apiBaseUrls: {
      transactions: '/v2/',
    },
    accountIds: ['account1', 'account2'],
    themePreset: 'SellSense',
  },
  tags: ['@sellsense', '@theme'],
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(mockTransactionsResponse)
        ),
        http.get('*/transactions/:id', ({ params }) => {
          const { id } = params;
          const transaction = getTransactionById(id as string);
          if (transaction) {
            return HttpResponse.json(transaction);
          }
          return HttpResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }),
      ],
    },
  },
};
