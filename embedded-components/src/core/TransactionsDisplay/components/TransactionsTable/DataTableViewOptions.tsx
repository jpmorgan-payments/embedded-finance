import { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
 * Map column IDs to their translation keys
 */
const getColumnTranslationKey = (columnId: string): string => {
  const keyMap: Record<string, string> = {
    paymentDate: 'columns.date',
    status: 'columns.status',
    type: 'columns.type',
    amount: 'columns.amount',
    currency: 'columns.currency',
    counterpartName: 'columns.counterpart',
    transactionReferenceId: 'columns.referenceId',
    createdAt: 'columns.createdAt',
    effectiveDate: 'columns.effectiveDate',
    memo: 'columns.memo',
    debtorName: 'columns.debtor',
    creditorName: 'columns.creditor',
    ledgerBalance: 'columns.ledgerBalance',
    postingVersion: 'columns.postingVersion',
    payinOrPayout: 'columns.direction',
  };
  return keyMap[columnId] || columnId;
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
  const { t } = useTranslation(['transactions']);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="eb-ml-auto eb-hidden eb-h-8 lg:eb-flex"
        >
          <Settings2 className="eb-mr-2 eb-h-4 eb-w-4" />
          {t('viewOptions.button', { defaultValue: 'Columns' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="eb-w-auto eb-min-w-[200px]">
        <DropdownMenuLabel>
          {t('viewOptions.label', { defaultValue: 'Toggle columns' })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              column.getCanHide() &&
              (column.accessorFn !== undefined ||
                (column.columnDef as any).accessorKey !== undefined)
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                className="eb-pr-4"
              >
                {t(getColumnTranslationKey(column.id), {
                  defaultValue: column.id,
                })}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
