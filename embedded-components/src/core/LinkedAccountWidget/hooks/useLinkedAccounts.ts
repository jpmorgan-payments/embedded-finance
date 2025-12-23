import { useMemo } from 'react';

import { useGetAllRecipientsInfinite } from '@/api/generated/ep-recipients';
import { PageMetaData, Recipient } from '@/api/generated/ep-recipients.schemas';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';

/**
 * Options for the useLinkedAccounts hook
 */
export interface UseLinkedAccountsOptions {
  /**
   * Variant determines filtering and limiting logic:
   * - 'default': Shows all verified linked accounts (excludes PENDING_VERIFICATION)
   * - 'singleAccount': Shows only the first verified linked account (for simplified views)
   */
  variant?: 'default' | 'singleAccount';

  /**
   * Number of items to fetch per API page
   * @default 10
   */
  pageSize?: number;
}

/**
 * Return type for useLinkedAccounts hook
 */
export interface UseLinkedAccountsReturn {
  /** Filtered linked accounts based on variant */
  linkedAccounts: Recipient[];

  /** All loaded accounts without pagination limits (for table view) */
  allLoadedAccounts: Recipient[];

  /** Metadata */
  metadata?: PageMetaData;

  /** Whether user has at least one active (non-pending) linked account */
  hasActiveAccount: boolean;

  /** Loading state from React Query */
  isLoading: boolean;

  /** Error state from React Query */
  isError: boolean;

  /** Error object if request failed */
  error: Error | null;

  /** Success state from React Query */
  isSuccess: boolean;

  /** Refetch function to manually trigger data refresh */
  refetch: () => void;

  /** Total count of filtered accounts */
  totalCount: number;

  /** Current page number (1-indexed) */
  currentPage: number;

  /** Total number of pages available */
  totalPages: number;

  /** Whether there are more pages to load */
  hasMore: boolean;

  /** Function to load the next page */
  loadMore: () => void;

  /** Whether currently loading more items */
  isLoadingMore: boolean;

  /** Number of items that will be loaded on next "Load More" click */
  nextLoadCount: number;
}

/**
 * Custom hook to fetch and filter linked accounts (type='LINKED_ACCOUNT')
 *
 * This hook is SPECIFIC to LinkedAccountWidget. It filters recipients by type='LINKED_ACCOUNT'
 * and applies variant-specific logic:
 * - 'default': Shows all verified accounts (excludes PENDING_VERIFICATION)
 * - 'singleAccount': Shows only the first verified account (for simplified views)
 *
 * Implements pagination support for loading more accounts from the API.
 *
 * @example
 * ```tsx
 * // Basic usage with pagination
 * const { linkedAccounts, hasMore, loadMore } = useLinkedAccounts({
 *   variant: 'default',
 *   pageSize: 10
 * });
 *
 * // Get only the first linked account
 * const { linkedAccounts } = useLinkedAccounts({ variant: 'singleAccount' });
 * ```
 */
export function useLinkedAccounts({
  variant = 'default',
  pageSize = 10,
}: UseLinkedAccountsOptions = {}): UseLinkedAccountsReturn {
  const { interceptorReady } = useInterceptorStatus();

  // Use infinite query for proper pagination with accumulation
  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllRecipientsInfinite(
    {
      type: 'LINKED_ACCOUNT',
      limit: pageSize,
    },
    {
      query: {
        getNextPageParam: (lastPage) => {
          const totalItems = lastPage.metadata?.total_items || 0;
          const currentLimit = lastPage.limit || pageSize;
          const currentPage = lastPage.page || 0;
          const totalPages = Math.ceil(totalItems / currentLimit);
          // Return next page number if more pages exist
          return currentPage + 1 < totalPages ? currentPage + 1 : undefined;
        },
        enabled: interceptorReady,
        initialPageParam: 0,
      },
    }
  );

  // Flatten all pages into accumulated accounts
  const allLoadedAccounts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.recipients || []);
  }, [data?.pages]);

  // Get metadata from the first page
  const metadata = data?.pages?.[0]?.metadata;

  // Apply variant logic
  const linkedAccounts = useMemo(() => {
    if (variant === 'singleAccount') {
      return allLoadedAccounts.slice(0, 1);
    }

    return allLoadedAccounts;
  }, [allLoadedAccounts, variant]);

  // Check if user has at least one active (non-pending) account
  const hasActiveAccount = allLoadedAccounts.length > 0;

  // Calculate pagination info
  const totalItems = metadata?.total_items || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = data?.pages?.length || 0;
  const hasMore = hasNextPage ?? false;

  // Calculate what will be loaded next
  const nextLoadCount = Math.min(pageSize, totalItems - allLoadedAccounts.length);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    linkedAccounts,
    allLoadedAccounts,
    metadata,
    hasActiveAccount,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
    totalCount: totalItems,
    currentPage,
    totalPages,
    hasMore,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    nextLoadCount,
  };
}
