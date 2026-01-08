import type { UserTrackingProps } from '@/lib/types/userTracking.types';

/**
 * TransactionsDisplay - Public API Types
 *
 * Only public types that consumers need should be exported here.
 * Internal types should be colocated with their respective components/hooks/utils.
 */

/**
 * Props for the TransactionsDisplay component
 */
export interface TransactionsDisplayProps extends UserTrackingProps {
  /**
   * Optional array of account IDs to filter transactions.
   * If not provided, transactions from all LIMITED_DDA_PAYMENTS and LIMITED_DDA accounts will be shown.
   */
  accountIds?: string[];

  /**
   * Optional description text to display below the title in the header
   */
  description?: string;

  /**
   * Additional CSS class name(s) for the root Card element.
   */
  className?: string;
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
