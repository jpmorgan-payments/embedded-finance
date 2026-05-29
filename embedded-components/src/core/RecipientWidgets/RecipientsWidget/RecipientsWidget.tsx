import React from 'react';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { BaseRecipientsWidget, BaseRecipientsWidgetProps } from '../components';

/**
 * Props for RecipientsWidget
 * Extends BaseRecipientsWidgetProps but fixes recipientType to RECIPIENT
 * and omits microdeposit-related props since they don't apply to recipients
 */
export interface RecipientsWidgetProps
  extends Omit<
    BaseRecipientsWidgetProps,
    'recipientType' | 'onAccountSettled' | 'onVerificationComplete'
  > {
  /**
   * Callback fired when a recipient is successfully added or when adding fails.
   */
  onRecipientAdded?: (recipient?: Recipient, error?: unknown) => void;

  // Future RECIPIENT-specific props can be added here
}

/**
 * RecipientsWidget - Main component for managing payment recipients
 *
 * This widget is for managing payment recipients (RECIPIENT type).
 * It provides the same look and feel as LinkedAccountWidget but is specifically
 * designed for payment recipients without microdeposit verification functionality.
 *
 * Features:
 * - Viewing recipients with various display modes
 * - Adding new payment recipients
 * - Editing and removing recipients
 * - Account validation response display
 *
 * For managing linked bank accounts with microdeposit verification,
 * use LinkedAccountWidget instead.
 *
 * @example Basic usage
 * ```tsx
 * <RecipientsWidget
 *   onRecipientAdded={(recipient, error) => {
 *     if (error) {
 *       console.error('Failed to add recipient:', error);
 *     } else {
 *       console.log('Recipient added successfully:', recipient);
 *     }
 *   }}
 * />
 * ```
 *
 * @example Single recipient mode (for payment flows)
 * ```tsx
 * <RecipientsWidget mode="single" />
 * ```
 *
 * @example Scrollable with custom height
 * ```tsx
 * <RecipientsWidget scrollable maxHeight={500} />
 * ```
 *
 * @example Compact cards with custom payment action
 * ```tsx
 * <RecipientsWidget
 *   viewMode="compact-cards"
 *   renderPaymentAction={(recipient) => (
 *     <Button onClick={() => pay(recipient)}>Pay</Button>
 *   )}
 * />
 * ```
 */
export const RecipientsWidget: React.FC<RecipientsWidgetProps> = ({
  onRecipientAdded,
  ...props
}) => {
  return (
    <BaseRecipientsWidget
      {...props}
      recipientType="RECIPIENT"
      onAccountSettled={onRecipientAdded}
      // onVerificationComplete is not passed - microdeposits are not applicable for RECIPIENT
    />
  );
};

export default RecipientsWidget;
