import type {
  AccountResponseType,
  PaymentMethod,
  PaymentValidation,
  Recipient,
} from '../types';

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

/**
 * Determines if a recipient should be disabled based on the selected account.
 * Rules:
 * - LIMITED_DDA_PAYMENTS → can pay to both RECIPIENT and LINKED_ACCOUNT types
 * - LIMITED_DDA → can only pay to LINKED_ACCOUNT types (not RECIPIENT)
 *
 * @param recipient - The recipient to check
 * @param selectedAccount - The currently selected account (if any)
 * @returns true if the recipient should be disabled
 */
export const isRecipientDisabled = (
  recipient: Recipient,
  selectedAccount: any
): boolean => {
  // If no account is selected, nothing is disabled
  if (!selectedAccount) {
    return false;
  }

  // LIMITED_DDA_PAYMENTS can pay to both types, so nothing is disabled
  if (selectedAccount.category === 'LIMITED_DDA_PAYMENTS') {
    return false;
  }

  // LIMITED_DDA can only pay to LINKED_ACCOUNT types
  if (selectedAccount.category === 'LIMITED_DDA') {
    // Disable RECIPIENT type
    if (recipient.type === 'RECIPIENT') {
      return true;
    }
    // Disable LINKED_ACCOUNT if not ACTIVE
    if (recipient.type === 'LINKED_ACCOUNT' && recipient.status !== 'ACTIVE') {
      return true;
    }
  }

  return false;
};

/**
 * Determines if an account should be disabled based on the selected recipient.
 * Rules (reverse of recipient rules):
 * - RECIPIENT type → can only be paid from LIMITED_DDA_PAYMENTS (disable LIMITED_DDA)
 * - LINKED_ACCOUNT type → can be paid from both LIMITED_DDA_PAYMENTS and LIMITED_DDA (nothing disabled)
 *
 * @param account - The account to check
 * @param selectedRecipient - The currently selected recipient (if any)
 * @returns true if the account should be disabled
 */
export const isAccountDisabled = (
  account: AccountResponseType,
  selectedRecipient: Recipient | undefined
): boolean => {
  // If no recipient is selected, nothing is disabled
  if (!selectedRecipient) {
    return false;
  }

  // RECIPIENT type can only be paid from LIMITED_DDA_PAYMENTS
  if (selectedRecipient.type === 'RECIPIENT') {
    // Disable LIMITED_DDA accounts
    if (account.category === 'LIMITED_DDA') {
      return true;
    }
  }

  // LINKED_ACCOUNT type can be paid from both LIMITED_DDA_PAYMENTS and LIMITED_DDA
  // So nothing is disabled for LINKED_ACCOUNT recipients
  if (selectedRecipient.type === 'LINKED_ACCOUNT') {
    return false;
  }

  return false;
};
