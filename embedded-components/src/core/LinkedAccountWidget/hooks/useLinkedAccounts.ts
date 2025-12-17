import { useMemo, useState } from 'react';

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
   * Number of items to display initially before "Load More" is clicked
   * @default 10
   */
  defaultVisibleCount?: number;

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

  /** Number of items that will be shown on next "Load More" click */
  nextLoadCount: number;

  /** Whether all items are expanded (vs collapsed to defaultVisibleCount) */
  isExpanded: boolean;

  /** Toggle between showing all items and initial items */
  toggleExpanded: () => void;
}

/**
 * Custom hook to fetch and filter linked accounts (type='LINKED_ACCOUNT')
 *
 * This hook is SPECIFIC to LinkedAccountWidget. It filters recipients by type='LINKED_ACCOUNT'
 * and applies variant-specific logic:
 * - 'default': Shows all verified accounts (excludes PENDING_VERIFICATION)
 * - 'singleAccount': Shows only the first verified account (for simplified views)
 *
 * Implements progressive disclosure with pagination support:
 * 1. Initially shows a limited number of accounts (default 2)
 * 2. First "Load More" click: shows all accounts from current page
 * 3. Second "Load More" click: fetches next page of accounts
 * 4. Continues paginating through all available accounts
 *
 * @example
 * ```tsx
 * // Show 2 accounts initially, expand to show more
 * const { linkedAccounts, hasMore, loadMore } = useLinkedAccounts({
 *   variant: 'default',
 *   defaultVisibleCount: 10,
 *   pageSize: 10
 * });
 *
 * // Get only the first linked account
 * const { linkedAccounts } = useLinkedAccounts({ variant: 'singleAccount' });
 * ```
 */
export function useLinkedAccounts({
  variant = 'default',
  defaultVisibleCount = 10,
  pageSize = 10,
}: UseLinkedAccountsOptions): UseLinkedAccountsReturn {
  const { interceptorReady } = useInterceptorStatus();
  const [showAll, setShowAll] = useState(false);

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

  // Apply variant and show/hide logic
  const linkedAccounts = useMemo(() => {
    if (variant === 'singleAccount') {
      return allLoadedAccounts.slice(0, 1);
    }

    // Show initial items or all loaded items
    if (showAll || allLoadedAccounts.length <= defaultVisibleCount) {
      return allLoadedAccounts;
    }

    return allLoadedAccounts.slice(0, defaultVisibleCount);
  }, [allLoadedAccounts, variant, showAll, defaultVisibleCount]);

  // Check if user has at least one active (non-pending) account
  const hasActiveAccount = allLoadedAccounts.length > 0;

  // Calculate pagination info
  const totalItems = metadata?.total_items || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = data?.pages?.length || 0;
  const hasMoreInCurrentLoad =
    allLoadedAccounts.length > defaultVisibleCount && !showAll;
  const hasMore = hasMoreInCurrentLoad || (hasNextPage ?? false);

  // Calculate what will be loaded next
  const nextLoadCount = hasMoreInCurrentLoad
    ? allLoadedAccounts.length - defaultVisibleCount // Will show remaining loaded items
    : Math.min(pageSize, totalItems - allLoadedAccounts.length); // Will fetch next page

  const loadMore = () => {
    if (hasMoreInCurrentLoad) {
      // First click: show all currently loaded items
      setShowAll(true);
    } else if (hasNextPage && !isFetchingNextPage) {
      // Second click: load next page and accumulate
      fetchNextPage();
    }
  };

  return {
    linkedAccounts,
    metadata,
    hasActiveAccount,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch: () => {
      setShowAll(false);
      refetch();
    },
    totalCount: totalItems,
    currentPage,
    totalPages,
    hasMore,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    nextLoadCount,
    isExpanded: showAll,
    toggleExpanded: () => setShowAll(!showAll),
  };
}
