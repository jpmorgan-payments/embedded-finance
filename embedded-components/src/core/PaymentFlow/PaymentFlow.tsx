'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { cn } from '@/lib/utils';
import { ErrorType } from '@/api/axios-instance';
import {
  getGetAccountBalanceQueryOptions,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import { useGetAllRecipientsInfinite } from '@/api/generated/ep-recipients';
import {
  RecipientType as ApiRecipientType,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { useCreateTransactionV2 } from '@/api/generated/ep-transactions';
import type {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { useRecipientForm } from '../RecipientWidgets/hooks';
import { RadioIndicator } from './components/RadioIndicator';
import { FlowContainer, FlowView, useFlowContext } from './FlowContainer';
import {
  BankAccountFormWrapper,
  EnablePaymentMethodWrapper,
  PayeeTypeSelector,
} from './forms';
import { PayeeSelector } from './PayeeSelector';
import { DEFAULT_PAYMENT_METHODS, PANEL_IDS } from './PaymentFlow.constants';
import type {
  AccountResponse,
  Payee,
  PaymentFlowInlineProps,
  PaymentFlowProps,
  PaymentMethod,
  PaymentMethodType,
  UnsavedRecipient,
} from './PaymentFlow.types';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { ReviewPanel } from './ReviewPanel';

/**
 * Error context item from API response
 */
interface ErrorContextItem {
  code?: string;
  location?: string;
  field?: string;
  message?: string;
}

/**
 * Maps API error context codes to user-friendly messages
 */
function getErrorMessageFromContext(
  context: ErrorContextItem[]
): { title: string; message: string } | null {
  if (!context || context.length === 0) return null;

  // Look for specific error codes and provide user-friendly messages
  for (const item of context) {
    const { code, field: rawField, message: errorMessage } = item;
    const field = rawField?.toLowerCase();

    // 10104 on recipientId with routing number message → Payment method not enabled for recipient
    if (
      code === '10104' &&
      field === 'recipientid' &&
      errorMessage?.toLowerCase().includes('routing number')
    ) {
      return {
        title: 'Payment Method Not Enabled',
        message:
          errorMessage ||
          'The selected payment method is not configured for this recipient. Please enable the payment method for this recipient or choose a different payment method.',
      };
    }

    // Currency/payment method not supported (code 10104 from API)
    if (
      code === '10104' ||
      field === 'targetcurrency' ||
      field === 'currency'
    ) {
      return {
        title: 'Payment Method Not Supported',
        message:
          errorMessage ||
          'The selected payment method is not available for this account. Please select a different payment method or use a different account.',
      };
    }

    // Recipient validation issues
    if (field === 'recipientid' || field === 'recipient') {
      return {
        title: 'Recipient Error',
        message:
          errorMessage ||
          'There was a problem with the selected recipient. Please verify the recipient details or select a different recipient.',
      };
    }
  }

  // If we have context but no specific mapping, show the first message
  const firstMessage = context.find((c) => c.message)?.message;
  if (firstMessage) {
    return {
      title: 'Payment Error',
      message: firstMessage,
    };
  }

  return null;
}

/**
 * Parse a transaction error into a user-friendly title and message
 */
function parseTransactionError(
  error: ErrorType<ApiErrorV2> | null | undefined
): { title: string; message: string } | null {
  if (!error) return null;

  const errorData = error.response?.data;
  const httpStatus = errorData?.httpStatus ?? error.status ?? 500;

  // Try to get a specific error message from context
  const contextError = getErrorMessageFromContext(
    (errorData as { context?: ErrorContextItem[] })?.context ?? []
  );

  if (contextError) return contextError;

  // Default messages by HTTP status
  switch (httpStatus) {
    case 400:
      return {
        title: 'Invalid Request',
        message: 'Please check the payment details and try again.',
      };
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in and try again.',
      };
    case 403:
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to make this payment.',
      };
    case 404:
      return {
        title: 'Not Found',
        message: 'The account or recipient was not found.',
      };
    case 422:
      return {
        title: 'Validation Error',
        message: 'The payment details are invalid. Please check and try again.',
      };
    case 503:
      return {
        title: 'Service Unavailable',
        message:
          'The service is currently unavailable. Please try again later.',
      };
    default:
      return {
        title: 'Payment Failed',
        message: 'An unexpected error occurred. Please try again later.',
      };
  }
}

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
  isLoading?: boolean;
  /** Show error state on this section */
  hasError?: boolean;
  /** Disable section interactions (e.g., while form is submitting) */
  disabled?: boolean;
  /** Ref to the section container for scrolling */
  sectionRef?: React.RefObject<HTMLDivElement>;
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
  isLoading = false,
  hasError = false,
  disabled = false,
  sectionRef,
}: StepSectionProps) {
  const isDisabled = !!disabledReason || disabled;
  // Can click to expand if not active, not disabled, and not loading
  // Can click to collapse if active (and not loading)
  const canClick = isLoading ? false : isActive || !isDisabled;

  // Ref to set inert attribute imperatively (React doesn't handle it well as a prop)
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (contentRef.current) {
      if (!isActive) {
        contentRef.current.setAttribute('inert', '');
      } else {
        contentRef.current.removeAttribute('inert');
      }
    }
  }, [isActive]);

  const handleClick = () => {
    if (isLoading) {
      return; // Don't allow any clicks while loading
    }
    if (isActive && onCollapse) {
      onCollapse();
    } else if (!isActive && !isDisabled && onHeaderClick) {
      onHeaderClick();
    }
  };

  // Determine the action label and chevron direction
  const getActionLabel = (): {
    text: string;
    chevron: 'up' | 'down' | null;
  } => {
    if (isActive) {
      return { text: 'Cancel', chevron: 'up' };
    }
    if (isLoading) {
      return { text: 'Loading...', chevron: null };
    }
    // When disabled, show the disabled reason (no chevron since not clickable)
    if (isDisabled) {
      return { text: disabledReason ?? '', chevron: null };
    }
    // Clickable states - show down chevron
    if (isComplete) {
      return { text: 'Change', chevron: 'down' };
    }
    return { text: 'Select', chevron: 'down' };
  };

  const actionLabel = getActionLabel();

  return (
    <div ref={sectionRef} className="eb-relative">
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
            isLoading &&
              'eb-border-2 eb-border-primary/50 eb-bg-background eb-text-primary',
            // Error state takes precedence over other states (except loading)
            hasError &&
              !isLoading &&
              'eb-border-2 eb-border-destructive eb-bg-destructive/10 eb-text-destructive',
            isComplete &&
              !isLoading &&
              !hasError &&
              'eb-bg-primary eb-text-primary-foreground',
            isActive &&
              !isComplete &&
              !isLoading &&
              !hasError &&
              'eb-border-2 eb-border-primary eb-bg-background eb-text-primary',
            !isComplete &&
              !isLoading &&
              !isActive &&
              !hasError &&
              'eb-border-2 eb-border-muted-foreground/30 eb-bg-background eb-text-muted-foreground'
          )}
        >
          {isLoading ? (
            <Loader2 className="eb-h-4 eb-w-4 eb-animate-spin" />
          ) : isComplete && !hasError ? (
            <Check className="eb-h-4 eb-w-4" strokeWidth={3} />
          ) : hasError ? (
            <AlertCircle className="eb-h-4 eb-w-4" />
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
                hasError && 'eb-text-destructive',
                isActive && !hasError && 'eb-text-foreground',
                isComplete && !isActive && !hasError && 'eb-text-foreground',
                !isComplete &&
                  !isActive &&
                  !hasError &&
                  'eb-text-muted-foreground'
              )}
            >
              {title}
            </span>
            {hasError && !isActive && (
              <span className="eb-text-xs eb-font-medium eb-text-destructive">
                (Required)
              </span>
            )}
            {isComplete && !isActive && !hasError && summary && (
              <span className="eb-text-sm eb-text-muted-foreground">
                — {summary}
              </span>
            )}
          </div>

          {/* Action label */}
          <span
            className={cn(
              'eb-flex eb-items-center eb-gap-0.5 eb-text-xs eb-font-medium',
              // When disabled, always use muted styling
              (isDisabled || isLoading) && 'eb-text-muted-foreground/60',
              // Active (expanded) state
              isActive && 'eb-text-muted-foreground',
              // Clickable states - use primary color
              !isActive && !isDisabled && !isLoading && 'eb-text-primary'
            )}
          >
            {actionLabel.text}
            {actionLabel.chevron === 'down' && (
              <ChevronDown className="eb-h-3.5 eb-w-3.5" />
            )}
            {actionLabel.chevron === 'up' && (
              <ChevronUp className="eb-h-3.5 eb-w-3.5" />
            )}
          </span>
        </div>
      </button>

      {/* Content with animation */}
      <div
        ref={contentRef}
        className={cn(
          'eb-ml-11 eb-overflow-hidden eb-transition-all eb-duration-300 eb-ease-in-out',
          isActive
            ? 'eb-max-h-[1000px] eb-opacity-100'
            : 'eb-max-h-0 eb-opacity-0'
        )}
        aria-hidden={!isActive}
      >
        <div className="eb-pt-1">{children}</div>
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
  isPayeesLoading?: boolean;
  onPayeeSelect: (payee: Payee) => void;
  onAddNewPayee: () => void;
  onAddRecipient?: () => void;
  onLinkAccount?: () => void;
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
  // Error states for payee fetching
  recipientsError?: boolean;
  linkedAccountsError?: boolean;
  onRetryRecipients?: () => void;
  onRetryLinkedAccounts?: () => void;
  // Account count after applying payee restrictions (for skipping account step)
  validAccountCount?: number;
  // Edit unsaved recipient handler
  onEditUnsavedRecipient?: () => void;
  // Clear unsaved recipient handler (to choose a different recipient)
  onClearUnsavedRecipient?: () => void;
  // Save unsaved recipient handler (to save it permanently)
  onSaveUnsavedRecipient?: () => void;
  // Loading state for saving unsaved recipient
  isSavingUnsavedRecipient?: boolean;
  // Error from saving unsaved recipient (for non-400 errors shown inline)
  saveUnsavedRecipientError?: Error | null;
}

function MainTransferView({
  payees,
  linkedAccounts,
  accounts,
  paymentMethods,
  isLoading,
  isPayeesLoading = false,
  onPayeeSelect,
  onAddNewPayee,
  onAddRecipient,
  onLinkAccount,
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
  recipientsError,
  linkedAccountsError,
  onRetryRecipients,
  onRetryLinkedAccounts,
  validAccountCount,
  onEditUnsavedRecipient,
  onClearUnsavedRecipient,
  onSaveUnsavedRecipient,
  isSavingUnsavedRecipient = false,
  saveUnsavedRecipientError,
}: MainTransferViewProps) {
  const {
    formData,
    setFormData,
    validationErrors,
    setValidationErrors,
    isSubmitting,
  } = useFlowContext();
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

  // Map validation error field names to panel IDs
  const fieldToPanelId: Record<string, string> = useMemo(
    () => ({
      fromAccount: PANEL_IDS.FROM_ACCOUNT,
      payee: PANEL_IDS.PAYEE,
      paymentMethod: PANEL_IDS.PAYMENT_METHOD,
      amount: PANEL_IDS.AMOUNT,
      exceedsBalance: PANEL_IDS.AMOUNT,
    }),
    []
  );

  // Check if a panel has a validation error
  const hasPanelError = useCallback(
    (panelId: string) => {
      return validationErrors.some(
        (error) => fieldToPanelId[error] === panelId
      );
    },
    [validationErrors, fieldToPanelId]
  );

  // Compute the initial active step based on current form data
  // This prevents the "flash" of seeing the FROM_ACCOUNT section animate when data is already selected
  const getInitialActiveStep = useCallback(() => {
    // If account is already selected (from initialData or auto-selection), skip to next step
    if (formData.fromAccountId) {
      if (!formData.payeeId && !formData.unsavedRecipient)
        return PANEL_IDS.PAYEE;
      if (!formData.paymentMethod) return PANEL_IDS.PAYMENT_METHOD;
      return ''; // All steps complete
    }
    // If only one account exists, it will be auto-selected, so start at PAYEE
    // Also check validAccountCount for cases where payee restrictions reduce valid accounts to 1
    if (accounts.length === 1 || validAccountCount === 1) {
      if (!formData.payeeId && !formData.unsavedRecipient)
        return PANEL_IDS.PAYEE;
      if (!formData.paymentMethod) return PANEL_IDS.PAYMENT_METHOD;
      return '';
    }
    return PANEL_IDS.FROM_ACCOUNT;
  }, [
    formData.fromAccountId,
    formData.payeeId,
    formData.unsavedRecipient,
    formData.paymentMethod,
    accounts.length,
    validAccountCount,
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
      const hasRecipient = formData.payeeId || formData.unsavedRecipient;
      const nextStep = !hasRecipient
        ? PANEL_IDS.PAYEE
        : !formData.paymentMethod
          ? PANEL_IDS.PAYMENT_METHOD
          : '';
      setActiveStep(nextStep);
    }
    prevFromAccountId.current = formData.fromAccountId;
  }, [
    formData.fromAccountId,
    formData.payeeId,
    formData.unsavedRecipient,
    formData.paymentMethod,
  ]);

  // Track if payee was just cleared due to account restriction
  const [showPayeeClearedWarning, setShowPayeeClearedWarning] = useState(false);

  // Track if account was cleared due to conflict with loaded payee
  const [showAccountClearedWarning, setShowAccountClearedWarning] =
    useState(false);

  // Ref for amount input to focus on validation error
  const amountInputRef = React.useRef<HTMLInputElement>(null);

  // Refs for each section to scroll on validation error
  const fromAccountSectionRef = React.useRef<HTMLDivElement>(null);
  const payeeSectionRef = React.useRef<HTMLDivElement>(null);
  const paymentMethodSectionRef = React.useRef<HTMLDivElement>(null);
  const amountSectionRef = React.useRef<HTMLDivElement>(null);

  // Map panel IDs to their refs for easy lookup (memoized for stable reference)
  const sectionRefs = React.useMemo<
    Record<string, React.RefObject<HTMLDivElement>>
  >(
    () => ({
      [PANEL_IDS.FROM_ACCOUNT]: fromAccountSectionRef,
      [PANEL_IDS.PAYEE]: payeeSectionRef,
      [PANEL_IDS.PAYMENT_METHOD]: paymentMethodSectionRef,
      [PANEL_IDS.AMOUNT]: amountSectionRef,
    }),
    []
  );

  // Track previous validation errors count to detect when errors are first shown
  const prevValidationErrorsCountRef = React.useRef(0);

  // When validation errors are FIRST SET (transition from 0 to >0), expand the first
  // section that has an error and scroll to it. This should only run once when errors
  // appear, not when the user navigates between sections.
  useEffect(() => {
    const wasEmpty = prevValidationErrorsCountRef.current === 0;
    const hasErrors = validationErrors.length > 0;

    // Only expand/scroll when errors first appear (not on every re-render)
    if (wasEmpty && hasErrors) {
      // Find the first panel with an error (in form order)
      const panelOrder = [
        PANEL_IDS.FROM_ACCOUNT,
        PANEL_IDS.PAYEE,
        PANEL_IDS.PAYMENT_METHOD,
        PANEL_IDS.AMOUNT,
      ];

      for (const panelId of panelOrder) {
        if (hasPanelError(panelId)) {
          setActiveStep(panelId);

          // Scroll to the section with the error
          const sectionRef = sectionRefs[panelId];

          // If amount is the first error field, focus the input
          if (panelId === PANEL_IDS.AMOUNT) {
            // Delay focus to ensure input is visible after expand animation
            setTimeout(() => {
              amountInputRef.current?.focus();
              amountInputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }, 100);
          } else {
            // For other sections, scroll to the section header
            setTimeout(() => {
              sectionRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }, 100);
          }
          break;
        }
      }
    }

    // Update ref after effect runs
    prevValidationErrorsCountRef.current = validationErrors.length;
  }, [validationErrors, hasPanelError, sectionRefs]);

  // Clear specific field errors when that field changes (react-hook-form pattern)
  const prevFormDataRef = React.useRef(formData);
  useEffect(() => {
    const prev = prevFormDataRef.current;

    if (validationErrors.length > 0) {
      const errorsToRemove: string[] = [];

      // Check each field and mark its error for removal if value changed
      if (prev.fromAccountId !== formData.fromAccountId) {
        errorsToRemove.push('fromAccount');
      }
      if (prev.payeeId !== formData.payeeId) {
        errorsToRemove.push('payee');
      }
      if (prev.paymentMethod !== formData.paymentMethod) {
        errorsToRemove.push('paymentMethod');
      }
      if (prev.amount !== formData.amount) {
        errorsToRemove.push('amount', 'exceedsBalance');
      }

      // Only update if there are errors to remove
      if (errorsToRemove.length > 0) {
        const remainingErrors = validationErrors.filter(
          (error) => !errorsToRemove.includes(error)
        );
        // Only dispatch if errors actually changed
        if (remainingErrors.length !== validationErrors.length) {
          setValidationErrors(remainingErrors);
        }
      }
    }

    prevFormDataRef.current = formData;
  }, [formData, validationErrors, setValidationErrors]);

  const selectedPayee = useMemo(() => {
    // If there's an unsaved recipient (one-time payment), create a virtual payee for display
    if (formData.unsavedRecipient) {
      return {
        id: 'unsaved-recipient',
        type: 'RECIPIENT' as const,
        name: formData.unsavedRecipient.displayName,
        accountNumber: formData.unsavedRecipient.accountNumber,
        routingNumber: formData.unsavedRecipient.routingNumber,
        bankName: formData.unsavedRecipient.bankName,
        enabledPaymentMethods: formData.unsavedRecipient.enabledPaymentMethods,
        recipientType: formData.unsavedRecipient.recipientType,
      };
    }
    // Otherwise, find the saved payee from the lists
    return [...payees, ...linkedAccounts].find(
      (p) => p.id === formData.payeeId
    );
  }, [payees, linkedAccounts, formData.payeeId, formData.unsavedRecipient]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );

  // Detect conflict: LIMITED_DDA account selected but loaded payee is RECIPIENT
  // This can happen when user selects account while initial payee is still loading
  useEffect(() => {
    if (
      selectedAccount?.category === 'LIMITED_DDA' &&
      selectedPayee?.type === 'RECIPIENT'
    ) {
      // Clear the account selection since the payee was pre-selected (intentional)
      setFormData({ fromAccountId: undefined, availableBalance: undefined });
      setShowAccountClearedWarning(true);
      // Navigate to account step so user can select a different account
      setActiveStep(PANEL_IDS.FROM_ACCOUNT);
    }
  }, [selectedPayee?.type, selectedAccount?.category, setFormData]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === formData.paymentMethod),
    [paymentMethods, formData.paymentMethod]
  );

  // Account restrictions
  // LIMITED_DDA accounts can only pay to linked accounts, not regular recipients
  const isLimitedDDA = selectedAccount?.category === 'LIMITED_DDA';

  const hasPayee = !!formData.payeeId || !!formData.unsavedRecipient;
  const hasPaymentMethod = !!formData.paymentMethod;
  const hasAccount = !!formData.fromAccountId;

  // Helper to check if an account is restricted based on the selected payee
  const getAccountRestriction = useCallback(
    (account: AccountResponse): string | undefined => {
      // If payee is a RECIPIENT (external), LIMITED_DDA accounts cannot be used
      if (
        selectedPayee?.type === 'RECIPIENT' &&
        account.category === 'LIMITED_DDA'
      ) {
        return 'Not available for external recipients';
      }
      return undefined;
    },
    [selectedPayee?.type]
  );

  // Balance validation - only validate when balance is loaded and not errored
  const amount = parseFloat(formData.amount) || 0;
  const isBalanceLoading = selectedAccount?.balance?.isLoading ?? false;
  const hasBalanceError = selectedAccount?.balance?.hasError ?? false;
  const availableBalance = selectedAccount?.balance?.available;
  // Only show exceeds balance error when balance is known (not loading, not errored)
  const exceedsBalance =
    !isBalanceLoading &&
    !hasBalanceError &&
    availableBalance !== undefined &&
    amount > 0 &&
    amount > availableBalance;

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
      // Check if the account is restricted before selecting
      const account = accounts.find((a) => a.id === accountId);
      if (account && getAccountRestriction(account)) {
        // Don't allow selection of restricted accounts
        return;
      }

      onAccountSelect(accountId);
      // Clear any account warning when user makes a new selection
      setShowAccountClearedWarning(false);

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
      getAccountRestriction,
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
        hasError={hasPanelError(PANEL_IDS.FROM_ACCOUNT)}
        summary={
          selectedAccount
            ? `${selectedAccount.label ?? getCategoryLabel(selectedAccount.category)} (...${selectedAccount.paymentRoutingInformation?.accountNumber?.slice(-4) ?? ''})`
            : undefined
        }
        onHeaderClick={() => setActiveStep(PANEL_IDS.FROM_ACCOUNT)}
        onCollapse={handleCollapse}
        disabled={isSubmitting}
        sectionRef={fromAccountSectionRef}
      >
        {/* Warning banner when account was cleared due to payee conflict */}
        {showAccountClearedWarning && (
          <div
            role="alert"
            className="eb-mb-3 eb-flex eb-items-start eb-gap-2 eb-rounded-md eb-border eb-border-amber-200 eb-bg-amber-50 eb-p-3 eb-text-sm"
          >
            <AlertCircle
              className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-amber-600"
              aria-hidden="true"
            />
            <div className="eb-text-amber-800">
              <span className="eb-font-medium">Account unavailable.</span> The
              selected account cannot send payments to external recipients.
              Please select a different account.
            </div>
          </div>
        )}
        <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
          {accounts.map((account, index) => {
            const lastFour =
              account.paymentRoutingInformation?.accountNumber?.slice(-4) ?? '';
            const displayName =
              account.label ?? getCategoryLabel(account.category);
            const isSelected = formData.fromAccountId === account.id;
            const isPendingClose = account.state === 'PENDING_CLOSE';
            const accountRestriction = getAccountRestriction(account);
            const isDisabled = !!accountRestriction;

            return (
              <React.Fragment key={account.id}>
                {index > 0 && <div className="eb-border-t eb-border-border" />}
                <button
                  type="button"
                  onClick={() => handleAccountSelect(account.id!)}
                  disabled={isDisabled}
                  className={cn(
                    'eb-flex eb-w-full eb-items-center eb-justify-between eb-px-3 eb-py-3 eb-text-left eb-text-sm eb-transition-colors',
                    isDisabled && 'eb-cursor-not-allowed eb-opacity-50',
                    isSelected && !isDisabled && 'eb-bg-primary/5',
                    !isSelected && !isDisabled && 'hover:eb-bg-muted/50'
                  )}
                >
                  <div className="eb-flex eb-items-center eb-gap-3">
                    <RadioIndicator
                      isSelected={isSelected}
                      disabled={isDisabled}
                    />
                    <div>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <span className="eb-font-medium">{displayName}</span>
                        {lastFour && (
                          <span className="eb-text-muted-foreground">
                            (...{lastFour})
                          </span>
                        )}
                        {isPendingClose && (
                          <span className="eb-rounded eb-bg-muted eb-px-1.5 eb-py-0.5 eb-text-xs eb-text-muted-foreground">
                            Pending Close
                          </span>
                        )}
                      </div>
                      {accountRestriction ? (
                        <div className="eb-space-y-0.5">
                          {account.category && (
                            <div className="eb-text-xs eb-text-muted-foreground">
                              {getCategoryLabel(account.category)}
                            </div>
                          )}
                          <div className="eb-text-xs eb-text-destructive">
                            {accountRestriction}
                          </div>
                        </div>
                      ) : (
                        account.category && (
                          <div className="eb-text-xs eb-text-muted-foreground">
                            {getCategoryLabel(account.category)}
                            {account.category === 'LIMITED_DDA' && (
                              <span className="eb-ml-1 eb-text-muted-foreground/70">
                                · Linked accounts only
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="eb-text-right">
                    {account.balance?.isLoading ? (
                      <>
                        <Skeleton className="eb-ml-auto eb-h-4 eb-w-20" />
                        <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                          Loading...
                        </div>
                      </>
                    ) : account.balance?.hasError ? (
                      <>
                        <div className="eb-font-medium eb-text-muted-foreground">
                          --
                        </div>
                        <div className="eb-text-xs eb-text-destructive">
                          Unavailable
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="eb-font-medium">
                          ${account.balance?.available?.toLocaleString() ?? '0'}
                        </div>
                        <div className="eb-text-xs eb-text-muted-foreground">
                          Available
                        </div>
                      </>
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
        isComplete={hasPayee && !!selectedPayee}
        isActive={activeStep === PANEL_IDS.PAYEE}
        hasError={hasPanelError(PANEL_IDS.PAYEE)}
        isLoading={hasPayee && isPayeesLoading && !selectedPayee}
        summary={
          selectedPayee
            ? `${selectedPayee.name} (...${selectedPayee.accountNumber?.slice(-4) ?? ''})`
            : undefined
        }
        onHeaderClick={() => setActiveStep(PANEL_IDS.PAYEE)}
        onCollapse={handleCollapse}
        disabledReason={
          !hasAccount && !selectedPayee ? 'Select account first' : undefined
        }
        disabled={isSubmitting}
        sectionRef={payeeSectionRef}
      >
        {/* Show unsaved recipient management UI when one is selected */}
        {formData.unsavedRecipient ? (
          <div className="eb-space-y-3">
            {/* Unsaved recipient info card */}
            <div className="eb-rounded-lg eb-border eb-bg-card eb-p-4">
              <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
                <div className="eb-flex eb-items-center eb-gap-3">
                  <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
                    <User className="eb-h-5 eb-w-5 eb-text-primary" />
                  </div>
                  <div>
                    <div className="eb-font-medium">
                      {formData.unsavedRecipient.displayName}
                    </div>
                    <div className="eb-text-sm eb-text-muted-foreground">
                      Account ending in ...
                      {formData.unsavedRecipient.accountNumber.slice(-4)}
                    </div>
                    <div className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                      One-time recipient (not saved)
                    </div>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="eb-mt-4 eb-flex eb-flex-col eb-gap-2">
                {/* Show inline error for non-400 errors */}
                {saveUnsavedRecipientError && (
                  <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-md eb-bg-destructive/10 eb-px-3 eb-py-2 eb-text-sm eb-text-destructive">
                    <AlertCircle className="eb-h-4 eb-w-4 eb-flex-shrink-0" />
                    <span>
                      {(saveUnsavedRecipientError as any)?.message ||
                        'Failed to save recipient. Please try again.'}
                    </span>
                  </div>
                )}
                <div className="eb-flex eb-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEditUnsavedRecipient}
                    className="eb-gap-1.5"
                    disabled={isSavingUnsavedRecipient}
                  >
                    <Pencil className="eb-h-3.5 eb-w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSaveUnsavedRecipient}
                    disabled={isSavingUnsavedRecipient}
                    className="eb-gap-1.5"
                  >
                    {isSavingUnsavedRecipient ? (
                      <Loader2 className="eb-h-3.5 eb-w-3.5 eb-animate-spin" />
                    ) : (
                      <Save className="eb-h-3.5 eb-w-3.5" />
                    )}
                    {isSavingUnsavedRecipient ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
            {/* Choose different recipient link - outside the card */}
            <button
              type="button"
              onClick={onClearUnsavedRecipient}
              className="eb-text-sm eb-text-primary hover:eb-underline"
            >
              Choose a different recipient
            </button>
          </div>
        ) : (
          <PayeeSelector
            selectedPayeeId={formData.payeeId}
            onSelect={handlePayeeSelect}
            onAddNew={onAddNewPayee}
            onAddRecipient={onAddRecipient}
            onLinkAccount={onLinkAccount}
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
            recipientsError={recipientsError}
            linkedAccountsError={linkedAccountsError}
            onRetryRecipients={onRetryRecipients}
            onRetryLinkedAccounts={onRetryLinkedAccounts}
          />
        )}
      </StepSection>

      {/* PAYMENT METHOD Section - Now third/last */}
      <StepSection
        stepNumber={3}
        title="Payment Method"
        isComplete={hasPaymentMethod}
        isActive={activeStep === PANEL_IDS.PAYMENT_METHOD}
        hasError={hasPanelError(PANEL_IDS.PAYMENT_METHOD)}
        summary={selectedMethod?.name}
        onHeaderClick={() => setActiveStep(PANEL_IDS.PAYMENT_METHOD)}
        onCollapse={handleCollapse}
        disabledReason={!hasPayee ? 'Select payee first' : undefined}
        isLast
        disabled={isSubmitting}
        sectionRef={paymentMethodSectionRef}
      >
        {/* Show loading message when we have a payee ID but haven't loaded the payee yet */}
        {hasPayee && isPayeesLoading && !selectedPayee ? (
          <div className="eb-flex eb-items-center eb-gap-2 eb-py-3 eb-text-sm eb-text-muted-foreground">
            <Loader2 className="eb-h-4 eb-w-4 eb-animate-spin" />
            <span>
              Loading recipient details to show available payment methods...
            </span>
          </div>
        ) : (
          <PaymentMethodSelector
            payee={selectedPayee}
            selectedMethod={formData.paymentMethod}
            availableMethods={paymentMethods}
            onSelect={handlePaymentMethodSelect}
            onEnableMethod={onEnablePaymentMethod}
            disabled={!hasPayee}
          />
        )}
      </StepSection>

      <Separator className="!eb-my-4" />

      {/* AMOUNT & MEMO Section - Always visible */}
      <div ref={amountSectionRef} className="eb-space-y-4">
        <div>
          <label
            htmlFor="amount"
            className={cn(
              'eb-mb-1.5 eb-block eb-text-sm eb-font-medium',
              hasPanelError(PANEL_IDS.AMOUNT) && 'eb-text-destructive'
            )}
          >
            Amount
            {hasPanelError(PANEL_IDS.AMOUNT) && (
              <span className="eb-ml-1 eb-text-xs eb-font-normal">
                (Required)
              </span>
            )}
          </label>
          <div className="eb-relative eb-flex eb-items-center">
            <span
              className={cn(
                'eb-absolute eb-left-3',
                exceedsBalance || hasPanelError(PANEL_IDS.AMOUNT)
                  ? 'eb-text-destructive'
                  : 'eb-text-muted-foreground'
              )}
            >
              $
            </span>
            <Input
              ref={amountInputRef}
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
                (exceedsBalance || hasPanelError(PANEL_IDS.AMOUNT)) &&
                  'eb-border-destructive eb-text-destructive focus-visible:eb-ring-destructive'
              )}
              autoComplete="off"
              disabled={isSubmitting}
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
            disabled={isSubmitting}
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
 * LoadingStateView component
 * Shows a skeleton loading state while accounts are being fetched
 * Mirrors the actual StepSection layout for a seamless transition
 */
function LoadingStateView() {
  return (
    <div className="eb-space-y-1">
      {/* Step 1: From Account - Skeleton */}
      <div className="eb-relative">
        {/* Connecting line - lighter than actual to indicate loading */}
        <div className="eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-px eb-bg-border/50" />

        {/* Step header */}
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          {/* Step indicator circle */}
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          {/* Title and action */}
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-12" />
            <Skeleton className="eb-h-4 eb-w-14" />
          </div>
        </div>

        {/* Expanded content - account list skeleton */}
        <div className="eb-ml-11 eb-pb-4 eb-pt-1">
          <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
            {/* Account row 1 */}
            <div className="eb-flex eb-w-full eb-items-center eb-justify-between eb-p-3">
              <div className="eb-space-y-1.5">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <Skeleton className="eb-h-4 eb-w-28" />
                  <Skeleton className="eb-h-4 eb-w-16" />
                </div>
                <Skeleton className="eb-h-3 eb-w-20" />
              </div>
              <div className="eb-space-y-1 eb-text-right">
                <Skeleton className="eb-ml-auto eb-h-4 eb-w-20" />
                <Skeleton className="eb-ml-auto eb-h-3 eb-w-14" />
              </div>
            </div>
            {/* Account row 2 */}
            <div className="eb-border-t eb-border-border" />
            <div className="eb-flex eb-w-full eb-items-center eb-justify-between eb-p-3">
              <div className="eb-space-y-1.5">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <Skeleton className="eb-h-4 eb-w-24" />
                  <Skeleton className="eb-h-4 eb-w-16" />
                </div>
                <Skeleton className="eb-h-3 eb-w-16" />
              </div>
              <div className="eb-space-y-1 eb-text-right">
                <Skeleton className="eb-ml-auto eb-h-4 eb-w-24" />
                <Skeleton className="eb-ml-auto eb-h-3 eb-w-14" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: To Payee - Skeleton (collapsed) */}
      <div className="eb-relative">
        {/* Connecting line */}
        <div className="eb-absolute eb-left-[15px] eb-top-[40px] eb-h-[calc(100%-28px)] eb-w-px eb-bg-border/50" />

        {/* Step header */}
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-8" />
            <Skeleton className="eb-h-4 eb-w-28 eb-opacity-50" />
          </div>
        </div>
      </div>

      {/* Step 3: Payment Method - Skeleton (collapsed) */}
      <div className="eb-relative">
        {/* Step header */}
        <div className="eb-relative eb-flex eb-w-full eb-items-center eb-gap-3 eb-py-2">
          <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0 eb-rounded-full" />
          <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between">
            <Skeleton className="eb-h-5 eb-w-28" />
            <Skeleton className="eb-h-4 eb-w-24 eb-opacity-50" />
          </div>
        </div>
      </div>

      {/* Separator */}
      <Separator className="!eb-my-4" />

      {/* Amount section skeleton */}
      <div className="eb-space-y-4">
        <div>
          <Skeleton className="eb-mb-1.5 eb-h-4 eb-w-14" />
          <Skeleton className="eb-h-10 eb-w-full eb-rounded-md" />
        </div>

        {/* Memo section skeleton */}
        <div>
          <div className="eb-mb-1.5 eb-flex eb-items-center eb-justify-between">
            <Skeleton className="eb-h-4 eb-w-20" />
            <Skeleton className="eb-h-3 eb-w-16" />
          </div>
          <Skeleton className="eb-h-20 eb-w-full eb-rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * EmptyAccountsView component
 * Shows when accounts fetch succeeded but no accounts are available
 */
interface EmptyAccountsViewProps {
  title: string;
  message: string;
  onClose?: () => void;
}

function EmptyAccountsView({
  title,
  message,
  onClose,
}: EmptyAccountsViewProps) {
  return (
    <div className="eb-flex eb-h-full eb-flex-col eb-items-center eb-justify-center eb-pb-[15%] eb-text-center">
      {/* Empty Icon */}
      <div className="eb-mb-4 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
        <AlertCircle className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
      </div>

      {/* Message */}
      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        {title}
      </h2>
      <p className="eb-mb-6 eb-max-w-sm eb-text-muted-foreground">{message}</p>

      {/* Close Button */}
      {onClose && (
        <Button
          onClick={onClose}
          variant="outline"
          className="eb-min-w-[140px]"
        >
          Close
        </Button>
      )}
    </div>
  );
}

/**
 * FatalErrorView component
 * Shows a full-screen error when critical data (accounts) fails to load
 */
interface FatalErrorViewProps {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

function FatalErrorView({
  title,
  message,
  onRetry,
  isRetrying = false,
}: FatalErrorViewProps) {
  return (
    <div className="eb-flex eb-h-full eb-flex-col eb-items-center eb-justify-center eb-pb-[15%] eb-text-center">
      {/* Error Icon */}
      <div className="eb-mb-4 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
        <AlertCircle className="eb-h-8 eb-w-8 eb-text-destructive" />
      </div>

      {/* Error Message */}
      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        {title}
      </h2>
      <p className="eb-mb-6 eb-max-w-sm eb-text-muted-foreground">{message}</p>

      {/* Retry Button */}
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="outline"
        className="eb-min-w-[140px]"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4" />
            Try Again
          </>
        )}
      </Button>
    </div>
  );
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
    paymentMethod?: string;
    memo?: string;
    unsavedRecipient?: UnsavedRecipient;
  };
  payees: Payee[];
  accounts: AccountResponse[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onMakeAnotherPayment?: () => void;
}

function SuccessView({
  transactionResponse,
  formData,
  payees,
  accounts,
  paymentMethods,
  onClose,
  onMakeAnotherPayment,
}: SuccessViewProps) {
  const { replaceView, setFormData } = useFlowContext();
  const [copied, setCopied] = useState(false);

  const handleMakeAnotherPayment = useCallback(() => {
    // Clear form data (keep only currency)
    setFormData({
      payeeId: undefined,
      payee: undefined,
      unsavedRecipient: undefined,
      fromAccountId: undefined,
      availableBalance: undefined,
      paymentMethod: undefined,
      amount: '',
      memo: undefined,
    });
    // Navigate back to main view
    replaceView('main');
    // Notify parent to clear transaction response
    onMakeAnotherPayment?.();
  }, [setFormData, replaceView, onMakeAnotherPayment]);

  const amount = parseFloat(formData.amount) || 0;
  const payee = payees.find((p) => p.id === formData.payeeId);
  const { unsavedRecipient } = formData;
  const account = accounts.find((a) => a.id === formData.fromAccountId);
  const selectedMethod = paymentMethods.find(
    (m) => m.id === formData.paymentMethod
  );
  const transactionId =
    transactionResponse?.id ?? transactionResponse?.transactionReferenceId;

  // Get recipient display info - works for both saved payees and unsaved recipients
  const recipientInfo = useMemo(() => {
    if (payee) {
      const typeLabel =
        payee.type === 'LINKED_ACCOUNT'
          ? payee.recipientType === 'BUSINESS'
            ? 'Linked business account'
            : 'Linked individual account'
          : payee.recipientType === 'BUSINESS'
            ? 'Business recipient'
            : 'Individual recipient';
      return {
        name: payee.name,
        lastFour: payee.accountNumber?.slice(-4),
        typeLabel,
      };
    }
    if (unsavedRecipient) {
      const typeLabel =
        unsavedRecipient.recipientType === 'BUSINESS'
          ? 'Business recipient (one-time)'
          : 'Individual recipient (one-time)';
      return {
        name: unsavedRecipient.displayName,
        lastFour: unsavedRecipient.accountNumber?.slice(-4),
        typeLabel,
      };
    }
    return null;
  }, [payee, unsavedRecipient]);

  const handleCopyId = useCallback(() => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [transactionId]);

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center">
      {/* Success Icon with animation */}
      <div className="eb-mb-6 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-green-600 eb-duration-300 eb-animate-in eb-zoom-in-50">
        <Check className="eb-h-8 eb-w-8 eb-text-white" strokeWidth={3} />
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
        {recipientInfo && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">To</span>
            <div className="eb-text-right">
              <div className="eb-text-sm eb-font-medium">
                {recipientInfo.name}
                {recipientInfo.lastFour && (
                  <span className="eb-font-normal eb-text-muted-foreground">
                    {' '}
                    (...{recipientInfo.lastFour})
                  </span>
                )}
              </div>
              <div className="eb-text-xs eb-text-muted-foreground">
                {recipientInfo.typeLabel}
              </div>
            </div>
          </div>
        )}
        {account && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">From</span>
            <span className="eb-text-sm eb-font-medium">
              {account.label ?? 'Account'}
              {account.paymentRoutingInformation?.accountNumber && (
                <span className="eb-font-normal eb-text-muted-foreground">
                  {' '}
                  (...
                  {account.paymentRoutingInformation.accountNumber.slice(-4)})
                </span>
              )}
            </span>
          </div>
        )}
        {selectedMethod && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">Method</span>
            <span className="eb-text-sm eb-font-medium">
              {selectedMethod.name}
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

      {/* Action Buttons */}
      <div className="eb-mt-6 eb-flex eb-w-full eb-max-w-sm eb-flex-col eb-gap-2">
        <Button
          variant="outline"
          onClick={handleMakeAnotherPayment}
          className="eb-w-full"
        >
          Make Another Payment
        </Button>
        <Button onClick={onClose} className="eb-w-full">
          Done
        </Button>
      </div>
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
  // Error states for payee fetching
  recipientsError?: boolean;
  linkedAccountsError?: boolean;
  onRetryRecipients?: () => void;
  onRetryLinkedAccounts?: () => void;
  // Balance errors
  hasBalanceErrors?: boolean;
  // Granular loading states for mismatch detection
  isAccountsLoaded?: boolean;
  isPayeesLoaded?: boolean;
  // Initial IDs for mismatch detection (needed for Storybook soft refresh)
  initialAccountId?: string;
  initialPayeeId?: string;
  // Handler to start a new payment
  onMakeAnotherPayment?: () => void;
}

function PaymentFlowContent({
  payees,
  linkedAccounts,
  accounts,
  paymentMethods,
  isLoading,
  isSubmitting: _isSubmitting,
  transactionResponse,
  transactionError: _transactionError,
  onClose,
  onRetry: _onRetry,
  hasMoreRecipients,
  onLoadMoreRecipients,
  isLoadingMoreRecipients,
  totalRecipients,
  hasMoreLinkedAccounts,
  onLoadMoreLinkedAccounts,
  isLoadingMoreLinkedAccounts,
  totalLinkedAccounts,
  recipientsError,
  linkedAccountsError,
  onRetryRecipients,
  onRetryLinkedAccounts,
  hasBalanceErrors: _hasBalanceErrors,
  isAccountsLoaded: _isAccountsLoaded = false,
  isPayeesLoaded = false,
  initialAccountId,
  initialPayeeId,
  onMakeAnotherPayment,
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

  // State for editing an unsaved recipient
  const [editingUnsavedRecipient, setEditingUnsavedRecipient] = useState<
    UnsavedRecipient | undefined
  >(undefined);

  // Counter to force remount of recipient form when navigating to it
  const [recipientFormKey, setRecipientFormKey] = useState(0);

  // Warning state for initial data mismatch
  const [initialDataWarning, setInitialDataWarning] = useState<{
    account?: string;
    payee?: string;
  } | null>(null);

  // State to store error from save attempt (to pass to form if user is redirected there)
  const [saveRecipientError, setSaveRecipientError] = useState<Error | null>(
    null
  );

  // Hook for saving unsaved recipient directly from the card
  const {
    submit: saveRecipient,
    isPending: isSavingUnsavedRecipient,
    reset: resetSaveRecipient,
    error: saveRecipientHookError,
  } = useRecipientForm({
    mode: 'create',
    recipientType: 'RECIPIENT',
    onSuccess: (savedRecipient) => {
      if (savedRecipient) {
        // Transform recipient to Payee format (same logic as handleRecipientSuccess)
        const isOrganization =
          savedRecipient.partyDetails?.type === 'ORGANIZATION';
        const name = isOrganization
          ? (savedRecipient.partyDetails?.businessName ?? 'Recipient')
          : `${savedRecipient.partyDetails?.firstName ?? ''} ${savedRecipient.partyDetails?.lastName ?? ''}`.trim() ||
            'Recipient';

        const enabledMethods = (
          savedRecipient.account?.routingInformation ?? []
        )
          .map((ri) => ri.transactionType as PaymentMethodType)
          .filter(Boolean);

        // Update formData with the saved recipient
        setFormData({
          payeeId: savedRecipient.id,
          payee: {
            id: savedRecipient.id!,
            type: 'RECIPIENT',
            name,
            accountNumber: savedRecipient.account?.number ?? '',
            routingNumber:
              savedRecipient.account?.routingInformation?.[0]?.routingNumber ??
              '',
            bankName: undefined,
            enabledPaymentMethods:
              enabledMethods.length > 0 ? enabledMethods : ['ACH'],
            recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
          },
          unsavedRecipient: undefined, // Clear unsaved recipient
        });
      }
    },
    onError: (apiError) => {
      // Only navigate to form on 400 errors (bad request - user can fix the data)
      // Other errors (401, 500, etc.) should just show an error message
      const httpStatus = (apiError as any)?.httpStatus;
      if (httpStatus === 400 && formData.unsavedRecipient) {
        // Store the error to display in the form
        setSaveRecipientError(apiError as unknown as Error);
        // Navigate to the save-recipient-form (no confirmation step)
        setEditingUnsavedRecipient(formData.unsavedRecipient);
        setRecipientFormKey((k) => k + 1);
        pushView('save-recipient-form');
      }
      // For non-400 errors, the error will be available via the hook's error state
      // but we don't navigate - the user can retry from the card
    },
  });

  // Navigate to success view when transaction is complete
  useEffect(() => {
    if (transactionResponse) {
      replaceView('success');
    }
  }, [transactionResponse, replaceView]);

  // Sync availableBalance in formData when the selected account's balance finishes loading
  // This handles the case where user selects an account before its balance has loaded
  useEffect(() => {
    if (formData.fromAccountId) {
      const account = accounts.find((a) => a.id === formData.fromAccountId);
      const balance = account?.balance?.available;
      const balanceIsLoading = account?.balance?.isLoading ?? true;
      // Update formData when balance has finished loading and we have a valid balance
      // This ensures the latest balance is always synced to form data
      if (
        !balanceIsLoading &&
        balance !== undefined &&
        balance !== formData.availableBalance
      ) {
        setFormData({ availableBalance: balance });
      }
    }
  }, [
    accounts,
    formData.fromAccountId,
    formData.availableBalance,
    setFormData,
  ]);

  // Auto-select account if only one is available
  useEffect(() => {
    if (accounts.length === 1 && !formData.fromAccountId) {
      const account = accounts[0];
      const availableBalance = account?.balance?.available;
      setFormData({ fromAccountId: account.id!, availableBalance });
    }
  }, [accounts, formData.fromAccountId, setFormData]);

  // Auto-select account when initial payee is external and only one valid account exists
  // LIMITED_DDA accounts cannot be used for external recipients (RECIPIENT type)
  useEffect(() => {
    // Only run if we have an initial payee that's an external recipient
    // and no account is currently selected
    if (
      formData.payeeId &&
      !formData.fromAccountId &&
      accounts.length > 0 &&
      isPayeesLoaded
    ) {
      // Find the payee from the loaded data
      const payee = [...payees, ...linkedAccounts].find(
        (p) => p.id === formData.payeeId
      );

      // Only auto-select if payee is an external recipient
      if (payee?.type === 'RECIPIENT') {
        // Filter out LIMITED_DDA accounts which can't be used for external recipients
        const validAccounts = accounts.filter(
          (account) => account.category !== 'LIMITED_DDA'
        );

        // Auto-select if exactly one valid account remains
        if (validAccounts.length === 1) {
          const account = validAccounts[0];
          const availableBalance = account?.balance?.available;
          setFormData({ fromAccountId: account.id!, availableBalance });
        }
      }
    }
  }, [
    accounts,
    payees,
    linkedAccounts,
    formData.payeeId,
    formData.fromAccountId,
    isPayeesLoaded,
    setFormData,
  ]);

  // Validate selected account exists in the fetched accounts list
  // If the initial/selected account doesn't exist, clear it and show warning
  // Track the initial ID prop value to reset check on Storybook soft refresh
  const lastInitialAccountIdRef = React.useRef<string | undefined>(
    initialAccountId
  );
  const hasCheckedAccountMismatch = React.useRef(false);

  // Reset check flag if the initialAccountId prop changes (Storybook soft refresh)
  useEffect(() => {
    if (lastInitialAccountIdRef.current !== initialAccountId) {
      lastInitialAccountIdRef.current = initialAccountId;
      hasCheckedAccountMismatch.current = false;
      // Clear any existing warning for account when initial ID changes
      setInitialDataWarning((prev) =>
        prev ? { ...prev, account: undefined } : null
      );
    }
  }, [initialAccountId]);

  useEffect(() => {
    // Only check once when accounts first become available
    if (
      !hasCheckedAccountMismatch.current &&
      accounts.length > 0 &&
      initialAccountId
    ) {
      hasCheckedAccountMismatch.current = true;
      if (!accounts.find((a) => a.id === initialAccountId)) {
        // Selected account not found in available accounts - clear selection
        setFormData({ fromAccountId: undefined, availableBalance: undefined });
        setInitialDataWarning((prev) => ({
          ...prev,
          account: `The pre-selected account (${initialAccountId.slice(-8)}...) was not found. Please select an account.`,
        }));
      }
    }
  }, [accounts, initialAccountId, setFormData]);

  // Merge formData.payee into the appropriate list if it's not already present.
  // This ensures newly created recipients appear immediately without waiting for refetch.
  const mergedPayees = useMemo(() => {
    // If no formData.payee or it's a linked account type, return original list
    if (!formData.payee || formData.payee.type === 'LINKED_ACCOUNT') {
      return payees;
    }
    // Check if the payee is already in the list
    const exists = payees.some((p) => p.id === formData.payee?.id);
    if (exists) {
      return payees;
    }
    // Prepend the new payee to the list so it appears first
    return [formData.payee, ...payees];
  }, [payees, formData.payee]);

  const mergedLinkedAccounts = useMemo(() => {
    // If no formData.payee or it's a recipient type, return original list
    if (!formData.payee || formData.payee.type === 'RECIPIENT') {
      return linkedAccounts;
    }
    // Check if the payee is already in the list
    const exists = linkedAccounts.some((p) => p.id === formData.payee?.id);
    if (exists) {
      return linkedAccounts;
    }
    // Prepend the new linked account to the list so it appears first
    return [formData.payee, ...linkedAccounts];
  }, [linkedAccounts, formData.payee]);

  // Validate selected payee exists in the fetched payees list
  // If the initial/selected payee doesn't exist, clear it and show warning
  const allPayees = useMemo(
    () => [...mergedPayees, ...mergedLinkedAccounts],
    [mergedPayees, mergedLinkedAccounts]
  );
  // Track the initial ID prop value to reset check on Storybook soft refresh
  const lastInitialPayeeIdRef = React.useRef<string | undefined>(
    initialPayeeId
  );
  const hasCheckedPayeeMismatch = React.useRef(false);

  // Reset check flag if the initialPayeeId prop changes (Storybook soft refresh)
  useEffect(() => {
    if (lastInitialPayeeIdRef.current !== initialPayeeId) {
      lastInitialPayeeIdRef.current = initialPayeeId;
      hasCheckedPayeeMismatch.current = false;
      // Clear any existing warning for payee when initial ID changes
      setInitialDataWarning((prev) =>
        prev ? { ...prev, payee: undefined } : null
      );
    }
  }, [initialPayeeId]);

  useEffect(() => {
    // Only check once when payees first become available (or when we know they're loaded even if empty)
    if (!hasCheckedPayeeMismatch.current && isPayeesLoaded && initialPayeeId) {
      hasCheckedPayeeMismatch.current = true;
      if (!allPayees.find((p) => p.id === initialPayeeId)) {
        // Selected payee not found in available payees - clear selection
        setFormData({ payeeId: undefined, payee: undefined });
        setInitialDataWarning((prev) => ({
          ...prev,
          payee: `The pre-selected payee (${initialPayeeId.slice(-8)}...) was not found. Please select a payee.`,
        }));
      }
    }
  }, [allPayees, initialPayeeId, isPayeesLoaded, setFormData]);

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

  // Handler for adding new payee (shows payee type selection)
  const handleAddNewPayee = useCallback(() => {
    pushView('payee-type');
  }, [pushView]);

  // Handler for directly adding a recipient (skips payee type selection)
  const handleAddRecipient = useCallback(() => {
    setRecipientFormKey((k) => k + 1);
    pushView('add-recipient-form');
  }, [pushView]);

  // Handler for directly linking an account (skips payee type selection)
  const handleLinkAccount = useCallback(() => {
    pushView('link-account');
  }, [pushView]);

  // Determine if current account is LIMITED_DDA (can only use linked accounts)
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );
  const isLimitedDDA = selectedAccount?.category === 'LIMITED_DDA';

  // Handler for switching from linked account form to recipient form
  const handleSwitchToRecipient = useCallback(() => {
    setRecipientFormKey((k) => k + 1);
    replaceView('add-recipient-form');
  }, [replaceView]);

  // Handler for switching from recipient form to linked account form
  const handleSwitchToLinkedAccount = useCallback(() => {
    replaceView('link-account');
  }, [replaceView]);

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
      // Use the same enable-payment-method flow for both saved and unsaved recipients
      setPendingPaymentMethod(method);
      pushView('enable-payment-method');
    },
    [pushView]
  );

  // Handler for account selection
  const handleAccountSelect = useCallback(
    (accountId: string) => {
      // Find the account to get its available balance
      const account = accounts.find((a) => a.id === accountId);
      const availableBalance = account?.balance?.available;
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
        // Go directly to add-recipient-form - BankAccountForm handles payment method selection
        setRecipientFormKey((k) => k + 1);
        pushView('add-recipient-form');
      }
    },
    [pushView]
  );

  // Handler for successful linked account creation
  const handleLinkedAccountSuccess = useCallback(
    (recipient: Recipient) => {
      // Transform recipient to Payee format (uses flat partyDetails structure)
      const isOrganization = recipient.partyDetails?.type === 'ORGANIZATION';
      const name = isOrganization
        ? (recipient.partyDetails?.businessName ?? 'Linked Account')
        : `${recipient.partyDetails?.firstName ?? ''} ${recipient.partyDetails?.lastName ?? ''}`.trim() ||
          'Linked Account';

      const enabledMethods = (recipient.account?.routingInformation ?? [])
        .map((ri) => ri.transactionType as PaymentMethodType)
        .filter(Boolean);

      const payee: Payee = {
        id: recipient.id!,
        type: 'LINKED_ACCOUNT',
        name,
        accountNumber: recipient.account?.number ?? '',
        routingNumber:
          recipient.account?.routingInformation?.[0]?.routingNumber ?? '',
        bankName: undefined,
        enabledPaymentMethods:
          enabledMethods.length > 0 ? enabledMethods : ['ACH'],
        recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
      };

      // Select the newly created linked account
      // Only auto-select payment method if there's exactly one enabled method
      setFormData({
        payeeId: payee.id,
        payee,
        paymentMethod:
          payee.enabledPaymentMethods.length === 1
            ? payee.enabledPaymentMethods[0]
            : undefined,
      });

      // Go back to main view
      popView();
    },
    [setFormData, popView]
  );

  // Handler for successful recipient creation
  const handleRecipientSuccess = useCallback(
    (recipient: Recipient) => {
      // Transform recipient to Payee format (uses flat partyDetails structure)
      const isOrganization = recipient.partyDetails?.type === 'ORGANIZATION';
      const name = isOrganization
        ? (recipient.partyDetails?.businessName ?? 'Recipient')
        : `${recipient.partyDetails?.firstName ?? ''} ${recipient.partyDetails?.lastName ?? ''}`.trim() ||
          'Recipient';

      const enabledMethods = (recipient.account?.routingInformation ?? [])
        .map((ri) => ri.transactionType as PaymentMethodType)
        .filter(Boolean);

      const payee: Payee = {
        id: recipient.id!,
        type: 'RECIPIENT',
        name,
        accountNumber: recipient.account?.number ?? '',
        routingNumber:
          recipient.account?.routingInformation?.[0]?.routingNumber ?? '',
        bankName: undefined,
        enabledPaymentMethods:
          enabledMethods.length > 0 ? enabledMethods : ['ACH'],
        recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
      };

      // Select the newly created recipient
      // Only auto-select payment method if there's exactly one enabled method
      // Clear unsavedRecipient since we now have a saved recipient
      setFormData({
        payeeId: payee.id,
        payee,
        unsavedRecipient: undefined,
        paymentMethod:
          payee.enabledPaymentMethods.length === 1
            ? (formData.paymentMethod ?? payee.enabledPaymentMethods[0])
            : undefined,
      });

      // Go back through the flow (method selection -> main)
      popView();
      popView();
    },
    [setFormData, popView, formData.paymentMethod]
  );

  // Handler for one-time recipient (not saved)
  const handleUnsavedRecipientSubmit = useCallback(
    (unsavedRecipient: UnsavedRecipient) => {
      // Set the unsaved recipient in form state and clear any saved payee
      // Only auto-select payment method if there's exactly one enabled method
      setFormData({
        payeeId: undefined,
        payee: undefined,
        unsavedRecipient,
        paymentMethod:
          unsavedRecipient.enabledPaymentMethods.length === 1
            ? (formData.paymentMethod ??
              unsavedRecipient.enabledPaymentMethods[0])
            : undefined,
      });

      // Clear editing state
      setEditingUnsavedRecipient(undefined);

      // Go back through the flow (method selection -> main)
      popView();
      popView();
    },
    [setFormData, popView, formData.paymentMethod]
  );

  // Handler to edit an unsaved recipient
  const handleEditUnsavedRecipient = useCallback(() => {
    if (formData.unsavedRecipient) {
      // Store the unsaved recipient data for editing
      setEditingUnsavedRecipient(formData.unsavedRecipient);
      // Increment key to force fresh form with editing data
      setRecipientFormKey((k) => k + 1);
      // Navigate to the add recipient form
      pushView('add-recipient-form');
    }
  }, [formData.unsavedRecipient, pushView]);

  // Handler to clear unsaved recipient and go back to recipient selection
  const handleClearUnsavedRecipient = useCallback(() => {
    setFormData({
      unsavedRecipient: undefined,
      paymentMethod: undefined, // Clear payment method since it was tied to the recipient
    });
  }, [setFormData]);

  // Handler to save unsaved recipient - calls API directly from the card
  // If it fails, the onError callback will navigate to the form at step 2
  const handleSaveUnsavedRecipient = useCallback(() => {
    if (formData.unsavedRecipient?.originalFormData) {
      // Reset any previous error state
      resetSaveRecipient();
      // Submit the original form data directly
      saveRecipient(formData.unsavedRecipient.originalFormData);
    }
  }, [formData.unsavedRecipient, saveRecipient, resetSaveRecipient]);

  // Get the selected payee for enable form
  const selectedPayee = useMemo(() => {
    // If there's an unsaved recipient (one-time payment), create a virtual payee for display
    if (formData.unsavedRecipient) {
      return {
        id: 'unsaved-recipient',
        type: 'RECIPIENT' as const,
        name: formData.unsavedRecipient.displayName,
        accountNumber: formData.unsavedRecipient.accountNumber,
        routingNumber: formData.unsavedRecipient.routingNumber,
        bankName: formData.unsavedRecipient.bankName,
        enabledPaymentMethods: formData.unsavedRecipient.enabledPaymentMethods,
        recipientType: formData.unsavedRecipient.recipientType,
      };
    }
    // Try to find the saved payee from the lists first
    const foundPayee = [...payees, ...linkedAccounts].find(
      (p) => p.id === formData.payeeId
    );
    // Fall back to formData.payee if not found in lists (e.g., newly created recipient)
    return foundPayee ?? formData.payee;
  }, [
    payees,
    linkedAccounts,
    formData.payeeId,
    formData.unsavedRecipient,
    formData.payee,
  ]);

  const pendingMethod = pendingPaymentMethod
    ? paymentMethods.find((m) => m.id === pendingPaymentMethod)
    : null;

  // Compute valid account count considering payee restrictions
  // If payee is an external recipient, LIMITED_DDA accounts cannot be used
  const validAccountCount = useMemo(() => {
    if (selectedPayee?.type === 'RECIPIENT') {
      return accounts.filter((a) => a.category !== 'LIMITED_DDA').length;
    }
    return accounts.length;
  }, [accounts, selectedPayee?.type]);

  return (
    <>
      {/* Main Transfer View */}
      <FlowView viewId="main">
        {/* Initial Data Mismatch Warning */}
        {initialDataWarning && (
          <div className="eb-mb-4 eb-rounded-lg eb-border eb-border-yellow-200 eb-bg-yellow-50 eb-p-3">
            <div className="eb-flex eb-items-start eb-gap-2">
              <AlertCircle className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-yellow-600" />
              <div className="eb-space-y-1 eb-text-sm eb-text-yellow-800">
                {initialDataWarning.account && (
                  <p>{initialDataWarning.account}</p>
                )}
                {initialDataWarning.payee && <p>{initialDataWarning.payee}</p>}
              </div>
            </div>
          </div>
        )}
        <MainTransferView
          payees={mergedPayees}
          linkedAccounts={mergedLinkedAccounts}
          accounts={accounts}
          paymentMethods={paymentMethods}
          isLoading={isLoading}
          isPayeesLoading={!isPayeesLoaded}
          onPayeeSelect={handlePayeeSelect}
          onAddNewPayee={handleAddNewPayee}
          onAddRecipient={handleAddRecipient}
          onLinkAccount={handleLinkAccount}
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
          recipientsError={recipientsError}
          linkedAccountsError={linkedAccountsError}
          onRetryRecipients={onRetryRecipients}
          onRetryLinkedAccounts={onRetryLinkedAccounts}
          validAccountCount={validAccountCount}
          onEditUnsavedRecipient={handleEditUnsavedRecipient}
          onClearUnsavedRecipient={handleClearUnsavedRecipient}
          onSaveUnsavedRecipient={handleSaveUnsavedRecipient}
          isSavingUnsavedRecipient={isSavingUnsavedRecipient}
          saveUnsavedRecipientError={saveRecipientHookError}
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
        <BankAccountFormWrapper
          formType="linked-account"
          onSuccess={handleLinkedAccountSuccess}
          onCancel={popView}
          onSwitchToRecipient={
            isLimitedDDA ? undefined : handleSwitchToRecipient
          }
        />
      </FlowView>

      {/* Add Recipient Form - BankAccountForm handles payment method selection */}
      <FlowView viewId="add-recipient-form">
        <BankAccountFormWrapper
          key={`recipient-form-${recipientFormKey}`}
          formType="recipient"
          availablePaymentMethods={paymentMethods}
          onSuccess={handleRecipientSuccess}
          onSubmitWithoutSave={handleUnsavedRecipientSubmit}
          onCancel={() => {
            setEditingUnsavedRecipient(undefined);
            setSaveRecipientError(null);
            popView();
          }}
          onSwitchToLinkedAccount={handleSwitchToLinkedAccount}
          initialData={editingUnsavedRecipient}
          isEditing={!!editingUnsavedRecipient}
          initialError={saveRecipientError}
        />
      </FlowView>

      {/* Save Unsaved Recipient Form - save-only mode (no one-time option) */}
      <FlowView viewId="save-recipient-form">
        <BankAccountFormWrapper
          key={`save-recipient-form-${recipientFormKey}`}
          formType="recipient"
          availablePaymentMethods={paymentMethods}
          onSuccess={handleRecipientSuccess}
          onCancel={() => {
            setEditingUnsavedRecipient(undefined);
            setSaveRecipientError(null);
            popView();
          }}
          initialData={editingUnsavedRecipient}
          isEditing
          initialError={saveRecipientError}
        />
      </FlowView>

      {/* Enable Payment Method View */}
      <FlowView viewId="enable-payment-method">
        {selectedPayee && pendingMethod && (
          <EnablePaymentMethodWrapper
            payee={selectedPayee}
            paymentMethod={pendingMethod}
            unsavedRecipient={formData.unsavedRecipient}
            onSuccess={() => {
              // Payment method is now enabled - select it and go back
              setFormData({ paymentMethod: pendingPaymentMethod! });
              setPendingPaymentMethod(null);
              popView();
            }}
            onUnsavedSuccess={(updatedUnsaved) => {
              // Update the unsaved recipient with new payment methods and select the method
              setFormData({
                unsavedRecipient: updatedUnsaved,
                paymentMethod: pendingPaymentMethod!,
              });
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
          paymentMethods={paymentMethods}
          onClose={onClose}
          onMakeAnotherPayment={onMakeAnotherPayment}
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
  trigger,
  paymentMethods = DEFAULT_PAYMENT_METHODS,
  initialAccountId,
  initialPayeeId,
  initialPaymentMethod,
  initialAmount,
  showFees = false,
  onTransactionComplete,
  onClose,
  open: controlledOpen,
  onOpenChange,
  resetKey,
  userEventsHandler: _userEventsHandler,
  userEventsLifecycle: _userEventsLifecycle,
}: PaymentFlowProps) {
  // State
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Internal reset key that increments when dialog re-opens
  // This triggers FlowContextProvider to reset its state (without remounting)
  const [internalResetKey, setInternalResetKey] = useState(0);
  const prevOpenRef = React.useRef(false);

  // Controlled vs uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Increment reset key when dialog re-opens (transition from closed to open)
  // This resets the flow state for a fresh start
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setInternalResetKey((prev) => prev + 1);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Compute effective reset key (external or internal)
  const effectiveResetKey = resetKey ?? internalResetKey;

  // API hooks
  const { interceptorReady } = useInterceptorStatus();

  // Fetch accounts (clientId is automatically added by EBComponentsProvider interceptor)
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
    error: _accountsError,
    refetch: refetchAccounts,
  } = useGetAccounts(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });

  // Fetch RECIPIENT type with infinite scroll (only ACTIVE recipients)
  const {
    data: recipientsData,
    isLoading: isLoadingRecipients,
    isError: isRecipientsError,
    refetch: refetchRecipients,
    fetchNextPage: fetchNextRecipients,
    hasNextPage: hasNextRecipients,
    isFetchingNextPage: isFetchingNextRecipients,
  } = useGetAllRecipientsInfinite(
    { type: 'RECIPIENT', limit: 25 },
    {
      query: {
        enabled: interceptorReady,
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
    isError: isLinkedAccountsError,
    refetch: refetchLinkedAccounts,
    fetchNextPage: fetchNextLinkedAccounts,
    hasNextPage: hasNextLinkedAccounts,
    isFetchingNextPage: isFetchingNextLinkedAccounts,
  } = useGetAllRecipientsInfinite(
    { type: 'LINKED_ACCOUNT', limit: 25 },
    {
      query: {
        enabled: interceptorReady,
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

  // Get total counts from metadata (for pagination display)
  const totalRecipients =
    recipientsData?.pages?.[0]?.metadata?.total_items ?? 0;
  const totalLinkedAccounts =
    linkedAccountsData?.pages?.[0]?.metadata?.total_items ?? 0;

  // Get list of active account IDs for balance fetching (OPEN + PENDING_CLOSE)
  const activeAccountIds = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter(
        (account) =>
          account.state === 'OPEN' || account.state === 'PENDING_CLOSE'
      )
      .map((account) => account.id);
  }, [accountsData]);

  // Fetch balances for all active accounts in parallel
  const balanceQueries = useQueries({
    queries: activeAccountIds.map((accountId) =>
      getGetAccountBalanceQueryOptions(accountId, {
        query: {
          enabled: interceptorReady && !!accountId,
        },
      })
    ),
  });

  // Check if any balance query is still loading
  const isLoadingBalances = balanceQueries.some((query) => query.isLoading);

  // Check if any balance query has errors (for display purposes, not blocking)
  const hasBalanceErrors = balanceQueries.some((query) => query.isError);

  // Create a map of account ID to balance for quick lookup
  // For accounts with balance errors, we'll use undefined to indicate unknown balance
  const balanceMap = useMemo(() => {
    const map: Record<
      string,
      {
        available: number;
        currency: string;
        hasError?: boolean;
        isLoading?: boolean;
      }
    > = {};
    balanceQueries.forEach((query, index) => {
      const accountId = activeAccountIds[index];
      if (accountId) {
        if (query.isLoading) {
          // Balance is still loading
          map[accountId] = {
            available: 0,
            currency: 'USD',
            hasError: false,
            isLoading: true,
          };
        } else if (query.isError) {
          // Mark that this account has a balance error
          map[accountId] = {
            available: 0,
            currency: 'USD',
            hasError: true,
            isLoading: false,
          };
        } else if (query.data) {
          // Find the ITAV (interim available balance) from balanceTypes
          const availableBalance = query.data.balanceTypes?.find(
            (bt) => bt.typeCode === 'ITAV'
          );
          map[accountId] = {
            available: availableBalance?.amount ?? 0,
            currency: query.data.currency ?? 'USD',
            hasError: false,
            isLoading: false,
          };
        }
      }
    });
    return map;
  }, [balanceQueries, activeAccountIds]);

  // Transform API accounts to AccountResponse with balance (OPEN + PENDING_CLOSE)
  const accounts: AccountResponse[] = useMemo(() => {
    if (!accountsData?.items) return [];
    return accountsData.items
      .filter(
        (account) =>
          account.state === 'OPEN' || account.state === 'PENDING_CLOSE'
      )
      .map((account) => {
        const balanceInfo = balanceMap[account.id];
        return {
          ...account,
          balance: balanceInfo
            ? {
                available: balanceInfo.available,
                currency: balanceInfo.currency,
                hasError: balanceInfo.hasError,
                isLoading: balanceInfo.isLoading,
              }
            : {
                available: 0,
                currency: 'USD',
                hasError: false,
                isLoading: true, // No data yet means still loading
              },
        };
      });
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

  // Store transaction state keyed to the resetKey
  // This ensures stale state is automatically invalidated when dialog reopens
  const [transactionState, setTransactionState] = useState<{
    resetKey: number | string;
    response?: TransactionResponseV2;
    error?: ErrorType<ApiErrorV2> | null;
  }>({ resetKey: effectiveResetKey });

  // Derived state: only use response/error if they belong to the current resetKey
  // This prevents stale success screens from showing when dialog reopens
  const transactionResponse =
    transactionState.resetKey === effectiveResetKey
      ? transactionState.response
      : undefined;
  const transactionError =
    transactionState.resetKey === effectiveResetKey
      ? transactionState.error
      : null;

  // Helper to update transaction state with current resetKey
  const setTransactionResponse = useCallback(
    (response: TransactionResponseV2 | undefined) => {
      setTransactionState((prev) => ({
        ...prev,
        resetKey: effectiveResetKey,
        response,
      }));
    },
    [effectiveResetKey]
  );

  const setTransactionError = useCallback(
    (error: ErrorType<ApiErrorV2> | null) => {
      setTransactionState((prev) => ({
        ...prev,
        resetKey: effectiveResetKey,
        error,
      }));
    },
    [effectiveResetKey]
  );

  // Generate unique transaction reference ID (matching MakePayment pattern)
  const generateTransactionReferenceId = useCallback((): string => {
    const prefix = 'PHUI_';
    const uuid = uuidv4().replace(/-/g, ''); // Remove dashes to fit within the character limit
    const maxLength = 35;
    const randomPart = uuid.substring(0, maxLength - prefix.length);
    return prefix + randomPart;
  }, []);

  // Handle close - just close dialog, state cleanup happens on unmount
  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [setOpen, onClose]);

  // Handle retry - clear error to allow another attempt
  const handleRetry = useCallback(() => {
    setTransactionError(null);
  }, [setTransactionError]);

  // Handle make another payment - clear parent state
  const handleMakeAnotherPayment = useCallback(() => {
    setTransactionResponse(undefined);
    setTransactionError(null);
  }, [setTransactionResponse, setTransactionError]);

  // Handle submit - creates actual transaction via API
  const handleTransactionSubmit = useCallback(
    async (formData: {
      fromAccountId?: string;
      payeeId?: string;
      payee?: Payee;
      unsavedRecipient?: UnsavedRecipient;
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

        // Build the request - use recipient for one-time payments, recipientId for saved recipients
        const response = await createTransactionMutation.mutateAsync({
          data: {
            amount: parseFloat(formData.amount) || 0,
            currency: 'USD',
            debtorAccountId: formData.fromAccountId,
            // Use inline recipient for one-time payments, recipientId for saved recipients
            ...(formData.unsavedRecipient
              ? { recipient: formData.unsavedRecipient.transactionRecipient }
              : { recipientId: formData.payeeId }),
            memo: formData.memo,
            transactionReferenceId,
            type: paymentType,
          },
        });

        setTransactionResponse(response);
        createTransactionMutation.reset(); // Clear cached mutation state
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
      amount: initialAmount ?? '',
      currency: 'USD',
    }),
    [initialAccountId, initialPayeeId, initialPaymentMethod, initialAmount]
  );

  return (
    <FlowContainer
      title="Transfer Funds"
      onClose={handleClose}
      asModal
      open={open}
      onOpenChange={setOpen}
      initialData={initialData}
      trigger={trigger}
      resetKey={effectiveResetKey}
      reviewPanelWidth="md"
      isSubmitting={isSubmitting}
      reviewPanel={
        // Hide review panel on error or empty states, show otherwise (with loading state)
        isAccountsError ||
        (!isLoadingAccounts && accounts.length === 0) ? null : (
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
            showFees={showFees}
            isLoading={isLoadingAccounts}
            isPayeesLoading={isLoadingRecipients || isLoadingLinkedAccounts}
            transactionError={parseTransactionError(transactionError)}
            onDismissError={handleRetry}
          />
        )
      }
    >
      {/* Loading state: accounts are being fetched */}
      {isLoadingAccounts ? (
        <LoadingStateView />
      ) : /* Error state: accounts failed to load */
      isAccountsError ? (
        <FatalErrorView
          title="Unable to Load Accounts"
          message="We couldn't load your accounts. Please check your connection and try again."
          onRetry={() => refetchAccounts()}
          isRetrying={isLoadingAccounts}
        />
      ) : /* Empty state: no accounts available */
      accounts.length === 0 ? (
        <EmptyAccountsView
          title="No Accounts Available"
          message="You don't have any accounts available for transfers. Please contact support if you need assistance."
          onClose={handleClose}
        />
      ) : (
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
          recipientsError={isRecipientsError}
          linkedAccountsError={isLinkedAccountsError}
          onRetryRecipients={() => refetchRecipients()}
          onRetryLinkedAccounts={() => refetchLinkedAccounts()}
          hasBalanceErrors={hasBalanceErrors}
          isAccountsLoaded={!isLoadingAccounts}
          isPayeesLoaded={!isLoadingRecipients && !isLoadingLinkedAccounts}
          initialAccountId={initialAccountId}
          initialPayeeId={initialPayeeId}
          onMakeAnotherPayment={handleMakeAnotherPayment}
        />
      )}
    </FlowContainer>
  );
}

/**
 * PaymentFlowInline component
 * Inline/embedded version of PaymentFlow - renders directly on the page without a dialog
 *
 * @example
 * ```tsx
 * <PaymentFlowInline
 *   initialPayeeId="recipient-123"
 *   onTransactionComplete={(response) => console.log('Payment complete:', response)}
 * />
 * ```
 */
export function PaymentFlowInline({
  paymentMethods = DEFAULT_PAYMENT_METHODS,
  initialAccountId,
  initialPayeeId,
  initialPaymentMethod,
  initialAmount,
  showFees = false,
  onTransactionComplete,
  resetKey,
  hideHeader = false,
  showContainer = true,
  className,
  userEventsHandler: _userEventsHandler,
  userEventsLifecycle: _userEventsLifecycle,
}: PaymentFlowInlineProps) {
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const { interceptorReady } = useInterceptorStatus();

  // Fetch accounts (clientId is automatically added by EBComponentsProvider interceptor)
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
    error: _accountsError,
    refetch: refetchAccounts,
  } = useGetAccounts(undefined, {
    query: {
      enabled: interceptorReady,
    },
  });

  // Fetch RECIPIENT type with infinite scroll (only ACTIVE recipients)
  const {
    data: recipientsData,
    isLoading: isLoadingRecipients,
    isError: isRecipientsError,
    refetch: refetchRecipients,
    fetchNextPage: fetchNextRecipients,
    hasNextPage: hasNextRecipients,
    isFetchingNextPage: isFetchingNextRecipients,
  } = useGetAllRecipientsInfinite(
    { type: 'RECIPIENT', limit: 25 },
    {
      query: {
        enabled: interceptorReady,
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
    isError: isLinkedAccountsError,
    refetch: refetchLinkedAccounts,
    fetchNextPage: fetchNextLinkedAccounts,
    hasNextPage: hasNextLinkedAccounts,
    isFetchingNextPage: isFetchingNextLinkedAccounts,
  } = useGetAllRecipientsInfinite(
    { type: 'LINKED_ACCOUNT', limit: 25 },
    {
      query: {
        enabled: interceptorReady,
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

  // Get total counts from metadata (for pagination display)
  const totalRecipients =
    recipientsData?.pages?.[0]?.metadata?.total_items ??
    recipientsData?.pages?.[0]?.total_items ??
    0;
  const totalLinkedAccounts =
    linkedAccountsData?.pages?.[0]?.metadata?.total_items ??
    linkedAccountsData?.pages?.[0]?.total_items ??
    0;

  // Extract accounts from response
  const accounts: AccountResponse[] = useMemo(
    () => accountsData?.items ?? [],
    [accountsData]
  );

  // Fetch balances for all accounts in parallel
  const balanceQueries = useQueries({
    queries: accounts.map((account) => ({
      ...getGetAccountBalanceQueryOptions(account.id),
      enabled: interceptorReady && accounts.length > 0,
      retry: 1,
      staleTime: 30000,
    })),
  });

  // Merge balances into accounts
  const accountsWithBalances: AccountResponse[] = useMemo(() => {
    return accounts.map((account, index) => {
      const balanceQuery = balanceQueries[index];
      // Find the ITAV (interim available balance) from balanceTypes
      const availableBalance = balanceQuery?.data?.balanceTypes?.find(
        (bt) => bt.typeCode === 'ITAV'
      );
      const currentBalance = balanceQuery?.data?.balanceTypes?.find(
        (bt) => bt.typeCode === 'ITBD'
      );
      return {
        ...account,
        balance: {
          available: availableBalance?.amount ?? 0,
          current: currentBalance?.amount,
          currency: balanceQuery?.data?.currency ?? 'USD',
          hasError: balanceQuery?.isError ?? false,
          isLoading: balanceQuery?.isLoading ?? false,
        },
      };
    });
  }, [accounts, balanceQueries]);

  // Check if any balance queries had errors
  const hasBalanceErrors = balanceQueries.some((q) => q.isError);

  // Check if balances are still loading
  const isLoadingBalances = balanceQueries.some((q) => q.isLoading);

  // Transform recipients to payees
  const transformRecipientsToPayees = useCallback(
    (
      data: typeof recipientsData | typeof linkedAccountsData | undefined
    ): Payee[] => {
      if (!data?.pages) return [];

      return data.pages
        .flatMap((page) => page?.recipients ?? [])
        .map((recipient) => {
          const isOrganization =
            recipient.partyDetails?.type === 'ORGANIZATION';
          const isLinkedAccount = recipient.type === 'LINKED_ACCOUNT';

          // Get enabled payment methods from routing information
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
            bankName: undefined,
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

  // Transform API recipients to Payee arrays
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

  // Generate unique transaction reference ID
  const generateTransactionReferenceId = useCallback((): string => {
    const prefix = 'PHUI_';
    const uuid = uuidv4().replace(/-/g, '');
    const maxLength = 35;
    const randomPart = uuid.substring(0, maxLength - prefix.length);
    return prefix + randomPart;
  }, []);

  // Handle retry - clear error to allow another attempt
  const handleRetry = useCallback(() => {
    setTransactionError(null);
  }, []);

  // Handle make another payment - clear parent state
  const handleMakeAnotherPayment = useCallback(() => {
    setTransactionResponse(undefined);
    setTransactionError(null);
  }, []);

  // Handle submit - creates actual transaction via API
  const handleTransactionSubmit = useCallback(
    async (formData: {
      fromAccountId?: string;
      payeeId?: string;
      payee?: Payee;
      unsavedRecipient?: UnsavedRecipient;
      paymentMethod?: PaymentMethodType;
      amount: string;
      memo?: string;
    }) => {
      setIsSubmitting(true);
      setTransactionError(null);
      try {
        const transactionReferenceId = generateTransactionReferenceId();
        const paymentType = formData.paymentMethod as
          | 'ACH'
          | 'WIRE'
          | 'RTP'
          | undefined;

        // Build the request - use recipient for one-time payments, recipientId for saved recipients
        const response = await createTransactionMutation.mutateAsync({
          data: {
            amount: parseFloat(formData.amount) || 0,
            currency: 'USD',
            debtorAccountId: formData.fromAccountId,
            // Use inline recipient for one-time payments, recipientId for saved recipients
            ...(formData.unsavedRecipient
              ? { recipient: formData.unsavedRecipient.transactionRecipient }
              : { recipientId: formData.payeeId }),
            memo: formData.memo,
            transactionReferenceId,
            type: paymentType,
          },
        });

        setTransactionResponse(response);
        createTransactionMutation.reset(); // Clear cached mutation state
        onTransactionComplete?.(response);
      } catch (error) {
        const axiosError = error as ErrorType<ApiErrorV2>;
        setTransactionError(axiosError);
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
      amount: initialAmount ?? '',
      currency: 'USD',
    }),
    [initialAccountId, initialPayeeId, initialPaymentMethod, initialAmount]
  );

  // No-op close handler for inline mode (component stays rendered)
  const handleClose = useCallback(() => {
    // In inline mode, closing typically means clearing the form
    // The parent component decides what to do via callbacks
  }, []);

  return (
    <FlowContainer
      title="Transfer Funds"
      onClose={handleClose}
      asModal={false}
      initialData={initialData}
      resetKey={resetKey}
      reviewPanelWidth="md"
      isSubmitting={isSubmitting}
      hideHeader={hideHeader}
      showContainer={showContainer}
      className={className}
      reviewPanel={
        isAccountsError ||
        (!isLoadingAccounts && accounts.length === 0) ? null : (
          <ReviewPanel
            accounts={{
              items: accountsWithBalances,
              metadata: {
                page: 0,
                limit: 10,
                total_items: accountsWithBalances.length,
              },
            }}
            payees={[...payees, ...linkedAccounts]}
            paymentMethods={paymentMethods}
            onSubmit={handleTransactionSubmit}
            isSubmitting={isSubmitting}
            showFees={showFees}
            isLoading={isLoadingAccounts}
            isPayeesLoading={isLoadingRecipients || isLoadingLinkedAccounts}
            transactionError={parseTransactionError(transactionError)}
            onDismissError={handleRetry}
          />
        )
      }
    >
      {/* Loading state: accounts are being fetched */}
      {isLoadingAccounts ? (
        <LoadingStateView />
      ) : /* Error state: accounts failed to load */
      isAccountsError ? (
        <FatalErrorView
          title="Unable to Load Accounts"
          message="We couldn't load your accounts. Please check your connection and try again."
          onRetry={() => refetchAccounts()}
          isRetrying={isLoadingAccounts}
        />
      ) : /* Empty state: no accounts available */
      accounts.length === 0 ? (
        <EmptyAccountsView
          title="No Accounts Available"
          message="You don't have any accounts available for transfers. Please contact support if you need assistance."
          onClose={handleClose}
        />
      ) : (
        <PaymentFlowContent
          payees={payees}
          linkedAccounts={linkedAccounts}
          accounts={accountsWithBalances}
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
          recipientsError={isRecipientsError}
          linkedAccountsError={isLinkedAccountsError}
          onRetryRecipients={() => refetchRecipients()}
          onRetryLinkedAccounts={() => refetchLinkedAccounts()}
          hasBalanceErrors={hasBalanceErrors}
          isAccountsLoaded={!isLoadingAccounts}
          isPayeesLoaded={!isLoadingRecipients && !isLoadingLinkedAccounts}
          initialAccountId={initialAccountId}
          initialPayeeId={initialPayeeId}
          onMakeAnotherPayment={handleMakeAnotherPayment}
        />
      )}
    </FlowContainer>
  );
}
