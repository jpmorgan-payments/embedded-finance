import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ModifiedTransaction } from '../../utils';
import { DataTablePagination } from './DataTablePagination';
import { TransactionsTableToolbar } from './TransactionsTableToolbar';

/**
 * Props for TransactionsTable component
 */
interface TransactionsTableProps {
  columns: ColumnDef<ModifiedTransaction>[];
  data: ModifiedTransaction[];
}

/**
 * TransactionsTable - Enhanced data table with full shadcn/ui capabilities
 *
 * Features:
 * - Sorting (all sortable columns)
 * - Filtering (status, type, counterpart, reference ID)
 * - Column visibility toggle
 * - Pagination with page size control
 * - Client-side filtering and sorting
 */
export function TransactionsTable({ columns, data }: TransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      createdAt: false,
      effectiveDate: false,
      memo: false,
      debtorName: false,
      creditorName: false,
      ledgerBalance: false,
      postingVersion: false,
      payinOrPayout: false,
      currency: false,
    });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
      sorting: [
        {
          id: 'paymentDate',
          desc: true, // Most recent first
        },
      ],
    },
  });

  return (
    <div className="eb-w-full eb-space-y-4">
      <TransactionsTableToolbar table={table} />
      <div className="eb-rounded-md eb-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="eb-h-24 eb-text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
