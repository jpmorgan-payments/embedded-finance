import { ColumnDef } from '@tanstack/react-table';
import { ClipboardListIcon, MoreVerticalIcon } from 'lucide-react';

import { PaymentTypeResponse } from '@/api/generated/ep-transactions.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { TRANSACTIONS_DISPLAY_USER_JOURNEYS } from '../../TransactionsDisplay.constants';
import {
  formatNumberToCurrency,
  formatStatusText,
  getStatusVariant,
} from '../../utils';
import type { ModifiedTransaction } from '../../utils';
import { DataTableColumnHeader } from './DataTableColumnHeader';

/**
 * Format date for display
 * Parses ISO 8601 date strings and displays the date portion without timezone conversion
 */
const formatDate = (
  date?: string,
  naText = 'N/A',
  locale = 'en-US'
): string => {
  if (!date) return naText;

  // Extract date portion from ISO 8601 string (YYYY-MM-DD)
  const dateStr = date.split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create date in local timezone to avoid shifting
  const dateObj = new Date(year, month - 1, day);

  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date-time for display
 */
const formatDateTime = (
  date?: string,
  naText = 'N/A',
  locale = 'en-US'
): string => {
  if (!date) return naText;
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Comprehensive column definitions for the transactions data table
 *
 * Default visible columns (most commonly used):
 * - paymentDate, status, type, amount, currency, counterpartName
 *
 * Hidden by default (available via column toggle):
 * - transactionReferenceId, createdAt, effectiveDate, memo, debtorName, creditorName, ledgerBalance, etc.
 */
export const getTransactionsColumns = (
  t: (key: string, options?: any) => string,
  locale?: string
): ColumnDef<ModifiedTransaction>[] => {
  const naText = t('common:na', { defaultValue: 'N/A' });
  // Get locale from language code if not provided, or use provided locale
  const currentLocale = locale || 'en-US';
  const dateTitle = t('columns.date', { defaultValue: 'Posted' });
  const statusTitle = t('columns.status', { defaultValue: 'Status' });
  const typeTitle = t('columns.type', { defaultValue: 'Type' });
  const amountTitle = t('columns.amount', { defaultValue: 'Amount' });
  const currencyTitle = t('columns.currency', { defaultValue: 'Currency' });
  const counterpartTitle = t('columns.counterpart', {
    defaultValue: 'Counterpart',
  });
  const referenceIdTitle = t('columns.referenceId', {
    defaultValue: 'Reference ID',
  });
  const createdAtTitle = t('columns.createdAt', {
    defaultValue: 'Created',
  });
  const effectiveDateTitle = t('columns.effectiveDate', {
    defaultValue: 'Effective Date',
  });
  const memoTitle = t('columns.memo', { defaultValue: 'Memo' });
  const debtorTitle = t('columns.debtor', { defaultValue: 'From' });
  const creditorTitle = t('columns.creditor', { defaultValue: 'To' });
  const ledgerBalanceTitle = t('columns.ledgerBalance', {
    defaultValue: 'Ledger Balance',
  });
  const postingVersionTitle = t('columns.postingVersion', {
    defaultValue: 'Posting Version',
  });
  const directionTitle = t('columns.direction', { defaultValue: 'Direction' });

  return [
    // Created - Default visible (1st column)
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={createdAtTitle} />
      ),
      accessorFn: (row) => {
        if (row.createdAt === undefined) {
          return '';
        }
        return new Date(row.createdAt).getTime();
      },
      cell: ({ row }) => {
        return (
          <div>
            {formatDateTime(row.original.createdAt, naText, currentLocale)}
          </div>
        );
      },
    },
    // Posted - Default visible (2nd column)
    {
      accessorKey: 'paymentDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={dateTitle} />
      ),
      accessorFn: (row) => {
        if (row.paymentDate === undefined) {
          return '';
        }
        return new Date(row.paymentDate).getTime();
      },
      cell: ({ row }) => {
        return (
          <div>
            {formatDate(row.original.paymentDate, naText, currentLocale)}
          </div>
        );
      },
    },
    // From - Default visible (3rd column)
    {
      accessorKey: 'debtorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={debtorTitle} />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('debtorName') || naText}</div>;
      },
      filterFn: (row, id, value) => {
        const debtor = (row.getValue(id) as string | undefined) || '';
        return debtor.toLowerCase().includes(value.toLowerCase());
      },
    },
    // To - Default visible (4th column)
    {
      accessorKey: 'creditorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={creditorTitle} />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('creditorName') || naText}</div>;
      },
      filterFn: (row, id, value) => {
        const creditor = (row.getValue(id) as string | undefined) || '';
        return creditor.toLowerCase().includes(value.toLowerCase());
      },
    },
    // Amount - Default visible (5th column)
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={amountTitle} />
      ),
      accessorFn: (row) => {
        if (row.amount === undefined) {
          return 0;
        }
        return row.payinOrPayout === 'PAYOUT' ? -row.amount : row.amount;
      },
      cell: ({ row }) => {
        const transaction = row.original;
        if (transaction.amount === undefined) {
          return <div className="eb-text-right eb-font-medium">{naText}</div>;
        }
        const formattedAmount = formatNumberToCurrency(
          transaction.amount,
          transaction.currency ?? 'USD',
          currentLocale
        );
        const displayAmount =
          transaction.payinOrPayout === 'PAYIN'
            ? formattedAmount
            : `-${formattedAmount}`;
        return (
          <div className="eb-text-right eb-font-medium">{displayAmount}</div>
        );
      },
    },
    // Currency - Default visible (6th column)
    {
      accessorKey: 'currency',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={currencyTitle} />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('currency') || naText}</div>;
      },
    },
    // Status - Default visible (7th column)
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={statusTitle} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string | undefined;
        return (
          <Badge variant={getStatusVariant(status)} className="eb-text-xs">
            {formatStatusText(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as string | undefined;
        return value.includes(status || '');
      },
    },
    // Type - Default visible (8th column)
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={typeTitle} />
      ),
      cell: ({ row }) => {
        const type = row.getValue('type') as PaymentTypeResponse | undefined;
        return <div>{type || naText}</div>;
      },
      filterFn: (row, id, value) => {
        const type = row.getValue(id) as PaymentTypeResponse | undefined;
        return value.includes(type || '');
      },
    },
    // Counterpart - Hidden by default
    {
      accessorKey: 'counterpartName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={counterpartTitle} />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('counterpartName') || naText}</div>;
      },
      filterFn: (row, id, value) => {
        const counterpart = (row.getValue(id) as string | undefined) || '';
        return counterpart.toLowerCase().includes(value.toLowerCase());
      },
    },
    // Transaction Reference ID - Hidden by default
    {
      accessorKey: 'transactionReferenceId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={referenceIdTitle} />
      ),
      cell: ({ row }) => {
        const refId = row.getValue('transactionReferenceId') as
          | string
          | undefined;
        return <div className="eb-font-mono eb-text-xs">{refId || naText}</div>;
      },
      filterFn: (row, id, value) => {
        const refId = (row.getValue(id) as string | undefined) || '';
        return refId.toLowerCase().includes(value.toLowerCase());
      },
    },
    // Effective Date - Hidden by default
    {
      accessorKey: 'effectiveDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={effectiveDateTitle} />
      ),
      accessorFn: (row) => {
        if (row.effectiveDate === undefined) {
          return '';
        }
        return new Date(row.effectiveDate).getTime();
      },
      cell: ({ row }) => {
        return (
          <div>
            {formatDateTime(row.original.effectiveDate, naText, currentLocale)}
          </div>
        );
      },
    },
    // Memo - Hidden by default
    {
      accessorKey: 'memo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={memoTitle} />
      ),
      cell: ({ row }) => {
        const memo = row.getValue('memo') as string | undefined;
        return (
          <div className="eb-max-w-[200px] eb-truncate">{memo || naText}</div>
        );
      },
      filterFn: (row, id, value) => {
        const memo = (row.getValue(id) as string | undefined) || '';
        return memo.toLowerCase().includes(value.toLowerCase());
      },
    },
    // Ledger Balance - Hidden by default
    {
      accessorKey: 'ledgerBalance',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={ledgerBalanceTitle} />
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        const balance = row.getValue('ledgerBalance') as number | undefined;
        if (balance === undefined) {
          return <div className="eb-text-right">{naText}</div>;
        }
        const formatted = formatNumberToCurrency(
          balance,
          transaction.currency ?? 'USD',
          currentLocale
        );
        return <div className="eb-text-right">{formatted}</div>;
      },
    },
    // Posting Version - Hidden by default
    {
      accessorKey: 'postingVersion',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={postingVersionTitle} />
      ),
      cell: ({ row }) => {
        const version = row.getValue('postingVersion') as number | undefined;
        return <div>{version ?? naText}</div>;
      },
    },
    // Payin/Payout - Hidden by default
    {
      accessorKey: 'payinOrPayout',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={directionTitle} />
      ),
      cell: ({ row }) => {
        const direction = row.getValue('payinOrPayout') as
          | 'PAYIN'
          | 'PAYOUT'
          | undefined;
        if (!direction) return <div>{naText}</div>;
        return (
          <Badge variant={direction === 'PAYIN' ? 'default' : 'secondary'}>
            {direction}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const direction = row.getValue(id) as string | undefined;
        return value.includes(direction || '');
      },
    },
    // Actions - Details (pattern aligned with RecipientsTableView / LinkedAccountWidget table)
    {
      id: 'actions',
      header: () => (
        <span className="eb-sr-only">
          {t('columns.actions', { defaultValue: 'Actions' })}
        </span>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        const transactionId = transaction.id ?? '';
        const viewDetailsLabel = t('actions.viewDetails', {
          defaultValue: 'View details',
        });
        const viewDetailsShort = t('actions.viewDetailsShort', {
          defaultValue: 'Details',
        });
        const moreActionsLabel = t('actions.moreActions', {
          defaultValue: 'More actions',
        });
        // Inline Details button at @2xl+ (icon only; label at @3xl+)
        const detailsButton = (
          <TransactionDetailsDialogTrigger transactionId={transactionId}>
            <Button
              variant="ghost"
              size="sm"
              className="eb-h-8 eb-gap-1 eb-text-xs"
              aria-label={`${viewDetailsLabel} ${transactionId}`}
              data-user-event={TRANSACTIONS_DISPLAY_USER_JOURNEYS.VIEW_DETAILS}
              data-transaction-id={transactionId}
            >
              <ClipboardListIcon className="eb-h-3.5 eb-w-3.5" />
              <span className="eb-hidden @3xl:eb-inline">
                {viewDetailsShort}
              </span>
            </Button>
          </TransactionDetailsDialogTrigger>
        );
        // View details menu item for dropdown (<@2xl)
        const viewDetailsMenuItem = (
          <TransactionDetailsDialogTrigger transactionId={transactionId}>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="eb-cursor-pointer"
            >
              <ClipboardListIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {viewDetailsLabel}
            </DropdownMenuItem>
          </TransactionDetailsDialogTrigger>
        );
        return (
          <div className="eb-flex eb-items-center eb-justify-end eb-gap-1">
            {/* Details button - inline at @2xl+ (matches RecipientsTableView) */}
            <div className="eb-hidden eb-items-center eb-gap-1 @2xl:eb-flex">
              {detailsButton}
            </div>
            {/* Dropdown with View details - shown at <@2xl */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="eb-h-8 eb-w-8 @2xl:eb-hidden"
                  aria-label={moreActionsLabel}
                >
                  <MoreVerticalIcon className="eb-h-4 eb-w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {viewDetailsMenuItem}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableHiding: false,
    },
  ];
};

// Legacy export for backward compatibility - use getTransactionsColumns with t function instead
// @deprecated Use getTransactionsColumns(t) instead
export const transactionsColumns: ColumnDef<ModifiedTransaction>[] = [];
