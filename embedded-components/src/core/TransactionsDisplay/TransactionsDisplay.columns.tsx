import { ColumnDef } from '@tanstack/react-table';
import { ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui';

import { TransactionDetailsDialogTrigger } from './TransactionDetailsSheet/TransactionDetailsSheet';
import { formatNumberToCurrency } from './utils/formatNumberToCurrency';
import { ModifiedTransaction } from './utils/modifyTransactionsData';

export const columns: ColumnDef<ModifiedTransaction>[] = [
  {
    accessorKey: 'paymentDate',
    header: 'Payment Date',
    accessorFn: (row) => {
      if (row.paymentDate === undefined) {
        return 'N/A';
      }
      return new Date(row.paymentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'counterpartName',
    header: 'Counterpart Name',
  },
  {
    accessorKey: 'amount',
    accessorFn: (row) => {
      if (row.amount === undefined) {
        return 'N/A';
      }
      const formattedAmount = formatNumberToCurrency(
        row.amount,
        row.currency ?? 'USD'
      );
      return row.payinOrPayout === 'PAYIN'
        ? formattedAmount
        : `-${formattedAmount}`;
    },
    header: () => <div className="eb-text-right">Amount</div>,
    cell: ({ row }) => {
      return (
        <div className="eb-text-right eb-font-medium">
          {row.getValue('amount')}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <TransactionDetailsDialogTrigger transaction={transaction}>
          <Button variant="ghost" className="eb-h-8 eb-w-8 eb-p-0">
            <span className="eb-sr-only">View transaction details</span>
            <ChevronRightIcon className="eb-h-4 eb-w-4" />
          </Button>
        </TransactionDetailsDialogTrigger>
      );
    },
  },
];
