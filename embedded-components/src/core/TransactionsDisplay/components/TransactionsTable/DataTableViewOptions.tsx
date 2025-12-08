import { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Props for DataTableViewOptions component
 */
interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

/**
 * Map column IDs to their display names
 */
const getColumnDisplayName = (columnId: string): string => {
  const displayNameMap: Record<string, string> = {
    paymentDate: 'Date',
    status: 'Status',
    type: 'Type',
    amount: 'Amount',
    currency: 'Currency',
    counterpartName: 'Counterpart',
    transactionReferenceId: 'Reference ID',
    createdAt: 'Created At',
    effectiveDate: 'Effective Date',
    memo: 'Memo',
    debtorName: 'Debtor',
    creditorName: 'Creditor',
    ledgerBalance: 'Ledger Balance',
    postingVersion: 'Posting Version',
    payinOrPayout: 'Direction',
  };
  return displayNameMap[columnId] || columnId;
};

/**
 * DataTableViewOptions - Column visibility toggle component
 *
 * Allows users to show/hide table columns.
 * Based on shadcn/ui data table patterns.
 */
export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="eb-ml-auto eb-hidden eb-h-8 lg:eb-flex"
        >
          <Settings2 className="eb-mr-2 eb-h-4 eb-w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="eb-w-auto eb-min-w-[200px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                className="eb-pr-4"
              >
                {getColumnDisplayName(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
