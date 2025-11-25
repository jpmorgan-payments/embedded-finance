import { useMemo } from 'react';

import type {
  Recipient,
  RecipientStatus,
} from '@/api/generated/ep-recipients.schemas';

import { formatRecipientName } from '../utils/recipientHelpers';

export interface UseRecipientsDataOptions {
  recipients: Recipient[] | undefined;
  searchTerm: string;
  statusFilter?: RecipientStatus;
  sortRecipients: (recipients: Recipient[]) => Recipient[];
}

export interface UseRecipientsDataReturn {
  filteredRecipients: Recipient[];
}

/**
 * Hook for filtering and sorting recipients data
 */
export function useRecipientsData(
  options: UseRecipientsDataOptions
): UseRecipientsDataReturn {
  const { recipients, searchTerm, statusFilter, sortRecipients } = options;

  const filteredRecipients = useMemo(() => {
    if (!recipients) return [];

    const filtered = recipients.filter((recipient) => {
      // Only show RECIPIENT type
      if (recipient.type !== 'RECIPIENT') return false;

      const matchesSearch =
        searchTerm === '' ||
        formatRecipientName(recipient)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        recipient.account?.number?.includes(searchTerm);

      const matchesStatus = !statusFilter || recipient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    return sortRecipients(filtered);
  }, [recipients, searchTerm, statusFilter, sortRecipients]);

  return {
    filteredRecipients,
  };
}
