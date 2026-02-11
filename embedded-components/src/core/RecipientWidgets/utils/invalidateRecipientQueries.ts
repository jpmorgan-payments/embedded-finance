import { QueryClient } from '@tanstack/react-query';

import { SupportedRecipientType } from '../types';

/**
 * Invalidates all React Query caches related to recipients of a specific type.
 *
 * This utility handles the complex query key matching needed because
 * recipient queries may have varying params (page, limit, etc.).
 * It uses a predicate to match any query that:
 * 1. Contains '/recipients' in the query key path
 * 2. Has the specified type in the params
 *
 * @param queryClient - The React Query client instance
 * @param recipientType - The recipient type to invalidate queries for
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 *
 * // After a mutation succeeds for LINKED_ACCOUNT
 * invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT');
 *
 * // After a mutation succeeds for RECIPIENT
 * invalidateRecipientQueries(queryClient, 'RECIPIENT');
 * ```
 */
export function invalidateRecipientQueries(
  queryClient: QueryClient,
  recipientType: SupportedRecipientType = 'LINKED_ACCOUNT'
): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const { queryKey } = query;
      if (Array.isArray(queryKey)) {
        const hasRecipientsPath = queryKey.some((key) => key === '/recipients');
        const hasMatchingType = queryKey.some(
          (key) =>
            typeof key === 'object' &&
            key !== null &&
            'type' in key &&
            key.type === recipientType
        );
        return hasRecipientsPath && hasMatchingType;
      }
      return false;
    },
  });
}
