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
    <div className="eb-flex eb-flex-col eb-gap-2 eb-px-2 sm:eb-flex-row sm:eb-items-center sm:eb-justify-between sm:eb-gap-0">
      {/* Row count - hidden on mobile to save space */}
      <div className="eb-hidden eb-text-sm eb-text-muted-foreground sm:eb-block">
        {t('pagination.rowsTotal', {
          count: table.getFilteredRowModel().rows.length,
          defaultValue: '{{count}} row(s) total',
        })}
      </div>
      <div className="eb-flex eb-flex-col eb-gap-2 sm:eb-flex-row sm:eb-items-center sm:eb-gap-4">
        {/* Page size selector - hidden on mobile to save space */}
        <div className="eb-hidden eb-items-center eb-gap-2 sm:eb-flex">
          <p className="eb-text-sm eb-font-medium">
            {t('pagination.rowsPerPage', { defaultValue: 'Rows per page' })}
          </p>
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
        {/* Mobile layout: Navigation buttons first, then page info */}
        <div className="eb-flex eb-flex-col eb-gap-2 sm:eb-flex-row sm:eb-items-center sm:eb-gap-4">
          {/* Navigation buttons - larger on mobile */}
          <div className="eb-flex eb-items-center eb-justify-center eb-gap-2">
            <Button
              variant="outline"
              size="icon"
              className="eb-hidden eb-h-8 lg:eb-flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="eb-sr-only">
                {t('pagination.goToFirst.srOnly', {
                  defaultValue: 'Go to first page',
                })}
              </span>
              <ChevronsLeft className="eb-h-4 eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-10 eb-w-10 sm:eb-h-8 sm:eb-w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="eb-sr-only">
                {t('pagination.goToPrevious.srOnly', {
                  defaultValue: 'Go to previous page',
                })}
              </span>
              <ChevronLeft className="eb-h-5 eb-w-5 sm:eb-h-4 sm:eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-10 eb-w-10 sm:eb-h-8 sm:eb-w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="eb-sr-only">
                {t('pagination.goToNext.srOnly', {
                  defaultValue: 'Go to next page',
                })}
              </span>
              <ChevronRight className="eb-h-5 eb-w-5 sm:eb-h-4 sm:eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-hidden eb-h-8 lg:eb-flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="eb-sr-only">
                {t('pagination.goToLast.srOnly', {
                  defaultValue: 'Go to last page',
                })}
              </span>
              <ChevronsRight className="eb-h-4 eb-w-4" />
            </Button>
          </div>
          {/* Page info - compact on mobile */}
          <div className="eb-flex eb-items-center eb-justify-center eb-text-sm eb-font-medium">
            <span className="eb-hidden sm:eb-inline">
              {t('pagination.pageInfo', {
                current: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
                defaultValue: 'Page {{current}} of {{total}}',
              })}
            </span>
            <span className="eb-inline sm:eb-hidden">
              {t('pagination.pageInfoMobile', {
                current: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
                defaultValue: '{{current}} / {{total}}',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
