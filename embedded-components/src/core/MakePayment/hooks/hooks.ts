import { useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import {
  useGetAllRecipients,
  useGetRecipient,
} from '@/api/generated/ep-recipients';

import { useInterceptorStatus } from '../../EBComponentsProvider/EBComponentsProvider';
import type { PaymentFormData, PaymentMethod } from '../types';
import {
  filterPaymentMethods,
  filterRecipients,
  getAvailableRoutingTypes,
  isAccountDisabled,
  isRecipientDisabled,
} from '../utils';

/**
 * Hook for managing payment data fetching and processing
 */
export const usePaymentData = (
  paymentMethods: PaymentMethod[],
  form: UseFormReturn<PaymentFormData>,
  recipientId?: string
) => {
  const { interceptorReady } = useInterceptorStatus();
  // Fetch recipients from API
  const {
    data: recipientsData,
    status: recipientsStatus,
    refetch: refetchRecipients,
  } = useGetAllRecipients(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });

  // Fetch specific recipient by ID if recipientId is provided
  // This ensures we get the recipient even if it's not on the first page of the paginated list
  const {
    data: preselectedRecipient,
    status: preselectedRecipientStatus,
    error: preselectedRecipientError,
  } = useGetRecipient(recipientId || '', {
    query: {
      enabled: interceptorReady && Boolean(recipientId),
    },
  });

  const {
    data: accountsData,
    status: accountsStatus,
    refetch: refetchAccounts,
  } = useGetAccounts(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });

  // Filter accounts to only show DDA and LIMITED_DDA
  const accounts = useMemo(() => {
    if (!accountsData?.items) return accountsData;

    const filteredItems = accountsData.items.filter(
      (account) =>
        account.category === 'LIMITED_DDA_PAYMENTS' ||
        account.category === 'LIMITED_DDA'
    );

    return {
      ...accountsData,
      items: filteredItems,
    };
  }, [accountsData]);

  // Merge recipients from list with preselected recipient if provided
  const recipients = useMemo(() => {
    const listRecipients = recipientsData?.recipients || [];

    // If we have a preselected recipient, ensure it's in the list
    if (preselectedRecipient) {
      // Check if preselected recipient is already in the list
      const existsInList = listRecipients.some(
        (r) => r.id === preselectedRecipient.id
      );

      if (!existsInList) {
        // Add preselected recipient to the list
        return [preselectedRecipient, ...listRecipients];
      }
    }

    return listRecipients;
  }, [recipientsData?.recipients, preselectedRecipient]);

  const selectedAccountId = form.watch('from');

  // Fetch account balance when account is selected
  const {
    data: accountBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError,
    refetch: refetchBalance,
  } = useGetAccountBalance(selectedAccountId || '', {
    query: {
      enabled: interceptorReady && Boolean(selectedAccountId),
    },
  });

  // Get selected account details
  const selectedAccount = useMemo(() => {
    return accounts?.items.find((account) => account.id === selectedAccountId);
  }, [accounts?.items, selectedAccountId]);

  // Get available balance (ITAV) for validation
  const availableBalance =
    accountBalance?.balanceTypes?.find((b) => b.typeCode === 'ITAV')?.amount ||
    0;

  // Filter recipients based on selected account category
  const filteredRecipients = useMemo(() => {
    return filterRecipients(recipients as any[], selectedAccount as any);
  }, [recipients, selectedAccount]);

  // Compute available payment methods for the selected recipient
  const selectedRecipient = useMemo(() => {
    return filteredRecipients.find((r) => r.id === form.watch('to'));
  }, [filteredRecipients, form.watch('to')]);

  // Compute which recipients should be disabled based on selected account
  // Show all recipients but disable incompatible ones
  const recipientDisabledMap = useMemo(() => {
    const disabledMap = new Map<string, boolean>();
    recipients.forEach((recipient) => {
      disabledMap.set(
        recipient.id,
        isRecipientDisabled(recipient as any, selectedAccount as any)
      );
    });
    return disabledMap;
  }, [recipients, selectedAccount]);

  // Compute which accounts should be disabled based on selected recipient
  // Show all accounts but disable incompatible ones
  const accountDisabledMap = useMemo(() => {
    const disabledMap = new Map<string, boolean>();
    accounts?.items?.forEach((account) => {
      disabledMap.set(
        account.id,
        isAccountDisabled(account as any, selectedRecipient as any)
      );
    });
    return disabledMap;
  }, [accounts?.items, selectedRecipient]);

  const availableRoutingTypes = useMemo(() => {
    return getAvailableRoutingTypes(selectedRecipient as any);
  }, [selectedRecipient]);

  const dynamicPaymentMethods = useMemo(() => {
    return filterPaymentMethods(paymentMethods, availableRoutingTypes);
  }, [paymentMethods, availableRoutingTypes]);

  // Combine recipients status - if we're fetching a preselected recipient,
  // consider it part of the overall recipients status
  const combinedRecipientsStatus = useMemo(() => {
    // If we have a preselected recipient and it's loading, show loading
    if (recipientId && preselectedRecipientStatus === 'pending') {
      return 'pending';
    }
    // If list is loading, show loading
    if (recipientsStatus === 'pending') {
      return 'pending';
    }
    // If preselected recipient fetch failed (404, etc), still return success
    // since the list query succeeded - the warning will be shown in the component
    if (recipientsStatus === 'success') {
      return 'success';
    }
    // If list query failed, return error
    if (recipientsStatus === 'error') {
      return 'error';
    }
    return recipientsStatus;
  }, [recipientsStatus, preselectedRecipientStatus, recipientId]);

  return {
    accounts,
    recipients,
    selectedAccount,
    selectedRecipient,
    filteredRecipients,
    dynamicPaymentMethods,
    availableBalance,
    accountBalance,
    isBalanceLoading,
    isBalanceError,
    balanceError,
    refetchBalance,
    accountsStatus,
    recipientsStatus: combinedRecipientsStatus,
    preselectedRecipientStatus,
    preselectedRecipientError,
    recipientDisabledMap,
    accountDisabledMap,
    refetchAccounts,
    refetchRecipients,
  };
};

/**
 * Hook for managing payment validation logic
 */
export const usePaymentValidation = (
  paymentMethods: PaymentMethod[],
  availableBalance: number,
  form: UseFormReturn<PaymentFormData>
) => {
  const amount = Number.parseFloat(form.watch('amount') || '0');
  const from = form.watch('from');
  const to = form.watch('to');
  const method = form.watch('method');
  const currency = form.watch('currency');
  const recipientMode = form.watch('recipientMode');

  // In manual mode, validate minimal manual fields are present
  const manualFilled = (() => {
    if (recipientMode !== 'manual') return false;
    const partyType = form.watch('partyType');
    const accountType = form.watch('accountType');
    const accountNumber = form.watch('accountNumber');
    const routingNumber = form.watch('routingNumber');
    const firstName = form.watch('firstName');
    const lastName = form.watch('lastName');
    const businessName = form.watch('businessName');
    const addressLine1 = form.watch('addressLine1');
    const city = form.watch('city');
    const state = form.watch('state');

    const baseOk = Boolean(
      partyType && accountType && accountNumber && routingNumber
    );
    const partyOk =
      partyType === 'INDIVIDUAL'
        ? Boolean(firstName && lastName)
        : partyType === 'ORGANIZATION'
          ? Boolean(businessName)
          : false;
    const rtpOk =
      method === 'RTP' ? Boolean(addressLine1 && city && state) : true;
    return baseOk && partyOk && rtpOk;
  })();

  const existingFilled = Boolean(to);
  const isFormFilled = Boolean(
    amount > 0 &&
      from &&
      method &&
      currency &&
      (recipientMode === 'manual' ? manualFilled : existingFilled)
  );

  const validation = useMemo(() => {
    const fee = paymentMethods?.find((m) => m.id === method)?.fee || 0;
    const totalAmount = amount + fee;
    const isAmountValid = amount > fee && totalAmount <= availableBalance;

    return {
      isAmountValid,
      totalAmount,
      fee,
      availableBalance,
    };
  }, [amount, method, paymentMethods, availableBalance]);

  return {
    amount,
    from,
    to,
    method,
    currency,
    isFormFilled,
    ...validation,
  };
};

/**
 * Hook for managing auto-selection logic
 */
export const usePaymentAutoSelection = (
  accounts: any,
  selectedAccount: any,
  filteredRecipients: any[],
  paymentMethods: PaymentMethod[],
  form: UseFormReturn<PaymentFormData>
) => {
  useEffect(() => {
    const currentRecipient = form.getValues('to');
    const currentAccount = form.getValues('from');
    const currentMethod = form.getValues('method');

    // Check if currently selected recipient is still valid in filtered list
    const isCurrentRecipientValid = currentRecipient
      ? filteredRecipients.some((r) => r.id === currentRecipient)
      : false;

    // Recipient auto-selection logic:
    // IMPORTANT: Only modify recipient selection if:
    // 1. Current selection is invalid (filtered out) - clear it
    // 2. No selection exists AND only one recipient available - auto-select it
    // DO NOT overwrite a valid user selection!
    if (currentRecipient && !isCurrentRecipientValid) {
      // Current selection is no longer valid (filtered out by account change)
      // Only clear if it's actually invalid
      form.setValue('to', '');
    } else if (!currentRecipient && filteredRecipients.length === 1) {
      // No selection yet, and only one recipient available - auto-select it
      // Only if there's truly no selection
      form.setValue('to', filteredRecipients[0].id);
    }
    // If currentRecipient exists and is valid, do nothing - preserve user's selection

    // Auto-select single account if only one is available
    // Only if no account is currently selected
    if (accounts?.items?.length === 1 && !currentAccount) {
      form.setValue('from', accounts.items[0].id);
    }

    // Auto-select single payment method if only one is available
    // Only if no method is currently selected
    if (paymentMethods?.length === 1 && !currentMethod) {
      form.setValue('method', paymentMethods[0].id);
    }
  }, [
    accounts?.items,
    selectedAccount,
    filteredRecipients,
    paymentMethods,
    form,
  ]);
};
