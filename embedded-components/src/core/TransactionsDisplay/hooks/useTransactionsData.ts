import { useMemo } from 'react';

import { useListTransactionsV2 } from '@/api/generated/ep-transactions';

import { useInterceptorStatus } from '../../EBComponentsProvider/EBComponentsProvider';
import { modifyTransactionsData, type ModifiedTransaction } from '../utils';

/**
 * Options for the useTransactionsData hook
 */
export interface UseTransactionsDataOptions {
  /**
   * Optional array of account IDs to filter transactions.
   * If not provided, all transactions will be returned.
   */
  accountIds?: string[];
}

/**
 * Return type for useTransactionsData hook
 */
export interface UseTransactionsDataReturn {
  /** Processed and filtered transactions */
  transactions: ModifiedTransaction[];

  /** Loading state from React Query */
  isLoading: boolean;

  /** Error state from React Query */
  isError: boolean;

  /** Error object if request failed */
  error: Error | null;

  /** Success state from React Query */
  isSuccess: boolean;

  /** Status from React Query */
  status: 'pending' | 'error' | 'success';

  /** Failure reason if request failed */
  failureReason: Error | null;

  /** Whether data is currently being fetched */
  isFetching: boolean;

  /** Refetch function to manually trigger data refresh */
  refetch: () => void;
}

/**
 * Custom hook to fetch and process transactions data
 *
 * This hook is SPECIFIC to TransactionsDisplay. It fetches transactions
 * and applies filtering/sorting logic based on account IDs.
 *
 * @example
 * ```tsx
 * const { transactions, isLoading, refetch } = useTransactionsData({
 *   accountIds: ['account1', 'account2']
 * });
 * ```
 */
export function useTransactionsData({
  accountIds,
}: UseTransactionsDataOptions = {}): UseTransactionsDataReturn {
  const { interceptorReady } = useInterceptorStatus();

  const {
    data,
    status,
    failureReason,
    refetch,
    isFetching,
    isLoading,
    isError,
    error,
    isSuccess,
  } = useListTransactionsV2(
    {},
    {
      query: {
        enabled: interceptorReady,
      },
    }
  );

  const transactions = useMemo(() => {
    if (!data?.items) {
      return [];
    }

    return modifyTransactionsData(data.items, accountIds ?? []);
  }, [data?.items, accountIds]);

  return {
    transactions,
    isLoading,
    isError,
    error: error as Error | null,
    isSuccess,
    status,
    failureReason: failureReason as Error | null,
    isFetching,
    refetch,
  };
}
