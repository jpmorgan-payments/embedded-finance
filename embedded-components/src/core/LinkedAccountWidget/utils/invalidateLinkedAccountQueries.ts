import { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates all React Query caches related to linked accounts.
 *
 * This utility handles the complex query key matching needed because
 * linked account queries may have varying params (page, limit, etc.).
 * It uses a predicate to match any query that:
 * 1. Contains '/recipients' in the query key path
 * 2. Has type: 'LINKED_ACCOUNT' in the params
 *
 * @param queryClient - The React Query client instance
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 *
 * // After a mutation succeeds
 * invalidateLinkedAccountQueries(queryClient);
 * ```
 */
export function invalidateLinkedAccountQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const { queryKey } = query;
      if (Array.isArray(queryKey)) {
        const hasRecipientsPath = queryKey.some((key) => key === '/recipients');
        const hasLinkedAccountType = queryKey.some(
          (key) =>
            typeof key === 'object' &&
            key !== null &&
            'type' in key &&
            key.type === 'LINKED_ACCOUNT'
        );
        return hasRecipientsPath && hasLinkedAccountType;
      }
      return false;
    },
  });
}
