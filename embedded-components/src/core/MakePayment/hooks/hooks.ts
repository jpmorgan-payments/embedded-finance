import { useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';

import type { PaymentFormData, PaymentMethod } from '../types';
import {
  filterPaymentMethods,
  filterRecipients,
  getAvailableRoutingTypes,
} from '../utils';

/**
 * Hook for managing payment data fetching and processing
 */
export const usePaymentData = (
  paymentMethods: PaymentMethod[],
  form: UseFormReturn<PaymentFormData>
) => {
  // Fetch recipients from API
  const {
    data: recipientsData,
    status: recipientsStatus,
    refetch: refetchRecipients,
  } = useGetAllRecipients(undefined);

  const {
    data: accounts,
    status: accountsStatus,
    refetch: refetchAccounts,
  } = useGetAccounts(undefined);

  const recipients = recipientsData?.recipients || [];

  const selectedAccountId = form.watch('from');

  // Fetch account balance when account is selected
  const { data: accountBalance, isLoading: isBalanceLoading } =
    useGetAccountBalance(selectedAccountId || '');

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

  const availableRoutingTypes = useMemo(() => {
    return getAvailableRoutingTypes(selectedRecipient as any);
  }, [selectedRecipient]);

  const dynamicPaymentMethods = useMemo(() => {
    return filterPaymentMethods(paymentMethods, availableRoutingTypes);
  }, [paymentMethods, availableRoutingTypes]);

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
    accountsStatus,
    recipientsStatus,
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

  const isFormFilled = Boolean(amount > 0 && from && to && method && currency);

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
  dynamicPaymentMethods: PaymentMethod[],
  form: UseFormReturn<PaymentFormData>
) => {
  useEffect(() => {
    // Auto-select single recipient if only one is available
    if (filteredRecipients.length === 1) {
      const currentRecipient = form.getValues('to');
      if (currentRecipient !== filteredRecipients[0].id) {
        form.setValue('to', filteredRecipients[0].id);
      }
    }

    // Auto-select single account if only one is available
    if (accounts?.items?.length === 1) {
      const currentAccount = form.getValues('from');
      if (currentAccount !== accounts.items[0].id) {
        form.setValue('from', accounts.items[0].id);
      }
    }

    // Auto-select single payment method if only one is available
    if (paymentMethods?.length === 1) {
      const currentMethod = form.getValues('method');
      if (currentMethod !== paymentMethods[0].id) {
        form.setValue('method', paymentMethods[0].id);
      }
    }

    // Auto-select payment method if only one is available for the selected recipient
    if (dynamicPaymentMethods?.length === 1) {
      const currentMethod = form.getValues('method');
      if (currentMethod !== dynamicPaymentMethods[0].id) {
        form.setValue('method', dynamicPaymentMethods[0].id);
      }
    }

    // Reset payment method if not available for the new recipient
    if (
      form.getValues('method') &&
      !dynamicPaymentMethods?.some((pm) => pm.id === form.getValues('method'))
    ) {
      form.setValue('method', '');
    }

    // Reset account when recipient changes (if needed for specific business logic)
    // This could be used if certain recipients require specific account types
    const selectedRecipient = filteredRecipients.find(
      (r) => r.id === form.getValues('to')
    );
    if (selectedRecipient) {
      // For now, we don't reset the account when recipient changes
      // This could be enhanced based on business requirements
    }
  }, [
    accounts?.items,
    selectedAccount,
    filteredRecipients,
    paymentMethods,
    dynamicPaymentMethods,
    form,
  ]);
};
