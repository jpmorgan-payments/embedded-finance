import React, { forwardRef, useImperativeHandle, useState } from 'react';
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
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { TransactionCard } from './components/TransactionCard/TransactionCard';
import { DataTablePagination } from './components/TransactionsTable/DataTablePagination';
import { TransactionsTable } from './components/TransactionsTable/TransactionsTable';
import { getTransactionsColumns } from './components/TransactionsTable/TransactionsTable.columns';
import { TransactionsTableToolbar } from './components/TransactionsTable/TransactionsTableToolbar';
import { useAccountsData, useTransactionsData } from './hooks';
import { TRANSACTIONS_DISPLAY_USER_JOURNEYS } from './TransactionsDisplay.constants';
import type {
  TransactionsDisplayProps,
  TransactionsDisplayRef,
} from './TransactionsDisplay.types';

export const TransactionsDisplay = forwardRef<
  TransactionsDisplayRef,
  TransactionsDisplayProps
>(
  (
    {
      accountIds,
      description,
      userEventsHandler,
      userEventsLifecycle,
      className,
    },
    ref
  ) => {
    const { t } = useTranslation(['transactions']);
    const locale = useLocale();
    const { filteredAccountIds } = useAccountsData();

    // Set up automatic event tracking for data-user-event attributes
    useUserEventTracking({
      containerId: 'transactions-display-container',
      userEventsHandler,
      userEventsLifecycle,
    });
    const { transactions, status, failureReason, refetch } =
      useTransactionsData({
        accountIds: accountIds ?? filteredAccountIds,
      });

    // Track view when transactions load
    React.useEffect(() => {
      if (status === 'success' && transactions.length > 0) {
        trackUserEvent({
          actionName: TRANSACTIONS_DISPLAY_USER_JOURNEYS.VIEW_LIST,
          metadata: { count: transactions.length },
          userEventsHandler,
        });
      }
    }, [status, transactions.length, userEventsHandler]);

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
      effectiveDate: false,
      memo: false,
      counterpartName: false,
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
      <div className="eb-w-full eb-@container">
        <Card
          id="transactions-display-container"
          className={cn(
            'eb-component eb-mx-0 eb-w-full eb-max-w-none eb-overflow-hidden',
            className
          )}
        >
          <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
            <div className="eb-min-w-0 eb-flex-1">
              <CardTitle className="eb-h-8 eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-8 @md:eb-text-xl">
                {t('title', { defaultValue: 'Transactions' })}{' '}
                {status === 'success' && (
                  <span className="eb-animate-fade-in">
                    {`(${table.getFilteredRowModel().rows.length})`}
                  </span>
                )}
              </CardTitle>
              {description && (
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="eb-p-0">
            {status === 'pending' && (
              <div className="eb-px-2.5 eb-py-8 eb-text-center eb-text-muted-foreground @md:eb-px-3 @lg:eb-px-4">
                {t('loading.transactions', {
                  defaultValue: 'Loading transactions...',
                })}
              </div>
            )}
            {status === 'error' && (
              <div className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
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
                      defaultValue:
                        'Failed to load transactions. Please try again.',
                    }),
                  }}
                  tryAgainAction={() => refetch()}
                  showDetails={false}
                />
              </div>
            )}
            {status === 'success' && transactions.length > 0 && (
              <div className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                <div className="eb-w-full eb-space-y-4">
                  <TransactionsTableToolbar table={table} />
                  {isMobile ? (
                    <div className="eb-space-y-4">
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
                          {t('empty.noResults', {
                            defaultValue: 'No results.',
                          })}
                        </div>
                      )}
                      <DataTablePagination table={table} />
                    </div>
                  ) : (
                    <>
                      <TransactionsTable
                        columns={transactionsColumns}
                        data={transactions}
                        table={table}
                      />
                      <DataTablePagination table={table} />
                    </>
                  )}
                </div>
              </div>
            )}
            {status === 'success' && transactions.length === 0 && (
              <div className="eb-px-2.5 eb-py-8 eb-text-center eb-text-muted-foreground @md:eb-px-3 @lg:eb-px-4">
                {t('empty.noTransactions', {
                  defaultValue: 'No transactions found',
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

// Add display name for better debugging
TransactionsDisplay.displayName = 'TransactionsDisplay';
