import type {
  Recipient,
  RecipientType,
} from '@/api/generated/ep-recipients.schemas';

import type { RecipientsColumnConfiguration } from './Recipients.columns';
import type { RecipientsConfig } from './types/paymentConfig';

/**
 * Recipients - Public API Types
 *
 * Only public types that consumers of this component need.
 */

/**
 * Props for the Recipients component
 */
export interface RecipientsProps {
  /** Optional client ID filter */
  clientId?: string;
  /**
   * @deprecated RecipientForm now always uses 'RECIPIENT' type internally.
   * This prop is no longer used and will be removed in a future version.
   */
  initialRecipientType?: RecipientType;
  /** Show/hide create functionality */
  showCreateButton?: boolean;
  /**
   * @deprecated Configuration is now handled internally by BankAccountForm.
   * This prop is no longer used and will be removed in a future version.
   */
  config?: RecipientsConfig;
  /** Optional MakePayment component to render in each recipient card/row */
  makePaymentComponent?: React.ReactNode;
  /** Callback when recipient is created */
  onRecipientCreated?: (recipient: Recipient) => void;
  /** Callback when recipient is updated */
  onRecipientUpdated?: (recipient: Recipient) => void;
  /** Callback when recipient is deactivated */
  onRecipientDeactivated?: (recipient: Recipient) => void;
  /** List of user events to track */
  userEventsToTrack?: string[];
  /** Handler for user events */
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
  /** Force widget layout with minimal columns and no filters */
  isWidget?: boolean;
  /**
   * Column configuration
   * Allows customization of which columns are visible, sortable, and their labels
   * Based on the LIST recipients API model fields
   */
  columnConfig?: Partial<RecipientsColumnConfiguration>;
}
