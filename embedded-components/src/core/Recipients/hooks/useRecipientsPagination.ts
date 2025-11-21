import { useCallback, useMemo, useState } from 'react';

export interface UseRecipientsPaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface UseRecipientsPaginationReturn {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;
  paginatedItems: <T>(items: T[]) => T[];
  paginationInfo: {
    startIndex: number;
    endIndex: number;
    total: number;
  };
}

/**
 * Hook for managing pagination state and logic
 */
export function useRecipientsPagination(
  totalItems: number,
  options: UseRecipientsPaginationOptions = {}
): UseRecipientsPaginationReturn {
  const { initialPage = 1, initialPageSize = 10 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const paginatedItems = useCallback(
    <T>(items: T[]): T[] => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return items.slice(startIndex, endIndex);
    },
    [currentPage, pageSize]
  );

  const paginationInfo = useMemo(
    () => ({
      startIndex: (currentPage - 1) * pageSize + 1,
      endIndex: Math.min(currentPage * pageSize, totalItems),
      total: totalItems,
    }),
    [currentPage, pageSize, totalItems]
  );

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    paginatedItems,
    paginationInfo,
  };
}
