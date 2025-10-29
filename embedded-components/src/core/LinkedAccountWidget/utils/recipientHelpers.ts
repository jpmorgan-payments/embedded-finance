import { getRecipientLabel } from '@/lib/utils';
import { Recipient } from '@/api/generated/ep-recipients.schemas';

/**
 * Get supported payment methods for a recipient
 */
export function getSupportedPaymentMethods(recipient: Recipient): string[] {
  if (!recipient.account?.routingInformation) return [];
  return recipient.account.routingInformation
    .map((ri) => ri.transactionType)
    .filter(Boolean) as string[];
}

/**
 * Get masked account number (last 4 digits)
 */
export function getMaskedAccountNumber(recipient: Recipient): string {
  if (!recipient.account?.number) return 'N/A';
  return `****${recipient.account.number.slice(-4)}`;
}

/**
 * Get display name for recipient using existing utility
 */
export function getRecipientDisplayName(recipient: Recipient): string {
  return getRecipientLabel(recipient);
}

/**
 * Check if recipient can verify microdeposits
 */
export function canVerifyMicrodeposits(recipient: Recipient): boolean {
  return recipient.status === 'READY_FOR_VALIDATION';
}

/**
 * Check if recipient can make payments
 */
export function canMakePayment(recipient: Recipient): boolean {
  return recipient.status === 'ACTIVE';
}

/**
 * Determine if the create button should be shown based on variant and account state
 */
export function shouldShowCreateButton(
  variant: 'default' | 'singleAccount',
  hasActiveAccount: boolean,
  showCreateButton: boolean
): boolean {
  if (!showCreateButton) return false;
  if (variant === 'singleAccount' && hasActiveAccount) return false;
  return true;
}

/**
 * Format date for display
 */
export function formatRecipientDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
