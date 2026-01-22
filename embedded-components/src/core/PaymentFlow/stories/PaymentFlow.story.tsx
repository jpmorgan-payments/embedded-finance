import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { Button } from '@/components/ui/button';

import { PaymentFlow } from '../PaymentFlow';
import { DEFAULT_PAYMENT_METHODS } from '../PaymentFlow.constants';

// Helper to log actions
const logAction = (name: string) => () => {
  // eslint-disable-next-line no-console
  console.log(`[Action] ${name}`);
};

// Mock recipients matching MakePayment story structure
const mockRecipients = [
  // Linked Accounts
  {
    id: 'linkedAccount1',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
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
    clientId: 'mock-client-id',
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
    clientId: 'mock-client-id',
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
    clientId: 'mock-client-id',
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
    clientId: 'mock-client-id',
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

// Mock accounts matching MakePayment story structure
const mockAccounts = {
  items: [
    {
      id: 'account1',
      clientId: 'mock-client-id',
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
      clientId: 'mock-client-id',
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
      clientId: 'mock-client-id',
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
      clientId: 'mock-client-id',
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

// Mock account balances
const mockAccountBalances: Record<
  string,
  {
    balanceTypes: Array<{ typeCode: string; amount: number }>;
    currency: string;
  }
> = {
  account1: {
    balanceTypes: [
      { typeCode: 'ITAV', amount: 5000.0 },
      { typeCode: 'ITBD', amount: 5200.0 },
    ],
    currency: 'USD',
  },
  account2: {
    balanceTypes: [
      { typeCode: 'ITAV', amount: 15000.0 },
      { typeCode: 'ITBD', amount: 15200.0 },
    ],
    currency: 'USD',
  },
  account3: {
    balanceTypes: [
      { typeCode: 'ITAV', amount: 25000.0 },
      { typeCode: 'ITBD', amount: 25200.0 },
    ],
    currency: 'USD',
  },
  account4: {
    balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
    currency: 'USD',
  },
};

// MSW handlers for PaymentFlow
const mswHandlers = [
  // Accounts list
  http.get('/accounts', () => {
    return HttpResponse.json(mockAccounts);
  }),
  // Account balances
  http.get('/accounts/:accountId/balances', ({ params }) => {
    const accountId = params.accountId as string;
    const balance = mockAccountBalances[accountId];
    if (balance) {
      return HttpResponse.json(balance);
    }
    return HttpResponse.json({ error: 'Account not found' }, { status: 404 });
  }),
  // Recipients list (supports type filter and pagination)
  http.get('/recipients', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let filteredRecipients = mockRecipients;
    if (type) {
      filteredRecipients = mockRecipients.filter((r) => r.type === type);
    }

    return HttpResponse.json({
      recipients: filteredRecipients,
      metadata: {
        total_items: filteredRecipients.length,
        page: 0,
        limit: 25,
      },
    });
  }),
  // Single recipient by ID
  http.get('/recipients/:recipientId', ({ params }) => {
    const recipientId = params.recipientId as string;
    const recipient = mockRecipients.find((r) => r.id === recipientId);
    if (recipient) {
      return HttpResponse.json(recipient);
    }
    return HttpResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }),
  // Create transaction
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
];

const meta: Meta<typeof PaymentFlow> = {
  title: 'core/PaymentFlow/PaymentFlow',
  component: PaymentFlow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: `
The PaymentFlow component provides a complete payment/transfer flow within a modal dialog.
It uses a FlowContainer architecture to avoid double modal issues and provides a clean,
step-by-step experience for selecting payees, payment methods, accounts, and amounts.

## Features

- **Two-column layout**: Form on left, review panel on right (desktop)
- **Mobile-optimized**: Collapsible review panel on mobile with mandatory review
- **FlowContainer architecture**: View-based navigation avoids modal stacking
- **Collapsible sections**: Payee, Payment Method, From Account, Amount
- **Progressive disclosure**: Payment methods unlock after payee selection
- **Add payee inline**: Link external account or add new recipient
- **Enable payment methods**: Enable locked payment methods for existing payees
        `,
      },
    },
  },
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Client ID for fetching accounts and recipients',
    },
    onTransactionComplete: { action: 'transactionComplete' },
    onClose: { action: 'close' },
    paymentMethods: {
      control: 'object',
      description: 'Available payment methods',
    },
    initialAccountId: {
      control: 'text',
      description: 'Pre-selected account ID',
    },
    initialPayeeId: {
      control: 'text',
      description: 'Pre-selected payee ID',
    },
    initialPaymentMethod: {
      control: 'select',
      options: ['ACH', 'WIRE', 'RTP', 'BOOK'],
      description: 'Pre-selected payment method',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentFlow>;

/**
 * Default PaymentFlow with button trigger
 */
export const Default: Story = {
  args: {
    clientId: 'mock-client-id',
    trigger: <Button>Transfer Funds</Button>,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    onTransactionComplete: logAction('transactionComplete'),
    onClose: logAction('close'),
  },
};

/**
 * PaymentFlow with initial values pre-selected
 */
export const WithInitialValues: Story = {
  args: {
    clientId: 'mock-client-id',
    trigger: <Button>Transfer to Acme Corp</Button>,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    initialPayeeId: '1', // Acme Corp from mock data
    initialPaymentMethod: 'ACH',
    initialAccountId: 'acc-1',
    onTransactionComplete: logAction('transactionComplete'),
    onClose: logAction('close'),
  },
};

/**
 * Controlled open state
 */
export const Controlled: Story = {
  args: {
    clientId: 'mock-client-id',
    open: true,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    onTransactionComplete: logAction('transactionComplete'),
    onClose: logAction('close'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The dialog can be controlled externally using the `open` and `onOpenChange` props.',
      },
    },
  },
};

/**
 * PaymentFlow with limited payment methods
 */
export const LimitedPaymentMethods: Story = {
  args: {
    clientId: 'mock-client-id',
    trigger: <Button>ACH Transfer Only</Button>,
    paymentMethods: [
      {
        id: 'ACH',
        name: 'ACH Transfer',
        description: '1-3 business days',
        estimatedDelivery: '1-3 business days',
        fee: 0,
      },
    ],
    onTransactionComplete: logAction('transactionComplete'),
    onClose: logAction('close'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The available payment methods can be customized by passing a filtered list.',
      },
    },
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  args: {
    clientId: 'mock-client-id',
    trigger: <Button>Transfer Funds</Button>,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    onTransactionComplete: logAction('transactionComplete'),
    onClose: logAction('close'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile, the review panel appears as a collapsible bottom sheet that must be expanded before submitting.',
      },
    },
  },
};
