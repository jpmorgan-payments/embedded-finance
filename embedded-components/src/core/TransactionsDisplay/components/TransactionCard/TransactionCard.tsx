import { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { formatNumberToCurrency } from '../../utils';
import type { ModifiedTransaction } from '../../utils';

/**
 * Format status text for display (convert from uppercase to title case)
 */
const formatStatusText = (status?: string): string => {
  if (!status) return 'N/A';
  // Convert "COMPLETED" to "Completed", "PENDING" to "Pending", etc.
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Get status badge variant based on transaction status
 */
const getStatusVariant = (
  status?: string
): 'success' | 'warning' | 'destructive' | 'informative' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'RETURNED':
    case 'FAILED':
      return 'destructive';
    default:
      return 'informative';
  }
};

/**
 * Format date for display
 */
const formatDate = (date?: string): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
 * Displays essential transaction information in a compact card format.
 * Clicking the card opens the transaction details modal.
 */
export const TransactionCard: FC<TransactionCardProps> = ({ transaction }) => {
  const transactionId = transaction.id ?? '';

  return (
    <TransactionDetailsDialogTrigger transactionId={transactionId}>
      <Card className="eb-mb-3 eb-cursor-pointer eb-p-3 eb-shadow-sm eb-transition-colors hover:eb-bg-muted/50">
        <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
          <div className="eb-min-w-0 eb-flex-1">
            <div className="eb-mb-1 eb-flex eb-items-center eb-gap-2">
              <div className="eb-truncate eb-text-sm eb-font-medium">
                {transaction.type || 'Transaction'}
              </div>
              <Badge
                variant={getStatusVariant(transaction.status)}
                className="eb-shrink-0"
              >
                {formatStatusText(transaction.status)}
              </Badge>
            </div>
            <div className="eb-text-xs eb-text-muted-foreground">
              {formatDate(transaction.paymentDate)}
            </div>
          </div>
          <div className="eb-shrink-0 eb-text-right">
            <div className="eb-text-sm eb-font-semibold">
              {transaction.amount
                ? formatNumberToCurrency(
                    transaction.amount,
                    transaction.currency ?? 'USD'
                  )
                : 'N/A'}
            </div>
            {transaction.currency && (
              <div className="eb-text-xs eb-text-muted-foreground">
                {transaction.currency}
              </div>
            )}
          </div>
        </div>
        {transaction.counterpartName && (
          <div className="eb-mt-2 eb-truncate eb-text-xs eb-text-muted-foreground">
            {transaction.counterpartName}
          </div>
        )}
      </Card>
    </TransactionDetailsDialogTrigger>
  );
};
