import React from 'react';
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

export interface RecipientsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * RecipientsPagination - Pagination controls for recipients table
 */
export const RecipientsPagination: React.FC<RecipientsPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="eb-flex eb-flex-col eb-gap-2 eb-px-2 sm:eb-flex-row sm:eb-items-center sm:eb-justify-between sm:eb-gap-0">
      {/* Row count - hidden on mobile to save space */}
      <div className="eb-hidden eb-text-sm eb-text-muted-foreground sm:eb-block">
        {totalItems} row(s) total
      </div>
      <div className="eb-flex eb-flex-col eb-gap-2 sm:eb-flex-row sm:eb-items-center sm:eb-gap-4">
        {/* Page size selector - hidden on mobile to save space */}
        <div className="eb-hidden eb-items-center eb-gap-2 sm:eb-flex">
          <p className="eb-text-sm eb-font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="eb-h-8 eb-w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
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
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="eb-sr-only">Go to first page</span>
              <ChevronsLeft className="eb-h-4 eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-10 eb-w-10 sm:eb-h-8 sm:eb-w-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="eb-sr-only">Go to previous page</span>
              <ChevronLeft className="eb-h-5 eb-w-5 sm:eb-h-4 sm:eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-10 eb-w-10 sm:eb-h-8 sm:eb-w-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="eb-sr-only">Go to next page</span>
              <ChevronRight className="eb-h-5 eb-w-5 sm:eb-h-4 sm:eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-hidden eb-h-8 lg:eb-flex"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <span className="eb-sr-only">Go to last page</span>
              <ChevronsRight className="eb-h-4 eb-w-4" />
            </Button>
          </div>
          {/* Page info - compact on mobile */}
          <div className="eb-flex eb-items-center eb-justify-center eb-text-sm eb-font-medium">
            <span className="eb-hidden sm:eb-inline">
              Page {currentPage} of {totalPages}
            </span>
            <span className="eb-inline sm:eb-hidden">
              {currentPage} / {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
