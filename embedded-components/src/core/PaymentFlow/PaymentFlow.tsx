'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { cn } from '@/lib/utils';
import { ErrorType } from '@/api/axios-instance';
import {
  getGetAccountBalanceQueryOptions,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import { useGetAllRecipientsInfinite } from '@/api/generated/ep-recipients';
import { RecipientType as ApiRecipientType } from '@/api/generated/ep-recipients.schemas';
import { useCreateTransactionV2 } from '@/api/generated/ep-transactions';
import type {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { FlowContainer, FlowView, useFlowContext } from './FlowContainer';
import {
  AddRecipientForm,
  EnablePaymentMethodForm,
  LinkAccountForm,
  PayeeTypeSelector,
  PaymentMethodSelection,
} from './forms';
import { PayeeSelector } from './PayeeSelector';
import { DEFAULT_PAYMENT_METHODS, PANEL_IDS } from './PaymentFlow.constants';
import type {
  AccountResponse,
  Payee,
  PaymentFlowProps,
  PaymentMethod,
  PaymentMethodType,
} from './PaymentFlow.types';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { ReviewPanel } from './ReviewPanel';

/**
 * StepSection component
 * A clean stepper-style section with smooth animations
 * Based on checkout flow patterns (Stripe, Apple Pay style)
 */
interface StepSectionProps {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  summary?: React.ReactNode;
  children: React.ReactNode;
  onHeaderClick?: () => void;
  onCollapse?: () => void;
  isLast?: boolean;
  disabledReason?: string;
}

function StepSection({
  stepNumber,
  title,
  isComplete,
  isActive,
  summary,
  children,
  onHeaderClick,
  onCollapse,
  isLast = false,
  disabledReason,
}: StepSectionProps) {
  const isDisabled = !!disabledReason;
  // Can click to expand if not active and not disabled
  // Can click to collapse if active
  const canClick = isActive || !isDisabled;

  const handleClick = () => {
    if (isActive && onCollapse) {
      onCollapse();
    } else if (!isActive && !isDisabled && onHeaderClick) {
      onHeaderClick();
    }
  };

  // Determine the action label
  const getActionLabel = () => {
    if (isActive) {
      return 'Cancel';
    }
    if (isDisabled) {
      return disabledReason;
    }
    if (isComplete) {
      return 'Change';
    }
    return 'Select';
  };

  return (
    <div className="eb-relative">
      {/* Connecting line (except for last item) */}
      {!isLast && (
        <div
          className={cn(
            'eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-[2px]',
            isComplete ? 'eb-bg-primary/30' : 'eb-bg-border'
          )}
        />
      )}

      {/* Header */}
      <button
        type="button"
        onClick={canClick ? handleClick : undefined}
        disabled={!canClick}
        className={cn(
          'eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2 eb-text-left eb-transition-all eb-duration-200',
          canClick && !isDisabled && 'eb-cursor-pointer hover:eb-opacity-80',
          (!canClick || isDisabled) && 'eb-cursor-default'
        )}
      >
        {/* Step indicator */}
        <div
          className={cn(
            'eb-relative eb-z-10 eb-flex eb-h-8 eb-w-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-text-sm eb-font-medium eb-transition-all eb-duration-300',
            isComplete && 'eb-bg-primary eb-text-primary-foreground',
            isActive &&
              !isComplete &&
              'eb-border-2 eb-border-primary eb-bg-background eb-text-primary',
            !isComplete &&
              !isActive &&
              'eb-border-2 eb-border-muted-foreground/30 eb-bg-background eb-text-muted-foreground'
          )}
        >
          {isComplete ? (
            <Check className="eb-h-4 eb-w-4" strokeWidth={3} />
          ) : (
            <span>{stepNumber}</span>
          )}
        </div>

        {/* Title and summary */}
        <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
          <div className="eb-flex eb-items-center eb-gap-2">
            <span
              className={cn(
                'eb-font-medium eb-transition-colors eb-duration-200',
                isActive && 'eb-text-foreground',
                isComplete && !isActive && 'eb-text-foreground',
                !isComplete && !isActive && 'eb-text-muted-foreground'
              )}
            >
              {title}
            </span>
            {isComplete && !isActive && summary && (
              <span className="eb-text-sm eb-text-muted-foreground">
                — {summary}
              </span>
            )}
          </div>

          {/* Action label */}
          <span
            className={cn(
              'eb-text-xs eb-font-medium',
              isActive && 'eb-text-muted-foreground',
              !isActive && !isDisabled && 'eb-text-primary',
              isDisabled && 'eb-text-muted-foreground/60'
            )}
          >
            {getActionLabel()}
          </span>
        </div>
      </button>

      {/* Content with animation */}
      <div
        className={cn(
          'eb-ml-11 eb-overflow-hidden eb-transition-all eb-duration-300 eb-ease-in-out',
          isActive
            ? 'eb-max-h-[1000px] eb-opacity-100'
            : 'eb-max-h-0 eb-opacity-0'
        )}
      >
        <div className="eb-pb-4 eb-pt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * MainTransferView component
 * The main view with all form sections
 */
interface MainTransferViewProps {
  payees: Payee[];
  linkedAccounts: Payee[];
  accounts: AccountResponse[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  onPayeeSelect: (payee: Payee) => void;
  onAddNewPayee: () => void;
  onPaymentMethodSelect: (method: PaymentMethodType) => void;
  onEnablePaymentMethod: (method: PaymentMethodType) => void;
  onAccountSelect: (accountId: string) => void;
  onAmountChange: (amount: string) => void;
  onMemoChange: (memo: string) => void;
  // Infinite scroll props - Recipients
  hasMoreRecipients?: boolean;
  onLoadMoreRecipients?: () => void;
  isLoadingMoreRecipients?: boolean;
  totalRecipients?: number;
  // Infinite scroll props - Linked Accounts
  hasMoreLinkedAccounts?: boolean;
  onLoadMoreLinkedAccounts?: () => void;
  isLoadingMoreLinkedAccounts?: boolean;
  totalLinkedAccounts?: number;
}

function MainTransferView({
  payees,
  linkedAccounts,
  accounts,
  paymentMethods,
  isLoading,
  onPayeeSelect,
  onAddNewPayee,
  onPaymentMethodSelect,
  onEnablePaymentMethod,
  onAccountSelect,
  onAmountChange,
  onMemoChange,
  hasMoreRecipients,
  onLoadMoreRecipients,
  isLoadingMoreRecipients,
  totalRecipients,
  hasMoreLinkedAccounts,
  onLoadMoreLinkedAccounts,
  isLoadingMoreLinkedAccounts,
  totalLinkedAccounts,
}: MainTransferViewProps) {
  const { formData, setFormData } = useFlowContext();
  const { t } = useTranslation('accounts');

  // Helper to get translated category label
  const getCategoryLabel = useCallback(
    (category?: string) => {
      if (!category) return 'Account';
      return t(`categories.${category}`, {
        defaultValue: category.replace(/_/g, ' '),
      });
    },
    [t]
  );

  // Compute the initial active step based on current form data
  // This prevents the "flash" of seeing the FROM_ACCOUNT section animate when data is already selected
  const getInitialActiveStep = useCallback(() => {
    // If account is already selected (from initialData or auto-selection), skip to next step
    if (formData.fromAccountId) {
      if (!formData.payeeId) return PANEL_IDS.PAYEE;
      if (!formData.paymentMethod) return PANEL_IDS.PAYMENT_METHOD;
      return ''; // All steps complete
    }
    // If only one account exists, it will be auto-selected, so start at PAYEE
    if (accounts.length === 1) {
      if (!formData.payeeId) return PANEL_IDS.PAYEE;
      if (!formData.paymentMethod) return PANEL_IDS.PAYMENT_METHOD;
      return '';
    }
    return PANEL_IDS.FROM_ACCOUNT;
  }, [
    formData.fromAccountId,
    formData.payeeId,
    formData.paymentMethod,
    accounts.length,
  ]);

  // Track which step is currently active
  const [activeStep, setActiveStep] = useState<string>(() =>
    getInitialActiveStep()
  );

  // Update activeStep when formData changes (e.g., auto-selection happens)
  // This is needed because useState initializer only runs once
  const prevFromAccountId = React.useRef(formData.fromAccountId);
  useEffect(() => {
    // Only update if fromAccountId changed from undefined to a value (auto-selection)
    if (!prevFromAccountId.current && formData.fromAccountId) {
      const nextStep = !formData.payeeId
        ? PANEL_IDS.PAYEE
        : !formData.paymentMethod
          ? PANEL_IDS.PAYMENT_METHOD
          : '';
      setActiveStep(nextStep);
    }
    prevFromAccountId.current = formData.fromAccountId;
  }, [formData.fromAccountId, formData.payeeId, formData.paymentMethod]);

  // Track if payee was just cleared due to account restriction
  const [showPayeeClearedWarning, setShowPayeeClearedWarning] = useState(false);

  const selectedPayee = useMemo(
    () => [...payees, ...linkedAccounts].find((p) => p.id === formData.payeeId),
    [payees, linkedAccounts, formData.payeeId]
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === formData.paymentMethod),
    [paymentMethods, formData.paymentMethod]
  );

  // Account restrictions
  // LIMITED_DDA accounts can only pay to linked accounts, not regular recipients
  const isLimitedDDA = selectedAccount?.category === 'LIMITED_DDA';

  const hasPayee = !!formData.payeeId;
  const hasPaymentMethod = !!formData.paymentMethod;
  const hasAccount = !!formData.fromAccountId;

  // Balance validation
  const amount = parseFloat(formData.amount) || 0;
  const availableBalance = selectedAccount?.balance?.available;
  const exceedsBalance =
    availableBalance !== undefined && amount > 0 && amount > availableBalance;

  // Auto-advance to next incomplete step when selection is made
  const handlePayeeSelect = useCallback(
    (payee: Payee) => {
      onPayeeSelect(payee);
      // Clear the warning when a new payee is selected
      setShowPayeeClearedWarning(false);
      // Only advance if next step is not complete
      setTimeout(() => {
        if (!hasPaymentMethod) {
          setActiveStep(PANEL_IDS.PAYMENT_METHOD);
        } else {
          setActiveStep('');
        }
      }, 150);
    },
    [onPayeeSelect, hasPaymentMethod]
  );

  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethodType) => {
      onPaymentMethodSelect(method);
      // Payment method is the last step, just close
      setTimeout(() => setActiveStep(''), 150);
    },
    [onPaymentMethodSelect]
  );

  const handleAccountSelect = useCallback(
    (accountId: string) => {
      onAccountSelect(accountId);

      // Check if the newly selected account is LIMITED_DDA
      const newAccount = accounts.find((a) => a.id === accountId);
      const isNewAccountLimitedDDA = newAccount?.category === 'LIMITED_DDA';

      // Check if current payee is a recipient (not linked account)
      const currentPayeeIsRecipient = selectedPayee?.type === 'RECIPIENT';

      // If switching to LIMITED_DDA and current payee is a recipient, clear it
      if (isNewAccountLimitedDDA && currentPayeeIsRecipient) {
        setFormData({ payeeId: undefined });
        // Show warning that payee was cleared
        setShowPayeeClearedWarning(true);
        // Always navigate to payee step to select a linked account
        setTimeout(() => setActiveStep(PANEL_IDS.PAYEE), 150);
        return;
      }

      // Advance to next incomplete step
      setTimeout(() => {
        if (!hasPayee) {
          setActiveStep(PANEL_IDS.PAYEE);
        } else if (!hasPaymentMethod) {
          setActiveStep(PANEL_IDS.PAYMENT_METHOD);
        } else {
          setActiveStep('');
        }
      }, 150);
    },
    [
      onAccountSelect,
      hasPayee,
      hasPaymentMethod,
      accounts,
      selectedPayee,
      setFormData,
    ]
  );

  // Collapse handler - just close the current section
  const handleCollapse = useCallback(() => {
    setActiveStep('');
  }, []);

  return (
    <div className="eb-space-y-1">
      {/* FROM ACCOUNT Section - Now first */}
      <StepSection
        stepNumber={1}
        title="From"
        isComplete={hasAccount}
        isActive={activeStep === PANEL_IDS.FROM_ACCOUNT}
        summary={
          selectedAccount
            ? `${selectedAccount.label ?? getCategoryLabel(selectedAccount.category)} (...${selectedAccount.paymentRoutingInformation?.accountNumber?.slice(-4) ?? ''})`
            : undefined
        }
        onHeaderClick={() => setActiveStep(PANEL_IDS.FROM_ACCOUNT)}
        onCollapse={handleCollapse}
      >
        <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
          {accounts.map((account, index) => {
            const lastFour =
              account.paymentRoutingInformation?.accountNumber?.slice(-4) ?? '';
            const displayName =
              account.label ?? getCategoryLabel(account.category);
            const isSelected = formData.fromAccountId === account.id;

            return (
              <React.Fragment key={account.id}>
                {index > 0 && <div className="eb-border-t eb-border-border" />}
                <button
                  type="button"
                  onClick={() => handleAccountSelect(account.id!)}
                  className={cn(
                    'eb-flex eb-w-full eb-items-center eb-justify-between eb-px-3 eb-py-3 eb-text-left eb-text-sm eb-transition-colors',
                    isSelected ? 'eb-bg-primary/5' : 'hover:eb-bg-muted/50'
                  )}
                >
                  <div className="eb-flex eb-items-center eb-gap-2">
                    <div>
                      <div>
                        <span className="eb-font-medium">{displayName}</span>
                        {lastFour && (
                          <span className="eb-ml-2 eb-text-muted-foreground">
                            (...{lastFour})
                          </span>
                        )}
                      </div>
                      {account.category && (
                        <div className="eb-text-xs eb-text-muted-foreground">
                          {getCategoryLabel(account.category)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="eb-flex eb-items-center eb-gap-3">
                    <div className="eb-text-right">
                      <div className="eb-font-medium">
                        {account.balance?.available !== undefined
                          ? `$${account.balance.available.toLocaleString()}`
                          : '$10,000.00'}
                      </div>
                      <div className="eb-text-xs eb-text-muted-foreground">
                        Available
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="eb-h-4 eb-w-4 eb-shrink-0 eb-text-primary" />
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </StepSection>

      {/* TO PAYEE Section - Now second */}
      <StepSection
        stepNumber={2}
        title="To"
        isComplete={hasPayee}
        isActive={activeStep === PANEL_IDS.PAYEE}
        summary={
          selectedPayee
            ? `${selectedPayee.name} (...${selectedPayee.accountNumber?.slice(-4) ?? ''})`
            : undefined
        }
        onHeaderClick={() => setActiveStep(PANEL_IDS.PAYEE)}
        onCollapse={handleCollapse}
        disabledReason={!hasAccount ? 'Select account first' : undefined}
      >
        <PayeeSelector
          selectedPayeeId={formData.payeeId}
          onSelect={handlePayeeSelect}
          onAddNew={onAddNewPayee}
          recipients={payees}
          linkedAccounts={linkedAccounts}
          isLoading={isLoading}
          hasMoreRecipients={hasMoreRecipients}
          onLoadMoreRecipients={onLoadMoreRecipients}
          isLoadingMoreRecipients={isLoadingMoreRecipients}
          totalRecipients={totalRecipients}
          hasMoreLinkedAccounts={hasMoreLinkedAccounts}
          onLoadMoreLinkedAccounts={onLoadMoreLinkedAccounts}
          isLoadingMoreLinkedAccounts={isLoadingMoreLinkedAccounts}
          totalLinkedAccounts={totalLinkedAccounts}
          recipientsRestricted={isLimitedDDA}
          showRestrictionWarning={showPayeeClearedWarning}
        />
      </StepSection>

      {/* PAYMENT METHOD Section - Now third/last */}
      <StepSection
        stepNumber={3}
        title="Payment Method"
        isComplete={hasPaymentMethod}
        isActive={activeStep === PANEL_IDS.PAYMENT_METHOD}
        summary={selectedMethod?.name}
        onHeaderClick={() => setActiveStep(PANEL_IDS.PAYMENT_METHOD)}
        onCollapse={handleCollapse}
        disabledReason={!hasPayee ? 'Select payee first' : undefined}
        isLast
      >
        <PaymentMethodSelector
          payee={selectedPayee}
          selectedMethod={formData.paymentMethod}
          availableMethods={paymentMethods}
          onSelect={handlePaymentMethodSelect}
          onEnableMethod={onEnablePaymentMethod}
          disabled={!hasPayee}
        />
      </StepSection>

      <Separator className="!eb-my-4" />

      {/* AMOUNT & MEMO Section - Always visible */}
      <div className="eb-space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
          >
            Amount
          </label>
          <div className="eb-relative eb-flex eb-items-center">
            <span
              className={cn(
                'eb-absolute eb-left-3',
                exceedsBalance
                  ? 'eb-text-destructive'
                  : 'eb-text-muted-foreground'
              )}
            >
              $
            </span>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => onAmountChange(e.target.value)}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, decimal point
                if (
                  [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    '.',
                  ].includes(e.key) ||
                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.ctrlKey &&
                    ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
                  // Allow: home, end, left, right
                  ['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                ) {
                  return;
                }
                // Block if not a number
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              className={cn(
                'eb-w-full eb-pl-7',
                exceedsBalance &&
                  'eb-border-destructive eb-text-destructive focus-visible:eb-ring-destructive'
              )}
              autoComplete="off"
            />
          </div>
          {exceedsBalance && availableBalance !== undefined && (
            <p className="eb-mt-1.5 eb-text-sm eb-text-destructive">
              Amount exceeds available balance ($
              {availableBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              )
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="memo"
            className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
          >
            Memo{' '}
            <span className="eb-font-normal eb-text-muted-foreground">
              (optional)
            </span>
          </label>
          <Textarea
            id="memo"
            placeholder="Add a note..."
            value={formData.memo ?? ''}
            onChange={(e) => onMemoChange(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

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
 * SuccessView component
 * Shows payment success confirmation with transaction details
 */
interface SuccessViewProps {
  transactionResponse?: TransactionResponseV2;
  formData: {
    amount: string;
    payeeId?: string;
    fromAccountId?: string;
    memo?: string;
  };
  payees: Payee[];
  accounts: AccountResponse[];
  onClose: () => void;
}

function SuccessView({
  transactionResponse,
  formData,
  payees,
  accounts,
  onClose,
}: SuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const amount = parseFloat(formData.amount) || 0;
  const payee = payees.find((p) => p.id === formData.payeeId);
  const account = accounts.find((a) => a.id === formData.fromAccountId);
  const transactionId =
    transactionResponse?.id ?? transactionResponse?.transactionReferenceId;

  const handleCopyId = useCallback(() => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [transactionId]);

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center">
      {/* Success Icon */}
      <div className="eb-mb-4 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-green-100">
        <CheckCircle2 className="eb-h-8 eb-w-8 eb-text-green-600" />
      </div>

      {/* Success Message */}
      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        Payment Sent!
      </h2>
      <p className="eb-mb-6 eb-text-muted-foreground">
        Your payment of {formatCurrency(amount)} has been initiated
      </p>

      {/* Transaction Details */}
      <div className="eb-w-full eb-max-w-sm eb-space-y-3 eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-4 eb-text-left">
        {payee && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">To</span>
            <span className="eb-text-sm eb-font-medium">{payee.name}</span>
          </div>
        )}
        {account && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">From</span>
            <span className="eb-text-sm eb-font-medium">
              {account.label ?? 'Account'} (...
              {account.paymentRoutingInformation?.accountNumber?.slice(-4)})
            </span>
          </div>
        )}
        <div className="eb-flex eb-justify-between">
          <span className="eb-text-sm eb-text-muted-foreground">Amount</span>
          <span className="eb-text-sm eb-font-medium">
            {formatCurrency(amount)}
          </span>
        </div>
        {transactionResponse?.status && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">Status</span>
            <span className="eb-text-sm eb-font-medium eb-capitalize">
              {transactionResponse.status.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        )}
        {transactionId && (
          <div className="eb-flex eb-items-center eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              Reference
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="eb-flex eb-items-center eb-gap-1 eb-text-sm eb-font-medium eb-text-primary hover:eb-underline"
            >
              {transactionId.slice(0, 8)}...
              {copied ? (
                <Check className="eb-h-3 eb-w-3" />
              ) : (
                <Copy className="eb-h-3 eb-w-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Close Button */}
      <Button onClick={onClose} className="eb-mt-6 eb-w-full eb-max-w-sm">
        Done
      </Button>
    </div>
  );
}

/**
 * PaymentFlowContent component
 * Inner content that uses the flow context
 */
interface PaymentFlowContentProps {
  payees: Payee[];
  linkedAccounts: Payee[];
  accounts: AccountResponse[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  isSubmitting: boolean;
  // Transaction response for success state
  transactionResponse?: TransactionResponseV2;
  // Transaction error for error display
  transactionError?: ErrorType<ApiErrorV2> | null;
  onClose: () => void;
  // Retry handler for errors
  onRetry?: () => void;
  // Infinite scroll props - Recipients
  hasMoreRecipients?: boolean;
  onLoadMoreRecipients?: () => void;
  isLoadingMoreRecipients?: boolean;
  totalRecipients?: number;
  // Infinite scroll props - Linked Accounts
  hasMoreLinkedAccounts?: boolean;
  onLoadMoreLinkedAccounts?: () => void;
  isLoadingMoreLinkedAccounts?: boolean;
  totalLinkedAccounts?: number;
}

function PaymentFlowContent({
  payees,
  linkedAccounts,
  accounts,
  paymentMethods,
  isLoading,
  isSubmitting: _isSubmitting,
  transactionResponse,
  transactionError,
  onClose,
  onRetry,
  hasMoreRecipients,
  onLoadMoreRecipients,
  isLoadingMoreRecipients,
  totalRecipients,
  hasMoreLinkedAccounts,
  onLoadMoreLinkedAccounts,
  isLoadingMoreLinkedAccounts,
  totalLinkedAccounts,
}: PaymentFlowContentProps) {
  const {
    formData,
    setFormData,
    pushView,
    popView,
    replaceView,
    isComplete: _isComplete,
  } = useFlowContext();
  const [pendingPaymentMethod, setPendingPaymentMethod] =
    useState<PaymentMethodType | null>(null);

  // Navigate to success view when transaction is complete
  useEffect(() => {
    if (transactionResponse) {
      replaceView('success');
    }
  }, [transactionResponse, replaceView]);

  // Auto-select account if only one is available
  useEffect(() => {
    if (accounts.length === 1 && !formData.fromAccountId) {
      const account = accounts[0];
      const availableBalance = account?.balance?.available;
      setFormData({ fromAccountId: account.id!, availableBalance });
    }
  }, [accounts, formData.fromAccountId, setFormData]);

  // Handler for payee selection
  const handlePayeeSelect = useCallback(
    (payee: Payee) => {
      setFormData({
        payeeId: payee.id,
        payee,
        // Clear payment method if payee changes and method isn't enabled
        paymentMethod: payee.enabledPaymentMethods.includes(
          formData.paymentMethod as PaymentMethodType
        )
          ? formData.paymentMethod
          : undefined,
      });
    },
    [formData.paymentMethod, setFormData]
  );

  // Handler for adding new payee
  const handleAddNewPayee = useCallback(() => {
    pushView('payee-type');
  }, [pushView]);

  // Handler for payment method selection
  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethodType) => {
      setFormData({ paymentMethod: method });
    },
    [setFormData]
  );

  // Handler for enabling a payment method
  const handleEnablePaymentMethod = useCallback(
    (method: PaymentMethodType) => {
      setPendingPaymentMethod(method);
      pushView('enable-payment-method');
    },
    [pushView]
  );

  // Handler for account selection
  const handleAccountSelect = useCallback(
    (accountId: string) => {
      // Find the account to get its available balance
      const selectedAccount = accounts.find((a) => a.id === accountId);
      const availableBalance = selectedAccount?.balance?.available;
      setFormData({ fromAccountId: accountId, availableBalance });
    },
    [accounts, setFormData]
  );

  // Handler for amount change - validates and sanitizes currency input
  const handleAmountChange = useCallback(
    (value: string) => {
      // Allow empty string for clearing
      if (value === '') {
        setFormData({ amount: '' });
        return;
      }

      // Remove any non-numeric characters except decimal point
      let sanitized = value.replace(/[^0-9.]/g, '');

      // Prevent multiple decimal points
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
      }

      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        sanitized = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }

      // Prevent leading zeros (except for "0." decimal values)
      if (
        sanitized.length > 1 &&
        sanitized[0] === '0' &&
        sanitized[1] !== '.'
      ) {
        sanitized = sanitized.replace(/^0+/, '');
      }

      setFormData({ amount: sanitized });
    },
    [setFormData]
  );

  // Handler for memo change
  const handleMemoChange = useCallback(
    (memo: string) => {
      setFormData({ memo });
    },
    [setFormData]
  );

  // Payee type selection handler
  const handlePayeeTypeSelect = useCallback(
    (type: 'link-account' | 'add-recipient') => {
      if (type === 'link-account') {
        pushView('link-account');
      } else {
        pushView('add-recipient-method');
      }
    },
    [pushView]
  );

  // Payment method selection for new recipient
  const handleRecipientMethodSelect = useCallback(
    (method: PaymentMethodType) => {
      setFormData({ paymentMethod: method });
      pushView('add-recipient-form');
    },
    [pushView, setFormData]
  );

  // Get the selected payee for enable form
  const selectedPayee = useMemo(
    () => [...payees, ...linkedAccounts].find((p) => p.id === formData.payeeId),
    [payees, linkedAccounts, formData.payeeId]
  );

  const pendingMethod = pendingPaymentMethod
    ? paymentMethods.find((m) => m.id === pendingPaymentMethod)
    : null;

  return (
    <>
      {/* Main Transfer View */}
      <FlowView viewId="main">
        {/* Transaction Error Alert */}
        {transactionError && (
          <div className="eb-mb-4">
            <ServerErrorAlert
              error={transactionError}
              customTitle="Payment Failed"
              customErrorMessage={{
                '400': 'Please check the payment details and try again.',
                '401': 'Your session has expired. Please log in and try again.',
                '403': 'You do not have permission to make this payment.',
                '404': 'The account or recipient was not found.',
                '422':
                  'The payment details are invalid. Please check and try again.',
                '500': 'An unexpected error occurred. Please try again later.',
                '503':
                  'The service is currently unavailable. Please try again later.',
                default: 'Failed to process the payment. Please try again.',
              }}
              tryAgainAction={onRetry}
              showDetails={false}
            />
          </div>
        )}
        <MainTransferView
          payees={payees}
          linkedAccounts={linkedAccounts}
          accounts={accounts}
          paymentMethods={paymentMethods}
          isLoading={isLoading}
          onPayeeSelect={handlePayeeSelect}
          onAddNewPayee={handleAddNewPayee}
          onPaymentMethodSelect={handlePaymentMethodSelect}
          onEnablePaymentMethod={handleEnablePaymentMethod}
          onAccountSelect={handleAccountSelect}
          onAmountChange={handleAmountChange}
          onMemoChange={handleMemoChange}
          hasMoreRecipients={hasMoreRecipients}
          onLoadMoreRecipients={onLoadMoreRecipients}
          isLoadingMoreRecipients={isLoadingMoreRecipients}
          totalRecipients={totalRecipients}
          hasMoreLinkedAccounts={hasMoreLinkedAccounts}
          onLoadMoreLinkedAccounts={onLoadMoreLinkedAccounts}
          isLoadingMoreLinkedAccounts={isLoadingMoreLinkedAccounts}
          totalLinkedAccounts={totalLinkedAccounts}
        />
      </FlowView>

      {/* Payee Type Selection View */}
      <FlowView viewId="payee-type">
        <PayeeTypeSelector
          onSelect={handlePayeeTypeSelect}
          onCancel={popView}
        />
      </FlowView>

      {/* Link Account View */}
      <FlowView viewId="link-account">
        <LinkAccountForm
          onSubmit={(_data) => {
            // TODO: Create linked account and select it
            popView();
          }}
          onCancel={popView}
        />
      </FlowView>

      {/* Add Recipient - Payment Method Selection */}
      <FlowView viewId="add-recipient-method">
        <PaymentMethodSelection
          availablePaymentMethods={paymentMethods}
          onSelect={handleRecipientMethodSelect}
          onCancel={popView}
        />
      </FlowView>

      {/* Add Recipient Form */}
      <FlowView viewId="add-recipient-form">
        <AddRecipientForm
          preSelectedPaymentMethod={formData.paymentMethod}
          availablePaymentMethods={paymentMethods}
          onSubmit={(_data) => {
            // TODO: Create recipient and select it
            popView();
            popView(); // Go back to main
          }}
          onCancel={popView}
        />
      </FlowView>

      {/* Enable Payment Method View */}
      <FlowView viewId="enable-payment-method">
        {selectedPayee && pendingMethod && (
          <EnablePaymentMethodForm
            payee={selectedPayee}
            paymentMethod={pendingMethod}
            onSubmit={(_data) => {
              // TODO: Enable payment method for payee
              setFormData({ paymentMethod: pendingPaymentMethod! });
              setPendingPaymentMethod(null);
              popView();
            }}
            onCancel={() => {
              setPendingPaymentMethod(null);
              popView();
            }}
          />
        )}
      </FlowView>

      {/* Success View */}
      <FlowView viewId="success">
        <SuccessView
          transactionResponse={transactionResponse}
          formData={formData}
          payees={[...payees, ...linkedAccounts]}
          accounts={accounts}
          onClose={onClose}
        />
      </FlowView>
    </>
  );
}

/**
 * PaymentFlow component
 * Main payment flow component with FlowContainer architecture
 */
export function PaymentFlow({
  clientId,
  trigger,
  paymentMethods = DEFAULT_PAYMENT_METHODS,
  initialAccountId,
  initialPayeeId,
  initialPaymentMethod,
  onTransactionComplete,
  onClose,
  open: controlledOpen,
  onOpenChange,
  userEventsHandler: _userEventsHandler,
  userEventsLifecycle: _userEventsLifecycle,
}: PaymentFlowProps) {
  // State
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlled vs uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // API hooks
  const { interceptorReady } = useInterceptorStatus();

  // Fetch accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useGetAccounts(
    clientId ? { clientId } : undefined,
    {
      query: {
        enabled: interceptorReady && !!clientId,
      },
    }
  );

  // Fetch RECIPIENT type with infinite scroll
  const {
    data: recipientsData,
    isLoading: isLoadingRecipients,
    fetchNextPage: fetchNextRecipients,
    hasNextPage: hasNextRecipients,
    isFetchingNextPage: isFetchingNextRecipients,
  } = useGetAllRecipientsInfinite(
    clientId ? { clientId, type: 'RECIPIENT', limit: 25 } : undefined,
    {
      query: {
        enabled: interceptorReady && !!clientId,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const totalItems =
            lastPage?.metadata?.total_items ?? lastPage?.total_items ?? 0;
          const loadedItems = allPages.reduce(
            (acc, page) => acc + (page?.recipients?.length ?? 0),
            0
          );
          return loadedItems < totalItems ? allPages.length : undefined;
        },
      },
    }
  );

  // Fetch LINKED_ACCOUNT type with infinite scroll
  const {
    data: linkedAccountsData,
    isLoading: isLoadingLinkedAccounts,
    fetchNextPage: fetchNextLinkedAccounts,
    hasNextPage: hasNextLinkedAccounts,
    isFetchingNextPage: isFetchingNextLinkedAccounts,
  } = useGetAllRecipientsInfinite(
    clientId ? { clientId, type: 'LINKED_ACCOUNT', limit: 25 } : undefined,
    {
      query: {
        enabled: interceptorReady && !!clientId,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const totalItems =
            lastPage?.metadata?.total_items ?? lastPage?.total_items ?? 0;
          const loadedItems = allPages.reduce(
            (acc, page) => acc + (page?.recipients?.length ?? 0),
            0
          );
          return loadedItems < totalItems ? allPages.length : undefined;
        },
      },
    }
  );

  // Get total counts from metadata
  const totalRecipients =
    recipientsData?.pages?.[0]?.metadata?.total_items ?? 0;
  const totalLinkedAccounts =
    linkedAccountsData?.pages?.[0]?.metadata?.total_items ?? 0;

  // Get list of open account IDs for balance fetching
  const openAccountIds = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter((account) => account.state === 'OPEN')
      .map((account) => account.id);
  }, [accountsData]);

  // Fetch balances for all open accounts in parallel
  const balanceQueries = useQueries({
    queries: openAccountIds.map((accountId) =>
      getGetAccountBalanceQueryOptions(accountId, {
        query: {
          enabled: interceptorReady && !!accountId,
        },
      })
    ),
  });

  // Check if any balance query is still loading
  const isLoadingBalances = balanceQueries.some((query) => query.isLoading);

  // Create a map of account ID to balance for quick lookup
  const balanceMap = useMemo(() => {
    const map: Record<string, { available: number; currency: string }> = {};
    balanceQueries.forEach((query, index) => {
      const accountId = openAccountIds[index];
      if (query.data && accountId) {
        // Find the ITAV (interim available balance) from balanceTypes
        const availableBalance = query.data.balanceTypes?.find(
          (bt) => bt.typeCode === 'ITAV'
        );
        map[accountId] = {
          available: availableBalance?.amount ?? 0,
          currency: query.data.currency ?? 'USD',
        };
      }
    });
    return map;
  }, [balanceQueries, openAccountIds]);

  // Transform API accounts to AccountResponse with balance
  const accounts: AccountResponse[] = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter((account) => account.state === 'OPEN')
      .map((account) => ({
        ...account,
        balance: balanceMap[account.id] ?? {
          available: 0,
          currency: 'USD',
        },
      }));
  }, [accountsData, balanceMap]);

  // Helper function to transform API recipients to Payee format
  const transformRecipientsToPayees = useCallback(
    (recipients: typeof recipientsData): Payee[] => {
      const allRecipients =
        recipients?.pages?.flatMap((page) => page?.recipients ?? []) ?? [];

      return allRecipients
        .filter((r) => r.status === 'ACTIVE')
        .map((recipient) => {
          const isLinkedAccount =
            recipient.type === ApiRecipientType.LINKED_ACCOUNT;
          const isOrganization =
            recipient.partyDetails?.type === 'ORGANIZATION';

          // Determine enabled payment methods based on routing information
          const enabledMethods: PaymentMethodType[] = [];
          if (recipient.account?.routingInformation) {
            recipient.account.routingInformation.forEach((ri) => {
              if (
                ri.transactionType === 'ACH' &&
                !enabledMethods.includes('ACH')
              ) {
                enabledMethods.push('ACH');
              }
              if (
                ri.transactionType === 'WIRE' &&
                !enabledMethods.includes('WIRE')
              ) {
                enabledMethods.push('WIRE');
              }
              if (
                ri.transactionType === 'RTP' &&
                !enabledMethods.includes('RTP')
              ) {
                enabledMethods.push('RTP');
              }
            });
          }

          // Build name based on party type
          const name = isOrganization
            ? (recipient.partyDetails?.businessName ?? 'Unknown Business')
            : `${recipient.partyDetails?.firstName ?? ''} ${recipient.partyDetails?.lastName ?? ''}`.trim() ||
              'Unknown';

          return {
            id: recipient.id,
            type: isLinkedAccount ? 'LINKED_ACCOUNT' : 'RECIPIENT',
            name,
            accountNumber: recipient.account?.number ?? '',
            routingNumber:
              recipient.account?.routingInformation?.[0]?.routingNumber ?? '',
            bankName: undefined, // Not available in API response
            enabledPaymentMethods:
              enabledMethods.length > 0 ? enabledMethods : ['ACH'],
            recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
            details: {
              email: recipient.partyDetails?.contacts?.find(
                (c) => c.contactType === 'EMAIL'
              )?.value,
              phone: recipient.partyDetails?.contacts?.find(
                (c) => c.contactType === 'PHONE'
              )?.value,
              beneficiaryAddress: recipient.partyDetails?.address?.addressLine1,
              beneficiaryCity: recipient.partyDetails?.address?.city,
              beneficiaryState: recipient.partyDetails?.address?.state,
              beneficiaryZip: recipient.partyDetails?.address?.postalCode,
            },
          } as Payee;
        });
    },
    []
  );

  // Transform API recipients to Payee arrays (fetched separately by type)
  const payees = useMemo(
    () => transformRecipientsToPayees(recipientsData),
    [recipientsData, transformRecipientsToPayees]
  );

  const linkedAccounts = useMemo(
    () => transformRecipientsToPayees(linkedAccountsData),
    [linkedAccountsData, transformRecipientsToPayees]
  );

  const isLoading =
    isLoadingAccounts ||
    isLoadingRecipients ||
    isLoadingLinkedAccounts ||
    isLoadingBalances;

  // Transaction mutation
  const createTransactionMutation = useCreateTransactionV2();

  // Store transaction response for success view
  const [transactionResponse, setTransactionResponse] = useState<
    TransactionResponseV2 | undefined
  >();

  // Store transaction error for error display
  const [transactionError, setTransactionError] =
    useState<ErrorType<ApiErrorV2> | null>(null);

  // Generate unique transaction reference ID (matching MakePayment pattern)
  const generateTransactionReferenceId = useCallback((): string => {
    const prefix = 'PHUI_';
    const uuid = uuidv4().replace(/-/g, ''); // Remove dashes to fit within the character limit
    const maxLength = 35;
    const randomPart = uuid.substring(0, maxLength - prefix.length);
    return prefix + randomPart;
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setOpen(false);
    setTransactionResponse(undefined); // Clear transaction response on close
    setTransactionError(null); // Clear error on close
    onClose?.();
  }, [setOpen, onClose]);

  // Handle retry - clear error to allow another attempt
  const handleRetry = useCallback(() => {
    setTransactionError(null);
  }, []);

  // Handle submit - creates actual transaction via API
  const handleTransactionSubmit = useCallback(
    async (formData: {
      fromAccountId?: string;
      payeeId?: string;
      payee?: Payee;
      paymentMethod?: PaymentMethodType;
      amount: string;
      memo?: string;
    }) => {
      setIsSubmitting(true);
      setTransactionError(null); // Clear any previous error
      try {
        // Generate unique transaction reference ID
        const transactionReferenceId = generateTransactionReferenceId();

        // Determine payment type based on selected method
        const paymentType = formData.paymentMethod as
          | 'ACH'
          | 'WIRE'
          | 'RTP'
          | undefined;

        // Build the request
        const response = await createTransactionMutation.mutateAsync({
          data: {
            amount: parseFloat(formData.amount) || 0,
            currency: 'USD',
            debtorAccountId: formData.fromAccountId,
            recipientId: formData.payeeId,
            memo: formData.memo,
            transactionReferenceId,
            type: paymentType,
          },
        });

        setTransactionResponse(response);
        onTransactionComplete?.(response);
      } catch (error) {
        // Store error for display (cast to AxiosError type)
        const axiosError = error as ErrorType<ApiErrorV2>;
        setTransactionError(axiosError);
        // Handle error - call onTransactionComplete with error
        onTransactionComplete?.(undefined, {
          httpStatus: axiosError.response?.status ?? 500,
          title: axiosError.response?.data?.title ?? 'Transaction Failed',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createTransactionMutation,
      onTransactionComplete,
      generateTransactionReferenceId,
    ]
  );

  // Initial form data
  const initialData = useMemo(
    () => ({
      payeeId: initialPayeeId,
      paymentMethod: initialPaymentMethod,
      fromAccountId: initialAccountId,
      amount: '',
      currency: 'USD',
    }),
    [initialAccountId, initialPayeeId, initialPaymentMethod]
  );

  return (
    <>
      {/* Trigger */}
      {trigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="eb-appearance-none eb-border-0 eb-bg-transparent eb-p-0"
        >
          {trigger}
        </button>
      )}

      {/* Flow Container */}
      <FlowContainer
        title="Transfer Funds"
        onClose={handleClose}
        asModal
        open={open}
        onOpenChange={setOpen}
        initialData={initialData}
        reviewPanelWidth="md"
        reviewPanel={
          <ReviewPanel
            accounts={{
              items: accounts,
              metadata: {
                page: 0,
                limit: 10,
                total_items: accounts.length,
              },
            }}
            payees={[...payees, ...linkedAccounts]}
            paymentMethods={paymentMethods}
            onSubmit={handleTransactionSubmit}
            isSubmitting={isSubmitting}
          />
        }
      >
        <PaymentFlowContent
          payees={payees}
          linkedAccounts={linkedAccounts}
          accounts={accounts}
          paymentMethods={paymentMethods}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          transactionResponse={transactionResponse}
          transactionError={transactionError}
          onClose={handleClose}
          onRetry={handleRetry}
          hasMoreRecipients={hasNextRecipients}
          onLoadMoreRecipients={fetchNextRecipients}
          isLoadingMoreRecipients={isFetchingNextRecipients}
          totalRecipients={totalRecipients}
          hasMoreLinkedAccounts={hasNextLinkedAccounts}
          onLoadMoreLinkedAccounts={fetchNextLinkedAccounts}
          isLoadingMoreLinkedAccounts={isFetchingNextLinkedAccounts}
          totalLinkedAccounts={totalLinkedAccounts}
        />
      </FlowContainer>
    </>
  );
}
