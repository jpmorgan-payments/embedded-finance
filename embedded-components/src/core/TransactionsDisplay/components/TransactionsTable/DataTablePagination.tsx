import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

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
  return (
    <div className="eb-flex eb-items-center eb-justify-between eb-px-2">
      <div className="eb-flex-1 eb-text-sm eb-text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s) total
      </div>
      <div className="eb-flex eb-items-center eb-space-x-6 lg:eb-space-x-8">
        <div className="eb-flex eb-items-center eb-space-x-2">
          <p className="eb-text-sm eb-font-medium">Rows per page</p>
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
        <div className="eb-flex eb-w-[100px] eb-items-center eb-justify-center eb-text-sm eb-font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className="eb-flex eb-items-center eb-space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 lg:eb-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="eb-sr-only">Go to first page</span>
            <ChevronsLeft className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="eb-sr-only">Go to previous page</span>
            <ChevronLeft className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="eb-sr-only">Go to next page</span>
            <ChevronRight className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 lg:eb-flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="eb-sr-only">Go to last page</span>
            <ChevronsRight className="eb-h-4 eb-w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
