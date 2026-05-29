import type {
  HeadingLevel,
  HeadingLevelProps,
} from '@/lib/types/headingLevel.types';
import type { UserTrackingProps } from '@/lib/types/userTracking.types';

/**
 * Accounts - Public API Types
 * Only public types that consumers need should be exported here.
 */

/**
 * Props for the Accounts component
 */
export interface AccountsProps extends UserTrackingProps, HeadingLevelProps {
  allowedCategories: string[];
  clientId?: string;
  /** Optional title for the accounts section */
  title?: string;
}

/**
 * Ref interface for external actions on Accounts component
 */
export interface AccountsRef {
  refresh: () => void;
  // Add other actions as needed
  // exportAccounts: () => void;
  // getAccountsData: () => AccountResponse[];
}

// Re-export for convenience
export type { HeadingLevel };
