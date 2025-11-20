/**
 * TransactionsDisplay - Public API Types
 *
 * Only public types that consumers need should be exported here.
 * Internal types should be colocated with their respective components/hooks/utils.
 */

/**
 * Props for the TransactionsDisplay component
 */
export interface TransactionsDisplayProps {
  /**
   * Optional array of account IDs to filter transactions.
   * If not provided, transactions from all LIMITED_DDA_PAYMENTS and LIMITED_DDA accounts will be shown.
   */
  accountIds?: string[];
}

/**
 * Ref interface for external actions on TransactionsDisplay
 */
export interface TransactionsDisplayRef {
  /**
   * Refresh the transactions list
   */
  refresh: () => void;
}
