import type { RecipientStatus } from '@/api/generated/ep-recipients.schemas';

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
 * User journey identifiers for LinkedAccountWidget component
 * These are automatically tracked when userEventsHandler is provided
 */
export const LINKED_ACCOUNT_USER_JOURNEYS = {
  VIEW_ACCOUNTS: 'linked_account_viewed',
  LINK_STARTED: 'linked_account_link_started',
  LINK_COMPLETED: 'linked_account_link_completed',
  VERIFY_STARTED: 'linked_account_verify_started',
  VERIFY_COMPLETED: 'linked_account_verify_completed',
  REMOVE_STARTED: 'linked_account_remove_started',
  REMOVE_COMPLETED: 'linked_account_remove_completed',
} as const;

/**
 * Status badge variants mapping for LinkedAccountWidget StatusBadge component
 */
export const STATUS_BADGE_VARIANTS: Record<
  RecipientStatus,
  { variant: 'success' | 'warning' | 'destructive' | 'informative' | 'outline' }
> = {
  ACTIVE: { variant: 'success' },
  PENDING: { variant: 'warning' },
  MICRODEPOSITS_INITIATED: { variant: 'informative' },
  READY_FOR_VALIDATION: { variant: 'warning' },
  REJECTED: { variant: 'destructive' },
  INACTIVE: { variant: 'outline' },
} as const;
