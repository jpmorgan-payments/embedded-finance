import type { PaymentMethod, PaymentValidation, Recipient } from './types';

/**
 * Utility functions for payment calculations and formatting
 */

export const getFee = (
  paymentMethodId: string,
  paymentMethods: PaymentMethod[]
): number => {
  const selectedMethod = paymentMethods?.find((m) => m.id === paymentMethodId);
  return selectedMethod?.fee || 0;
};

export const calculatePaymentValidation = (
  amount: number,
  method: string,
  paymentMethods: PaymentMethod[],
  availableBalance: number
): PaymentValidation => {
  const fee = getFee(method, paymentMethods);
  const totalAmount = amount + fee;
  const isAmountValid = amount > fee && totalAmount <= availableBalance;

  return {
    isAmountValid,
    totalAmount,
    fee,
    availableBalance,
  };
};

export const renderRecipientName = (recipient: Recipient): string => {
  if (recipient?.partyDetails?.type === 'INDIVIDUAL') {
    return `${recipient?.partyDetails?.firstName || ''} ${recipient?.partyDetails?.lastName || ''}`.trim();
  }
  return recipient?.partyDetails?.businessName || 'Recipient';
};

export const maskAccount = (accountNumber?: string): string => {
  return accountNumber ? `****${accountNumber.slice(-4)}` : '';
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getAvailableRoutingTypes = (recipient: Recipient): string[] => {
  return (
    recipient?.account?.routingInformation?.map((ri) =>
      typeof ri.transactionType === 'string'
        ? ri.transactionType.toUpperCase()
        : String(ri.transactionType)
    ) || []
  );
};

export const filterPaymentMethods = (
  paymentMethods: PaymentMethod[],
  availableRoutingTypes: string[]
): PaymentMethod[] => {
  return paymentMethods.filter((pm) =>
    availableRoutingTypes.includes(pm.id.toUpperCase())
  );
};

export const filterRecipients = (
  recipients: Recipient[],
  selectedAccount: any
): Recipient[] => {
  return recipients.filter((recipient) => {
    // Show all recipients initially - no need to filter by account
    // The account selection will determine available payment methods later

    // If account is LIMITED_DDA, only show active linked accounts
    if (selectedAccount?.category === 'LIMITED_DDA') {
      return (
        recipient.type === 'LINKED_ACCOUNT' && recipient.status === 'ACTIVE'
      );
    }

    // For other account types or no account selected, show all recipients
    return true;
  });
};

export const groupRecipientsByType = (recipients: Recipient[]) => {
  const linkedAccounts = recipients.filter((r) => r.type === 'LINKED_ACCOUNT');
  const regularRecipients = recipients.filter((r) => r.type === 'RECIPIENT');

  return {
    linkedAccounts,
    regularRecipients,
  };
};
