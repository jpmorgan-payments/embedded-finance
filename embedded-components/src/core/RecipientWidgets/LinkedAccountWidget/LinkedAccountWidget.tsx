import React from 'react';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { BaseRecipientsWidget, BaseRecipientsWidgetProps } from '../components';

/**
 * Props for LinkedAccountWidget
 * Extends BaseRecipientsWidgetProps but fixes recipientType to LINKED_ACCOUNT
 * and uses semantically appropriate callback names
 */
export interface LinkedAccountWidgetProps
  extends Omit<
    BaseRecipientsWidgetProps,
    'recipientType' | 'onAccountSettled'
  > {
  /**
   * Callback fired when a linked account operation completes (success or failure).
   */
  onAccountLinked?: (recipient?: Recipient, error?: unknown) => void;
}

/**
 * LinkedAccountWidget - Main component for managing linked bank accounts
 *
 * This widget is for managing linked bank accounts (LINKED_ACCOUNT type).
 * It provides functionality for:
 * - Viewing linked accounts with various display modes
 * - Linking new bank accounts
 * - Microdeposit verification for account ownership
 * - Editing and removing accounts
 *
 * For managing payment recipients without microdeposit verification,
 * use RecipientsWidget instead.
 *
 * @example Basic usage
 * ```tsx
 * <LinkedAccountWidget
 *   onAccountLinked={(recipient, error) => {
 *     if (error) {
 *       console.error('Failed to link account:', error);
 *     } else {
 *       console.log('Account linked successfully:', recipient);
 *     }
 *   }}
 * />
 * ```
 *
 * @example Single account mode (for payment flows)
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
export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  onAccountLinked,
  onVerificationComplete,
  ...props
}) => {
  return (
    <BaseRecipientsWidget
      {...props}
      recipientType="LINKED_ACCOUNT"
      onAccountSettled={onAccountLinked}
      onVerificationComplete={onVerificationComplete}
    />
  );
};

export default LinkedAccountWidget;
