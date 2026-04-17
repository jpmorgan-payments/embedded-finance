import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import type { ModifiedTransaction } from '../../utils';
import { TransactionCard } from './TransactionCard';

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
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Test Counterpart')).toBeInTheDocument();
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
      currency: 'USD',
      paymentDate: '2024-01-15',
      createdAt: '2024-01-15T00:00:00Z',
    };

    renderWithProviders(<TransactionCard transaction={minimalTransaction} />);

    expect(screen.getByText('TRANSFER')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    // Amount is missing so N/A should appear
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});
