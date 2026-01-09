import { useMemo } from 'react';

import { useGetAllRecipientsInfinite } from '@/api/generated/ep-recipients';
import { PageMetaData, Recipient } from '@/api/generated/ep-recipients.schemas';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { SupportedRecipientType } from '../types';

/**
 * Options for the useRecipients hook
 */
export interface UseRecipientsOptions {
  /**
   * Variant determines filtering and limiting logic:
   * - 'default': Shows all recipients
   * - 'singleAccount': Shows only the first recipient (for simplified views)
   */
  variant?: 'default' | 'singleAccount';

  /**
   * Number of items to fetch per API page
   * @default 10
   */
  pageSize?: number;

  /**
   * Type of recipients to fetch (required)
   */
  recipientType: SupportedRecipientType;
}

/**
 * Return type for useRecipients hook
 */
export interface UseRecipientsReturn {
  /** Filtered recipients based on variant */
  recipients: Recipient[];

  /** All loaded recipients without pagination limits (for table view) */
  allLoadedRecipients: Recipient[];

  /** Metadata */
  metadata?: PageMetaData;

  /** Whether user has at least one active recipient */
  hasActiveRecipient: boolean;

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

  /** Total count of filtered recipients */
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
 * Custom hook to fetch and filter recipients
 *
 * This hook fetches recipients based on the specified type and applies variant-specific logic:
 * - 'default': Shows all recipients
 * - 'singleAccount': Shows only the first recipient (for simplified views)
 *
 * Implements pagination support for loading more recipients from the API.
 *
 * @example
 * ```tsx
 * // Basic usage with pagination
 * const { recipients, hasMore, loadMore } = useRecipients({
 *   variant: 'default',
 *   pageSize: 10
 * });
 *
 * // Get only the first recipient
 * const { recipients } = useRecipients({ variant: 'singleAccount' });
 *
 * // Fetch RECIPIENT type instead of LINKED_ACCOUNT
 * const { recipients } = useRecipients({ recipientType: 'RECIPIENT' });
 * ```
 */
export function useRecipients({
  variant = 'default',
  pageSize = 10,
  recipientType,
}: UseRecipientsOptions): UseRecipientsReturn {
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
      type: recipientType,
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

  // Flatten all pages into accumulated recipients
  const allLoadedRecipients = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.recipients || []);
  }, [data?.pages]);

  // Get metadata from the first page
  const metadata = data?.pages?.[0]?.metadata;

  // Apply variant logic
  const recipients = useMemo(() => {
    if (variant === 'singleAccount') {
      return allLoadedRecipients.slice(0, 1);
    }

    return allLoadedRecipients;
  }, [allLoadedRecipients, variant]);

  // Check if user has at least one active recipient
  const hasActiveRecipient = allLoadedRecipients.length > 0;

  // Calculate pagination info
  const totalItems = metadata?.total_items || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = data?.pages?.length || 0;
  const hasMore = hasNextPage ?? false;

  // Calculate what will be loaded next
  const nextLoadCount = Math.min(
    pageSize,
    totalItems - allLoadedRecipients.length
  );

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    recipients,
    allLoadedRecipients,
    metadata,
    hasActiveRecipient,
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
