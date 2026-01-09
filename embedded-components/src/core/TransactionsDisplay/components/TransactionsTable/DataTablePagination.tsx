import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Props for DataTablePagination component
 */
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

/**
 * DataTablePagination - Enhanced pagination controls for data tables
 *
 * Provides page navigation, page size selection, and row count display.
 * Based on shadcn/ui data table patterns.
 */
export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation(['transactions']);

  return (
    <div className="eb-flex eb-items-center eb-justify-between eb-px-2">
      <div className="eb-flex eb-items-center eb-space-x-2 eb-text-sm eb-text-muted-foreground">
        <span>
          {t('pagination.showing', {
            defaultValue: 'Showing {{from}} to {{to}} of {{total}}',
            from:
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1,
            to: Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            ),
            total: table.getFilteredRowModel().rows.length,
          })}
        </span>
      </div>
      <div className="eb-flex eb-items-center eb-space-x-6 lg:eb-space-x-8">
        {/* Page size selector */}
        <div className="eb-flex eb-items-center eb-space-x-2">
          <span className="eb-text-sm eb-font-medium">
            {t('pagination.rowsPerPage', { defaultValue: 'Rows per page' })}
          </span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="eb-h-8 eb-w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <div className="eb-flex eb-w-[100px] eb-items-center eb-justify-center eb-text-sm eb-font-medium">
          {t('pagination.pageInfo', {
            current: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
            defaultValue: 'Page {{current}} of {{total}}',
          })}
        </div>

        {/* Navigation buttons */}
        <div className="eb-flex eb-items-center eb-space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('pagination.goToFirst.srOnly', {
              defaultValue: 'Go to first page',
            })}
          >
            <ChevronsLeft className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8 eb-w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('pagination.goToPrevious.srOnly', {
              defaultValue: 'Go to previous page',
            })}
          >
            <ChevronLeft className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8 eb-w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t('pagination.goToNext.srOnly', {
              defaultValue: 'Go to next page',
            })}
          >
            <ChevronRight className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label={t('pagination.goToLast.srOnly', {
              defaultValue: 'Go to last page',
            })}
          >
            <ChevronsRight className="eb-h-4 eb-w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
