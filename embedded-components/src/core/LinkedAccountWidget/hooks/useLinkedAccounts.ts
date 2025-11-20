import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { Recipient } from '@/api/generated/ep-recipients.schemas';
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
}

/**
 * Return type for useLinkedAccounts hook
 */
export interface UseLinkedAccountsReturn {
  /** Filtered linked accounts based on variant */
  linkedAccounts: Recipient[];

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
}

/**
 * Custom hook to fetch and filter linked accounts (type='LINKED_ACCOUNT')
 *
 * This hook is SPECIFIC to LinkedAccountWidget. It filters recipients by type='LINKED_ACCOUNT'
 * and applies variant-specific logic:
 * - 'default': Shows all verified accounts (excludes PENDING_VERIFICATION)
 * - 'singleAccount': Shows only the first verified account (for simplified views)
 *
 * @example
 * ```tsx
 * // Get all verified linked accounts
 * const { linkedAccounts, hasActiveAccount } = useLinkedAccounts({ variant: 'default' });
 *
 * // Get only the first linked account
 * const { linkedAccounts } = useLinkedAccounts({ variant: 'singleAccount' });
 * ```
 */
export function useLinkedAccounts({
  variant = 'default',
}: UseLinkedAccountsOptions): UseLinkedAccountsReturn {
  const { interceptorReady } = useInterceptorStatus();
  const { data, isLoading, isError, error, isSuccess, refetch } =
    useGetAllRecipients(
      {
        type: 'LINKED_ACCOUNT',
      },
      {
        query: {
          select: (response) => {
            const accounts = response.recipients || [];

            // Apply variant-specific logic
            if (variant === 'singleAccount') {
              // Return only the first account for single account view
              return accounts.slice(0, 1);
            }

            // Default: return all verified accounts
            return accounts;
          },
          enabled: interceptorReady,
        },
      }
    );

  const linkedAccounts = data || [];

  // Check if user has at least one active (non-pending) account
  const hasActiveAccount = linkedAccounts.length > 0;

  return {
    linkedAccounts,
    hasActiveAccount,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
    totalCount: linkedAccounts.length,
  };
}
