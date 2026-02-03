import type { Meta, StoryObj } from '@storybook/react-vite';
import { DefaultOptions } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import type { AccountBalanceResponse } from '@/api/generated/ep-accounts.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { MakePayment } from '../MakePayment';

/**
 * Story args interface extending base provider args
 */
interface MakePaymentStoryArgs extends BaseStoryArgs {
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
    fee?: number;
    description?: string;
  }>;
  recipientId?: string;
  icon?: React.ReactNode;
  showPreviewPanel?: boolean;
  onTransactionSettled?: (response?: any, error?: any) => void;
  reactQueryDefaultOptions?: DefaultOptions;
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

// AccountBalanceResponse: id, date (yyyy-MM-dd), currency, balanceTypes
const mockAccountBalances: Record<string, AccountBalanceResponse> = {
  account1: {
    id: 'account1',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 5000.0 },
      { typeCode: 'ITBD', amount: 5200.0 },
    ],
  },
  account2: {
    id: 'account2',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 15000.0 },
      { typeCode: 'ITBD', amount: 15200.0 },
    ],
  },
  account3: {
    id: 'account3',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 25000.0 },
      { typeCode: 'ITBD', amount: 25200.0 },
    ],
  },
  account4: {
    id: 'account4',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
  },
};

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const MakePaymentStory = (props: {
  paymentMethods?: MakePaymentStoryArgs['paymentMethods'];
  recipientId?: string;
  triggerButtonVariant?: MakePaymentStoryArgs['triggerButtonVariant'];
  icon?: React.ReactNode;
  showPreviewPanel?: boolean;
  onTransactionSettled?: (response?: any, error?: any) => void;
}) => {
  return (
    <div className="eb-p-4">
      <MakePayment
        paymentMethods={props.paymentMethods}
        recipientId={props.recipientId}
        triggerButtonVariant={props.triggerButtonVariant}
        icon={props.icon}
        showPreviewPanel={props.showPreviewPanel}
        onTransactionSettled={props.onTransactionSettled}
      />
    </div>
  );
};

const meta: Meta<MakePaymentStoryArgs> = {
  title: 'Legacy/MakePayment',
  component: MakePaymentStory,
  tags: ['@legacy', '@payment'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        // Handler for GET /recipients/:id - returns the specific recipient by ID
        http.get('/recipients/:recipientId', ({ params }) => {
          const recipientId = params.recipientId as string;
          const recipient = mockRecipients.find((r) => r.id === recipientId);
          if (recipient) {
            return HttpResponse.json(recipient);
          }
          // Not found
          return HttpResponse.json(
            { error: 'Recipient not found' },
            { status: 404 }
          );
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
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
  argTypes: {
    onTransactionSettled: { table: { disable: true } },
  },
  render: (args) => (
    <MakePaymentStory
      paymentMethods={args.paymentMethods}
      recipientId={args.recipientId}
      triggerButtonVariant={args.triggerButtonVariant}
      icon={args.icon}
      showPreviewPanel={args.showPreviewPanel}
      onTransactionSettled={args.onTransactionSettled}
    />
  ),
};
export default meta;

type Story = StoryObj<MakePaymentStoryArgs>;

const paymentMethodsNoFees = [
  { id: 'ACH', name: 'ACH' },
  { id: 'RTP', name: 'RTP' },
  { id: 'WIRE', name: 'WIRE' },
];

const paymentMethodsWithFees = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

// Track retry count for accounts error story (refetch succeeds on first retry)
const accountsRetryCount = { count: 0 };

/**
 * Default story with no fees - showcases the component without any payment method fees.
 * This is the standard/default experience.
 */
export const Default: Story = {
  name: 'Default - No Fees',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsNoFees,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default story with all accounts and recipients and no payment method fees. Shows the full functionality including conditional dropdown logic and auto-selection features.',
      },
    },
  },
};

/**
 * Story showcasing payment methods with fees.
 */
export const WithFees: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the component with payment method fees. ACH: $2.50, RTP: $1.00, WIRE: $25.00. The fee is displayed below each payment method option and in the transfer fee section when the form is filled.',
      },
    },
  },
};

/**
 * LIMITED_DDA Account: Tests the conditional dropdown logic where only active linked accounts are shown.
 */
export const LimitedDDAAccount: Story = {
  name: 'LIMITED_DDA Account - Active Linked Accounts Only',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
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
        http.get('/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2]], // LIMITED_DDA account only
          });
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
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
  name: 'Single Account + Single Active Linked Account',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one account (LIMITED_DDA) and one active linked account are available, both are automatically selected. This demonstrates the auto-selection feature.',
      },
    },
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({
            recipients: [mockRecipients[0]], // Only one active linked account
          });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json({
            ...mockAccounts,
            items: [mockAccounts.items[2]], // Only LIMITED_DDA account
          });
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
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
  name: 'Transaction Error Handling',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
    onTransactionSettled: (response, error) => {
      if (response) {
        // eslint-disable-next-line no-console
        console.log('@@TRANSACTION response data', response);
      } else if (error) {
        // eslint-disable-next-line no-console
        console.log('@@TRANSACTION response error', error);
      }
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
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
 * This story demonstrates the case where the preselected recipient is NOT on the first page
 * of the paginated list, requiring a separate GET /recipients/:id call to fetch it.
 */
export const WithPreselectedRecipient: Story = {
  name: 'Pre-selected Recipient (Not on First Page)',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    recipientId: 'recipient-on-page-2', // This recipient is NOT in the first page
    icon: 'CirclePlus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the recipientId prop functionality when the recipient is NOT on the first page of the paginated list. The component uses GET /recipients/:id to fetch the specific recipient, ensuring it works correctly even when pagination limits the initial list response.',
      },
    },
    msw: {
      handlers: [
        // Handler for GET /recipients/:id - MUST come before /recipients to avoid conflicts
        http.get('/recipients/:recipientId', ({ params }) => {
          const recipientId = params.recipientId as string;

          // If requesting the preselected recipient, return it
          if (recipientId === 'recipient-on-page-2') {
            return HttpResponse.json({
              id: 'recipient-on-page-2',
              type: 'RECIPIENT',
              status: 'ACTIVE',
              clientId: 'client-001',
              partyDetails: {
                type: 'INDIVIDUAL',
                firstName: 'Bob',
                lastName: 'Wilson',
                address: {
                  addressLine1: '999 Remote Street',
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
                    value: '5559998888',
                    countryCode: '+1',
                  },
                ],
              },
              account: {
                id: 'acc-remote',
                number: '999988887777',
                type: 'CHECKING',
                countryCode: 'US',
                routingInformation: [
                  {
                    routingCodeType: 'USABA',
                    routingNumber: '777000888',
                    transactionType: 'ACH',
                  },
                  {
                    routingCodeType: 'USABA',
                    routingNumber: '777000888',
                    transactionType: 'RTP',
                  },
                  {
                    routingCodeType: 'USABA',
                    routingNumber: '777000888',
                    transactionType: 'WIRE',
                  },
                ],
              },
              createdAt: '2024-01-25T12:00:00Z',
              updatedAt: '2024-01-25T12:00:00Z',
            });
          }

          // For other recipient IDs, try to find in mockRecipients
          const recipient = mockRecipients.find((r) => r.id === recipientId);
          if (recipient) {
            return HttpResponse.json(recipient);
          }

          // Not found
          return HttpResponse.json(
            { error: 'Recipient not found' },
            { status: 404 }
          );
        }),
        // Paginated recipients list - only returns first 2 recipients (simulating page 1)
        http.get('/recipients', () => {
          return HttpResponse.json({
            recipients: mockRecipients.slice(0, 2), // Only first 2 recipients
            metadata: {
              page: 0,
              limit: 2,
              total_items: 6, // Total includes all recipients
            },
          });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-remote',
            recipientId: 'recipient-on-page-2',
            transactionReferenceId: 'PAY-1234567890',
            type: 'ACH',
            memo: 'Test payment',
            status: 'PENDING',
            paymentDate: '2024-01-15',
            createdAt: '2024-01-15T10:30:00Z',
            debtorName: 'John Doe',
            creditorName: 'Bob Wilson',
            debtorAccountNumber: '****1234',
            creditorAccountNumber: '****7777',
          });
        }),
      ],
    },
  },
};

/**
 * Without Preview Panel: Tests the showPreviewPanel=false functionality.
 */
export const WithoutPreviewPanel: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
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
 * Ghost Variant with No Icon: Demonstrates a subtle trigger button style.
 */
export const GhostVariantNoIcon: Story = {
  name: 'Ghost Variant - No Icon',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    triggerButtonVariant: 'ghost',
    icon: undefined, // No icon
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MakePayment component with a Ghost variant trigger button and no icon. The Ghost variant provides a subtle, minimal appearance suitable for secondary actions or less prominent UI elements.',
      },
    },
  },
};

/**
 * SellSense Theme: Demonstrates the component with SellSense brand theming.
 */
export const SellSenseTheme: Story = {
  name: 'SellSense Theme',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    themePreset: 'SellSense',
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
  name: 'Manual recipient entry',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          // Still return recipients; user will switch to manual mode
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', async ({ request }) => {
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
          'Use the new toggle to switch to "Enter details" and provide recipient info inline. This posts to /transactions without creating a recipient.',
      },
    },
  },
};

export const FunctionalTestingNoMocks: Story = {
  name: 'Functional Testing with no mocks',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
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

/**
 * Account Balance API Error: Demonstrates error handling when the account balance API fails.
 */
export const AccountBalanceError: Story = {
  name: 'Account Balance API Error',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
    showPreviewPanel: true,
    reactQueryDefaultOptions: {
      queries: {
        retry: false,
      },
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        // Mock failed balance API call - always fails
        http.get('/accounts/:accountId/balances', () => {
          return HttpResponse.json(
            {
              httpStatus: 500,
              title: 'Internal Server Error',
              context: [
                {
                  code: 'BALANCE_SERVICE_UNAVAILABLE',
                  message: 'Unable to retrieve account balance at this time',
                },
              ],
            },
            { status: 500 }
          );
        }),
        // Also support versioned paths - always fails
        http.get('/v*/accounts/:accountId/balances', () => {
          return HttpResponse.json(
            {
              httpStatus: 500,
              title: 'Internal Server Error',
              context: [
                {
                  code: 'BALANCE_SERVICE_UNAVAILABLE',
                  message: 'Unable to retrieve account balance at this time',
                },
              ],
            },
            { status: 500 }
          );
        }),
        http.post('/transactions', () => {
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
    docs: {
      description: {
        story:
          'This story demonstrates error handling when the account balance API fails. Select an account to see the error state with a retry button. The balance API will always fail in this story. The form remains functional even when balance information cannot be loaded.',
      },
    },
  },
};

/**
 * Accounts API Error: Demonstrates error handling when the GET accounts API fails.
 */
export const AccountsError: Story = {
  name: 'Accounts API Error',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
    showPreviewPanel: true,
    reactQueryDefaultOptions: {
      queries: {
        retry: false,
      },
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({ recipients: mockRecipients });
        }),
        // Mock failed accounts API call - succeeds on first retry
        http.get('/accounts', () => {
          if (accountsRetryCount.count === 0) {
            // First call fails
            accountsRetryCount.count = 1;
            return HttpResponse.json(
              {
                httpStatus: 500,
                title: 'Internal Server Error',
                context: [
                  {
                    code: 'ACCOUNTS_SERVICE_UNAVAILABLE',
                    message: 'Unable to retrieve accounts at this time',
                  },
                ],
              },
              { status: 500 }
            );
          }

          // Retry succeeds
          return HttpResponse.json(mockAccounts);
        }),
        // Also support versioned paths - succeeds on first retry
        http.get('/v*/accounts', () => {
          if (accountsRetryCount.count === 0) {
            accountsRetryCount.count = 1;
            return HttpResponse.json(
              {
                httpStatus: 500,
                title: 'Internal Server Error',
                context: [
                  {
                    code: 'ACCOUNTS_SERVICE_UNAVAILABLE',
                    message: 'Unable to retrieve accounts at this time',
                  },
                ],
              },
              { status: 500 }
            );
          }

          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.get('/v*/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
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
    docs: {
      description: {
        story:
          'This story demonstrates error handling when the GET accounts API fails. The account selector will show an error message with a retry button. Clicking retry will succeed on the first attempt. When a recipient is selected and accounts API is failing, the payment method selector will show "No payment methods available for this recipient."',
      },
    },
  },
};

/**
 * Helper function to generate a large number of recipients for pagination testing
 */
function generateManyRecipients(count: number) {
  const recipients = [];
  const firstNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Edward',
    'Fiona',
    'George',
    'Hannah',
    'Ivan',
    'Julia',
    'Kevin',
    'Laura',
    'Michael',
    'Nancy',
    'Oliver',
    'Patricia',
    'Quinn',
    'Rachel',
    'Samuel',
    'Tina',
  ];
  const lastNames = [
    'Anderson',
    'Brown',
    'Clark',
    'Davis',
    'Evans',
    'Foster',
    'Garcia',
    'Harris',
    'Jackson',
    'King',
    'Lee',
    'Martinez',
    'Nelson',
    'Owen',
    'Parker',
    'Quinn',
    'Roberts',
    'Smith',
    'Taylor',
    'White',
  ];
  const cities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
  ];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];

  for (let i = 0; i < count; i += 1) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const cityIndex = i % cities.length;
    const isLinkedAccount = i % 3 === 0; // Every 3rd recipient is a linked account

    recipients.push({
      id: `recipient-${i + 1}`,
      type: isLinkedAccount ? 'LINKED_ACCOUNT' : 'RECIPIENT',
      status: 'ACTIVE',
      clientId: 'client-001',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName,
        lastName,
        address: {
          addressLine1: `${i + 1} Main Street`,
          city: cities[cityIndex],
          state: states[cityIndex],
          postalCode: `${10000 + i}`,
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          },
        ],
      },
      account: {
        id: `acc-${i + 1000}`,
        number: `${1000000000 + i}`,
        type: i % 2 === 0 ? 'CHECKING' : 'SAVINGS',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: `${111000000 + (i % 1000)}`,
            transactionType: 'ACH',
          },
          ...(i % 2 === 0
            ? [
                {
                  routingCodeType: 'USABA',
                  routingNumber: `${111000000 + (i % 1000)}`,
                  transactionType: 'RTP',
                },
              ]
            : []),
        ],
      },
      createdAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z`,
      updatedAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z`,
    });
  }

  return recipients;
}

/**
 * Many Recipients: Demonstrates pagination with a large number of recipients (75 across 3 pages).
 * This story shows that the infinite query automatically loads all recipients across multiple pages.
 */
export const ManyRecipients: Story = {
  name: 'Many Recipients (3 Pages)',
  args: {
    apiBaseUrl: '/',
    paymentMethods: paymentMethodsWithFees,
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MakePayment component with 75 recipients across 3 pages (25 per page). The component uses infinite queries to automatically load all recipients across multiple pages. Open the recipient selector to see all recipients are available for selection, even though they span 3 API pages. You can verify pagination is working by checking the network tab - you should see 3 API calls to /recipients with page=0, page=1, and page=2.',
      },
    },
    msw: {
      handlers: [
        // Paginated recipients handler - returns recipients in pages
        http.get('/recipients', ({ request }) => {
          const url = new URL(request.url);
          const page = Math.max(
            0,
            parseInt(url.searchParams.get('page') || '0', 10)
          );
          const limit = Math.min(
            25,
            Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10))
          );

          // Generate 75 recipients total (3 pages × 25 per page)
          const allRecipients = generateManyRecipients(75);
          const totalItems = allRecipients.length;

          // Apply pagination
          const startIndex = page * limit;
          const endIndex = startIndex + limit;
          const paginatedRecipients = allRecipients.slice(startIndex, endIndex);

          return HttpResponse.json({
            recipients: paginatedRecipients,
            metadata: {
              page,
              limit,
              total_items: totalItems,
            },
          });
        }),
        // Handler for GET /recipients/:id
        http.get('/recipients/:recipientId', ({ params }) => {
          const recipientId = params.recipientId as string;
          const allRecipients = generateManyRecipients(75);
          const recipient = allRecipients.find((r) => r.id === recipientId);
          if (recipient) {
            return HttpResponse.json(recipient);
          }
          return HttpResponse.json(
            { error: 'Recipient not found' },
            { status: 404 }
          );
        }),
        http.get('/accounts', () => {
          return HttpResponse.json(mockAccounts);
        }),
        http.get('/accounts/:accountId/balances', ({ params }) => {
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
        http.post('/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'recipient-1',
            transactionReferenceId: 'PAY-1234567890',
            type: 'ACH',
            memo: 'Test payment',
            status: 'PENDING',
            paymentDate: '2024-01-15',
            createdAt: '2024-01-15T10:30:00Z',
            debtorName: 'John Doe',
            creditorName: 'Alice Anderson',
            debtorAccountNumber: '****1234',
            creditorAccountNumber: '****0001',
          });
        }),
      ],
    },
  },
};
