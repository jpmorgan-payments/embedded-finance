import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';

/**
 * Container query breakpoints for responsive layout
 *
 * The LinkedAccountWidget uses container queries to adapt to its container width,
 * not the viewport width. This allows the component to be responsive regardless of
 * where it's placed in the application.
 *
 * Breakpoints:
 * - @md: 28rem (448px) - Header switches from stacked to horizontal layout
 * - @2xl: 56rem (896px) - Account cards switch from single to two-column grid
 */
export const CONTAINER_BREAKPOINTS = {
  md: '28rem', // 448px - Mobile to tablet
  '2xl': '56rem', // 896px - Tablet to desktop
} as const;

/**
 * Status badge variant mapping for different recipient statuses
 */
export const STATUS_BADGE_VARIANTS: Record<
  RecipientStatus,
  Record<string, string>
> = {
  ACTIVE: {
    variant: 'success',
  },
  INACTIVE: {
    variant: 'secondary',
  },
  MICRODEPOSITS_INITIATED: {
    variant: 'secondary',
  },
  PENDING: {
    variant: 'secondary',
  },
  READY_FOR_VALIDATION: {
    variant: 'warning',
  },
  REJECTED: {
    variant: 'destructive',
  },
};

/**
 * Status display labels for each recipient status
 */
export const STATUS_LABELS: Record<RecipientStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MICRODEPOSITS_INITIATED: 'Pending Verification',
  PENDING: 'Processing',
  READY_FOR_VALIDATION: 'Action Required',
  REJECTED: 'Rejected',
};

/**
 * Status messages to display for each recipient status
 */
export const RECIPIENT_STATUS_MESSAGES: Record<string, string> = {
  MICRODEPOSITS_INITIATED:
    'We initiated microdeposits to verify this account. This usually takes 3-5 business days.',
  READY_FOR_VALIDATION:
    'Your microdeposits are ready to be verified. Please enter the amounts to complete verification.',
  ACTIVE: 'Your external account has been linked and is active.',
  PENDING: 'We are processing your account. This may take a moment.',
  INACTIVE: 'The account was linked but is currently inactive.',
  REJECTED:
    'We could not link this account. Please review details or try again.',
};

/**
 * Detailed explanations for each status
 */
export const STATUS_EXPLANATIONS: Record<RecipientStatus, string> = {
  ACTIVE: 'This account is verified and ready for transactions.',
  INACTIVE:
    'This account has been deactivated and cannot be used for transactions.',
  MICRODEPOSITS_INITIATED:
    'Two small deposits are being sent to verify account ownership. This typically takes 3-5 business days.',
  PENDING:
    "Your account information is being processed. You'll be notified once complete.",
  READY_FOR_VALIDATION:
    'The verification deposits have arrived in your account.',
  REJECTED:
    'There was an issue linking this account. Please check the account details or contact support.',
};

/**
 * Constants for validation
 */
export const ROUTING_NUMBER_LENGTH = 9;
export const MIN_MICRODEPOSIT_AMOUNT = 0.01;
export const MAX_MICRODEPOSIT_AMOUNT = 0.99;
export const MAX_VERIFICATION_ATTEMPTS = 3;

/**
 * Payment type labels and descriptions
 */
export const PAYMENT_TYPE_INFO = {
  ACH: {
    label: 'ACH / Direct Payment',
    description: 'Standard electronic bank transfer (1-3 business days)',
    requiredFields: ['routingNumber', 'accountNumber', 'accountType'],
    routingCodeType: 'USABA',
  },
  WIRE: {
    label: 'Wire Transfer',
    description: 'Fast domestic or international transfer (same day)',
    requiredFields: ['routingNumber', 'accountNumber', 'address'],
    routingCodeType: 'SWIFT',
  },
  RTP: {
    label: 'Real-Time Payments (RTP)',
    description: 'Instant transfer available 24/7',
    requiredFields: ['routingNumber', 'accountNumber'],
    routingCodeType: 'USABA',
  },
} as const;
