import type { Meta, StoryObj } from '@storybook/react-vite';
import { SELLSENSE_THEME } from '@storybook/themes';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { MakePayment } from '../MakePayment';

interface MakePaymentWithProviderProps extends EBConfig {
  triggerButton?: React.ReactNode;
  triggerButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  accounts?: Array<{ id: string; name: string }>;
  paymentMethods?: Array<{
    id: string;
    name: string;
    fee: number;
    description?: string;
  }>;
  recipientId?: string;
  icon?: React.ReactNode;
  showPreviewPanel?: boolean;
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
    status: 'INACTIVE',
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
];

const mockAccounts = {
  items: [
    {
      id: 'account1',
      clientId: '0005199987',
      label: 'TAXES',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '10000000001035',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.592681Z',
      category: 'MANAGEMENT',
    },
    {
      id: 'account2',
      clientId: '0005199987',
      label: 'CLIENT_OFFSET',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '10000000001032',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.644832Z',
      category: 'CLIENT_OFFSET',
    },
    {
      id: 'account3',
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
      id: 'account4',
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
  account4: {
    balanceTypes: [
      {
        typeCode: 'ITAV',
        amount: 25000.0,
      },
    ],
    currency: 'USD',
  },
};

const meta: Meta<MakePaymentWithProviderProps> = {
  title: 'Core/MakePayment',
  component: MakePayment,
  tags: ['@core', '@payment'],
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
        // Also support versioned paths like /v1/accounts/:accountId/balances
        http.get('*/v*/accounts/:accountId/balances', ({ params }) => {
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
        recipientId,
        triggerButtonVariant,
        icon,
        showPreviewPanel,
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
                args={{
                  accounts,
                  paymentMethods,
                  recipientId,
                  triggerButtonVariant,
                  icon,
                  showPreviewPanel,
                  onTransactionSettled,
                }}
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

const defaultPaymentMethods = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

export const Default: Story = {
  args: {
    apiBaseUrl: '/api',
    headers: {
      client_id: 'client01',
      platform_id: 'platform01',
    },
    theme: {
      colorScheme: 'light',
    },
    contentTokens: {
      name: 'enUS',
    },
    paymentMethods: defaultPaymentMethods,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default story with all accounts and recipients. Shows the full functionality including conditional dropdown logic and auto-selection features.',
      },
    },
  },
};

/**
 * LIMITED_DDA Account: Tests the conditional dropdown logic where only active linked accounts are shown.
 */
export const LimitedDDAAccount: Story = {
  ...Default,
  name: 'LIMITED_DDA Account - Active Linked Accounts Only',
  args: {
    ...Default.args,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a LIMITED_DDA account is selected, only active linked accounts are shown in the recipients dropdown. This demonstrates the conditional filtering logic.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2]], // LIMITED_DDA account only
          });
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
            debtorAccountId: 'account3',
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
};

/**
 * Single Account with Single Active Linked Account: Tests auto-selection when only one account and one active linked account are available.
 */
export const SingleAccountWithSingleLinkedAccount: Story = {
  ...Default,
  name: 'Single Account + Single Active Linked Account',
  parameters: {
    docs: {
      description: {
        story:
          'When only one account (LIMITED_DDA) and one active linked account are available, both are automatically selected. This demonstrates the auto-selection feature.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({
            recipients: [mockRecipients[0]], // Only one active linked account
          });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2]], // Only LIMITED_DDA account
          });
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
            debtorAccountId: 'account3',
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
};

/**
 * Single Account with Non-Active Linked Accounts: Tests the scenario where no active linked accounts are available.
 */
export const SingleAccountWithNonActiveLinkedAccounts: Story = {
  ...Default,
  name: 'Single Account + Non-Active Linked Accounts',
  parameters: {
    docs: {
      description: {
        story:
          'When a LIMITED_DDA account is selected but only inactive linked accounts are available, the recipients dropdown shows an appropriate message.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({
            recipients: [mockRecipients[2]], // Only inactive linked account
          });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2]], // Only LIMITED_DDA account
          });
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
            debtorAccountId: 'account3',
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
};

/**
 * Both LIMITED_DDA and LIMITED_DDA_PAYMENTS: Tests the scenario with both account types available.
 */
export const BothLimitedDDATypes: Story = {
  ...Default,
  name: 'Both LIMITED_DDA and LIMITED_DDA_PAYMENTS',
  parameters: {
    docs: {
      description: {
        story:
          'Shows both LIMITED_DDA and LIMITED_DDA_PAYMENTS accounts. LIMITED_DDA will only show active linked accounts, while LIMITED_DDA_PAYMENTS will show all recipients.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2], mockAccounts.items[3]], // LIMITED_DDA and LIMITED_DDA_PAYMENTS
          });
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
            debtorAccountId: 'account3',
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
};

/**
 * Error Handling: Tests the transaction error scenario.
 */
export const WithTransactionError: Story = {
  ...Default,
  name: 'Transaction Error Handling',
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
          'This story demonstrates error handling when a payment fails. Open the browser console to see the error response.',
      },
    },
  },
};

/**
 * Pre-selected Recipient: Tests the recipientId prop functionality.
 */
export const WithPreselectedRecipient: Story = {
  ...Default,
  name: 'Pre-selected Recipient',
  args: {
    ...Default.args,
    recipientId: 'linkedAccount1',
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the recipientId prop functionality. When a valid recipientId is provided, the recipient will be automatically selected once an account is chosen.',
      },
    },
  },
};

/**
 * Invalid Recipient ID: Tests the warning when recipientId is not found.
 */
export const WithInvalidRecipientId: Story = {
  ...Default,
  name: 'Invalid Recipient ID Warning',
  args: {
    ...Default.args,
    recipientId: 'non-existent-recipient-id',
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the warning message that appears when a recipientId is provided but not found in the available recipients list.',
      },
    },
  },
};

/**
 * Without Preview Panel: Tests the showPreviewPanel=false functionality.
 */
export const WithoutPreviewPanel: Story = {
  ...Default,
  name: 'Without Preview Panel',
  args: {
    ...Default.args,
    showPreviewPanel: false,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MakePayment component with the preview panel hidden. The layout adjusts to use the full width without the right-side review panel.',
      },
    },
  },
};

/**
 * Single Account with Pre-selected Recipient: Tests auto-selection when only one account is available.
 */
export const SingleAccountWithPreselectedRecipient: Story = {
  ...Default,
  name: 'Single Account with Pre-selected Recipient',
  args: {
    ...Default.args,
    recipientId: 'linkedAccount1',
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the scenario where a recipientId is provided and there is only one account available. Both the account and recipient should be auto-selected.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[0]], // Only one account
          });
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
};

/**
 * Ghost Variant with No Icon: Demonstrates a subtle trigger button style.
 */
export const GhostVariantNoIcon: Story = {
  ...Default,
  name: 'Ghost Variant - No Icon',
  args: {
    ...Default.args,
    triggerButtonVariant: 'ghost',
    icon: undefined, // No icon
    contentTokens: {
      name: 'enUS',
      tokens: {
        'make-payment': {
          buttons: {
            makePayment: 'Pay',
          },
        },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MakePayment component with a Ghost variant trigger button and no icon. The Ghost variant provides a subtle, minimal appearance suitable for secondary actions or less prominent UI elements. The button text is customized using content tokens to show "Pay" instead of the default text.',
      },
    },
  },
};

/**
 * SellSense Theme: Demonstrates the component with SellSense brand theming.
 */
export const SellSenseTheme: Story = {
  ...Default,
  name: 'SellSense Theme',
  args: {
    ...Default.args,
    theme: SELLSENSE_THEME,
    icon: 'CirclePlus',
  },
  tags: ['@sellsense', '@theme'],
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MakePayment component with SellSense brand theming. The component uses the official SellSense color palette with orange primary colors, warm backgrounds, and brand-consistent typography.',
      },
    },
  },
};

/**
 * Manual Recipient Entry: Demonstrates entering recipient details and posting a transaction without creating a recipient.
 */
export const ManualRecipientEntry: Story = {
  ...Default,
  name: 'Manual recipient entry',
  args: {
    ...Default.args,
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          // Still return recipients; user will switch to manual mode
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
        http.post('*/transactions', async ({ request }) => {
          // Accept both recipientId or inline recipient details
          const body = (await request.json()) as any;
          return HttpResponse.json({
            id: 'txn-manual-12345',
            ...body,
            status: 'PENDING',
            createdAt: '2024-01-15T10:30:00Z',
          });
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Use the new toggle to switch to “Enter details” and provide recipient info inline. This posts to /transactions without creating a recipient.',
      },
    },
  },
};

export const FunctionalTestingNoMocks: Story = {
  ...Default,
  name: 'Functional Testing with no mocks',
  args: {
    ...Default.args,
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    msw: {
      handlers: [],
    },
    docs: {
      description: {
        story:
          'Functional testing story without any MSW mocks. Connects to a real backend API for end-to-end testing.',
      },
    },
  },
};
