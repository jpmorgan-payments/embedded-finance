import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { TransactionCard } from './TransactionCard';
import type { ModifiedTransaction } from '../../utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const mockTransaction: ModifiedTransaction = {
  id: 'txn-123',
  type: 'ACH',
  status: 'COMPLETED',
  amount: 1000,
  currency: 'USD',
  paymentDate: '2024-01-15',
  transactionReferenceId: 'REF-123',
  counterpartName: 'Test Counterpart',
  memo: 'Test memo',
  debtorName: 'Debtor Name',
  creditorName: 'Creditor Name',
  payinOrPayout: 'PAYIN',
};

describe('TransactionCard', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  test('renders transaction information', () => {
    renderWithProviders(<TransactionCard transaction={mockTransaction} />);

    expect(screen.getByText('ACH')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Test Counterpart')).toBeInTheDocument();
    expect(screen.getByText('Test memo')).toBeInTheDocument();
  });

  test('renders formatted amount', () => {
    renderWithProviders(<TransactionCard transaction={mockTransaction} />);

    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  test('handles missing optional fields', () => {
    const minimalTransaction: ModifiedTransaction = {
      id: 'txn-456',
      type: 'TRANSFER',
      status: 'PENDING',
      amount: 500,
      currency: 'USD',
    };

    renderWithProviders(<TransactionCard transaction={minimalTransaction} />);

    expect(screen.getByText('TRANSFER')).toBeInTheDocument();
    // Check that N/A appears (there may be multiple instances)
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});

