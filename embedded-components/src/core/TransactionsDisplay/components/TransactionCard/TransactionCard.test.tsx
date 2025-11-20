import { render, screen } from '@testing-library/react';

import { TransactionCard } from './TransactionCard';
import type { ModifiedTransaction } from '../../utils';

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
  test('renders transaction information', () => {
    render(<TransactionCard transaction={mockTransaction} />);

    expect(screen.getByText('ACH')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Test Counterpart')).toBeInTheDocument();
    expect(screen.getByText('Test memo')).toBeInTheDocument();
  });

  test('renders formatted amount', () => {
    render(<TransactionCard transaction={mockTransaction} />);

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

    render(<TransactionCard transaction={minimalTransaction} />);

    expect(screen.getByText('TRANSFER')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});

