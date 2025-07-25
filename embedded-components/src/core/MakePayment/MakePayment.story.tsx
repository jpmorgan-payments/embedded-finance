import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { MakePayment } from './MakePayment';

interface MakePaymentWithProviderProps extends EBConfig {
  triggerButton?: React.ReactNode;
  accounts?: Array<{ id: string; name: string }>;
  paymentMethods?: Array<{
    id: string;
    name: string;
    fee: number;
    description?: string;
  }>;
  onTransactionSettled?: (response?: any, error?: any) => void;
}

const mockRecipients = [
  // Linked Accounts
  {
    id: 'linkedAccount1',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Doe',
      address: {
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'john.doe@email.com',
        },
        {
          contactType: 'PHONE',
          value: '5551234567',
          countryCode: '+1',
        },
      ],
    },
    account: {
      id: 'acc-1234',
      number: '1234567890',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '111000025',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'linkedAccount2',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Jane',
      lastName: 'Smith',
      address: {
        addressLine1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'jane.smith@email.com',
        },
        {
          contactType: 'PHONE',
          value: '5559876543',
          countryCode: '+1',
        },
      ],
    },
    account: {
      id: 'acc-5678',
      number: '9876543210',
      type: 'SAVINGS',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '222000111',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'USABA',
          routingNumber: '222000111',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
  },
  {
    id: 'linkedAccount3',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Company LLC',
      address: {
        addressLine1: '789 Business Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'payments@companyllc.com',
        },
        {
          contactType: 'WEBSITE',
          value: 'https://www.companyllc.com',
        },
      ],
    },
    account: {
      id: 'acc-9012',
      number: '2468135790',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '333000222',
          transactionType: 'RTP',
        },
      ],
    },
    createdAt: '2024-01-05T11:45:00Z',
    updatedAt: '2024-01-17T16:30:00Z',
  },
  // Regular Recipients
  {
    id: 'recipient1',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Alice',
      lastName: 'Johnson',
      address: {
        addressLine1: '321 Pine Street',
        city: 'Miami',
        state: 'FL',
        postalCode: '33101',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'alice.johnson@email.com',
        },
        {
          contactType: 'PHONE',
          value: '5551112222',
          countryCode: '+1',
        },
      ],
    },
    account: {
      id: 'acc-3456',
      number: '111122223333',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '444000555',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'USABA',
          routingNumber: '444000555',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-01-20T08:15:00Z',
    updatedAt: '2024-01-20T08:15:00Z',
  },
  {
    id: 'recipient2',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Tech Solutions Inc',
      address: {
        addressLine1: '654 Innovation Drive',
        city: 'Austin',
        state: 'TX',
        postalCode: '73301',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'payments@techsolutions.com',
        },
        {
          contactType: 'WEBSITE',
          value: 'https://www.techsolutions.com',
        },
      ],
    },
    account: {
      id: 'acc-7890',
      number: '555566667777',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '666000777',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'USABA',
          routingNumber: '666000777',
          transactionType: 'RTP',
        },
      ],
    },
    createdAt: '2024-01-18T13:30:00Z',
    updatedAt: '2024-01-19T10:45:00Z',
  },
  {
    id: 'recipient3',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Bob',
      lastName: 'Wilson',
      address: {
        addressLine1: '987 Elm Court',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'bob.wilson@email.com',
        },
        {
          contactType: 'PHONE',
          value: '5553334444',
          countryCode: '+1',
        },
      ],
    },
    account: {
      id: 'acc-1357',
      number: '888899990000',
      type: 'SAVINGS',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '777000888',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-22T15:20:00Z',
    updatedAt: '2024-01-22T15:20:00Z',
  },
];

const mockAccounts = {
  items: [
    {
      id: 'account1',
      label: 'Main Account',
      number: '****1234',
      type: 'CHECKING',
      balance: 5000.0,
      currency: 'USD',
    },
    {
      id: 'account2',
      label: 'Savings Account',
      number: '****5678',
      type: 'SAVINGS',
      balance: 15000.0,
      currency: 'USD',
    },
    {
      id: 'account3',
      label: 'Business Account',
      number: '****9012',
      type: 'CHECKING',
      balance: 25000.0,
      currency: 'USD',
    },
  ],
};

const mockAccountBalances = {
  account1: {
    balanceTypes: [
      {
        typeCode: 'ITAV',
        amount: 5000.0,
      },
      {
        typeCode: 'ITBD',
        amount: 5200.0,
      },
    ],
    currency: 'USD',
  },
  account2: {
    balanceTypes: [
      {
        typeCode: 'ITAV',
        amount: 15000.0,
      },
      {
        typeCode: 'ITBD',
        amount: 15200.0,
      },
    ],
    currency: 'USD',
  },
  account3: {
    balanceTypes: [
      {
        typeCode: 'ITAV',
        amount: 25000.0,
      },
      {
        typeCode: 'ITBD',
        amount: 25200.0,
      },
    ],
    currency: 'USD',
  },
};

const meta: Meta<MakePaymentWithProviderProps> = {
  title: 'Payment / Make Payment',
  component: MakePayment,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('*/accounts/:accountId/balances', ({ params }) => {
          const accountId = params.accountId as string;
          const balance =
            mockAccountBalances[accountId as keyof typeof mockAccountBalances];
          if (balance) {
            return HttpResponse.json(balance);
          }
          return HttpResponse.json(
            { error: 'Account not found' },
            { status: 404 }
          );
        }),
        http.post('*/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'linkedAccount1',
            transactionReferenceId: 'PAY-1234567890',
            type: 'ACH',
            memo: 'Test payment',
            status: 'PENDING',
            paymentDate: '2024-01-15',
            createdAt: '2024-01-15T10:30:00Z',
            debtorName: 'John Doe',
            creditorName: 'Jane Smith',
            debtorAccountNumber: '****1234',
            creditorAccountNumber: '****5678',
          });
        }),
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const {
        apiBaseUrl,
        headers,
        theme,
        reactQueryDefaultOptions,
        contentTokens,
        accounts,
        paymentMethods,
        onTransactionSettled,
      } = context.args;
      return (
        <div className="eb-light">
          <EBComponentsProvider
            apiBaseUrl={apiBaseUrl}
            headers={headers}
            theme={{
              colorScheme: 'light',
              ...theme,
            }}
            reactQueryDefaultOptions={{
              queries: {
                refetchOnWindowFocus: false,
                retry: false,
              },
              ...reactQueryDefaultOptions,
            }}
            contentTokens={contentTokens}
          >
            <div className="eb-p-4">
              <Story
                args={{ accounts, paymentMethods, onTransactionSettled }}
              />
            </div>
          </EBComponentsProvider>
        </div>
      );
    },
  ],
  argTypes: {
    onTransactionSettled: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<MakePaymentWithProviderProps>;

// Common data for stories
const singleAccount = [{ id: 'account1', name: 'Main Account' }];
const multipleAccounts = [
  { id: 'account1', name: 'Main Account' },
  { id: 'account2', name: 'Savings Account' },
  { id: 'account3', name: 'Business Account' },
];

const defaultPaymentMethods = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

const singlePaymentMethod = [{ id: 'ACH', name: 'ACH', fee: 2.5 }];

const customPaymentMethods = [
  {
    id: 'INSTANT',
    name: 'Instant Transfer',
    fee: 5,
    description: 'Instant transfer with a $5 fee',
  },
  {
    id: 'STANDARD',
    name: 'Standard Transfer',
    fee: 0,
    description: 'Free transfer that takes 2-3 business days',
  },
];

export const Default: Story = {
  args: {
    apiBaseUrl: '/api',
    headers: {
      api_gateway_client_id: 'test',
    },
    theme: {
      colorScheme: 'light',
    },
    contentTokens: {
      name: 'enUS',
    },
    accounts: multipleAccounts,
    paymentMethods: defaultPaymentMethods,
  },
};

export const WithSingleAccount: Story = {
  args: {
    ...Default.args,
    accounts: singleAccount,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one account is available, it is preselected automatically.',
      },
    },
  },
};

export const WithSinglePaymentMethod: Story = {
  args: {
    ...Default.args,
    paymentMethods: singlePaymentMethod,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one payment method is available, it is preselected automatically.',
      },
    },
  },
};

export const WithCustomPaymentMethods: Story = {
  args: {
    ...Default.args,
    paymentMethods: customPaymentMethods,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom payment methods can be provided with different names, fees, and descriptions.',
      },
    },
  },
};

// --- Storybook Stories for MakePayment ---

/**
 * Default: Shows all payment methods (ACH, RTP, WIRE) for all recipients.
 * Use this to test dynamic payment method selection (e.g., Jane Smith: ACH & WIRE).
 */
export const AllPaymentMethods: Story = {
  ...Default,
  name: 'All Payment Methods (Default)',
  parameters: {
    docs: {
      description: {
        story:
          'Shows all payment methods (ACH, RTP, WIRE) for all recipients. Use this to test dynamic payment method selection (e.g., Jane Smith: ACH & WIRE).',
      },
    },
  },
};

/**
 * Only ACH: Shows only ACH as a payment method for all recipients.
 * Use this to test single-method scenarios.
 */
export const OnlyACH: Story = {
  ...WithSinglePaymentMethod,
  name: 'Only ACH',
  parameters: {
    docs: {
      description: {
        story:
          'Shows only ACH as a payment method for all recipients. Use this to test single-method scenarios.',
      },
    },
  },
};

/**
 * Custom Payment Methods: Shows custom payment methods (INSTANT, STANDARD).
 * Use this to test custom method scenarios.
 */
export const CustomPaymentMethods: Story = {
  ...WithCustomPaymentMethods,
  name: 'Custom Payment Methods',
  parameters: {
    docs: {
      description: {
        story:
          'Shows custom payment methods (INSTANT, STANDARD). Use this to test custom method scenarios.',
      },
    },
  },
};

export const WithTransactionSettledCallback: Story = {
  ...Default,
  name: 'With Transaction Settled Callback',
  args: {
    ...Default.args,
    onTransactionSettled: (response, error) => {
      if (response) {
        console.log('@@TRANSACTION response data', response);
      } else if (error) {
        console.log('@@TRANSACTION response error', error);
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the onTransactionSettled callback using the onSettled mutation callback. Open the browser console to see the transaction response data or error when a payment is submitted. The callback will be triggered for all transaction states (pending, success, error).',
      },
    },
  },
};

export const WithTransactionSettledCallbackError: Story = {
  ...Default,
  name: 'With Transaction Settled Callback (Error)',
  args: {
    ...Default.args,
    onTransactionSettled: (response, error) => {
      if (response) {
        console.log('@@TRANSACTION response data', response);
      } else if (error) {
        console.log('@@TRANSACTION response error', error);
      }
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('*/accounts/:accountId/balances', ({ params }) => {
          const accountId = params.accountId as string;
          const balance =
            mockAccountBalances[accountId as keyof typeof mockAccountBalances];
          if (balance) {
            return HttpResponse.json(balance);
          }
          return HttpResponse.json(
            { error: 'Account not found' },
            { status: 404 }
          );
        }),
        http.post('*/transactions', () => {
          return HttpResponse.json(
            {
              httpStatus: 400,
              title: 'Bad Request',
              context: [
                {
                  code: 'INSUFFICIENT_FUNDS',
                  message: 'Insufficient funds in account',
                  field: 'amount',
                  location: 'body',
                },
              ],
            },
            { status: 400 }
          );
        }),
      ],
    },
    docs: {
      description: {
        story:
          'This story demonstrates the onTransactionSettled callback with an error scenario using the onSettled mutation callback. Open the browser console to see the error response when a payment fails.',
      },
    },
  },
};
