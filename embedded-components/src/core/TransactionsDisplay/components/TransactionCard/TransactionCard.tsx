import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { TRANSACTIONS_DISPLAY_USER_JOURNEYS } from '../../TransactionsDisplay.constants';
import {
  formatNumberToCurrency,
  formatStatusText,
  getStatusVariant,
} from '../../utils';
import type { ModifiedTransaction } from '../../utils';

/**
 * Format date for display
 */
const formatDate = (date?: string, locale = 'en-US'): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString(locale, {
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
  const { t } = useTranslation(['transactions', 'common']);
  const locale = useLocale();
  const transactionId = transaction.id ?? '';

  return (
    <TransactionDetailsDialogTrigger transactionId={transactionId}>
      <Card
        data-user-event={TRANSACTIONS_DISPLAY_USER_JOURNEYS.VIEW_DETAILS}
        data-transaction-id={transactionId}
        className="eb-mb-3 eb-cursor-pointer eb-p-3 eb-shadow-sm eb-transition-colors hover:eb-bg-muted/50"
      >
        <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
          <div className="eb-min-w-0 eb-flex-1">
            <div className="eb-mb-1 eb-flex eb-items-center eb-gap-2">
              <div className="eb-truncate eb-text-sm eb-font-medium">
                {transaction.type ||
                  t('card.transactionFallback', {
                    defaultValue: 'Transaction',
                  })}
              </div>
              <Badge
                variant={getStatusVariant(transaction.status)}
                className="eb-shrink-0"
              >
                {formatStatusText(transaction.status)}
              </Badge>
            </div>
            <div className="eb-text-xs eb-text-muted-foreground">
              {formatDate(transaction.paymentDate, locale)}
            </div>
          </div>
          <div className="eb-shrink-0 eb-text-right">
            <div className="eb-text-sm eb-font-semibold">
              {transaction.amount
                ? formatNumberToCurrency(
                    transaction.amount,
                    transaction.currency ?? 'USD',
                    locale
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
