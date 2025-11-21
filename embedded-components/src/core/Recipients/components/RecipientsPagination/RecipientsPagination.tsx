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
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="eb-mt-4 eb-flex eb-flex-col eb-gap-4 sm:eb-flex-row sm:eb-items-center sm:eb-justify-between">
      <div className="eb-flex eb-items-center eb-gap-4">
        <div className="eb-text-sm eb-text-gray-600">
          Showing {startIndex} to {endIndex} of {totalItems} recipient
          {totalItems !== 1 ? 's' : ''}
        </div>
        <div className="eb-flex eb-items-center eb-gap-2">
          <span className="eb-text-sm eb-font-medium">Rows per page</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="eb-h-8 eb-w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="eb-flex eb-items-center eb-gap-2">
          <div className="eb-text-sm eb-font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="eb-flex eb-gap-1">
            <Button
              variant="outline"
              size="icon"
              className="eb-h-8 eb-w-8"
              disabled={currentPage === 1}
              onClick={() => onPageChange(1)}
              title="First page"
            >
              <ChevronsLeft className="eb-h-4 eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-8 eb-w-8"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              title="Previous page"
            >
              <ChevronLeft className="eb-h-4 eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-8 eb-w-8"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              title="Next page"
            >
              <ChevronRight className="eb-h-4 eb-w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="eb-h-8 eb-w-8"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              title="Last page"
            >
              <ChevronsRight className="eb-h-4 eb-w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
