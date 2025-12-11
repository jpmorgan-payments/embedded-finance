/**
 * Accounts - Public API Types
 * Only public types that consumers need should be exported here.
 */

/**
 * Props for the Accounts component
 */
export interface AccountsProps {
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

