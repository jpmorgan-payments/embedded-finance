import { forwardRef, useImperativeHandle } from 'react';
import { RefreshCw } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { TransactionCard } from './components/TransactionCard/TransactionCard';
import { TransactionsTable } from './components/TransactionsTable/TransactionsTable';
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
  const { transactions, status, failureReason, refetch, isFetching } =
    useTransactionsData({
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
            className={`eb-h-5 eb-w-5 eb-text-muted-foreground ${isFetching ? 'eb-animate-spin' : ''}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {status === 'pending' && (
          <div className="eb-py-8 eb-text-center eb-text-muted-foreground">
            Loading transactions...
          </div>
        )}
        {status === 'error' && (
          <ServerErrorAlert
            error={failureReason as any}
            customTitle="Failed to load transactions"
            customErrorMessage={{
              '400':
                'Invalid request. Please check your account filters and try again.',
              '401': 'Please log in and try again.',
              '403': 'You do not have permission to view these transactions.',
              '404': 'Transactions not found.',
              '500':
                'An unexpected error occurred while loading transactions. Please try again later.',
              '503':
                'The service is currently unavailable. Please try again later.',
              default: 'Failed to load transactions. Please try again.',
            }}
            tryAgainAction={() => refetch()}
            showDetails={false}
          />
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
            <TransactionsTable
              columns={transactionsColumns}
              data={transactions}
            />
          ))}
        {status === 'success' && transactions.length === 0 && (
          <div className="eb-py-8 eb-text-center eb-text-muted-foreground">
            No transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging
TransactionsDisplay.displayName = 'TransactionsDisplay';
