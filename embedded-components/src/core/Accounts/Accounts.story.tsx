import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../.storybook/preview';
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

/**
 * Story args interface extending base provider args
 */
interface AccountsStoryArgs extends BaseStoryArgs, AccountsProps {}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const AccountsStory = (props: AccountsProps) => {
  return (
    <div className="eb-mx-auto eb-w-full eb-max-w-6xl eb-p-6">
      <Accounts {...props} />
    </div>
  );
};

const meta: Meta<AccountsStoryArgs> = {
  title: 'Core/Accounts',
  component: AccountsStory,
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
  render: (args) => (
    <AccountsStory
      allowedCategories={args.allowedCategories}
      clientId={args.clientId}
    />
  ),
};
export default meta;

type Story = StoryObj<AccountsStoryArgs>;

// --- Stories ---
export const Default: Story = {
  args: {
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
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
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
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
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
  parameters: {
    msw: {
      handlers: [http.get('*/accounts', () => new Promise(() => {}))],
    },
  },
};

export const Error: Story = {
  args: {
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
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
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
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
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA'],
    clientId: 'client-001',
  },
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
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
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

/**
 * Story with SellSense theme preset.
 * Theme is applied via themePreset arg which is handled by the global decorator.
 */
export const SellSenseTheme: Story = {
  args: {
    apiBaseUrl: '/',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
    themePreset: 'SellSense',
  },
  tags: ['@sellsense', '@theme'],
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
