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
 * @example Compact mode with custom payment action
 * ```tsx
 * <LinkedAccountWidget
 *   compact
 *   renderPaymentAction={(recipient) => (
 *     <Button onClick={() => pay(recipient)}>Pay</Button>
 *   )}
 * />
 * ```
 */
export interface LinkedAccountWidgetProps extends UserTrackingProps {
  // ============================================================================
  // Display Mode
  // ============================================================================

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
   * - `'cards'`: Display accounts as cards (default)
   * - `'table'`: Display accounts in a sortable/paginated table
   *
   * @default 'cards'
   */
  viewMode?: 'cards' | 'table';

  /**
   * Enable compact mode with row-based cards and minimal spacing.
   *
   * When enabled:
   * - Cards display as compact rows instead of full cards
   * - No gap between cards
   * - Reduced padding
   * - Single column layout only
   *
   * @default false
   */
  compact?: boolean;

  // ============================================================================
  // Scrolling & Virtualization
  // ============================================================================

  /**
   * Enable scrollable container with virtualization and infinite scroll.
   *
   * When `true`:
   * - Creates a scrollable container with the height specified by `maxHeight`
   * - Uses virtual list for performance with large datasets
   * - Automatically loads more accounts as user scrolls near the bottom
   *
   * When `false` (default):
   * - Shows all loaded accounts
   * - User clicks "Load more" to fetch additional pages from API
   *
   * @default false
   */
  scrollable?: boolean;

  /**
   * Maximum height of the scrollable container.
   *
   * Only applies when `scrollable={true}`.
   * Accepts CSS height values (number for pixels, string for any CSS unit).
   *
   * @example
   * ```tsx
   * maxHeight={400}      // 400px
   * maxHeight="50vh"     // 50% of viewport height
   * maxHeight="100%"     // Full height of parent
   * ```
   *
   * @default '400px'
   */
  maxHeight?: number | string;

  // ============================================================================
  // Pagination
  // ============================================================================

  /**
   * Number of accounts to fetch per API request.
   *
   * Higher values reduce API calls but increase initial load time.
   * Consider your typical user's account count when tuning this.
   *
   * @default 10
   */
  pageSize?: number;

  // ============================================================================
  // Actions & Customization
  // ============================================================================

  /**
   * Hide the "Link New Account" button.
   *
   * Use this when you want to display accounts in read-only mode,
   * or when account linking is handled elsewhere in your application.
   *
   * Note: In `mode="single"`, the button is automatically hidden
   * when an active account already exists.
   *
   * @default false
   */
  hideCreateButton?: boolean;

  /**
   * Render a custom payment/action component for each account card.
   *
   * Use this to add payment buttons, transfer actions, or other
   * account-specific actions to each card.
   *
   * @param recipient - The linked account recipient object
   * @returns React element to render in the card's action area
   *
   * @example
   * ```tsx
   * renderPaymentAction={(recipient) => (
   *   <Button onClick={() => initiatePayment(recipient.id)}>
   *     Send Payment
   *   </Button>
   * )}
   * ```
   */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  // ============================================================================
  // Callbacks
  // ============================================================================

  /**
   * Called when a linked account operation completes (success or failure).
   *
   * Triggered after:
   * - Successfully linking a new account
   * - Account linking fails with an error
   * - Account update operations
   *
   * @param recipient - The recipient object (if operation succeeded)
   * @param error - The API error (if operation failed)
   */
  onAccountLinked?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * Called when microdeposit verification completes.
   *
   * Triggered after user submits microdeposit amounts, regardless of outcome.
   * Check `response.status` for the result:
   * - `'VERIFIED'`: Verification successful
   * - `'FAILED'`: Incorrect amounts entered
   * - `'FAILED_MAX_ATTEMPTS_EXCEEDED'`: Too many failed attempts
   *
   * @param response - The verification response containing status
   * @param recipient - The recipient that was being verified
   */
  onVerificationComplete?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;

  // ============================================================================
  // Styling
  // ============================================================================

  /**
   * Additional CSS class name(s) for the root Card element.
   */
  className?: string;

  // ============================================================================
  // Deprecated Props (for backward compatibility)
  // ============================================================================

  /**
   * @deprecated Use `mode` instead. Will be removed in next major version.
   * - `'default'` → `mode="list"`
   * - `'singleAccount'` → `mode="single"`
   */
  variant?: 'default' | 'singleAccount';

  /**
   * @deprecated Use `hideCreateButton` instead. Will be removed in next major version.
   * Note: Logic is inverted (`showCreateButton={false}` → `hideCreateButton={true}`)
   */
  showCreateButton?: boolean;

  /**
   * @deprecated Use `scrollable` and `maxHeight` instead. Will be removed in next major version.
   * Setting `scrollHeight` now automatically enables `scrollable={true}`.
   */
  scrollHeight?: number | string;

  /**
   * @deprecated Use `renderPaymentAction` instead. Will be removed in next major version.
   */
  makePaymentComponent?: React.ReactNode;

  /**
   * @deprecated Use `onAccountLinked` instead. Will be removed in next major version.
   */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * @deprecated Use `onVerificationComplete` instead. Will be removed in next major version.
   */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;
}
