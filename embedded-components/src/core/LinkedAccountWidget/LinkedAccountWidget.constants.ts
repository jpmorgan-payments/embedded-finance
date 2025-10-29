import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';

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
  READY_FOR_VALIDATION: {},
  REJECTED: {
    variant: 'destructive',
  },
};

/**
 * Status messages to display for each recipient status
 */
export const RECIPIENT_STATUS_MESSAGES: Record<string, string> = {
  MICRODEPOSITS_INITIATED:
    'We initiated microdeposits to verify this account. This usually takes 1–2 business days.',
  READY_FOR_VALIDATION:
    'Your microdeposits are ready to be verified. Please enter the amounts to complete verification.',
  ACTIVE: 'Your external account has been linked and is active.',
  PENDING: 'We are processing your account. This may take a moment.',
  INACTIVE: 'The account was linked but is currently inactive.',
  REJECTED:
    'We could not link this account. Please review details or try again.',
};

/**
 * Constants for validation
 */
export const ROUTING_NUMBER_LENGTH = 9;
export const MIN_MICRODEPOSIT_AMOUNT = 0.01;
export const MAX_MICRODEPOSIT_AMOUNT = 0.99;
export const MAX_VERIFICATION_ATTEMPTS = 3;
