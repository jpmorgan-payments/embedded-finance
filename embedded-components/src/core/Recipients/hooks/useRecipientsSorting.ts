import { useCallback, useState } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

import type { RecipientColumnKey } from '../Recipients.columns';
import { formatRecipientName } from '../utils/recipientHelpers';

export interface UseRecipientsSortingReturn {
  sortBy: RecipientColumnKey | null;
  sortOrder: 'asc' | 'desc';
  setSortBy: (column: RecipientColumnKey | null) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  handleSort: (column: RecipientColumnKey) => void;
  sortRecipients: (recipients: Recipient[]) => Recipient[];
}

/**
 * Hook for managing sorting state and logic
 */
export function useRecipientsSorting(
  isColumnSortable: (column: RecipientColumnKey) => boolean
): UseRecipientsSortingReturn {
  const [sortBy, setSortBy] = useState<RecipientColumnKey | null>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback(
    (column: RecipientColumnKey) => {
      // Only allow sorting if column is sortable
      if (!isColumnSortable(column)) {
        return;
      }

      if (sortBy === column) {
        // Toggle sort order if same column
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // Set new column and default to ascending
        setSortBy(column);
        setSortOrder('asc');
      }
    },
    [sortBy, isColumnSortable]
  );

  const sortRecipients = useCallback(
    (recipients: Recipient[]): Recipient[] => {
      if (!sortBy) return recipients;

      return [...recipients].sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;

        switch (sortBy) {
          case 'name':
            aValue = formatRecipientName(a).toLowerCase();
            bValue = formatRecipientName(b).toLowerCase();
            break;
          case 'type':
            aValue = a.type || '';
            bValue = b.type || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'accountNumber':
            aValue = a.account?.number || '';
            bValue = b.account?.number || '';
            break;
          case 'accountType':
            aValue = a.account?.type || '';
            bValue = b.account?.type || '';
            break;
          case 'routingNumber':
            aValue = a.account?.routingInformation?.[0]?.routingNumber || '';
            bValue = b.account?.routingInformation?.[0]?.routingNumber || '';
            break;
          case 'createdAt':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          case 'updatedAt':
            aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
          case 'partyId':
            aValue = a.partyId || '';
            bValue = b.partyId || '';
            break;
          case 'clientId':
            aValue = a.clientId || '';
            bValue = b.clientId || '';
            break;
          default:
            return 0;
        }

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
    [sortBy, sortOrder]
  );

  return {
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    handleSort,
    sortRecipients,
  };
}
