/**
 * PaymentFlow - State Stories
 *
 * Showcases the different loading, error, and empty states of the PaymentFlow component.
 * These states handle edge cases when fetching accounts fails or no accounts are available.
 *
 * ## State Types:
 * - **Loading**: Skeleton UI while accounts are being fetched
 * - **Error**: Fatal error when accounts API fails
 * - **Empty**: No accounts available after successful fetch
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';

import { Button } from '@/components/ui/button';

import { PaymentFlow } from '../PaymentFlow';
import {
  commonArgs,
  commonArgTypes,
  createPaymentFlowHandlers,
  mockAccounts,
  mockLinkedAccounts,
  mockRecipients,
} from './story-utils';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Core/PaymentFlow/States',
  component: PaymentFlow,
  tags: ['@core', '@payments'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
These stories demonstrate the different states the PaymentFlow component can be in
when loading accounts or when errors occur.

## States Covered

1. **Loading State**: Shows a skeleton UI that matches the actual form layout
2. **Error State**: Shows an error message with a retry button when accounts fail to load
3. **Empty State**: Shows a friendly message when no accounts are available

These states are automatically shown based on the API response status.
        `,
      },
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof PaymentFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Handler Factories for Different States
// ============================================================================

/**
 * Creates handlers that simulate a very slow accounts load to show loading state
 */
function createLoadingHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - very slow load (10 seconds to observe skeleton)
    http.get('/accounts', async () => {
      await delay(10000);
      return HttpResponse.json({
        items: [],
        metadata: { page: 0, limit: 10, total_items: 0 },
      });
    }),

    // Balances - won't be called since no accounts
    http.get('/accounts/:id/balances', async () => {
      await delay(300);
      return HttpResponse.json({
        accountId: 'unknown',
        currency: 'USD',
        balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
      });
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers for progressive loading with initial data:
 * - Recipients load quickly (1s)
 * - Accounts load slowly (4s)
 * - Balances load after accounts (2s more)
 */
function createProgressiveLoadingHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - slow load (4 seconds)
    http.get('/accounts', async () => {
      await delay(4000);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - loads after accounts (2 more seconds)
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(2000);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - fast load (1 second)
    http.get('/recipients', async ({ request }) => {
      await delay(1000);
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
  ];
}

/**
 * Creates handlers where accounts load fast but recipients load slowly.
 * Good for showing the "looking for initial recipient" state.
 */
function createLoadingRecipientsHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - fast load
    http.get('/accounts', async () => {
      await delay(300);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - fast load
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(500);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - slow load (8 seconds to observe loading state)
    http.get('/recipients', async ({ request }) => {
      await delay(8000);
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
  ];
}

/**
 * Creates handlers where accounts load quickly but balances load slowly
 */
function createLoadingBalancesHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - fast load
    http.get('/accounts', async () => {
      await delay(300);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - slow load (5 seconds to observe)
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(5000);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers that simulate an accounts API failure
 */
function createAccountsErrorHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - 500 error
    http.get('/accounts', async () => {
      await delay(500);
      return HttpResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to fetch accounts. Please try again.',
        },
        { status: 500 }
      );
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers that return empty accounts
 */
function createEmptyAccountsHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - empty response
    http.get('/accounts', async () => {
      await delay(500);
      return HttpResponse.json({
        items: [],
        metadata: { page: 0, limit: 10, total_items: 0 },
      });
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers that simulate network timeout
 */
function createNetworkTimeoutHandlers() {
  return [
    // Accounts - network error
    http.get('/accounts', async () => {
      await delay(1000);
      return HttpResponse.error();
    }),

    // Recipients - normal but also fails
    http.get('/recipients', async () => {
      await delay(300);
      return HttpResponse.error();
    }),
  ];
}

/**
 * Creates handlers where first request fails, retry succeeds
 */
function createRetrySuccessHandlers() {
  let accountsAttempts = 0;
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - fails first time, succeeds on retry
    http.get('/accounts', async () => {
      await delay(500);
      accountsAttempts += 1;

      if (accountsAttempts === 1) {
        return HttpResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }

      return HttpResponse.json({
        items: [
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
        ],
        metadata: { page: 0, limit: 10, total_items: 1 },
      });
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers where balances fail to load
 */
function createFailedBalancesHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - normal
    http.get('/accounts', async () => {
      await delay(300);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - 500 error
    http.get('/accounts/:id/balances', async () => {
      await delay(500);
      return HttpResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers where recipients fail to load
 */
function createFailedRecipientsHandlers() {
  return [
    // Accounts - normal
    http.get('/accounts', async () => {
      await delay(300);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - normal
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(300);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - 500 error
    http.get('/recipients', async () => {
      await delay(500);
      return HttpResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }),
  ];
}

/**
 * Creates handlers for mismatched initial account scenario.
 * Returns normal data but the initial account ID won't exist in the response.
 */
function createMismatchedAccountHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - normal but doesn't contain the initial account ID
    http.get('/accounts', async () => {
      await delay(500);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - normal
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(300);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

/**
 * Creates handlers for mismatched initial payee scenario.
 * Returns normal data but the initial payee ID won't exist in the response.
 */
function createMismatchedPayeeHandlers() {
  const allRecipients = [...mockRecipients, ...mockLinkedAccounts];

  return [
    // Accounts - normal
    http.get('/accounts', async () => {
      await delay(300);
      return HttpResponse.json(mockAccounts);
    }),

    // Balances - normal
    http.get('/accounts/:id/balances', async ({ params }) => {
      await delay(300);
      const balanceData: Record<string, object> = {
        'acc-limited-dda': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 25000.0 }],
        },
        'acc-payments-main': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 15000.0 }],
        },
        'acc-payments-empty': {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        },
      };
      return HttpResponse.json(
        balanceData[params.id as string] ?? {
          accountId: params.id,
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 0 }],
        }
      );
    }),

    // Recipients - normal
    http.get('/recipients', async ({ request }) => {
      await delay(300);
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
  ];
}

// ============================================================================
// Loading State Stories
// ============================================================================

/**
 * Loading state with skeleton UI.
 * Shows a skeleton that matches the actual form layout for a seamless transition.
 *
 * **Observe:**
 * - Skeleton matches the StepSection layout
 * - Account rows show placeholder content
 * - Connecting lines are lighter to indicate loading
 * - Review panel shows skeleton for selected items when initial data exists
 */
export const LoadingState: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createLoadingHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows the loading skeleton while accounts are being fetched. The skeleton mirrors the actual UI layout for a seamless transition when data loads.',
      },
    },
  },
};

/**
 * Loading state with initial data - Progressive loading.
 * Shows how data loads progressively when initial account/payee are provided:
 * - Recipients load first (1s)
 * - Accounts load next (4s)
 * - Balances load last (6s total)
 *
 * **Observe:**
 * - Review panel shows skeletons for the pre-selected items
 * - Recipients tab becomes available first
 * - Account list appears after 4 seconds
 * - Balances fill in 2 seconds after accounts
 */
export const LoadingStateWithInitialData: Story = {
  args: {
    open: true,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-alice',
  },
  parameters: {
    msw: {
      handlers: createProgressiveLoadingHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates progressive loading: recipients load first, then accounts, then balances. Review panel shows skeletons for pre-selected items.',
      },
    },
  },
};

/**
 * Loading balances state.
 * Accounts load quickly but balances take time to fetch.
 *
 * **Observe:**
 * - Accounts appear immediately in the list
 * - Balance amounts show loading placeholders
 * - "Available" text shows skeleton or placeholder until balance loads
 */
export const LoadingBalances: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createLoadingBalancesHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows the state where accounts have loaded but balances are still being fetched. This demonstrates the progressive loading experience.',
      },
    },
  },
};

/**
 * Loading recipients with initial payee selected.
 * Accounts and balances load quickly, but recipients take time to fetch.
 * Shows the "looking for initial recipient" state.
 *
 * **Observe:**
 * - Account list appears immediately with balances
 * - Review panel shows skeleton for the pre-selected payee
 * - Payee section shows loading spinner
 * - Once recipients load, the initial payee is found and displayed
 */
export const LoadingInitialRecipient: Story = {
  args: {
    open: true,
    initialPayeeId: 'recipient-alice',
  },
  parameters: {
    msw: {
      handlers: createLoadingRecipientsHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows the state where an initial payee is selected but recipients are still loading. The review panel shows a skeleton for the payee while we search for it.',
      },
    },
  },
};

// ============================================================================
// Error State Stories
// ============================================================================

/**
 * Error state when accounts API fails.
 * Shows a full-screen error with a retry button.
 *
 * **Features:**
 * - Clear error message explaining the issue
 * - "Try Again" button to retry the failed request
 * - Spinning indicator while retrying
 */
export const ErrorState: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createAccountsErrorHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows when the accounts API returns an error. Users can click "Try Again" to retry the request.',
      },
    },
  },
};

/**
 * Network timeout error.
 * Simulates when the network request fails entirely.
 */
export const NetworkError: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createNetworkTimeoutHandlers(),
    },
    docs: {
      description: {
        story:
          'Simulates a network failure. The error view shows with an option to retry.',
      },
    },
  },
};

/**
 * Error that recovers on retry.
 * First request fails, retry succeeds.
 *
 * **Test this:**
 * 1. Observe the error state
 * 2. Click "Try Again"
 * 3. Watch it successfully load
 */
export const ErrorThenSuccess: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createRetrySuccessHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates the retry flow. The first request fails with a 503 error, but clicking "Try Again" succeeds.',
      },
    },
  },
};

// ============================================================================
// Empty State Stories
// ============================================================================

/**
 * Empty state when no accounts are available.
 * Shows a friendly message explaining the situation.
 *
 * **This happens when:**
 * - User has no bank accounts linked
 * - All accounts are closed or inactive
 * - Accounts are filtered out by business rules
 */
export const EmptyState: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createEmptyAccountsHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows when accounts fetch succeeds but returns no accounts. Users see a friendly message and can close the dialog.',
      },
    },
  },
};

/**
 * Empty state with close button.
 * Demonstrates the onClose callback integration.
 */
export const EmptyStateWithClose: Story = {
  args: {
    trigger: <Button>Transfer Funds</Button>,
  },
  parameters: {
    msw: {
      handlers: createEmptyAccountsHandlers(),
    },
    docs: {
      description: {
        story:
          'Empty state with a trigger button. Opening the dialog shows the empty state, and the close button dismisses it.',
      },
    },
  },
};

// ============================================================================
// Failed Data Stories
// ============================================================================

/**
 * Failed to load balances.
 * Accounts load successfully but balances fail to fetch.
 *
 * **Observe:**
 * - Accounts appear in the list
 * - Balance shows "--" with "Unavailable" text
 * - Users can still select accounts but won't see balance info
 * - Review panel shows "Balance unavailable" for selected account
 */
export const FailedBalances: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createFailedBalancesHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates graceful degradation when balance API fails. Accounts are still usable but balance information is unavailable.',
      },
    },
  },
};

/**
 * Failed to load recipients.
 * Accounts and balances load but recipients fail to fetch.
 *
 * **Observe:**
 * - Account selection works normally
 * - Payee section shows an error state
 * - Users can retry loading recipients
 */
export const FailedRecipients: Story = {
  args: {
    open: true,
  },
  parameters: {
    msw: {
      handlers: createFailedRecipientsHandlers(),
    },
    docs: {
      description: {
        story:
          'Shows the state when recipients API fails. Users can still select accounts but cannot proceed without recipients.',
      },
    },
  },
};

// ============================================================================
// Initial Data Mismatch Stories
// ============================================================================

/**
 * Mismatched initial account ID.
 * The initialAccountId provided doesn't exist in the fetched accounts.
 *
 * **Observe:**
 * - A warning banner appears explaining the account wasn't found
 * - The account selection is cleared and user must select manually
 * - The warning includes the partial ID for debugging
 */
export const MismatchedInitialAccount: Story = {
  args: {
    open: true,
    // This account ID doesn't exist in mockAccounts
    initialAccountId: 'acc-deleted-or-closed-12345',
  },
  parameters: {
    msw: {
      handlers: createMismatchedAccountHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates the warning when a pre-selected account is no longer available (e.g., closed account, stale link). Users see a warning and must select a different account.',
      },
    },
  },
};

/**
 * Mismatched initial payee ID.
 * The initialPayeeId provided doesn't exist in the fetched recipients.
 *
 * **Observe:**
 * - A warning banner appears explaining the payee wasn't found
 * - The payee selection is cleared and user must select manually
 * - Account selection still works normally
 */
export const MismatchedInitialPayee: Story = {
  args: {
    open: true,
    // This payee ID doesn't exist in mockRecipients or mockLinkedAccounts
    initialPayeeId: 'recipient-deleted-or-archived-67890',
  },
  parameters: {
    msw: {
      handlers: createMismatchedPayeeHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates the warning when a pre-selected payee is no longer available (e.g., deleted recipient, archived contact). Users see a warning and must select a different payee.',
      },
    },
  },
};

/**
 * Both initial account and payee are mismatched.
 * Neither the initialAccountId nor initialPayeeId exist in fetched data.
 *
 * **Observe:**
 * - Warning banner shows both issues
 * - User must manually select both account and payee
 * - Flow still works normally after manual selection
 */
export const MismatchedBothInitialData: Story = {
  args: {
    open: true,
    // Neither exists in mock data
    initialAccountId: 'acc-nonexistent-account',
    initialPayeeId: 'recipient-nonexistent-payee',
  },
  parameters: {
    msw: {
      handlers: createMismatchedAccountHandlers(),
    },
    docs: {
      description: {
        story:
          'Demonstrates when both pre-selected account and payee are unavailable. The warning shows both issues, and users must select both manually.',
      },
    },
  },
};

// ============================================================================
// Account Restriction Stories
// ============================================================================

/**
 * Account restrictions based on payee type.
 * When an external recipient is selected, LIMITED_DDA accounts are disabled.
 *
 * **Observe:**
 * - External recipient (Alice Johnson) is pre-selected
 * - "Payroll Account" (LIMITED_DDA) appears disabled with reason text
 * - Other accounts can be selected normally
 * - Trying to click the disabled account does nothing
 */
export const AccountRestrictionsForRecipient: Story = {
  args: {
    open: true,
    // Pre-select an external recipient (type: 'RECIPIENT')
    initialPayeeId: 'recipient-alice',
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowHandlers({ delayMs: 200 }),
    },
    docs: {
      description: {
        story: `
Demonstrates proactive account restrictions based on the selected payee type.

**Business Rule:** LIMITED_DDA accounts can only send payments to linked accounts, not external recipients.

**Behavior:**
- When an external recipient is selected (pre-selected or by user)
- LIMITED_DDA accounts appear disabled with the reason: "Not available for external recipients"
- This prevents users from making an invalid account selection
- User must select a non-LIMITED_DDA account or change the payee to a linked account
        `,
      },
    },
  },
};

/**
 * No account restrictions for linked accounts.
 * When a linked account payee is selected, all accounts are available.
 *
 * **Observe:**
 * - Linked account (John Doe) is pre-selected
 * - All accounts including LIMITED_DDA can be selected
 * - No restrictions are shown
 */
export const NoRestrictionsForLinkedAccount: Story = {
  args: {
    open: true,
    // Pre-select a linked account (type: 'LINKED_ACCOUNT')
    initialPayeeId: 'linked-john',
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowHandlers({ delayMs: 200 }),
    },
    docs: {
      description: {
        story: `
Demonstrates that linked account payees have no account restrictions.

**Business Rule:** Linked accounts can receive payments from any account type, including LIMITED_DDA.

**Behavior:**
- When a linked account is selected (pre-selected or by user)
- All accounts are available for selection
- This includes LIMITED_DDA accounts (e.g., "Payroll Account")
        `,
      },
    },
  },
};
