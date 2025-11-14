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

export const getRecipientDisplayName = (recipient: Recipient) => {
  const name =
    recipient.partyDetails?.type === 'INDIVIDUAL'
      ? [
          recipient.partyDetails?.firstName,
          recipient.partyDetails?.lastName,
        ].join(' ')
      : recipient.partyDetails?.businessName;

  return `${name} (...${recipient.account ? recipient.account.number?.slice(-4) : ''})`;
};

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
 * Returns true if account is active but missing Wire or RTP
 */
export function needsAdditionalRouting(recipient: Recipient): boolean {
  if (recipient.status !== 'ACTIVE') return false;

  const methods = getSupportedPaymentMethods(recipient);
  const hasWire = methods.includes('WIRE');
  const hasRTP = methods.includes('RTP');

  // Can add routing if either Wire or RTP is missing
  return !hasWire || !hasRTP;
}

/**
 * Get the missing payment methods that can be added
 */
export function getMissingPaymentMethods(recipient: Recipient): string[] {
  const methods = getSupportedPaymentMethods(recipient);
  const missing: string[] = [];

  if (!methods.includes('WIRE')) {
    missing.push('Wire');
  }
  if (!methods.includes('RTP')) {
    missing.push('RTP');
  }

  return missing;
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

/**
 * SHARED STATUS UTILITIES
 * These functions work for ALL recipient types (LINKED_ACCOUNT, RECIPIENT, etc.)
 */

/**
 * Check if a recipient is in a final state (success or terminal error)
 */
export function isRecipientInFinalState(recipient: Recipient): boolean {
  const finalStates = ['ACTIVE', 'REJECTED', 'INACTIVE'];
  return finalStates.includes(recipient.status || '');
}

/**
 * Check if a recipient needs user action
 */
export function doesRecipientNeedAction(recipient: Recipient): boolean {
  return recipient.status === 'READY_FOR_VALIDATION';
}

/**
 * Get a user-friendly message key for recipient status (use with i18n)
 */
export function getRecipientStatusMessageKey(recipient: Recipient): string {
  return `status.messages.${recipient.status}`;
}

/**
 * Sort recipients by priority (action needed > active > pending > inactive)
 */
export function sortRecipientsByPriority(recipients: Recipient[]): Recipient[] {
  return [...recipients].sort((a, b) => {
    const priorityMap: Record<string, number> = {
      READY_FOR_VALIDATION: 1,
      ACTIVE: 2,
      PENDING: 3,
      MICRODEPOSITS_INITIATED: 4,
      INACTIVE: 5,
      REJECTED: 6,
    };

    const aPriority = priorityMap[a.status || ''] || 99;
    const bPriority = priorityMap[b.status || ''] || 99;

    return aPriority - bPriority;
  });
}

/**
 * Get the number of accounts by status
 */
export function getAccountCountsByStatus(
  recipients: Recipient[]
): Record<string, number> {
  return recipients.reduce(
    (acc, recipient) => {
      const status = recipient.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Filter recipients by status
 */
export function filterRecipientsByStatus(
  recipients: Recipient[],
  statuses: string[]
): Recipient[] {
  return recipients.filter((r) => r.status && statuses.includes(r.status));
}
