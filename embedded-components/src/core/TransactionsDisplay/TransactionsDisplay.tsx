import { forwardRef, useImperativeHandle } from 'react';
import { RefreshCw } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

import { TransactionCard } from './components/TransactionCard/TransactionCard';
import { transactionsColumns } from './components/TransactionsTable/TransactionsTable.columns';
import { useAccountsData, useTransactionsData } from './hooks';
import type {
  TransactionsDisplayProps,
  TransactionsDisplayRef,
} from './TransactionsDisplay.types';

export const TransactionsDisplay = forwardRef<
  TransactionsDisplayRef,
  TransactionsDisplayProps
>(({ accountIds }, ref) => {
  const { filteredAccountIds } = useAccountsData();
  const {
    transactions,
    status,
    failureReason,
    refetch,
    isFetching,
  } = useTransactionsData({
    accountIds: accountIds ?? filteredAccountIds,
  });

  const isMobile = useMediaQuery('(max-width: 640px)');

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
          Transactions
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh transactions"
          title="Refresh transactions"
          onClick={() => refetch()}
          disabled={isFetching}
          className="eb-ml-2 eb-cursor-pointer"
        >
          <span className="eb-sr-only">Refresh transactions</span>
          <RefreshCw
            className={`eb-h-5 eb-w-5 eb-text-gray-500 ${isFetching ? 'eb-animate-spin' : ''}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {status === 'pending' && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            Loading transactions...
          </div>
        )}
        {status === 'error' && (
          <div className="eb-py-8 eb-text-center eb-text-red-500">
            Error: {failureReason?.message ?? 'Unknown error'}
          </div>
        )}
        {status === 'success' &&
          transactions.length > 0 &&
          (isMobile ? (
            <div>
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={transactionsColumns} data={transactions} />
          ))}
        {status === 'success' && transactions.length === 0 && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            No transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging
TransactionsDisplay.displayName = 'TransactionsDisplay';
