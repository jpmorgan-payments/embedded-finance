import {
  ApiError,
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Props for the LinkedAccountWidget component
 */
export interface LinkedAccountWidgetProps {
  /**
   * Display variant for different use cases
   * - 'default': Show all linked accounts with pagination
   * - 'singleAccount': Only show the first linked account
   * @default 'default'
   */
  variant?: 'default' | 'singleAccount';

  /**
   * Controls whether the create button is shown
   * @default true
   */
  showCreateButton?: boolean;

  /**
   * Optional custom component to render for making payments
   */
  makePaymentComponent?: React.ReactNode;

  /**
   * Callback when a linked account operation is settled (create, update, delete)
   * @param recipient - The recipient object (if operation succeeded)
   * @param error - The API error (if operation failed)
   */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * Callback when microdeposit verification is completed
   * @param response - The verification response containing status
   * @param recipient - The recipient that was being verified
   */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;

  /**
   * Number of linked accounts to display initially before "Load More" is clicked
   * Only applies when variant="default"
   * @default 2
   */
  initialItemsToShow?: number;

  /**
   * Number of items to fetch per API page
   * Only applies when variant="default"
   * @default 25
   */
  pageSize?: number;

  /**
   * Enable scrollable container with fixed height (in pixels)
   * When set, creates a scrollable area with virtual list for performance
   * Accounts load automatically as user scrolls (infinite scroll)
   *
   * Examples:
   * - scrollHeight={400} - Fixed 400px height with auto-loading
   * - scrollHeight={600} - Taller scroll area
   * - undefined (default) - Normal flow, use "Load More" button
   *
   * @default undefined (not scrollable)
   */
  scrollHeight?: number | string;

  /**
   * Enable compact mode with row-based cards and minimal spacing
   * When true:
   * - Cards display as compact rows instead of full cards
   * - No gap between cards
   * - Reduced padding
   * - Single column layout only
   *
   * @default false
   */
  compact?: boolean;

  /**
   * Optional custom CSS class for the root element
   */
  className?: string;
}
