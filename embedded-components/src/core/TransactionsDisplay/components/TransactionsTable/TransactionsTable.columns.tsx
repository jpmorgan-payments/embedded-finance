import { ColumnDef } from '@tanstack/react-table';
import { ChevronRightIcon } from 'lucide-react';

import { PaymentTypeResponse } from '@/api/generated/ep-transactions.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { TransactionDetailsDialogTrigger } from '../../TransactionDetailsSheet/TransactionDetailsSheet';
import { formatNumberToCurrency } from '../../utils';
import type { ModifiedTransaction } from '../../utils';
import { DataTableColumnHeader } from './DataTableColumnHeader';

/**
 * Get status badge variant based on transaction status
 * Uses Salt Status tokens: success, warning, destructive (error), informative
 */
const getStatusVariant = (
  status?: string
): 'success' | 'warning' | 'destructive' | 'informative' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'success'; // Uses statusSuccess tokens (statusSuccessAccentBackground + statusSuccessForeground)
    case 'PENDING':
      return 'warning'; // Uses statusWarning tokens (statusWarningAccentBackground + statusWarningForeground)
    case 'REJECTED':
    case 'RETURNED':
    case 'FAILED':
      return 'destructive'; // Uses sentimentNegative tokens (maps to statusError)
    default:
      return 'informative'; // Uses statusInfo tokens (statusInfoAccentBackground + statusInfoForeground)
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
 * Format date-time for display
 */
const formatDateTime = (date?: string): string => {
  if (!date) return 'N/A';
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
 * - paymentDate, status, type, amount, counterpartName, transactionReferenceId, actions
 *
 * Hidden by default (available via column toggle):
 * - createdAt, effectiveDate, memo, debtorName, creditorName, ledgerBalance, etc.
 */
export const transactionsColumns: ColumnDef<ModifiedTransaction>[] = [
  // Date - Default visible
  {
    accessorKey: 'paymentDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    accessorFn: (row) => {
      if (row.paymentDate === undefined) {
        return '';
      }
      return new Date(row.paymentDate).getTime();
    },
    cell: ({ row }) => {
      return <div>{formatDate(row.original.paymentDate)}</div>;
    },
    enableHiding: false,
  },
  // Status - Default visible
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string | undefined;
      return (
        <Badge variant={getStatusVariant(status)}>{status || 'N/A'}</Badge>
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
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as PaymentTypeResponse | undefined;
      return <div>{type || 'N/A'}</div>;
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
      <DataTableColumnHeader column={column} title="Amount" />
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
        return <div className="eb-text-right eb-font-medium">N/A</div>;
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
  // Counterpart - Default visible
  {
    accessorKey: 'counterpartName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Counterpart" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('counterpartName') || 'N/A'}</div>;
    },
    filterFn: (row, id, value) => {
      const counterpart = (row.getValue(id) as string | undefined) || '';
      return counterpart.toLowerCase().includes(value.toLowerCase());
    },
  },
  // Transaction Reference ID - Default visible
  {
    accessorKey: 'transactionReferenceId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference ID" />
    ),
    cell: ({ row }) => {
      const refId = row.getValue('transactionReferenceId') as
        | string
        | undefined;
      return <div className="eb-font-mono eb-text-xs">{refId || 'N/A'}</div>;
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
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    accessorFn: (row) => {
      if (row.createdAt === undefined) {
        return '';
      }
      return new Date(row.createdAt).getTime();
    },
    cell: ({ row }) => {
      return <div>{formatDateTime(row.original.createdAt)}</div>;
    },
  },
  // Effective Date - Hidden by default
  {
    accessorKey: 'effectiveDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Effective Date" />
    ),
    accessorFn: (row) => {
      if (row.effectiveDate === undefined) {
        return '';
      }
      return new Date(row.effectiveDate).getTime();
    },
    cell: ({ row }) => {
      return <div>{formatDateTime(row.original.effectiveDate)}</div>;
    },
  },
  // Memo - Hidden by default
  {
    accessorKey: 'memo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Memo" />
    ),
    cell: ({ row }) => {
      const memo = row.getValue('memo') as string | undefined;
      return (
        <div className="eb-max-w-[200px] eb-truncate">{memo || 'N/A'}</div>
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
      <DataTableColumnHeader column={column} title="Debtor" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('debtorName') || 'N/A'}</div>;
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
      <DataTableColumnHeader column={column} title="Creditor" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('creditorName') || 'N/A'}</div>;
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
      <DataTableColumnHeader column={column} title="Ledger Balance" />
    ),
    cell: ({ row }) => {
      const transaction = row.original;
      const balance = row.getValue('ledgerBalance') as number | undefined;
      if (balance === undefined) {
        return <div className="eb-text-right">N/A</div>;
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
      <DataTableColumnHeader column={column} title="Posting Version" />
    ),
    cell: ({ row }) => {
      const version = row.getValue('postingVersion') as number | undefined;
      return <div>{version ?? 'N/A'}</div>;
    },
  },
  // Payin/Payout - Hidden by default
  {
    accessorKey: 'payinOrPayout',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Direction" />
    ),
    cell: ({ row }) => {
      const direction = row.getValue('payinOrPayout') as
        | 'PAYIN'
        | 'PAYOUT'
        | undefined;
      if (!direction) return <div>N/A</div>;
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
  // Currency - Hidden by default
  {
    accessorKey: 'currency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Currency" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('currency') || 'N/A'}</div>;
    },
  },
  // Actions - Always visible
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <TransactionDetailsDialogTrigger transactionId={transaction.id ?? ''}>
          <Button variant="ghost" className="eb-h-8 eb-w-8 eb-p-0">
            <span className="eb-sr-only">View transaction details</span>
            <ChevronRightIcon className="eb-h-4 eb-w-4" />
          </Button>
        </TransactionDetailsDialogTrigger>
      );
    },
  },
];
