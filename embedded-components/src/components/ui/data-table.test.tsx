import { ColumnDef } from '@tanstack/react-table';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { DataTable } from './data-table';

type Row = { id: string; name: string };

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name,
  },
];

describe('DataTable', () => {
  it('renders column headers and rows', () => {
    const data: Row[] = [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ];

    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows empty state when there is no data', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('paginates with Previous and Next', async () => {
    const user = userEvent.setup();
    const data: Row[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `Row ${i}`,
    }));

    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Row 10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText('Row 0')).toBeInTheDocument();
  });
});
