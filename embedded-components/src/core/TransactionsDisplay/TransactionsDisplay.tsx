import { FC, forwardRef, useImperativeHandle } from 'react';
import { RefreshCw } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useGetAccounts } from '@/api/generated/ep-accounts';
import { useListTransactionsV2 } from '@/api/generated/ep-transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { TransactionDetailsDialogTrigger } from './TransactionDetailsSheet/TransactionDetailsSheet';
import { columns } from './TransactionsDisplay.columns';
import { formatNumberToCurrency } from './utils/formatNumberToCurrency';
import { modifyTransactionsData } from './utils/modifyTransactionsData';

export type TransactionsDisplayProps = {
  accountIds?: string[];
};

// Define the ref interface for external actions
export interface TransactionsDisplayRef {
  refresh: () => void;
  // Add other actions as needed
  // reset: () => void;
  // exportData: () => void;
}

const TransactionCard: FC<{ transaction: any }> = ({ transaction }) => (
  <Card className="eb-mb-4 eb-space-y-2 eb-p-4 eb-shadow-sm">
    <div className="eb-flex eb-items-center eb-justify-between">
      <div className="eb-truncate eb-text-base eb-font-semibold">
        {transaction.type || 'Transaction'}
      </div>
      <span className="eb-text-xs eb-font-medium eb-text-gray-500">
        {transaction.status}
      </span>
    </div>
    <div className="eb-flex eb-items-center eb-gap-2">
      <span className="eb-text-xs eb-text-gray-500">
        {transaction.paymentDate
          ? new Date(transaction.paymentDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A'}
      </span>
      <span className="eb-text-xs eb-text-gray-400">•</span>
      <span className="eb-font-mono eb-text-xs eb-text-gray-700">
        {transaction.transactionReferenceId || 'N/A'}
      </span>
    </div>
    <div className="eb-mt-2 eb-flex eb-items-center eb-justify-between">
      <div>
        <span className="eb-text-xs eb-text-muted-foreground">Amount</span>
        <div className="eb-font-medium">
          {transaction.amount
            ? formatNumberToCurrency(
                transaction.amount,
                transaction.currency ?? 'USD'
              )
            : 'N/A'}
        </div>
      </div>
      <TransactionDetailsDialogTrigger transactionId={transaction.id}>
        Details
      </TransactionDetailsDialogTrigger>
    </div>
    <div className="eb-mt-2 eb-text-xs eb-text-gray-600">
      <span className="eb-font-medium">Counterpart:</span>{' '}
      {transaction.counterpartName || 'N/A'}
    </div>
    {transaction.memo && (
      <div className="eb-mt-1 eb-text-xs eb-text-gray-500">
        <span className="eb-font-medium">Memo:</span> {transaction.memo}
      </div>
    )}
    <div className="eb-mt-1 eb-grid eb-grid-cols-2 eb-gap-2">
      <div>
        <span className="eb-text-xs eb-text-muted-foreground">Debtor</span>
        <div className="eb-text-xs">{transaction.debtorName || 'N/A'}</div>
      </div>
      <div>
        <span className="eb-text-xs eb-text-muted-foreground">Creditor</span>
        <div className="eb-text-xs">{transaction.creditorName || 'N/A'}</div>
      </div>
    </div>
  </Card>
);

export const TransactionsDisplay = forwardRef<
  TransactionsDisplayRef,
  TransactionsDisplayProps
>(({ accountIds }, ref) => {
  const { interceptorReady } = useInterceptorStatus();
  const { data, status, failureReason, refetch, isFetching } =
    useListTransactionsV2(
      {},
      {
        query: {
          enabled: interceptorReady,
        },
      }
    );
  const isMobile = useMediaQuery('(max-width: 640px)');

  const { data: accountsData } = useGetAccounts(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });
  const transactions = data?.items
    ? modifyTransactionsData(
        data.items,
        accountIds ??
          accountsData?.items
            ?.filter(
              (account) =>
                account.category === 'LIMITED_DDA_PAYMENTS' ||
                account.category === 'LIMITED_DDA'
            )
            ?.map((account) => account.id) ??
          []
      )
    : [];

  // Expose internal methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      refresh: () => {
        refetch();
      },
      // Add other actions as needed:
      // reset: () => {
      //   // Reset any internal state
      // },
      // exportData: () => {
      //   // Export transactions data
      //   console.log('Exporting transactions:', transactions);
      // },
    }),
    [refetch]
  ); // Include dependencies that the methods use

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
            <DataTable columns={columns} data={transactions} />
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
