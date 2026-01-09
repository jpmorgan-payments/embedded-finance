import { useMemo } from 'react';
import { PaginationState } from '@tanstack/react-table';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { PageMetaData, Recipient } from '@/api/generated/ep-recipients.schemas';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { SupportedRecipientType } from '../types';

/**
 * Options for the useRecipientsTable hook
 */
export interface UseRecipientsTableOptions {
  /**
   * Current pagination state from TanStack Table
   */
  pagination: PaginationState;

  /**
   * Callback to update pagination state
   */
  onPaginationChange: (pagination: PaginationState) => void;

  /**
   * Type of recipients to fetch (required)
   */
  recipientType: SupportedRecipientType;
}

/**
 * Return type for useRecipientsTable hook
 */
export interface UseRecipientsTableReturn {
  /** Recipients for the current page */
  recipients: Recipient[];

  /** Metadata from API */
  metadata?: PageMetaData;

  /** Total count of all recipients */
  totalCount: number;

  /** Total number of pages */
  pageCount: number;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  isError: boolean;

  /** Error object if request failed */
  error: Error | null;

  /** Success state */
  isSuccess: boolean;

  /** Refetch function */
  refetch: () => void;

  /** Whether user has at least one recipient */
  hasRecipients: boolean;
}

/**
 * Custom hook for recipients table with server-side pagination
 *
 * This hook is designed for table views where pagination is controlled by TanStack Table.
 * It fetches only the data needed for the current page, making it efficient for large datasets.
 *
 * @example
 * ```tsx
 * const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
 *
 * const { recipients, pageCount, isLoading } = useRecipientsTable({
 *   pagination,
 *   onPaginationChange: setPagination,
 * });
 *
 * const table = useReactTable({
 *   data: recipients,
 *   pageCount,
 *   state: { pagination },
 *   onPaginationChange: setPagination,
 *   manualPagination: true,
 *   // ...
 * });
 * ```
 */
export function useRecipientsTable({
  pagination,
  recipientType,
}: UseRecipientsTableOptions): UseRecipientsTableReturn {
  const { interceptorReady } = useInterceptorStatus();

  // Fetch data for the current page using standard pagination
  const { data, isLoading, isError, error, isSuccess, refetch } =
    useGetAllRecipients(
      {
        type: recipientType,
        page: pagination.pageIndex,
        limit: pagination.pageSize,
      },
      {
        query: {
          enabled: interceptorReady,
        },
      }
    );

  // Extract recipients from response
  const recipients = useMemo(() => {
    return data?.recipients || [];
  }, [data?.recipients]);

  // Get metadata
  const metadata = data?.metadata;
  const totalCount = metadata?.total_items || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  return {
    recipients,
    metadata,
    totalCount,
    pageCount,
    isLoading,
    isError,
    error: error as Error | null,
    isSuccess,
    refetch,
    hasRecipients: totalCount > 0,
  };
}
