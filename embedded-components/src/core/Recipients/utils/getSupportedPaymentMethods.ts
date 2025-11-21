import type { Recipient } from '@/api/generated/ep-recipients.schemas';

/**
 * Get supported payment methods as a string array from recipient's routing information
 */
export function getSupportedPaymentMethods(recipient: Recipient): string[] {
  if (!recipient.account?.routingInformation) return [];
  return recipient.account.routingInformation
    .map((ri) => ri.transactionType)
    .filter(Boolean) as string[];
}
