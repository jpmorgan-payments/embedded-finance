/**
 * User journey identifiers for TransactionsDisplay component
 * These are automatically tracked when userEventsHandler is provided
 */
export const TRANSACTIONS_DISPLAY_USER_JOURNEYS = {
  VIEW_LIST: 'transactions_list_viewed',
  VIEW_DETAILS: 'transaction_details_viewed',
  FILTER_CHANGED: 'transactions_filter_changed',
  REFRESH: 'transactions_refresh',
} as const;
