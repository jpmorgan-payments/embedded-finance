'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Loader2,
  TrendingDown,
  User,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useFlowContext } from '../FlowContainer/FlowContext';
import type { ReviewPanelProps } from '../PaymentFlow.types';

/**
 * Format currency value
 */
function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * ReviewPanel component
 * Compact right-side panel showing transfer summary and submit button
 * Uses FlowContext to get live form data updates
 */
export function ReviewPanel({
  accounts,
  payees,
  paymentMethods,
  onSubmit,
  isSubmitting = false,
  showFees = false,
  onValidationFail,
  isLoading = false,
  isPayeesLoading = false,
}: Omit<ReviewPanelProps, 'mobileConfig'>) {
  // Get live form data from context
  const { formData, isComplete, currentView, setValidationErrors } =
    useFlowContext();
  const { t } = useTranslation('accounts');

  // Track if validation has been attempted (to show error state)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Handle submit button click - validate first, then submit if valid
  const handleSubmitClick = useCallback(() => {
    setHasAttemptedSubmit(true);

    if (!isComplete) {
      // Collect missing fields for callback
      const missingFields: string[] = [];
      if (!formData.fromAccountId) missingFields.push('fromAccount');
      if (!formData.payeeId) missingFields.push('payee');
      if (!formData.paymentMethod) missingFields.push('paymentMethod');
      if (!formData.amount || parseFloat(formData.amount) <= 0)
        missingFields.push('amount');

      // Update context with validation errors (for MainTransferView to highlight)
      setValidationErrors(missingFields);
      onValidationFail?.(missingFields);
      return;
    }

    // Don't submit if balance is still loading or there's a balance error
    const account = accounts?.items?.find(
      (a) => a.id === formData.fromAccountId
    );
    const balanceIsLoading = account?.balance?.isLoading ?? false;
    const balanceHasError = account?.balance?.hasError ?? false;
    const balance = account?.balance?.available ?? 0;
    const amountValue = parseFloat(formData.amount) || 0;

    if (balanceIsLoading) {
      onValidationFail?.(['balanceLoading']);
      return;
    }

    if (!balanceHasError && amountValue > balance) {
      setValidationErrors(['exceedsBalance']);
      onValidationFail?.(['exceedsBalance']);
      return;
    }

    onSubmit(formData);
  }, [
    isComplete,
    formData,
    onSubmit,
    onValidationFail,
    accounts,
    setValidationErrors,
  ]);

  // Helper to get translated category label
  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Account';
    return t(`categories.${category}`, {
      defaultValue: category.replace(/_/g, ' '),
    });
  };

  // Determine if we're adding a new payee
  const isAddingNewPayee = [
    'payee-type',
    'link-account',
    'add-recipient-method',
    'add-recipient-form',
  ].includes(currentView);
  const isAddingLinkedAccount = currentView === 'link-account';
  const isAddingRecipient = [
    'add-recipient-method',
    'add-recipient-form',
  ].includes(currentView);

  // Find selected entities
  const selectedPayee = useMemo(
    () => payees?.find((p) => p.id === formData.payeeId),
    [payees, formData.payeeId]
  );

  const selectedAccount = useMemo(
    () => accounts?.items?.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );

  // Compute specific validation message based on what's missing
  // Note: Balance-related messages are computed separately below
  const missingFieldsMessage = useMemo(() => {
    const missing: string[] = [];
    if (!formData.fromAccountId) missing.push('an account');
    if (!formData.payeeId) missing.push('a recipient');
    if (!formData.paymentMethod) missing.push('a payment method');
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      missing.push('an amount');

    if (missing.length === 0) return null;
    if (missing.length === 1) return `Please select ${missing[0]}`;

    const lastItem = missing.pop();
    return `Please select ${missing.join(', ')} and ${lastItem}`;
  }, [
    formData.fromAccountId,
    formData.payeeId,
    formData.paymentMethod,
    formData.amount,
  ]);

  const selectedMethod = useMemo(
    () => paymentMethods?.find((m) => m.id === formData.paymentMethod),
    [paymentMethods, formData.paymentMethod]
  );

  // Calculate amounts
  const amount = parseFloat(formData.amount) || 0;
  const fee = selectedMethod?.fee ?? 0;
  // Only include fee in total if showFees is enabled
  const total = showFees ? amount + fee : amount;

  // Balance states
  const isBalanceLoading = selectedAccount?.balance?.isLoading ?? false;
  const hasBalanceError = selectedAccount?.balance?.hasError ?? false;
  const currentBalance = selectedAccount?.balance?.available;
  const balanceAfterPayment =
    currentBalance !== undefined && !isBalanceLoading && !hasBalanceError
      ? currentBalance - total
      : undefined;

  // Check if amount exceeds available balance (only when balance is known)
  const exceedsBalance =
    !isBalanceLoading &&
    !hasBalanceError &&
    currentBalance !== undefined &&
    amount > 0 &&
    currentBalance < amount;

  // Combined validation message including balance states
  const validationMessage = useMemo(() => {
    // First check for missing fields
    if (missingFieldsMessage) return missingFieldsMessage;

    // Then check for balance-related issues
    if (isBalanceLoading) return 'Waiting for balance...';
    if (exceedsBalance && currentBalance !== undefined) {
      return `Amount exceeds available balance ($${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }

    return null;
  }, [missingFieldsMessage, isBalanceLoading, exceedsBalance, currentBalance]);

  // Get display name for account
  const getAccountDisplayName = () => {
    if (!selectedAccount) return null;
    const lastFour =
      selectedAccount.paymentRoutingInformation?.accountNumber?.slice(-4) ?? '';
    const displayName =
      selectedAccount.label ?? getCategoryLabel(selectedAccount.category);
    return { displayName, lastFour };
  };

  const accountInfo = getAccountDisplayName();

  // Determine display for "To" section
  const getToDisplay = () => {
    if (selectedPayee) {
      const lastFour = selectedPayee.accountNumber?.slice(-4) ?? null;
      const isBusiness = selectedPayee.recipientType === 'BUSINESS';
      const isLinkedAccount = selectedPayee.type === 'LINKED_ACCOUNT';
      return {
        name: selectedPayee.name,
        lastFour,
        isPlaceholder: false,
        isBusiness,
        isLinkedAccount,
      };
    }
    // If we have a payeeId but no selectedPayee, payees might still be loading
    if (formData.payeeId && isPayeesLoading) {
      return {
        name: 'Loading recipient...',
        lastFour: null,
        isPlaceholder: false,
        isLoading: true,
      };
    }
    if (isAddingLinkedAccount) {
      return {
        name: 'New Linked Account',
        lastFour: null,
        isPlaceholder: false,
        isNew: true,
        isLinkedAccount: true,
      };
    }
    if (isAddingRecipient) {
      return {
        name: 'New Recipient',
        lastFour: null,
        isPlaceholder: false,
        isNew: true,
      };
    }
    if (isAddingNewPayee) {
      return {
        name: 'Adding...',
        lastFour: null,
        isPlaceholder: false,
        isNew: true,
      };
    }
    return { name: 'Select recipient', lastFour: null, isPlaceholder: true };
  };

  const toInfo = getToDisplay();

  // Determine icon for recipient:
  // - Building2 for business (whether linked account or recipient)
  // - User for individual (whether linked account or recipient)
  const RecipientIcon = toInfo.isBusiness ? Building2 : User;

  return (
    <div className="eb-flex eb-h-full eb-flex-col">
      {/* Header */}
      <div className="eb-mb-5 eb-text-base eb-font-semibold">
        Payment Summary
      </div>

      <div className="eb-flex eb-flex-1 eb-flex-col eb-justify-between">
        <div className="eb-space-y-5">
          {/* Transfer Flow Visual - Vertical Layout */}
          <div className="eb-rounded-lg eb-border eb-border-border eb-bg-muted/20">
            {/* From Account */}
            <div className="eb-flex eb-items-start eb-gap-3 eb-p-3">
              <div className="eb-flex eb-h-9 eb-w-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-background eb-shadow-sm">
                <Wallet className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
              </div>
              <div className="eb-min-w-0 eb-flex-1">
                <div className="eb-text-xs eb-text-muted-foreground">From</div>
                {isLoading && formData.fromAccountId ? (
                  // Show skeleton when loading with initial account data
                  <div className="eb-space-y-1">
                    <Skeleton className="eb-h-4 eb-w-32 eb-bg-muted-foreground/20" />
                    <Skeleton className="eb-h-3 eb-w-24 eb-bg-muted-foreground/20" />
                  </div>
                ) : accountInfo ? (
                  <>
                    <div className="eb-font-medium">
                      {accountInfo.displayName}
                      {accountInfo.lastFour && (
                        <span className="eb-font-normal eb-text-muted-foreground">
                          {' '}
                          (...{accountInfo.lastFour})
                        </span>
                      )}
                    </div>
                    {isBalanceLoading ? (
                      <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                        Loading balance...
                      </div>
                    ) : hasBalanceError ? (
                      <div className="eb-mt-0.5 eb-text-xs eb-text-destructive">
                        Balance unavailable
                      </div>
                    ) : currentBalance !== undefined ? (
                      <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                        {formatCurrency(currentBalance)} available
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="eb-text-muted-foreground">Select account</div>
                )}
              </div>
            </div>

            {/* Divider with Arrow */}
            <div className="eb-relative eb-border-t eb-border-border">
              <div className="eb-absolute eb-left-[21px] eb-top-1/2 eb-flex eb-h-5 eb-w-5 eb--translate-y-1/2 eb-items-center eb-justify-center eb-rounded-full eb-border eb-border-border eb-bg-background">
                <ArrowRight className="eb-h-3 eb-w-3 eb-rotate-90 eb-text-muted-foreground" />
              </div>
            </div>

            {/* To Recipient */}
            <div className="eb-flex eb-items-start eb-gap-3 eb-p-3">
              <div className="eb-flex eb-h-9 eb-w-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted eb-shadow-sm">
                <RecipientIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
              </div>
              <div className="eb-min-w-0 eb-flex-1">
                <div className="eb-text-xs eb-text-muted-foreground">To</div>
                {isLoading && formData.payeeId ? (
                  // Show skeleton when loading with initial payee data
                  <div className="eb-space-y-1">
                    <Skeleton className="eb-h-4 eb-w-28 eb-bg-muted-foreground/20" />
                    <Skeleton className="eb-h-3 eb-w-20 eb-bg-muted-foreground/20" />
                  </div>
                ) : toInfo.isLoading ? (
                  // Show skeleton when payees are still loading but we have a payeeId
                  <div className="eb-space-y-1">
                    <Skeleton className="eb-h-4 eb-w-28 eb-bg-muted-foreground/20" />
                    <Skeleton className="eb-h-3 eb-w-20 eb-bg-muted-foreground/20" />
                  </div>
                ) : toInfo.isPlaceholder ? (
                  <div className="eb-text-muted-foreground">{toInfo.name}</div>
                ) : (
                  <>
                    <div
                      className={cn(
                        'eb-font-medium',
                        toInfo.isNew && 'eb-text-primary'
                      )}
                    >
                      {toInfo.name}
                      {toInfo.lastFour && (
                        <span className="eb-font-normal eb-text-muted-foreground">
                          {' '}
                          (...{toInfo.lastFour})
                        </span>
                      )}
                    </div>
                    {!toInfo.isNew && (
                      <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                        {toInfo.isLinkedAccount
                          ? toInfo.isBusiness
                            ? 'Linked business account'
                            : 'Linked individual account'
                          : toInfo.isBusiness
                            ? 'Business recipient'
                            : 'Individual recipient'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="eb-space-y-2.5">
            {/* Amount - only show when fees are displayed (to show Amount + Fee = Total breakdown) */}
            {showFees && (
              <div className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-text-sm eb-text-muted-foreground">
                  Amount
                </span>
                <div className="eb-text-right">
                  {amount > 0 ? (
                    <span className="eb-font-medium">
                      {formatCurrency(amount)}
                    </span>
                  ) : (
                    <span className="eb-text-sm eb-text-muted-foreground">
                      —
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="eb-flex eb-items-center eb-justify-between">
              <span className="eb-text-sm eb-text-muted-foreground">
                Method
              </span>
              <div className="eb-text-right eb-text-sm">
                {selectedMethod ? (
                  <span className="eb-font-medium">{selectedMethod.name}</span>
                ) : (
                  <span className="eb-text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {/* Fee - only shown when showFees is enabled */}
            {showFees && (
              <div className="eb-flex eb-items-center eb-justify-between eb-text-sm">
                <span className="eb-text-muted-foreground">Fee</span>
                <span>{selectedMethod ? formatCurrency(fee) : '—'}</span>
              </div>
            )}

            {/* Memo */}
            {formData.memo && (
              <div className="eb-flex eb-items-start eb-justify-between eb-gap-4">
                <span className="eb-shrink-0 eb-text-sm eb-text-muted-foreground">
                  Memo
                </span>
                <span className="eb-text-right eb-text-sm eb-text-muted-foreground">
                  {formData.memo}
                </span>
              </div>
            )}
          </div>

          {/* Total & Balance Section */}
          {amount > 0 && (
            <div className="eb-space-y-2 eb-border-t eb-border-border eb-pt-4">
              {/* Total (or Amount when no fees are shown) */}
              <div className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-font-medium">
                  {showFees ? 'Total' : 'Amount'}
                </span>
                <span className="eb-text-lg eb-font-semibold">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Balance After Payment */}
              {selectedAccount && isBalanceLoading ? (
                <div className="eb-flex eb-items-center eb-justify-between eb-rounded-md eb-bg-muted/50 eb-px-3 eb-py-2">
                  <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                    <TrendingDown className="eb-h-4 eb-w-4" />
                    <span>Remaining balance</span>
                  </div>
                  <Skeleton className="eb-h-4 eb-w-16 eb-bg-muted-foreground/20" />
                </div>
              ) : balanceAfterPayment !== undefined ? (
                <div className="eb-flex eb-items-center eb-justify-between eb-rounded-md eb-bg-muted/50 eb-px-3 eb-py-2">
                  <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                    <TrendingDown className="eb-h-4 eb-w-4" />
                    <span>Remaining balance</span>
                  </div>
                  <span
                    className={cn(
                      'eb-text-sm eb-font-medium',
                      balanceAfterPayment < 0 && 'eb-text-destructive'
                    )}
                  >
                    {formatCurrency(balanceAfterPayment)}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="eb-mt-6 eb-space-y-2">
          {/* Validation message when form is incomplete */}
          {hasAttemptedSubmit && validationMessage && (
            <div className="eb-text-center eb-text-sm eb-text-destructive">
              {validationMessage}
            </div>
          )}
          <Button
            onClick={handleSubmitClick}
            disabled={isSubmitting || isLoading}
            className="eb-w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm payment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
