import React from 'react';
import { http, HttpResponse } from 'msw';
import { Meta, StoryObj } from '@storybook/react-vite';
import { SELLSENSE_THEME } from '@storybook/themes';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Accounts } from './Accounts';
import type { AccountsProps } from './Accounts.types';

// --- Mock Data (aligned with JPMorgan API docs) ---
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

const mockEmptyAccountsResponse = { items: [] };

const mockBalanceResponse = {
  id: 'account1',
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 5558.42 },
    { typeCode: 'ITBD', amount: 5758.42 },
  ],
};

// --- Provider Wrapper ---
const AccountsWithProvider = (props: AccountsProps) => {
  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: {
          retry: false,
        },
      }}
    >
      <div className="eb-mx-auto eb-w-full eb-max-w-6xl eb-p-6">
        <Accounts {...props} />
      </div>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof Accounts> = {
  title: 'Core/Accounts',
  component: Accounts,
  tags: ['@core', '@accounts'],
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

export const SellSenseTheme: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  tags: ['@sellsense', '@theme'],
  render: (args) => (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      theme={SELLSENSE_THEME}
      contentTokens={{ name: 'enUS' }}
    >
      <div className="eb-mx-auto eb-w-full eb-max-w-6xl eb-p-6">
        <Accounts {...args} />
      </div>
    </EBComponentsProvider>
  ),
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
