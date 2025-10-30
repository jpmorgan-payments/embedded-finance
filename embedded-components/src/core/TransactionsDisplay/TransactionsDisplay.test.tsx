import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { TransactionsDisplay } from './TransactionsDisplay';

const queryClient = new QueryClient();

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
});
