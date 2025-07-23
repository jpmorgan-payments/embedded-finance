import React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Accounts, AccountsProps } from './Accounts';

// --- Mock Data (aligned with JPMorgan API docs) ---
const mockAccountsResponse = {
  items: [
    {
      id: 'acc-001',
      clientId: 'client-001',
      label: 'Main Account',
      state: 'OPEN',
      category: 'LIMITED_DDA',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '123456789012',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '987654321' }],
      },
    },
    {
      id: 'acc-002',
      clientId: 'client-001',
      label: 'Payments Account',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '987654321098',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '123456789' }],
      },
    },
  ],
};

const mockEmptyAccountsResponse = { items: [] };

const mockBalanceResponse = {
  id: 'acc-001',
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 5558.42 },
    { typeCode: 'ITBD', amount: 5758.42 },
  ],
};

// --- Provider Wrapper ---
const AccountsWithProvider = (props: AccountsProps) => {
  const queryClient = new QueryClient();
  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="eb-mx-auto eb-max-w-2xl eb-p-6">
          <Accounts {...props} />
        </div>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof Accounts> = {
  title: 'Core/Accounts',
  component: Accounts,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a list of accounts filtered by category, with balances and routing info.',
      },
    },
  },
  argTypes: {
    allowedCategories: {
      control: 'object',
      description: 'Account categories to display',
    },
    clientId: {
      control: 'text',
      description: 'Optional client ID filter',
    },
  },
};
export default meta;
type Story = StoryObj<typeof Accounts>;

// --- Stories ---
export const Default: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () => HttpResponse.json(mockAccountsResponse)),
        http.get('*/accounts/:id/balances', () =>
          HttpResponse.json(mockBalanceResponse)
        ),
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json(mockEmptyAccountsResponse)
        ),
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [http.get('*/accounts', () => new Promise(() => {}))],
    },
  },
};

export const Error: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        ),
      ],
    },
  },
};

export const DarkTheme: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a1a' }],
    },
    msw: {
      handlers: [
        http.get('*/accounts', () => HttpResponse.json(mockAccountsResponse)),
        http.get('*/accounts/:id/balances', () =>
          HttpResponse.json(mockBalanceResponse)
        ),
      ],
    },
  },
};

export const SingleCategory: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () =>
          HttpResponse.json({
            items: [mockAccountsResponse.items[0]],
          })
        ),
        http.get('*/accounts/:id/balances', () =>
          HttpResponse.json(mockBalanceResponse)
        ),
      ],
    },
  },
};

export const MultipleCategories: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  render: (args) => <AccountsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/accounts', () => HttpResponse.json(mockAccountsResponse)),
        http.get('*/accounts/:id/balances', () =>
          HttpResponse.json(mockBalanceResponse)
        ),
      ],
    },
  },
};
