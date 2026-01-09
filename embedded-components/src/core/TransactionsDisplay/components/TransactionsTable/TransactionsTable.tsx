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
  Table as TanStackTable,
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

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { TRANSACTIONS_DISPLAY_USER_JOURNEYS } from '../../TransactionsDisplay.constants';
import type { ModifiedTransaction } from '../../utils';
import { DataTablePagination } from './DataTablePagination';
import { TransactionsTableToolbar } from './TransactionsTableToolbar';

/**
 * Props for TransactionsTable component
 */
interface TransactionsTableProps {
  columns: ColumnDef<ModifiedTransaction>[];
  data: ModifiedTransaction[];
  table?: TanStackTable<ModifiedTransaction>;
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
export function TransactionsTable({
  columns,
  data,
  table: providedTable,
}: TransactionsTableProps) {
  // Use provided table or create own table instance
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      transactionReferenceId: false,
      createdAt: false,
      effectiveDate: false,
      memo: false,
      debtorName: false,
      creditorName: false,
      ledgerBalance: false,
      postingVersion: false,
      payinOrPayout: false,
    });

  const internalTable = useReactTable({
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

  const table = providedTable || internalTable;

  return (
    <div className="eb-w-full">
      {!providedTable && <TransactionsTableToolbar table={table} />}
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
              table.getRowModel().rows.map((row) => {
                const transaction = row.original;
                const transactionId = transaction.id ?? '';
                return (
                  <TransactionDetailsDialogTrigger
                    key={row.id}
                    transactionId={transactionId}
                  >
                    <TableRow
                      data-user-event={
                        TRANSACTIONS_DISPLAY_USER_JOURNEYS.VIEW_DETAILS
                      }
                      data-transaction-id={transactionId}
                      data-state={row.getIsSelected() && 'selected'}
                      className="eb-cursor-pointer eb-transition-colors hover:eb-bg-muted/50"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Trigger click on the row to open dialog
                          (e.currentTarget as HTMLElement).click();
                        }
                      }}
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
                  </TransactionDetailsDialogTrigger>
                );
              })
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
      {!providedTable && <DataTablePagination table={table} />}
    </div>
  );
}
