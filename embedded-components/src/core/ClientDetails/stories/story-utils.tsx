/**
 * Shared utilities for ClientDetails stories
 */

import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { mockTransactionComplete } from '@/mocks/transactions.mock';
import { http, HttpResponse } from 'msw';

import type {
  AccountBalanceResponse,
  AccountResponse,
} from '@/api/generated/ep-accounts.schemas';
import {
  ClientStatus,
  type ClientResponse,
} from '@/api/generated/smbdo.schemas';

/** Mock client for stories (APPROVED for "fully onboarded" demo) */
export const mockClientDetails: ClientResponse = {
  ...efClientCorpEBMock,
  status: ClientStatus.APPROVED,
  results: {
    customerIdentityStatus: 'APPROVED',
  },
  questionResponses: [
    { questionId: '30005', values: ['5000'] },
    { questionId: '300001', values: ['US'] },
    { questionId: '300002', values: ['true'] },
    { questionId: '300003', values: ['true'] },
    { questionId: '300004', values: ['Retail', 'E-commerce'] },
  ],
};

/** Mock accounts for the Accounts section */
export const mockAccounts: AccountResponse[] = [
  {
    id: 'account1',
    clientId: '0030000133',
    label: 'MAIN3919',
    state: 'OPEN',
    paymentRoutingInformation: {
      accountNumber: '20000057603919',
      country: 'US',
      routingInformation: [{ type: 'ABA', value: '028000024' }],
    },
    createdAt: '2025-01-26T14:32:00.000Z',
    category: 'LIMITED_DDA_PAYMENTS',
  },
  {
    id: 'account2',
    clientId: '0030000133',
    label: 'SAVINGS001',
    state: 'OPEN',
    paymentRoutingInformation: {
      accountNumber: '20000097603212',
      country: 'US',
      routingInformation: [{ type: 'ABA', value: '028000024' }],
    },
    createdAt: '2025-01-26T14:35:00.000Z',
    category: 'LIMITED_DDA',
  },
];

/** Mock balances for accounts */
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

/** Mock transactions for the Activity section */
export const mockTransactions = [
  mockTransactionComplete,
  {
    ...mockTransactionComplete,
    id: 'txn-002',
    amount: 250.0,
    memo: 'Monthly subscription',
    payinOrPayout: 'PAYOUT',
    counterpartName: 'Subscription Service',
    createdAt: '2024-05-02T15:30:00Z',
  },
  {
    ...mockTransactionComplete,
    id: 'txn-003',
    amount: 3200.0,
    memo: 'Client payment received',
    payinOrPayout: 'PAYIN',
    counterpartName: 'ABC Corporation',
    createdAt: '2024-05-03T09:15:00Z',
  },
];

export interface ClientDetailsHandlerOptions {
  delayMs?: number;
  client?: ClientResponse;
  status?: number;
}

/**
 * Create MSW handlers for ClientDetails: GET /clients/:clientId and GET /questions
 * so question responses display full question sentences.
 * Also includes handlers for accounts and transactions for the embedded sections.
 */
export function createClientDetailsHandlers(
  options: ClientDetailsHandlerOptions = {}
) {
  const { delayMs = 200, client = mockClientDetails, status = 200 } = options;

  return [
    // Client endpoint
    http.get('/clients/:clientId', async () => {
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
      if (status !== 200) {
        return HttpResponse.json(
          { title: 'Not found', httpStatus: 404 },
          { status }
        );
      }
      return HttpResponse.json(client);
    }),

    // Questions endpoint
    http.get('/questions', (req) => {
      const url = new URL(req.request.url);
      const questionIdsParam = url.searchParams.get('questionIds');
      const ids = questionIdsParam?.split(',').filter(Boolean) ?? [];
      const fromMock = efClientQuestionsMock.questions.filter((q) =>
        ids.includes(q.id)
      );
      // Stub descriptions for question IDs not in the mock
      const stubDescriptions: Record<string, string> = {
        '30005': 'What is your total annual revenue in local currency?',
        '300001': 'In which country is your business primarily located?',
        '300002': 'Do you have a registered business address?',
        '300003': 'Is your business publicly traded?',
        '300004': 'Which industry segments does your business operate in?',
      };
      const stubs = ids
        .filter((id) => !fromMock.some((q) => q.id === id))
        .map((id) => ({
          id,
          description: stubDescriptions[id] ?? `Question ${id}`,
          defaultLocale: 'en-US',
          content: [
            {
              description: stubDescriptions[id] ?? `Question ${id}`,
              label: stubDescriptions[id] ?? `Question ${id}`,
              locale: 'en-US',
            },
          ],
          responseSchema: { type: 'array', items: {} },
          subQuestions: [],
        }));
      return HttpResponse.json({
        metadata: efClientQuestionsMock.metadata,
        questions: [...fromMock, ...stubs],
      });
    }),

    // Accounts endpoint (for Accounts section)
    http.get('/accounts', async () => {
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
      return HttpResponse.json({ items: mockAccounts });
    }),

    // Account balance endpoint
    http.get('/accounts/:id/balances', async ({ params }) => {
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
      const accountId = params.id as string;
      const balance = mockBalances[accountId];
      if (balance) {
        return HttpResponse.json(balance);
      }
      return HttpResponse.json({ error: 'Account not found' }, { status: 404 });
    }),

    // Transactions endpoint (for Activity section)
    http.get('/transactions', async () => {
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
      return HttpResponse.json({ items: mockTransactions });
    }),
  ];
}

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Common default args for ClientDetails stories
 */
export const commonArgs = {
  clientId: '0030000133',
  viewMode: 'summary' as const,
  title: 'Client details',
  enableDrillDown: true,
};

/**
 * Storybook controls and documentation for ClientDetails stories.
 */
export const commonArgTypes = {
  clientId: {
    control: { type: 'text' as const },
    description: 'Client ID to fetch (GET /clients/:id)',
    table: {
      category: 'Data',
      defaultValue: { summary: '0030000133' },
    },
  },
  viewMode: {
    control: { type: 'radio' as const },
    options: ['summary', 'accordion', 'cards'],
    description: 'Display mode for client information',
    table: {
      category: 'Display',
      defaultValue: { summary: 'summary' },
    },
  },
  title: {
    control: { type: 'text' as const },
    description: 'Section title (not used in summary mode)',
    table: {
      category: 'Display',
      defaultValue: { summary: 'Client details' },
    },
  },
  enableDrillDown: {
    control: { type: 'boolean' as const },
    description:
      'Enable drill-down sheets when clicking sections (summary mode)',
    table: {
      category: 'Behavior',
      defaultValue: { summary: 'true' },
    },
  },
  sections: {
    control: { type: 'check' as const },
    options: [
      'identity',
      'verification',
      'ownership',
      'compliance',
      'accounts',
      'activity',
    ],
    description: 'Which sections to display (summary mode)',
    table: {
      category: 'Display',
    },
  },

  // === Callbacks ===
  onSectionClick: {
    control: { disable: true },
    description: 'Callback when a section is clicked (overrides drill-down)',
    table: {
      category: 'Callbacks',
      type: { summary: '(section: ClientSection) => void' },
    },
  },
};
