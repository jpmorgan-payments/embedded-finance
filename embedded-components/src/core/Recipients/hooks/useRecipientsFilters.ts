import { useCallback, useState } from 'react';

import type {
  RecipientStatus,
  RecipientType,
} from '@/api/generated/ep-recipients.schemas';

export interface RecipientsFilters {
  type?: RecipientType;
  status?: RecipientStatus;
  searchTerm?: string;
}

export interface UseRecipientsFiltersReturn {
  filters: RecipientsFilters;
  updateFilter: <K extends keyof RecipientsFilters>(
    key: K,
    value: RecipientsFilters[K]
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Custom hook for managing recipients filters
 */
export const useRecipientsFilters = (): UseRecipientsFiltersReturn => {
  const [filters, setFilters] = useState<RecipientsFilters>({});

  const updateFilter = useCallback(
    <K extends keyof RecipientsFilters>(
      key: K,
      value: RecipientsFilters[K]
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
};
