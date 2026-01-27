/**
 * Shared utilities for Accounts stories
 *
 * This module provides:
 * - MSW handler factories for account endpoints
 * - Common story configuration (args, argTypes)
 * - Mock data for accounts
 *
 * Stories render the Accounts component directly.
 * The EBComponentsProvider is applied globally via a decorator in preview.tsx.
 */

import { http, HttpResponse } from 'msw';

import type {
  AccountBalanceResponse,
  AccountResponse,
} from '@/api/generated/ep-accounts.schemas';

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Mock account data for stories
 */
export const mockAccounts: AccountResponse[] = [
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
    createdAt: '2025-01-26T14:32:00.000Z',
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
    createdAt: '2025-01-26T14:35:00.000Z',
    category: 'LIMITED_DDA_PAYMENTS',
  },
];

/**
 * Mock balance data for accounts
 */
export const mockBalances: Record<string, AccountBalanceResponse> = {
  account1: {
    id: 'account1',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 5558.42 },
      { typeCode: 'ITBD', amount: 5558.42 },
    ],
  },
  account2: {
    id: 'account2',
    date: '2025-01-26',
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 125750.0 },
      { typeCode: 'ITBD', amount: 130250.75 },
    ],
  },
};

// ============================================================================
// MSW Handler Factories
// ============================================================================

/**
 * Configuration options for MSW handler creation
 */
export interface AccountsHandlerOptions {
  /** Network delay in milliseconds (default: 300ms) */
  delayMs?: number;
  /** Override accounts data */
  accounts?: AccountResponse[];
  /** Override balances data */
  balances?: Record<string, AccountBalanceResponse>;
  /** Force error response */
  forceError?: boolean;
  /** Error status code (default: 500) */
  errorStatus?: number;
}

/**
 * Creates MSW handlers for accounts API endpoints.
 *
 * @param options - Configuration for delays and mock data
 * @returns Array of MSW request handlers
 *
 * @example
 * ```tsx
 * export const MyStory: Story = {
 *   parameters: {
 *     msw: { handlers: createAccountsHandlers() }
 *   }
 * };
 * ```
 */
export const createAccountsHandlers = (options?: AccountsHandlerOptions) => {
  const delay = options?.delayMs ?? 300;
  const accounts = options?.accounts ?? mockAccounts;
  const balances = options?.balances ?? mockBalances;
  const forceError = options?.forceError ?? false;
  const errorStatus = options?.errorStatus ?? 500;

  return [
    // GET /accounts - List all accounts
    http.get('/accounts', async () => {
      await sleep(delay);

      if (forceError) {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: errorStatus }
        );
      }

      return HttpResponse.json({ items: accounts });
    }),

    // GET /accounts/:id/balances - Get account balance
    http.get('/accounts/:id/balances', async ({ params }) => {
      await sleep(delay);

      const { id } = params;
      const balance = balances[id as string];

      if (!balance) {
        return HttpResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      return HttpResponse.json(balance);
    }),
  ];
};

/**
 * Creates MSW handlers that simulate a loading state (never resolves)
 */
export const createLoadingHandlers = () => [
  http.get('/accounts', () => new Promise(() => {})),
];

/**
 * Creates MSW handlers that return an error
 */
export const createErrorHandlers = (
  status = 500,
  message = 'Internal Server Error'
) => [
  http.get('/accounts', () =>
    HttpResponse.json({ error: message }, { status })
  ),
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simulates network delay for realistic MSW responses
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Common default args for Accounts stories
 */
export const commonArgs = {
  allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  clientId: 'mock-client-id',
};

/**
 * Storybook controls and documentation for Accounts stories.
 */
export const commonArgTypes = {
  allowedCategories: {
    control: { type: 'object' as const },
    description:
      'Account categories to display (e.g., LIMITED_DDA, LIMITED_DDA_PAYMENTS)',
    table: {
      category: 'Filtering',
      defaultValue: { summary: "['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']" },
    },
  },
  clientId: {
    control: { type: 'text' as const },
    description: 'Optional client ID filter for accounts',
    table: {
      category: 'Filtering',
      defaultValue: { summary: 'undefined' },
    },
  },
  title: {
    control: { type: 'text' as const },
    description: 'Custom title for the accounts section',
    table: {
      category: 'Display',
      defaultValue: { summary: 'Accounts' },
    },
  },

  // === Callbacks ===
  userEventsHandler: {
    control: { disable: true },
    description: 'Callback for tracking user events',
    table: {
      category: 'Callbacks',
      type: { summary: '(event: UserEvent) => void' },
    },
  },
  userEventsLifecycle: {
    control: { disable: true },
    description: 'Lifecycle phase for event tracking',
    table: {
      category: 'Callbacks',
      type: { summary: "'mounted' | 'unmounted'" },
    },
  },
};
