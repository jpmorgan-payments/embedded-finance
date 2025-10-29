import { useMemo } from 'react';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { Recipient } from '@/api/generated/ep-recipients.schemas';

export interface UseLinkedAccountsOptions {
  /** Variant to control how many accounts to show */
  variant?: 'default' | 'singleAccount';
}

export interface UseLinkedAccountsResult {
  /** List of linked account recipients */
  recipients: Recipient[];
  /** Whether there's at least one active account */
  hasActiveAccount: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error details */
  error: Error | null;
  /** Success state */
  isSuccess: boolean;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Custom hook to manage linked accounts data fetching and state
 */
export function useLinkedAccounts(
  options: UseLinkedAccountsOptions = {}
): UseLinkedAccountsResult {
  const { variant = 'default' } = options;

  const { data, status, failureReason, refetch } = useGetAllRecipients({
    type: 'LINKED_ACCOUNT',
  });

  // Filter recipients based on variant
  const recipients = useMemo(() => {
    if (!data?.recipients) return [];
    return variant === 'singleAccount'
      ? data.recipients.slice(0, 1)
      : data.recipients;
  }, [data?.recipients, variant]);

  // Check if there's at least one active account
  const hasActiveAccount = useMemo(
    () => recipients.some((r) => r.status === 'ACTIVE'),
    [recipients]
  );

  return {
    recipients,
    hasActiveAccount,
    isLoading: status === 'pending',
    isError: status === 'error',
    error: failureReason,
    isSuccess: status === 'success',
    refetch,
  };
}
