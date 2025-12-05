import { FC } from 'react';

import { Card } from '@/components/ui/card';

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { formatNumberToCurrency } from '../../utils';
import type { ModifiedTransaction } from '../../utils';

/**
 * Props for TransactionCard component
 */
interface TransactionCardProps {
  /** Transaction data to display */
  transaction: ModifiedTransaction;
}

/**
 * TransactionCard component for mobile view
 *
 * Displays transaction information in a card format optimized for mobile screens.
 */
export const TransactionCard: FC<TransactionCardProps> = ({ transaction }) => {
  return (
    <Card className="eb-mb-4 eb-space-y-2 eb-p-4 eb-shadow-sm">
      <div className="eb-flex eb-items-center eb-justify-between">
        <div className="eb-truncate eb-text-base eb-font-semibold">
          {transaction.type || 'Transaction'}
        </div>
        <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
          {transaction.status}
        </span>
      </div>
      <div className="eb-flex eb-items-center eb-gap-2">
        <span className="eb-text-xs eb-text-muted-foreground">
          {transaction.paymentDate
            ? new Date(transaction.paymentDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'N/A'}
        </span>
        <span className="eb-text-xs eb-text-muted-foreground">•</span>
        <span className="eb-font-mono eb-text-xs eb-text-foreground">
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
        <TransactionDetailsDialogTrigger transactionId={transaction.id ?? ''}>
          Details
        </TransactionDetailsDialogTrigger>
      </div>
      <div className="eb-mt-2 eb-text-xs eb-text-foreground">
        <span className="eb-font-medium">Counterpart:</span>{' '}
        {transaction.counterpartName || 'N/A'}
      </div>
      {transaction.memo && (
        <div className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
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
};
