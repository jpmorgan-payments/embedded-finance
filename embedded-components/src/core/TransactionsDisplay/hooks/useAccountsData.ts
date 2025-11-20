import { useMemo } from 'react';

import { useGetAccounts } from '@/api/generated/ep-accounts';

import { useInterceptorStatus } from '../../EBComponentsProvider/EBComponentsProvider';

/**
 * Return type for useAccountsData hook
 */
export interface UseAccountsDataReturn {
  /** All accounts from the API */
  accounts: Array<{ id: string; category?: string }> | undefined;

  /** Filtered account IDs for LIMITED_DDA_PAYMENTS and LIMITED_DDA categories */
  filteredAccountIds: string[];

  /** Loading state from React Query */
  isLoading: boolean;

  /** Error state from React Query */
  isError: boolean;

  /** Success state from React Query */
  isSuccess: boolean;
}

/**
 * Custom hook to fetch accounts and filter for transaction display
 *
 * This hook is SPECIFIC to TransactionsDisplay. It fetches accounts
 * and filters for LIMITED_DDA_PAYMENTS and LIMITED_DDA categories.
 *
 * @example
 * ```tsx
 * const { filteredAccountIds } = useAccountsData();
 * ```
 */
export function useAccountsData(): UseAccountsDataReturn {
  const { interceptorReady } = useInterceptorStatus();

  const {
    data: accountsData,
    isLoading,
    isError,
    isSuccess,
  } = useGetAccounts(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });

  const filteredAccountIds = useMemo(() => {
    if (!accountsData?.items) {
      return [];
    }

    return accountsData.items
      .filter(
        (account) =>
          account.category === 'LIMITED_DDA_PAYMENTS' ||
          account.category === 'LIMITED_DDA'
      )
      .map((account) => account.id);
  }, [accountsData?.items]);

  return {
    accounts: accountsData?.items,
    filteredAccountIds,
    isLoading,
    isError,
    isSuccess,
  };
}
