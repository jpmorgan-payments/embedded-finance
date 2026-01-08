import * as React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationProps {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalCount: number;
  /** Total number of pages */
  pageCount: number;
  /** Whether previous page navigation is available */
  canPreviousPage: boolean;
  /** Whether next page navigation is available */
  canNextPage: boolean;
  /** Callback to change page */
  onPageChange: (pageIndex: number) => void;
  /** Callback to change page size */
  onPageSizeChange: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant for styling */
  variant?: 'default' | 'compact';
}

/**
 * Pagination - Reusable pagination controls
 *
 * Provides navigation buttons, page info, and optional page size selector.
 *
 * @example
 * ```tsx
 * <Pagination
 *   pageIndex={0}
 *   pageSize={10}
 *   totalCount={100}
 *   pageCount={10}
 *   canPreviousPage={false}
 *   canNextPage={true}
 *   onPageChange={(page) => setPage(page)}
 *   onPageSizeChange={(size) => setPageSize(size)}
 * />
 * ```
 */
export const Pagination: React.FC<PaginationProps> = ({
  pageIndex,
  pageSize,
  totalCount,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 30, 50],
  showPageSizeSelector = true,
  className,
  variant = 'default',
}) => {
  const { t } = useTranslation('linked-accounts');

  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div
      className={cn(
        'eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2',
        {
          'eb-px-2': variant === 'default',
          'eb-px-3 eb-py-2': variant === 'compact',
        },
        className
      )}
    >
      {/* Showing X to Y of Z */}
      <div className="eb-flex eb-items-center eb-text-sm eb-text-muted-foreground">
        <span>
          {t('table.showing', {
            defaultValue: 'Showing {{from}} to {{to}} of {{total}}',
            from,
            to,
            total: totalCount,
          })}
        </span>
      </div>

      <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-4 lg:eb-gap-6">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="eb-flex eb-items-center eb-gap-2">
            <span className="eb-text-sm eb-font-medium">
              {t('table.rowsPerPage', { defaultValue: 'Rows per page' })}
            </span>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="eb-h-8 eb-w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page X of Y */}
        <div className="eb-flex eb-w-[100px] eb-items-center eb-justify-center eb-text-sm eb-font-medium">
          {t('table.pageOf', {
            defaultValue: 'Page {{page}} of {{total}}',
            page: pageIndex + 1,
            total: pageCount,
          })}
        </div>

        {/* Navigation buttons */}
        <div className="eb-flex eb-items-center eb-gap-1">
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
            onClick={() => onPageChange(0)}
            disabled={!canPreviousPage}
            aria-label={t('table.firstPage', {
              defaultValue: 'Go to first page',
            })}
          >
            <ChevronsLeftIcon className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8 eb-w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPreviousPage}
            aria-label={t('table.previousPage', {
              defaultValue: 'Go to previous page',
            })}
          >
            <ChevronLeftIcon className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-h-8 eb-w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNextPage}
            aria-label={t('table.nextPage', {
              defaultValue: 'Go to next page',
            })}
          >
            <ChevronRightIcon className="eb-h-4 eb-w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!canNextPage}
            aria-label={t('table.lastPage', {
              defaultValue: 'Go to last page',
            })}
          >
            <ChevronsRightIcon className="eb-h-4 eb-w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
