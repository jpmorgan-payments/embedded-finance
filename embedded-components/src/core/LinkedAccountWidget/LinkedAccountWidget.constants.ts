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
 * Constants for validation
 */
export const ROUTING_NUMBER_LENGTH = 9;
export const MIN_MICRODEPOSIT_AMOUNT = 0.01;
export const MAX_MICRODEPOSIT_AMOUNT = 0.99;
export const MAX_VERIFICATION_ATTEMPTS = 3;
