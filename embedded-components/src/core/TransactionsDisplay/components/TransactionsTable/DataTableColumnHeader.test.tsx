import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableColumnHeader } from './DataTableColumnHeader';

type TestData = {
  name: string;
  value: number;
};

const columnHelper = createColumnHelper<TestData>();

// Wrapper component to use useReactTable hook
const TableWrapper = ({
  column,
  title,
}: {
  column: ColumnDef<TestData, unknown>;
  title: string;
}) => {
  const table = useReactTable({
    data: column.id === 'actions' ? [] : [{ name: 'Test', value: 100 }],
    columns: [column],
    getCoreRowModel: getCoreRowModel(),
  });

  const tableColumn = table.getAllColumns()[0];

  return <DataTableColumnHeader column={tableColumn} title={title} />;
};

describe('DataTableColumnHeader', () => {
  describe('Non-sortable column', () => {
    test('renders title without sort controls', () => {
      const column = columnHelper.display({
        id: 'actions',
        enableSorting: false,
      });

      render(<TableWrapper column={column} title="Actions" />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Sortable column', () => {
    test('renders sortable header with button', () => {
      const column = columnHelper.accessor('name', {
        enableSorting: true,
      }) as ColumnDef<TestData, unknown>;

      render(<TableWrapper column={column} title="Name" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Name');
    });

    test('shows sort menu on click', async () => {
      const user = userEvent.setup();
      const column = columnHelper.accessor('name', {
        enableSorting: true,
      }) as ColumnDef<TestData, unknown>;

      render(<TableWrapper column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Asc')).toBeInTheDocument();
      expect(screen.getByText('Desc')).toBeInTheDocument();
    });

    test('shows hide option for hideable columns', async () => {
      const user = userEvent.setup();
      const column = columnHelper.accessor('name', {
        enableSorting: true,
        enableHiding: true,
      }) as ColumnDef<TestData, unknown>;

      render(<TableWrapper column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Hide')).toBeInTheDocument();
    });

    test('does not show hide option for non-hideable columns', async () => {
      const user = userEvent.setup();
      const column = columnHelper.accessor('name', {
        enableSorting: true,
        enableHiding: false,
      }) as ColumnDef<TestData, unknown>;

      render(<TableWrapper column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.queryByText('Hide')).not.toBeInTheDocument();
    });
  });
});
