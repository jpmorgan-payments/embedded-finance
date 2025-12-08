import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  PaymentTypeResponse,
  TransactionStatus,
} from '@/api/generated/ep-transactions.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { DataTableViewOptions } from './DataTableViewOptions';

/**
 * Props for TransactionsTableToolbar component
 */
interface TransactionsTableToolbarProps<TData> {
  table: Table<TData>;
}

/**
 * TransactionsTableToolbar - Filtering and view controls for transactions table
 *
 * Provides filtering by:
 * - Status (dropdown)
 * - Type (dropdown)
 * - Counterpart name (text input)
 * - Transaction reference ID (text input)
 * - Amount (text input - can be enhanced with range later)
 */
export function TransactionsTableToolbar<TData>({
  table,
}: TransactionsTableToolbarProps<TData>) {
  const { t } = useTranslation(['transactions']);
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get unique status values from data
  const statusFilter = table.getColumn('status')?.getFilterValue() as
    | string[]
    | undefined;
  const typeFilter = table.getColumn('type')?.getFilterValue() as
    | string[]
    | undefined;
  const counterpartFilter = table
    .getColumn('counterpartName')
    ?.getFilterValue() as string | undefined;
  const referenceFilter = table
    .getColumn('transactionReferenceId')
    ?.getFilterValue() as string | undefined;

  return (
    <div className="eb-flex eb-flex-col eb-gap-2 sm:eb-flex-row sm:eb-items-center sm:eb-justify-between">
      <div className="eb-flex eb-flex-1 eb-flex-wrap eb-items-center eb-gap-2">
        {/* Status Filter */}
        <Select
          value={
            statusFilter && statusFilter.length > 0 ? statusFilter[0] : 'all'
          }
          onValueChange={(value) => {
            if (value === 'all') {
              table.getColumn('status')?.setFilterValue(undefined);
            } else {
              table.getColumn('status')?.setFilterValue([value]);
            }
          }}
        >
          <SelectTrigger className="eb-h-8 eb-w-[140px]">
            <SelectValue
              placeholder={t('filters.status.placeholder', {
                defaultValue: 'All statuses',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('filters.status.all', { defaultValue: 'All statuses' })}
            </SelectItem>
            {Object.values(TransactionStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={typeFilter && typeFilter.length > 0 ? typeFilter[0] : 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              table.getColumn('type')?.setFilterValue(undefined);
            } else {
              table.getColumn('type')?.setFilterValue([value]);
            }
          }}
        >
          <SelectTrigger className="eb-h-8 eb-w-[140px]">
            <SelectValue
              placeholder={t('filters.type.placeholder', {
                defaultValue: 'All types',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('filters.type.all', { defaultValue: 'All types' })}
            </SelectItem>
            {Object.values(PaymentTypeResponse).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Counterpart Name Filter */}
        <Input
          placeholder={t('filters.counterpart.placeholder', {
            defaultValue: 'Filter counterpart...',
          })}
          value={counterpartFilter ?? ''}
          onChange={(event) =>
            table
              .getColumn('counterpartName')
              ?.setFilterValue(event.target.value)
          }
          className="eb-h-8 eb-w-[150px]"
        />

        {/* Transaction Reference ID Filter */}
        <Input
          placeholder={t('filters.referenceId.placeholder', {
            defaultValue: 'Filter reference ID...',
          })}
          value={referenceFilter ?? ''}
          onChange={(event) =>
            table
              .getColumn('transactionReferenceId')
              ?.setFilterValue(event.target.value)
          }
          className="eb-h-8 eb-w-[150px]"
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="eb-h-8 eb-px-2 lg:eb-px-3"
          >
            {t('actions.reset', { defaultValue: 'Reset' })}
            <X className="eb-ml-2 eb-h-4 eb-w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
