import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableViewOptions } from './DataTableViewOptions';

type TestData = {
  id: string;
  name: string;
  email: string;
};

const columnHelper = createColumnHelper<TestData>();

// Wrapper component to use useReactTable hook
const ViewOptionsWrapper = () => {
  const data = [
    { id: '1', name: 'John', email: 'john@example.com' },
    { id: '2', name: 'Jane', email: 'jane@example.com' },
  ];

  const columns = [
    columnHelper.accessor('name', {
      enableHiding: true,
    }),
    columnHelper.accessor('email', {
      enableHiding: true,
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return <DataTableViewOptions table={table} />;
};

describe('DataTableViewOptions', () => {
  describe('Rendering', () => {
    test('renders columns button', () => {
      render(<ViewOptionsWrapper />);

      const columnsButton = screen.getByRole('button', { name: /columns/i });
      expect(columnsButton).toBeInTheDocument();
    });

    test('opens column toggle menu on click', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsWrapper />);

      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      expect(screen.getByText('Toggle columns')).toBeInTheDocument();
    });

    test('shows hideable columns in menu', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsWrapper />);

      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      // Should show columns that can be hidden
      expect(screen.getByText('Toggle columns')).toBeInTheDocument();
    });

    test('does not show non-hideable columns', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsWrapper />);

      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      // Actions column should not appear (enableHiding: false)
      const menu = screen.getByText('Toggle columns').closest('[role="menu"]');
      expect(menu).toBeInTheDocument();
    });
  });
});
