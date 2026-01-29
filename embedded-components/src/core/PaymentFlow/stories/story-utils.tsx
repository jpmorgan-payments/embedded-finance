/**
 * Shared utilities for PaymentFlow stories
 *
 * This module provides:
 * - Mock data for accounts, recipients, and linked accounts
 * - MSW handler factories for payment flow endpoints
 * - Common story configuration (args, argTypes)
 * - Helper functions for story setup
 *
 * Stories use the EBComponentsProvider applied globally via decorator in preview.tsx.
 */

import { delay, http, HttpResponse } from 'msw';

import type { PaymentMethod } from '../PaymentFlow.types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentFlowHandlerOptions {
  /** Network delay in milliseconds (default: 300ms) */
  delayMs?: number;
  /** Whether to simulate transaction errors */
  simulateError?: boolean;
  /** Custom error response for transaction failures */
  errorResponse?: {
    status: number;
    message: string;
  };
  /** Override accounts data */
  accounts?: typeof mockAccounts.items;
  /** Override recipients data */
  recipients?: typeof mockRecipients;
}

// ============================================================================
// Mock Data - Accounts
// ============================================================================

export const mockAccounts = {
  items: [
    {
      id: 'acc-limited-dda',
      clientId: 'mock-client-id',
      label: 'Payroll Account',
      state: 'OPEN',
      category: 'LIMITED_DDA',
      paymentRoutingInformation: {
        accountNumber: '30000000003456',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '028000024' }],
      },
      balance: { available: 25000.0, current: 25000.0, currency: 'USD' },
      createdAt: '2024-01-03T11:00:00Z',
    },
    {
      id: 'acc-payments-main',
      clientId: 'mock-client-id',
      label: 'Main Payments Account',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '10000000001234',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '028000024' }],
      },
      balance: { available: 15000.0, current: 15250.0, currency: 'USD' },
      createdAt: '2024-01-01T08:00:00Z',
    },
    {
      id: 'acc-payments-empty',
      clientId: 'mock-client-id',
      label: 'Secondary Payments Account',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '10000000005678',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '028000024' }],
      },
      balance: { available: 0, current: 0, currency: 'USD' },
      createdAt: '2024-01-05T10:00:00Z',
    },
  ],
  metadata: { page: 0, limit: 10, total_items: 3 },
};

// ============================================================================
// Mock Data - Recipients (Regular)
// ============================================================================

export const mockRecipients = [
  // Regular Recipients
  {
    id: 'recipient-alice',
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
      contacts: [{ contactType: 'EMAIL', value: 'alice.johnson@email.com' }],
    },
    account: {
      id: 'acc-alice',
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
    id: 'recipient-techsolutions',
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
      contacts: [{ contactType: 'EMAIL', value: 'payments@techsolutions.com' }],
    },
    account: {
      id: 'acc-techsolutions',
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
    id: 'recipient-bob',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Bob',
      lastName: 'Williams',
      address: {
        addressLine1: '789 Oak Lane',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        countryCode: 'US',
      },
      contacts: [{ contactType: 'EMAIL', value: 'bob.williams@email.com' }],
    },
    account: {
      id: 'acc-bob',
      number: '888899990000',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '777000888',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-22T14:00:00Z',
    updatedAt: '2024-01-22T14:00:00Z',
  },
];

// ============================================================================
// Mock Data - Linked Accounts
// ============================================================================

export const mockLinkedAccounts = [
  {
    id: 'linked-john',
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
      contacts: [{ contactType: 'EMAIL', value: 'john.doe@email.com' }],
    },
    account: {
      id: 'acc-john',
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
    id: 'linked-company',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Partner Company LLC',
      address: {
        addressLine1: '789 Business Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        countryCode: 'US',
      },
      contacts: [{ contactType: 'EMAIL', value: 'payments@partner.com' }],
    },
    account: {
      id: 'acc-company',
      number: '2468135790',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '333000222',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'USABA',
          routingNumber: '333000222',
          transactionType: 'WIRE',
        },
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
];

// ============================================================================
// Mock Data - Payment Methods
// ============================================================================

export const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: 'Standard bank transfer',
    estimatedDelivery: '1-3 business days',
    fee: 0,
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same-day transfer',
    estimatedDelivery: 'Same day',
    fee: 25,
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant transfer',
    estimatedDelivery: 'Within minutes',
    fee: 5,
  },
];

export const achOnlyPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: 'Standard bank transfer',
    estimatedDelivery: '1-3 business days',
    fee: 0,
  },
];

export const paymentMethodsWithFees: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: 'Standard bank transfer',
    estimatedDelivery: '1-3 business days',
    fee: 1.5,
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same-day transfer',
    estimatedDelivery: 'Same day',
    fee: 35,
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant transfer',
    estimatedDelivery: 'Within minutes',
    fee: 10,
  },
];

// ============================================================================
// MSW Handlers Factory
// ============================================================================

/**
 * Creates MSW handlers for PaymentFlow stories
 */
export function createPaymentFlowHandlers(
  options: PaymentFlowHandlerOptions = {}
): ReturnType<typeof http.get>[] {
  const {
    delayMs = 300,
    simulateError = false,
    errorResponse = { status: 500, message: 'Transaction failed' },
    accounts = mockAccounts.items,
    recipients = mockRecipients,
  } = options;

  const allRecipients = [...recipients, ...mockLinkedAccounts];

  // Mock balance data
  const balanceData: Record<string, object> = {
    'acc-limited-dda': {
      accountId: 'acc-limited-dda',
      currency: 'USD',
      balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
    },
    'acc-payments-main': {
      accountId: 'acc-payments-main',
      currency: 'USD',
      balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
    },
    'acc-payments-empty': {
      accountId: 'acc-payments-empty',
      currency: 'USD',
      balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
    },
  };

  return [
    // List accounts
    http.get('/accounts', async () => {
      await delay(delayMs);
      return HttpResponse.json({
        items: accounts,
        metadata: mockAccounts.metadata,
      });
    }),

    // Get account balance
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(delayMs);
      const balance = balanceData[params.id as string];
      if (balance) {
        return HttpResponse.json(balance);
      }
      return HttpResponse.json({
        accountId: params.id,
        currency: 'USD',
        balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
      });
    }),

    // List recipients (includes linked accounts)
    http.get('/recipients', async ({ request }) => {
      await delay(delayMs);
      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      const filteredRecipients = type
        ? allRecipients.filter((r) => r.type === type)
        : allRecipients;
      return HttpResponse.json({
        recipients: filteredRecipients,
        metadata: {
          page: 0,
          limit: 100,
          total_items: filteredRecipients.length,
        },
      });
    }),

    // Get single recipient
    http.get('/recipients/:recipientId', async ({ params }) => {
      await delay(delayMs);
      const recipient = allRecipients.find((r) => r.id === params.recipientId);
      if (recipient) {
        return HttpResponse.json(recipient);
      }
      return HttpResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }),

    // Create recipient
    http.post('/recipients', async ({ request }) => {
      await delay(delayMs);
      const body = await request.json();
      const newRecipient = {
        id: `recipient-${Date.now()}`,
        type: (body as Record<string, unknown>).type || 'RECIPIENT',
        status: 'ACTIVE',
        clientId: 'mock-client-id',
        ...(body as Record<string, unknown>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(newRecipient, { status: 201 });
    }),

    // Update recipient (for enabling payment methods)
    http.patch('/recipients/:recipientId', async ({ params, request }) => {
      await delay(delayMs);
      const body = await request.json();
      const recipient = allRecipients.find((r) => r.id === params.recipientId);
      if (recipient) {
        const updated = {
          ...recipient,
          ...(body as Record<string, unknown>),
          updatedAt: new Date().toISOString(),
        };
        return HttpResponse.json(updated);
      }
      return HttpResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }),

    // Create transaction
    http.post('/transactions', async ({ request }) => {
      await delay(delayMs * 2); // Slightly longer for transaction

      if (simulateError) {
        return HttpResponse.json(
          { error: errorResponse.message },
          { status: errorResponse.status }
        );
      }

      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        id: `txn-${Date.now()}`,
        transactionReferenceId: `PAY-${Date.now()}`,
        amount: body.amount,
        currency: body.currency || 'USD',
        debtorAccountId: body.debtorAccountId,
        creditorAccountId: body.creditorAccountId,
        recipientId: body.recipientId,
        type: body.paymentType,
        memo: body.memo,
        status: 'PENDING',
        paymentDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });
    }),
  ];
}

/**
 * Creates handlers that simulate a slow network
 */
export function createSlowNetworkHandlers(): ReturnType<typeof http.get>[] {
  return createPaymentFlowHandlers({ delayMs: 2000 });
}

/**
 * Creates handlers that simulate transaction errors
 */
export function createErrorHandlers(errorConfig?: {
  status: number;
  message: string;
}): ReturnType<typeof http.get>[] {
  return createPaymentFlowHandlers({
    simulateError: true,
    errorResponse: errorConfig || {
      status: 500,
      message: 'Transaction failed. Please try again.',
    },
  });
}

// ============================================================================
// Common Story Args
// ============================================================================

export const commonArgs = {
  clientId: 'mock-client-id',
  paymentMethods: defaultPaymentMethods,
};

export const commonArgTypes = {
  clientId: {
    control: { type: 'text' as const },
    description: 'Client ID for fetching accounts and recipients',
    table: { category: 'Required' },
  },
  paymentMethods: {
    control: { type: 'object' as const },
    description: 'Available payment methods with fees and delivery times',
    table: { category: 'Configuration' },
  },
  showFees: {
    control: { type: 'boolean' as const },
    description: 'Whether to show fees in the review panel',
    table: { category: 'Configuration' },
  },
  initialAccountId: {
    control: { type: 'text' as const },
    description: 'Pre-selected account ID',
    table: { category: 'Initial State' },
  },
  initialPayeeId: {
    control: { type: 'text' as const },
    description: 'Pre-selected payee ID',
    table: { category: 'Initial State' },
  },
  initialPaymentMethod: {
    control: { type: 'select' as const },
    options: ['ACH', 'WIRE', 'RTP'],
    description: 'Pre-selected payment method',
    table: { category: 'Initial State' },
  },
  onTransactionComplete: {
    action: 'transactionComplete',
    description: 'Callback when transaction completes (success or error)',
    table: { category: 'Callbacks' },
  },
  onClose: {
    action: 'close',
    description: 'Callback when the flow is closed',
    table: { category: 'Callbacks' },
  },
  open: {
    control: { type: 'boolean' as const },
    description: 'Controlled open state',
    table: { category: 'Controlled Mode' },
  },
  onOpenChange: {
    action: 'openChange',
    description: 'Callback when open state changes',
    table: { category: 'Controlled Mode' },
  },
};
