import type { Recipient } from '@/api/generated/ep-recipients.schemas';

/**
 * Extracts payment methods from recipient's routing information
 */
export function extractPaymentMethods(
  recipient: Recipient,
  defaultMethod: string
): string[] {
  return (
    recipient.account?.routingInformation?.map(
      (ri: { transactionType: any }) => ri.transactionType
    ) || [defaultMethod]
  );
}

/**
 * Extracts routing numbers from recipient's routing information
 */
export function extractRoutingNumbers(
  recipient: Recipient
): Record<string, string> {
  return (
    recipient.account?.routingInformation?.reduce(
      (
        acc: { [x: string]: any },
        ri: { transactionType: string | number; routingNumber: any }
      ) => {
        if (ri.transactionType && ri.routingNumber) {
          acc[ri.transactionType] = ri.routingNumber;
        }
        return acc;
      },
      {} as Record<string, string>
    ) || {}
  );
}
