/**
 * FXTransferView
 *
 * Cross-border variant of PaymentFlow's private MainTransferView. Reuses the
 * exported shared step components (StepSection, PayeeSelector,
 * PaymentMethodSelector) and layers in FX eligibility (FR-FX-1/3/4), delivery
 * estimates (FR-FX-5), the currency-aware amount input, and the quote preview.
 *
 * The domestic behaviour is preserved: when no target currency is active, the
 * FX overlays are inert and the view behaves like the standard flow.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircle, Loader2, Pencil, Save, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { RadioIndicator } from '../../PaymentFlow/components/RadioIndicator';
import { useFlowContext } from '../../PaymentFlow/FlowContainer';
import { PayeeSelector } from '../../PaymentFlow/PayeeSelector';
import { PANEL_IDS } from '../../PaymentFlow/PaymentFlow.constants';
import type {
  AccountResponse,
  Payee,
  PaymentMethod,
  PaymentMethodType,
} from '../../PaymentFlow/PaymentFlow.types';
import { PaymentMethodSelector } from '../../PaymentFlow/PaymentMethodSelector';
import { StepSection } from '../../PaymentFlow/StepSection';
import type { FxQuoteStatus } from '../hooks/useFxQuote';
import type {
  FXPayee,
  FxQuote,
  PaymentFlowFXFormData,
} from '../PaymentFlowFX.types';
import type { MethodAvailability } from '../utils/eligibility';
import { CurrencyAmountInput } from './CurrencyAmountInput';
import { CurrencyFlag } from './CurrencyFlag';
import { FxQuotePreview } from './FxQuotePreview';

export interface FXTransferViewProps {
  payees: FXPayee[];
  linkedAccounts: FXPayee[];
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
  // Infinite scroll - Recipients
  hasMoreRecipients?: boolean;
  onLoadMoreRecipients?: () => void;
  isLoadingMoreRecipients?: boolean;
  totalRecipients?: number;
  // Infinite scroll - Linked Accounts
  hasMoreLinkedAccounts?: boolean;
  onLoadMoreLinkedAccounts?: () => void;
  isLoadingMoreLinkedAccounts?: boolean;
  totalLinkedAccounts?: number;
  // Error states
  recipientsError?: boolean;
  linkedAccountsError?: boolean;
  onRetryRecipients?: () => void;
  onRetryLinkedAccounts?: () => void;
  validAccountCount?: number;
  // Unsaved recipient handlers
  onEditUnsavedRecipient?: () => void;
  onClearUnsavedRecipient?: () => void;
  onSaveUnsavedRecipient?: () => void;
  isSavingUnsavedRecipient?: boolean;
  saveUnsavedRecipientError?: Error | null;

  // ---- FX-specific ----
  /** Whether a cross-border payout is active (non-USD target currency). */
  fxActive: boolean;
  /** Active target currency (undefined for domestic/USD). */
  targetCurrency?: string;
  /** Reason a debtor account is unavailable for FX, or undefined. */
  getAccountDisabledReason: (account: AccountResponse) => string | undefined;
  /** Availability of a payment method for the current flow. */
  getMethodAvailability: (method: PaymentMethodType) => MethodAvailability;
  /** Reason a payee is not selectable, or undefined. */
  getPayeeDisabledReason: (payee: FXPayee) => string | undefined;
  /** Per-method availability map for the shared PaymentMethodSelector. */
  methodAvailability?: Partial<
    Record<PaymentMethodType, { available: boolean; reason?: string }>
  >;
  /** Per-method delivery estimates for the shared PaymentMethodSelector. */
  deliveryOverrides?: Partial<Record<PaymentMethodType, string>>;
  /** Current quote acquisition status. */
  fxQuoteStatus: FxQuoteStatus;
  /** Resolved quote, when available. */
  fxQuote?: FxQuote;
  /** Reason the quote is unavailable. */
  fxUnavailableReason?: string;
  /** True when the last submission fell back to the market rate. */
  usedMarketRateFallback?: boolean;
  /** Locale for number/currency formatting. */
  locale?: string;
}

/** Small currency chip (flag + ISO code) rendered next to an FX payee. */
function CurrencyBadge({ currency }: { currency: string }) {
  return (
    <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-bg-muted eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
      <CurrencyFlag currency={currency} className="eb-h-3 eb-w-4" />
      {currency}
    </span>
  );
}

export function FXTransferView({
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
  fxActive,
  targetCurrency,
  getAccountDisabledReason,
  getPayeeDisabledReason,
  methodAvailability,
  deliveryOverrides,
  fxQuoteStatus,
  fxQuote,
  fxUnavailableReason,
  usedMarketRateFallback = false,
  locale = 'en-US',
}: FXTransferViewProps) {
  const {
    formData: rawFormData,
    setFormData,
    validationErrors,
    setValidationErrors,
    isSubmitting,
  } = useFlowContext();
  const formData = rawFormData as PaymentFlowFXFormData;
  const { t, tString } = useTranslationWithTokens(['make-payment']);

  const getCategoryLabel = useCallback(
    (category?: string) => {
      if (!category) return tString('fx.accountFallback', 'Account');
      return t(`categories.${category}`, {
        defaultValue: category.replace(/_/g, ' '),
      });
    },
    [t, tString]
  );

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

  const hasPanelError = useCallback(
    (panelId: string) =>
      validationErrors.some((error) => fieldToPanelId[error] === panelId),
    [validationErrors, fieldToPanelId]
  );

  const getInitialActiveStep = useCallback(() => {
    if (formData.fromAccountId) {
      if (!formData.payeeId && !formData.unsavedRecipient)
        return PANEL_IDS.PAYEE;
      if (!formData.paymentMethod) return PANEL_IDS.PAYMENT_METHOD;
      return '';
    }
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

  const [activeStep, setActiveStep] = useState<string>(() =>
    getInitialActiveStep()
  );

  const prevFromAccountId = React.useRef(formData.fromAccountId);
  useEffect(() => {
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

  const [showAccountClearedWarning, setShowAccountClearedWarning] =
    useState(false);

  const amountInputRef = React.useRef<HTMLInputElement>(null);
  const fromAccountSectionRef = React.useRef<HTMLDivElement>(null);
  const payeeSectionRef = React.useRef<HTMLDivElement>(null);
  const paymentMethodSectionRef = React.useRef<HTMLDivElement>(null);
  const amountSectionRef = React.useRef<HTMLDivElement>(null);

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

  const prevValidationErrorsCountRef = React.useRef(0);
  useEffect(() => {
    const wasEmpty = prevValidationErrorsCountRef.current === 0;
    const hasErrors = validationErrors.length > 0;

    if (wasEmpty && hasErrors) {
      const panelOrder = [
        PANEL_IDS.FROM_ACCOUNT,
        PANEL_IDS.PAYEE,
        PANEL_IDS.PAYMENT_METHOD,
        PANEL_IDS.AMOUNT,
      ];

      for (const panelId of panelOrder) {
        if (hasPanelError(panelId)) {
          setActiveStep(panelId);
          const sectionRef = sectionRefs[panelId];
          if (panelId === PANEL_IDS.AMOUNT) {
            setTimeout(() => {
              amountInputRef.current?.focus();
              amountInputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }, 100);
          } else {
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

    prevValidationErrorsCountRef.current = validationErrors.length;
  }, [validationErrors, hasPanelError, sectionRefs]);

  const prevFormDataRef = React.useRef(formData);
  useEffect(() => {
    const prev = prevFormDataRef.current;

    if (validationErrors.length > 0) {
      const errorsToRemove: string[] = [];
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
      if (errorsToRemove.length > 0) {
        const remainingErrors = validationErrors.filter(
          (error) => !errorsToRemove.includes(error)
        );
        if (remainingErrors.length !== validationErrors.length) {
          setValidationErrors(remainingErrors);
        }
      }
    }

    prevFormDataRef.current = formData;
  }, [formData, validationErrors, setValidationErrors]);

  const selectedPayee = useMemo(() => {
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
    return [...payees, ...linkedAccounts].find(
      (p) => p.id === formData.payeeId
    );
  }, [payees, linkedAccounts, formData.payeeId, formData.unsavedRecipient]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );

  useEffect(() => {
    if (
      selectedAccount?.category === 'LIMITED_DDA' &&
      selectedPayee?.type === 'RECIPIENT'
    ) {
      setFormData({ fromAccountId: undefined, availableBalance: undefined });
      setShowAccountClearedWarning(true);
      setActiveStep(PANEL_IDS.FROM_ACCOUNT);
    }
  }, [selectedPayee?.type, selectedAccount?.category, setFormData]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === formData.paymentMethod),
    [paymentMethods, formData.paymentMethod]
  );

  const isLimitedDDA = selectedAccount?.category === 'LIMITED_DDA';

  const hasPayee = !!formData.payeeId || !!formData.unsavedRecipient;
  const hasPaymentMethod = !!formData.paymentMethod;
  const hasAccount = !!formData.fromAccountId;

  // Combined account restriction: payee-type (LIMITED_DDA) + FX eligibility.
  const getAccountRestriction = useCallback(
    (account: AccountResponse): string | undefined => {
      if (
        selectedPayee?.type === 'RECIPIENT' &&
        account.category === 'LIMITED_DDA'
      ) {
        return tString(
          'fx.accountNotForExternal',
          'Not available for external recipients'
        );
      }
      return getAccountDisabledReason(account);
    },
    [selectedPayee?.type, getAccountDisabledReason, tString]
  );

  const amount = parseFloat(formData.amount) || 0;
  const isBalanceLoading = selectedAccount?.balance?.isLoading ?? false;
  const hasBalanceError = selectedAccount?.balance?.hasError ?? false;
  const availableBalance = selectedAccount?.balance?.available;
  const exceedsBalance =
    !isBalanceLoading &&
    !hasBalanceError &&
    availableBalance !== undefined &&
    amount > 0 &&
    amount > availableBalance;

  const handlePayeeSelect = useCallback(
    (payee: Payee) => {
      onPayeeSelect(payee);
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
      setTimeout(() => setActiveStep(''), 150);
    },
    [onPaymentMethodSelect]
  );

  const handleAccountSelect = useCallback(
    (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      if (account && getAccountRestriction(account)) {
        return;
      }
      onAccountSelect(accountId);
      setShowAccountClearedWarning(false);
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

  const handleCollapse = useCallback(() => {
    setActiveStep('');
  }, []);

  const renderPayeeBadge = useCallback((payee: Payee) => {
    // Show a currency chip for every recipient — domestic recipients (no
    // `currencyCode`) are USD by definition.
    const currency = (payee as FXPayee).currencyCode ?? 'USD';
    return <CurrencyBadge currency={currency} />;
  }, []);

  return (
    <div className="eb-space-y-1">
      {/* FROM ACCOUNT Section */}
      <StepSection
        stepNumber={1}
        title={tString('stepSection.fromAccount', 'From')}
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
              <span className="eb-font-medium">
                {t('fx.accountUnavailable', 'Account unavailable.')}
              </span>{' '}
              {t(
                'fx.accountClearedReason',
                'The selected account cannot send this payment. Please select a different account.'
              )}
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
                            {t('fx.pendingClose', 'Pending Close')}
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
                                · {t('fx.linkedOnly', 'Linked accounts only')}
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
                          {t('fx.loading', 'Loading...')}
                        </div>
                      </>
                    ) : account.balance?.hasError ? (
                      <>
                        <div className="eb-font-medium eb-text-muted-foreground">
                          --
                        </div>
                        <div className="eb-text-xs eb-text-destructive">
                          {t('fx.unavailable', 'Unavailable')}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="eb-font-medium">
                          ${account.balance?.available?.toLocaleString() ?? '0'}
                        </div>
                        <div className="eb-text-xs eb-text-muted-foreground">
                          {t('fx.available', 'Available')}
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

      {/* TO PAYEE Section */}
      <StepSection
        stepNumber={2}
        title={tString('stepSection.toPayee', 'To')}
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
          !hasAccount && !selectedPayee
            ? tString('stepSection.selectAccountFirst', 'Select account first')
            : undefined
        }
        disabled={isSubmitting}
        sectionRef={payeeSectionRef}
      >
        {formData.unsavedRecipient ? (
          <div className="eb-space-y-3">
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
                      {t('fx.accountEndingIn', 'Account ending in')} ...
                      {formData.unsavedRecipient.accountNumber.slice(-4)}
                    </div>
                    <div className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                      {t(
                        'unsavedRecipient.notSaved',
                        'One-time recipient (not saved)'
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="eb-mt-4 eb-flex eb-flex-col eb-gap-2">
                {saveUnsavedRecipientError && (
                  <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-md eb-bg-destructive/10 eb-px-3 eb-py-2 eb-text-sm eb-text-destructive">
                    <AlertCircle className="eb-h-4 eb-w-4 eb-shrink-0" />
                    <span>
                      {saveUnsavedRecipientError.message ||
                        tString(
                          'unsavedRecipient.saveError',
                          'Failed to save recipient. Please try again.'
                        )}
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
                    {t('unsavedRecipient.editButton', 'Edit')}
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
                    {isSavingUnsavedRecipient
                      ? t('unsavedRecipient.savingButton', 'Saving...')
                      : t('unsavedRecipient.saveButton', 'Save')}
                  </Button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearUnsavedRecipient}
              className="eb-text-sm eb-text-primary hover:eb-underline"
            >
              {t(
                'unsavedRecipient.chooseDifferent',
                'Choose a different recipient'
              )}
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
            recipientsError={recipientsError}
            linkedAccountsError={linkedAccountsError}
            onRetryRecipients={onRetryRecipients}
            onRetryLinkedAccounts={onRetryLinkedAccounts}
            renderPayeeBadge={renderPayeeBadge}
            getPayeeDisabledReason={
              getPayeeDisabledReason as (payee: Payee) => string | undefined
            }
          />
        )}
      </StepSection>

      {/* PAYMENT METHOD Section */}
      <StepSection
        stepNumber={3}
        title={tString('stepSection.paymentMethod', 'Payment Method')}
        isComplete={hasPaymentMethod}
        isActive={activeStep === PANEL_IDS.PAYMENT_METHOD}
        hasError={hasPanelError(PANEL_IDS.PAYMENT_METHOD)}
        summary={selectedMethod?.name}
        onHeaderClick={() => setActiveStep(PANEL_IDS.PAYMENT_METHOD)}
        onCollapse={handleCollapse}
        disabledReason={
          !hasPayee
            ? tString('stepSection.selectPayeeFirst', 'Select payee first')
            : undefined
        }
        isLast
        disabled={isSubmitting}
        sectionRef={paymentMethodSectionRef}
      >
        {hasPayee && isPayeesLoading && !selectedPayee ? (
          <div className="eb-flex eb-items-center eb-gap-2 eb-py-3 eb-text-sm eb-text-muted-foreground">
            <Loader2 className="eb-h-4 eb-w-4 eb-animate-spin" />
            <span>
              {t(
                'paymentMethod.loadingRecipientDetails',
                'Loading recipient details to show available payment methods...'
              )}
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
            methodAvailability={methodAvailability}
            deliveryOverrides={deliveryOverrides}
          />
        )}
      </StepSection>

      <Separator className="!eb-my-4" />

      {/* AMOUNT & MEMO Section */}
      <CurrencyAmountInput
        amount={formData.amount}
        memo={formData.memo}
        exceedsBalance={exceedsBalance}
        availableBalance={availableBalance}
        hasAmountError={hasPanelError(PANEL_IDS.AMOUNT)}
        onAmountChange={onAmountChange}
        onMemoChange={onMemoChange}
        isSubmitting={isSubmitting}
        amountInputRef={amountInputRef}
        amountSectionRef={amountSectionRef}
        targetCurrency={targetCurrency}
        fxRate={fxQuote?.rate}
        isIndicativeRate={fxQuote?.isIndicative}
        locale={locale}
      />

      {/* FX quote preview — inline conversion for narrow viewports only. On
          wide (@3xl) layouts the right-hand review panel already shows the same
          conversion (FxReviewBlock), so this is hidden to avoid a duplicate. */}
      {fxActive && targetCurrency && (
        <div className="@3xl:eb-hidden">
          <FxQuotePreview
            status={fxQuoteStatus}
            quote={fxQuote}
            unavailableReason={fxUnavailableReason}
            targetCurrency={targetCurrency}
            usdAmount={amount}
            usedMarketRateFallback={usedMarketRateFallback}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
