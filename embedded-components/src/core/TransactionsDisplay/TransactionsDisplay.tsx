import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { TransactionCard } from './components/TransactionCard/TransactionCard';
import { DataTablePagination } from './components/TransactionsTable/DataTablePagination';
import { TransactionsTable } from './components/TransactionsTable/TransactionsTable';
import { getTransactionsColumns } from './components/TransactionsTable/TransactionsTable.columns';
import { TransactionsTableToolbar } from './components/TransactionsTable/TransactionsTableToolbar';
import { useAccountsData, useTransactionsData } from './hooks';
import type {
  TransactionsDisplayProps,
  TransactionsDisplayRef,
} from './TransactionsDisplay.types';
import { useLocale } from './utils';

export const TransactionsDisplay = forwardRef<
  TransactionsDisplayRef,
  TransactionsDisplayProps
>(({ accountIds }, ref) => {
  const { t } = useTranslation(['transactions']);
  const locale = useLocale();
  const { filteredAccountIds } = useAccountsData();
  const { transactions, status, failureReason, refetch, isFetching } =
    useTransactionsData({
      accountIds: accountIds ?? filteredAccountIds,
    });

  const isMobile = useMediaQuery('(max-width: 640px)');

  // Get translated columns
  // Type assertion needed due to TypeScript overload resolution issues with TFunction
  const transactionsColumns = getTransactionsColumns(
    t as (key: string, options?: any) => string,
    locale
  );

  // Table state management (shared for both table and card views)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
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

  // Create table instance for filtering, sorting, and pagination
  const table = useReactTable({
    data: transactions,
    columns: transactionsColumns,
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

  // Expose internal methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      refresh: () => {
        refetch();
      },
    }),
    [refetch]
  );

  return (
    <Card className="eb-component eb-w-full">
      <CardHeader className="eb-flex eb-flex-row eb-items-center eb-justify-between eb-gap-2">
        <CardTitle className="eb-flex-1 eb-text-xl eb-font-semibold">
          {t('title', { defaultValue: 'Transactions' })}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('actions.refresh.label', {
            defaultValue: 'Refresh transactions',
          })}
          title={t('actions.refresh.label', {
            defaultValue: 'Refresh transactions',
          })}
          onClick={() => refetch()}
          disabled={isFetching}
          className="eb-ml-2 eb-cursor-pointer"
        >
          <span className="eb-sr-only">
            {t('actions.refresh.srOnly', {
              defaultValue: 'Refresh transactions',
            })}
          </span>
          <RefreshCw
            className={`eb-h-5 eb-w-5 eb-text-muted-foreground ${isFetching ? 'eb-animate-spin' : ''}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {status === 'pending' && (
          <div className="eb-py-8 eb-text-center eb-text-muted-foreground">
            {t('loading.transactions', {
              defaultValue: 'Loading transactions...',
            })}
          </div>
        )}
        {status === 'error' && (
          <ServerErrorAlert
            error={failureReason as any}
            customTitle={t('errors.loadTransactions.title', {
              defaultValue: 'Failed to load transactions',
            })}
            customErrorMessage={{
              '400': t('errors.loadTransactions.400', {
                defaultValue:
                  'Invalid request. Please check your account filters and try again.',
              }),
              '401': t('errors.loadTransactions.401', {
                defaultValue: 'Please log in and try again.',
              }),
              '403': t('errors.loadTransactions.403', {
                defaultValue:
                  'You do not have permission to view these transactions.',
              }),
              '404': t('errors.loadTransactions.404', {
                defaultValue: 'Transactions not found.',
              }),
              '500': t('errors.loadTransactions.500', {
                defaultValue:
                  'An unexpected error occurred while loading transactions. Please try again later.',
              }),
              '503': t('errors.loadTransactions.503', {
                defaultValue:
                  'The service is currently unavailable. Please try again later.',
              }),
              default: t('errors.loadTransactions.default', {
                defaultValue: 'Failed to load transactions. Please try again.',
              }),
            }}
            tryAgainAction={() => refetch()}
            showDetails={false}
          />
        )}
        {status === 'success' && transactions.length > 0 && (
          <div className="eb-w-full eb-space-y-4">
            <TransactionsTableToolbar table={table} />
            {isMobile ? (
              <div>
                {table.getRowModel().rows.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <TransactionCard
                        key={row.original.id ?? `transaction-${row.id}`}
                        transaction={row.original}
                      />
                    ))
                ) : (
                  <div className="eb-py-8 eb-text-center eb-text-muted-foreground">
                    {t('empty.noResults', { defaultValue: 'No results.' })}
                  </div>
                )}
              </div>
            ) : (
              <TransactionsTable
                columns={transactionsColumns}
                data={transactions}
                table={table}
              />
            )}
            <DataTablePagination table={table} />
          </div>
        )}
        {status === 'success' && transactions.length === 0 && (
          <div className="eb-py-8 eb-text-center eb-text-muted-foreground">
            {t('empty.noTransactions', {
              defaultValue: 'No transactions found',
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging
TransactionsDisplay.displayName = 'TransactionsDisplay';
