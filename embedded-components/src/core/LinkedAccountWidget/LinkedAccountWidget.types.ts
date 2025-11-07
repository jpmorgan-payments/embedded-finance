import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';

/**
 * Props for the LinkedAccountWidget component
 */
export interface LinkedAccountWidgetProps {
  /**
   * Display variant for different use cases
   * - 'default': Show all linked accounts
   * - 'singleAccount': Only show the first linked account (useful for simplified views)
   * @default 'default'
   */
  variant?: 'default' | 'singleAccount';

  /**
   * Whether to show the "Link A New Account" button
   * @default true
   */
  showCreateButton?: boolean;

  /**
   * Optional MakePayment component to render in each card when account is active
   * The component will receive recipientId as a prop
   */
  makePaymentComponent?: React.ReactNode;

  /**
   * Callback fired when a linked account creation or verification is settled
   * @param recipient - The recipient data if successful
   * @param error - The error if failed
   */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * Optional CSS class name for custom styling
   */
  className?: string;
}

/**
 * Props for the LinkedAccountCard component
 */
export interface LinkedAccountCardProps {
  /** The recipient/linked account data to display */
  recipient: Recipient;

  /** Optional MakePayment component to render when account is active */
  makePaymentComponent?: React.ReactNode;

  /** Callback when account is edited or removed */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /** Hide action buttons and status alerts (useful for confirmation views) */
  hideActions?: boolean;
}
