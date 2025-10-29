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
 * Get account holder type display text
 */
export function getAccountHolderType(recipient: Recipient): string {
  return recipient.partyDetails?.type === 'INDIVIDUAL'
    ? 'Individual'
    : 'Business';
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
 * Check if recipient needs additional routing information (Wire/RTP)
 * Returns true if account is active but only has ACH configured
 */
export function needsAdditionalRouting(recipient: Recipient): boolean {
  if (recipient.status !== 'ACTIVE') return false;

  const methods = getSupportedPaymentMethods(recipient);
  const hasACH = methods.includes('ACH');
  const hasWire = methods.includes('WIRE');
  const hasRTP = methods.includes('RTP');

  // If only ACH is configured, suggest adding Wire or RTP
  return hasACH && !hasWire && !hasRTP;
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

/**
 * Check if recipient has all required information for a payment type
 */
export function hasRequiredInfoForPaymentType(
  recipient: Recipient,
  paymentType: 'ACH' | 'WIRE' | 'RTP'
): boolean {
  const methods = getSupportedPaymentMethods(recipient);
  return methods.includes(paymentType);
}
