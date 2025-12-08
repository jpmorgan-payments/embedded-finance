import { ColumnDef } from '@tanstack/react-table';

import { PaymentTypeResponse } from '@/api/generated/ep-transactions.schemas';
import { Badge } from '@/components/ui/badge';

import {
  formatNumberToCurrency,
  formatStatusText,
  getStatusVariant,
} from '../../utils';
import type { ModifiedTransaction } from '../../utils';
import { DataTableColumnHeader } from './DataTableColumnHeader';

/**
 * Format date for display
 */
const formatDate = (date?: string, naText = 'N/A'): string => {
  if (!date) return naText;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date-time for display
 */
const formatDateTime = (date?: string, naText = 'N/A'): string => {
  if (!date) return naText;
  return new Date(date).toLocaleString('en-US', {
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
  t: (key: string, options?: any) => string
): ColumnDef<ModifiedTransaction>[] => {
  const naText = t('common:na', { defaultValue: 'N/A' });
  const dateTitle = t('columns.date', { defaultValue: 'Date' });
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
    defaultValue: 'Created At',
  });
  const effectiveDateTitle = t('columns.effectiveDate', {
    defaultValue: 'Effective Date',
  });
  const memoTitle = t('columns.memo', { defaultValue: 'Memo' });
  const debtorTitle = t('columns.debtor', { defaultValue: 'Debtor' });
  const creditorTitle = t('columns.creditor', { defaultValue: 'Creditor' });
  const ledgerBalanceTitle = t('columns.ledgerBalance', {
    defaultValue: 'Ledger Balance',
  });
  const postingVersionTitle = t('columns.postingVersion', {
    defaultValue: 'Posting Version',
  });
  const directionTitle = t('columns.direction', { defaultValue: 'Direction' });

  return [
    // Date - Default visible
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
        return <div>{formatDate(row.original.paymentDate, naText)}</div>;
      },
      enableHiding: false,
    },
    // Status - Default visible
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={statusTitle} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string | undefined;
        return (
          <Badge variant={getStatusVariant(status)}>
            {formatStatusText(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as string | undefined;
        return value.includes(status || '');
      },
    },
    // Type - Default visible
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
    // Amount - Default visible
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
          transaction.currency ?? 'USD'
        );
        const displayAmount =
          transaction.payinOrPayout === 'PAYIN'
            ? formattedAmount
            : `-${formattedAmount}`;
        return (
          <div className="eb-text-right eb-font-medium">{displayAmount}</div>
        );
      },
      enableHiding: false,
    },
    // Currency - Default visible
    {
      accessorKey: 'currency',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={currencyTitle} />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('currency') || naText}</div>;
      },
      enableHiding: false,
    },
    // Counterpart - Default visible
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
    // Created At - Hidden by default
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
        return <div>{formatDateTime(row.original.createdAt, naText)}</div>;
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
        return <div>{formatDateTime(row.original.effectiveDate, naText)}</div>;
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
    // Debtor Name - Hidden by default
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
    // Creditor Name - Hidden by default
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
          transaction.currency ?? 'USD'
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
  ];
};

// Legacy export for backward compatibility - use getTransactionsColumns with t function instead
// @deprecated Use getTransactionsColumns(t) instead
export const transactionsColumns: ColumnDef<ModifiedTransaction>[] = [];
