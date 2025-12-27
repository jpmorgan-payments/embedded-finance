import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import {
  ApiError,
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Props for the LinkedAccountWidget component
 *
 * @example Basic usage
 * ```tsx
 * <LinkedAccountWidget
 *   onAccountLinked={(recipient, error) => {
 *     if (error) console.error('Failed:', error);
 *     else console.log('Linked:', recipient);
 *   }}
 * />
 * ```
 *
 * @example Single account mode (e.g., for payment flows)
 * ```tsx
 * <LinkedAccountWidget mode="single" />
 * ```
 *
 * @example Scrollable with custom height
 * ```tsx
 * <LinkedAccountWidget scrollable maxHeight={500} />
 * ```
 *
 * @example Compact cards with custom payment action
 * ```tsx
 * <LinkedAccountWidget
 *   viewMode="compact-cards"
 *   renderPaymentAction={(recipient) => (
 *     <Button onClick={() => pay(recipient)}>Pay</Button>
 *   )}
 * />
 * ```
 */
export interface LinkedAccountWidgetProps extends UserTrackingProps {
  /**
   * Layout mode for the widget
   * - `'list'`: Show all linked accounts with expand/collapse pagination (default)
   * - `'single'`: Show only the first linked account; hides "Link New Account"
   *   button when an active account exists
   *
   * @default 'list'
   */
  mode?: 'list' | 'single';

  /**
   * View mode for displaying linked accounts
   * - `'cards'`: Display accounts as full cards with rich details (default)
   * - `'compact-cards'`: Display accounts as compact rows with minimal spacing
   * - `'table'`: Display accounts in a sortable/paginated table
   *
   * @default 'cards'
   */
  viewMode?: 'cards' | 'compact-cards' | 'table';

  /**
   * Enable scrollable container with virtualization and infinite scroll.
   *
   * @default false
   */
  scrollable?: boolean;

  /**
   * Maximum height of the scrollable container (only when `scrollable={true}`).
   *
   * @default '400px'
   */
  maxHeight?: number | string;

  /**
   * Number of accounts to fetch per API request.
   *
   * @default 10
   */
  pageSize?: number;

  /**
   * Pagination style for cards and compact-cards views.
   * - `'loadMore'`: Show a "Load More" button to incrementally load accounts (default)
   * - `'pages'`: Show page navigation controls similar to the table view
   *
   * Note: This prop has no effect when `viewMode` is `'table'` (table always uses pages).
   *
   * @default 'loadMore'
   */
  paginationStyle?: 'loadMore' | 'pages';

  /**
   * Hide the "Link New Account" button.
   *
   * @default false
   */
  hideCreateButton?: boolean;

  /**
   * Render a custom payment/action component for each account card.
   */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  /**
   * Called when a linked account operation completes (success or failure).
   */
  onAccountLinked?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * Called when microdeposit verification completes.
   */
  onVerificationComplete?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;

  /**
   * Additional CSS class name(s) for the root Card element.
   */
  className?: string;
}
