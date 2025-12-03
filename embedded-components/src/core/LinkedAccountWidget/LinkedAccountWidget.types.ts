import {
  ApiError,
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Props for the LinkedAccountWidget component (Public API)
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
   */
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
   * Optional custom CSS class for the root element
   */
  className?: string;
}
