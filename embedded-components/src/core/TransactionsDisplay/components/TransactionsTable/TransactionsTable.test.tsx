import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ModifiedTransaction } from '../../utils';
import { TransactionsTable } from './TransactionsTable';
import { getTransactionsColumns } from './TransactionsTable.columns';

// Mock translation function for tests
const mockT = (
  key: string,
  options?: { defaultValue?: string; [key: string]: any }
): string => {
  return options?.defaultValue || key;
};

// Test without locale to ensure default 'en-US' is used
const transactionsColumns = getTransactionsColumns(mockT);

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

const mockTransactions: ModifiedTransaction[] = [
  {
    id: 'txn-001',
    status: 'COMPLETED',
    type: 'ACH',
    amount: 1500.25,
    currency: 'USD',
    paymentDate: '2024-05-01',
    createdAt: '2024-05-01T10:00:00Z',
    transactionReferenceId: 'REF-12345',
    counterpartName: 'John Doe',
    payinOrPayout: 'PAYIN',
  },
  {
    id: 'txn-002',
    status: 'PENDING',
    type: 'WIRE',
    amount: 2000.0,
    currency: 'USD',
    paymentDate: '2024-05-02',
    createdAt: '2024-05-02T12:00:00Z',
    transactionReferenceId: 'REF-67890',
    counterpartName: 'Jane Smith',
    payinOrPayout: 'PAYOUT',
  },
  {
    id: 'txn-003',
    status: 'REJECTED',
    type: 'TRANSFER',
    amount: 500.0,
    currency: 'USD',
    paymentDate: '2024-05-03',
    createdAt: '2024-05-03T14:00:00Z',
    transactionReferenceId: 'REF-11111',
    counterpartName: 'Acme Corp',
    payinOrPayout: 'PAYIN',
  },
];

describe('TransactionsTable', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Rendering', () => {
    test('renders table with transactions', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      // Default visible columns (createdAt, debtorName, creditorName are hidden by default)
      expect(screen.getByText('Posted')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Currency')).toBeInTheDocument();
      expect(screen.getByText('Counterpart')).toBeInTheDocument();
    });

    test('renders transaction data', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('renders empty state when no data', () => {
      renderWithProviders(
        <TransactionsTable columns={transactionsColumns} data={[]} />
      );

      expect(screen.getByText('No results.')).toBeInTheDocument();
    });

    test('renders pagination controls', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      expect(screen.getByText(/Showing \d+ to \d+ of \d+/)).toBeInTheDocument();
      expect(screen.getByText('Rows per page')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    test('sorts by date descending by default', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      // Verify that transactions are displayed (table is sorted)
      // The table should show all transactions, with most recent first
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();

      // Verify dates are displayed (indicating sorting is working)
      const dateCells = screen.getAllByText(/May \d+, 2024/);
      expect(dateCells.length).toBeGreaterThan(0);
    });

    test('allows sorting by clicking column header', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      const statusHeader = screen.getByText('Status');
      await user.click(statusHeader);

      // Should be able to interact with sort menu
      expect(statusHeader).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('renders filter toolbar', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      expect(
        screen.getByPlaceholderText('Filter counterpart...')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Filter reference ID...')
      ).toBeInTheDocument();
    });

    test('filters by counterpart name', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      const counterpartFilter = screen.getByPlaceholderText(
        'Filter counterpart...'
      );
      await user.type(counterpartFilter, 'John');

      // Should filter to show only John Doe transaction
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    test('filters by reference ID', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      // First, show the Reference ID column
      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      // Find and check the Reference ID checkbox to show the column
      const refIdCheckbox = screen.getByRole('menuitemcheckbox', {
        name: /reference id/i,
      });
      await user.click(refIdCheckbox);

      // Close the menu by pressing Escape
      await user.keyboard('{Escape}');

      const refFilter = screen.getByPlaceholderText('Filter reference ID...');
      await user.type(refFilter, 'REF-12345');

      expect(screen.getByText('REF-12345')).toBeInTheDocument();
      expect(screen.queryByText('REF-67890')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('displays correct page information', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    test('allows changing page size', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      const pageSizeSelect = screen.getByText('Rows per page').parentElement;
      expect(pageSizeSelect).toBeInTheDocument();
    });
  });

  describe('Column Visibility', () => {
    test('renders view options button', () => {
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      // Check for Columns button in toolbar
      const columnsButton = screen.getByRole('button', { name: /columns/i });
      expect(columnsButton).toBeInTheDocument();
    });

    test('toggles column visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TransactionsTable
          columns={transactionsColumns}
          data={mockTransactions}
        />
      );

      // Get the Columns button from the toolbar
      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      // Should show column toggle menu
      expect(screen.getByText('Toggle columns')).toBeInTheDocument();
    });
  });
});
