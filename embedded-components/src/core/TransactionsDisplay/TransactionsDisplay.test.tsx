import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { TransactionsDisplay } from './TransactionsDisplay';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Disable retries for faster test execution
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: { retry: 0 },
  },
});

const renderComponent = (
  props: Partial<React.ComponentProps<typeof TransactionsDisplay>> = {}
) => {
  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="eb-mx-auto eb-max-w-4xl eb-p-6">
          <TransactionsDisplay {...props} />
        </div>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('TransactionsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  describe('Rendering', () => {
    test('renders loading state', () => {
      renderComponent({ accountIds: ['account1'] });

      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });

    test('renders transactions title', () => {
      renderComponent({ accountIds: ['account1'] });

      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    test('renders ServerErrorAlert on error', async () => {
      server.use(
        http.get('/transactions', () => {
          return HttpResponse.json(
            {
              title: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              traceId: 'trace-500-001',
            },
            { status: 500 }
          );
        })
      );

      renderComponent({ accountIds: ['account1'] });

      // Wait for error state - ServerErrorAlert renders an alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Verify try again button is present
      expect(
        screen.getByRole('button', { name: /Try Again/i })
      ).toBeInTheDocument();
    });

    test('renders empty state when no transactions', async () => {
      server.use(
        http.get('/transactions', () => {
          return HttpResponse.json({
            items: [],
            metadata: { limit: 25, page: 1, total_items: 0 },
          });
        })
      );

      renderComponent({ accountIds: ['account1'] });

      await waitFor(() => {
        expect(screen.getByText('No transactions found')).toBeInTheDocument();
      });
    });
  });

  describe('With accountIds prop', () => {
    test('renders when accountIds are provided', () => {
      renderComponent({ accountIds: ['account1', 'account2'] });

      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    test('renders with single accountId', () => {
      renderComponent({ accountIds: ['account1'] });

      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    test('renders without accountIds prop', () => {
      server.use(
        http.get('/accounts', () => {
          return HttpResponse.json({
            items: [],
            metadata: { limit: 25, page: 1, total_items: 0 },
          });
        })
      );

      renderComponent();

      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });
  });

  describe('Refresh functionality', () => {
    test('renders refresh button', () => {
      renderComponent({ accountIds: ['account1'] });

      expect(
        screen.getByRole('button', { name: /refresh transactions/i })
      ).toBeInTheDocument();
    });
  });

  describe('Table rendering', () => {
    test('renders table with transactions when data is loaded', async () => {
      const mockTransactions = [
        {
          id: 'txn-001',
          status: 'COMPLETED',
          type: 'ACH',
          amount: 1000,
          currency: 'USD',
          paymentDate: '2024-01-15',
          transactionReferenceId: 'REF-123',
          counterpartName: 'Test Counterpart',
        },
      ];

      server.use(
        http.get('/transactions', () => {
          return HttpResponse.json({
            items: mockTransactions,
            metadata: { limit: 25, page: 1, total_items: 1 },
          });
        })
      );

      renderComponent({ accountIds: ['account1'] });

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
      });
    });
  });
});
