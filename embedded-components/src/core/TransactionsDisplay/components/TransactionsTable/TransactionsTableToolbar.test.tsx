import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ModifiedTransaction } from '../../utils';
import { TransactionsTableToolbar } from './TransactionsTableToolbar';

const columnHelper = createColumnHelper<ModifiedTransaction>();

// Wrapper component to use useReactTable hook
const ToolbarWrapper = ({
  data,
  initialFilters = [],
}: {
  data: ModifiedTransaction[];
  initialFilters?: Array<{ id: string; value: unknown }>;
}) => {
  const columns = [
    columnHelper.accessor('status', {
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as string | undefined;
        return value.includes(status || '');
      },
    }),
    columnHelper.accessor('type', {
      filterFn: (row, id, value) => {
        const type = row.getValue(id) as string | undefined;
        return value.includes(type || '');
      },
    }),
    columnHelper.accessor('counterpartName', {
      filterFn: (row, id, value) => {
        const counterpart = (row.getValue(id) as string | undefined) || '';
        return counterpart.toLowerCase().includes(value.toLowerCase());
      },
    }),
    columnHelper.accessor('transactionReferenceId', {
      filterFn: (row, id, value) => {
        const refId = (row.getValue(id) as string | undefined) || '';
        return refId.toLowerCase().includes(value.toLowerCase());
      },
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnFilters: initialFilters,
    },
  });

  return <TransactionsTableToolbar table={table} />;
};

describe('TransactionsTableToolbar', () => {
  const mockTransactions: ModifiedTransaction[] = [
    {
      id: 'txn-001',
      status: 'COMPLETED',
      type: 'ACH',
      counterpartName: 'John Doe',
      transactionReferenceId: 'REF-123',
    },
    {
      id: 'txn-002',
      status: 'PENDING',
      type: 'WIRE',
      counterpartName: 'Jane Smith',
      transactionReferenceId: 'REF-456',
    },
  ];

  describe('Rendering', () => {
    test('renders all filter controls', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      expect(
        screen.getByPlaceholderText('Filter counterpart...')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Filter reference ID...')
      ).toBeInTheDocument();
    });

    test('renders status filter dropdown', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      const statusSelect = screen.getByText('All statuses');
      expect(statusSelect).toBeInTheDocument();
    });

    test('renders type filter dropdown', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      const typeSelect = screen.getByText('All types');
      expect(typeSelect).toBeInTheDocument();
    });

    test('renders view options button', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters by counterpart name', async () => {
      const user = userEvent.setup();
      render(<ToolbarWrapper data={mockTransactions} />);

      const counterpartFilter = screen.getByPlaceholderText(
        'Filter counterpart...'
      );
      await user.type(counterpartFilter, 'John');

      expect(counterpartFilter).toHaveValue('John');
    });

    test('filters by reference ID', async () => {
      const user = userEvent.setup();
      render(<ToolbarWrapper data={mockTransactions} />);

      const refFilter = screen.getByPlaceholderText('Filter reference ID...');
      await user.type(refFilter, 'REF-123');

      expect(refFilter).toHaveValue('REF-123');
    });

    test('shows reset button when filters are active', () => {
      render(
        <ToolbarWrapper
          data={mockTransactions}
          initialFilters={[{ id: 'status', value: ['COMPLETED'] }]}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });

    test('hides reset button when no filters are active', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      expect(
        screen.queryByRole('button', { name: /reset/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    test('renders status filter dropdown', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      // Check that the status filter is rendered
      const statusSelect = screen.getByText('All statuses');
      expect(statusSelect).toBeInTheDocument();
    });
  });

  describe('Type Filter', () => {
    test('renders type filter dropdown', () => {
      render(<ToolbarWrapper data={mockTransactions} />);

      // Check that the type filter is rendered
      const typeSelect = screen.getByText('All types');
      expect(typeSelect).toBeInTheDocument();
    });
  });
});
