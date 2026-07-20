'use client';

/**
 * PaymentFlowFX
 *
 * Cross-border / multicurrency payout flow. A self-contained sibling of
 * PaymentFlow (which is left untouched — non-breaking mandate D6) that reuses
 * PaymentFlow's exported shared components and layers in FX eligibility, rate
 * quoting, the V3 transaction API, and post-submit enrichment.
 *
 * Two public entry points mirror PaymentFlow:
 * - {@link PaymentFlowFX} — dialog mode.
 * - {@link PaymentFlowFXInline} — inline / embedded mode.
 *
 * See SPECIFICATION.md.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircle } from 'lucide-react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type {
  TransactionGetResponseV3,
  TransactionResponseV3,
} from '@/api/generated/ep-transactions-v3.schemas';

import {
  FlowContainer,
  FlowView,
  useFlowContext,
} from '../PaymentFlow/FlowContainer';
import {
  BankAccountFormWrapper,
  EnablePaymentMethodWrapper,
  PayeeTypeSelector,
} from '../PaymentFlow/forms';
import { DEFAULT_PAYMENT_METHODS } from '../PaymentFlow/PaymentFlow.constants';
import type {
  AccountResponse,
  Payee,
  PaymentFlowFormData,
  PaymentMethod,
  PaymentMethodType,
  UnsavedRecipient,
} from '../PaymentFlow/PaymentFlow.types';
import { ReviewPanel } from '../PaymentFlow/ReviewPanel';
import { useRecipientForm } from '../RecipientWidgets/hooks';
import { FxReviewBlock } from './components/FxReviewBlock';
import { FXSuccessView } from './components/FXSuccessView';
import { FXTransferView } from './components/FXTransferView';
import {
  EmptyAccountsView,
  FatalErrorView,
  LoadingStateView,
} from './components/StateViews';
import { useFxEligibility } from './hooks/useFxEligibility';
import { useFxQuote } from './hooks/useFxQuote';
import { usePaymentFlowFXData } from './hooks/usePaymentFlowFXData';
import { useSubmitTransactionV3 } from './hooks/useSubmitTransactionV3';
import {
  CURRENCY_LABELS,
  FX_ALLOWED_METHODS,
  SUPPORTED_TARGET_CURRENCIES,
} from './PaymentFlowFX.constants';
import type {
  FxConfig,
  FXPayee,
  PaymentFlowFXFormData,
  PaymentFlowFXInlineProps,
  PaymentFlowFXProps,
} from './PaymentFlowFX.types';
import { getTargetCurrencyForPayee, isFxActive } from './utils/eligibility';
import { parseTransactionError } from './utils/transactionErrors';

const DEFAULT_LOCALE = 'en-US';

/**
 * Tolerant read of a recipient's account currency.
 *
 * The FX recipients spec widens `account.currencyCode` to the 16 supported
 * credit currencies plus USD. We read it as an open `string` (decoupled from the
 * generated enum) and treat USD/absent as domestic.
 */
function readRecipientCurrency(recipient: Recipient): string | undefined {
  const currency = (recipient.account as { currencyCode?: string } | undefined)
    ?.currencyCode;
  return currency && currency !== 'USD' ? currency : undefined;
}

/**
 * PaymentFlowFXContent
 *
 * Inner orchestrator (inside FlowContextProvider). Owns view routing, all
 * selection handlers, and the FX overlays (eligibility, quote sync, currency
 * derivation). Mirrors PaymentFlow's private PaymentFlowContent.
 */
interface PaymentFlowFXContentProps {
  payees: FXPayee[];
  linkedAccounts: FXPayee[];
  accounts: AccountResponse[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  transactionResponse?: TransactionResponseV3;
  enrichedDetails?: TransactionGetResponseV3;
  isEnriching?: boolean;
  onClose: () => void;
  onMakeAnotherPayment?: () => void;
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
  isPayeesLoaded?: boolean;
  initialAccountId?: string;
  initialPayeeId?: string;
  // FX
  fxConfig?: FxConfig;
  supportedTargetCurrencies?: string[];
  locale?: string;
}

function PaymentFlowFXContent({
  payees,
  linkedAccounts,
  accounts,
  paymentMethods,
  isLoading,
  transactionResponse,
  enrichedDetails,
  isEnriching = false,
  onClose,
  onMakeAnotherPayment,
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
  isPayeesLoaded = false,
  initialAccountId,
  initialPayeeId,
  fxConfig,
  supportedTargetCurrencies = SUPPORTED_TARGET_CURRENCIES,
  locale = DEFAULT_LOCALE,
}: PaymentFlowFXContentProps) {
  const {
    formData: rawFormData,
    setFormData,
    pushView,
    popView,
    replaceView,
  } = useFlowContext();
  const formData = rawFormData as PaymentFlowFXFormData;
  const { tString } = useTranslationWithTokens(['make-payment']);

  const [pendingPaymentMethod, setPendingPaymentMethod] =
    useState<PaymentMethodType | null>(null);
  const [editingUnsavedRecipient, setEditingUnsavedRecipient] = useState<
    UnsavedRecipient | undefined
  >(undefined);
  const [recipientFormKey, setRecipientFormKey] = useState(0);
  const [initialDataWarning, setInitialDataWarning] = useState<{
    account?: string;
    payee?: string;
  } | null>(null);
  const [saveRecipientError, setSaveRecipientError] = useState<Error | null>(
    null
  );

  // ---- FX eligibility + quote (depend on live form data) ----
  const { targetCurrency } = formData;
  const {
    fxActive,
    getAccountDisabledReason,
    getMethodAvailability,
    getPayeeDisabledReason,
  } = useFxEligibility({
    targetCurrency,
    accounts,
    supportedTargetCurrencies,
  });

  const selectedPayeeForQuote = useMemo(
    () => [...payees, ...linkedAccounts].find((p) => p.id === formData.payeeId),
    [payees, linkedAccounts, formData.payeeId]
  );
  const beneficiaryType: 'INDIVIDUAL' | 'BUSINESS' =
    selectedPayeeForQuote?.recipientType === 'BUSINESS' ||
    formData.unsavedRecipient?.recipientType === 'BUSINESS'
      ? 'BUSINESS'
      : 'INDIVIDUAL';

  const fxMethod: 'ACH' | 'WIRE' =
    formData.paymentMethod === 'WIRE' ? 'WIRE' : 'ACH';

  const fxQuoteResult = useFxQuote({
    targetCurrency,
    fromAccountId: formData.fromAccountId,
    amount: formData.amount,
    paymentMethod: fxMethod,
    beneficiaryType,
    fxConfig,
  });

  // Sync the resolved quote into form data so the review panel + submission see it.
  const quoteSig = fxQuoteResult.quote
    ? `${fxQuoteResult.quote.rateId ?? ''}|${fxQuoteResult.quote.rate}|${
        fxQuoteResult.quote.expiresAt?.getTime() ?? ''
      }|${fxQuoteResult.quote.isIndicative}`
    : '';
  const lastQuoteSigRef = useRef<string>('');
  useEffect(() => {
    if (quoteSig === lastQuoteSigRef.current) return;
    lastQuoteSigRef.current = quoteSig;
    if (fxQuoteResult.status === 'success' && fxQuoteResult.quote) {
      setFormData({
        fxQuote: { ...fxQuoteResult.quote, fetchedAt: new Date() },
      });
    } else if (formData.fxQuote) {
      setFormData({ fxQuote: undefined });
    }
  }, [quoteSig, fxQuoteResult.status]);

  // FR-FX-4: drop a now-disallowed method (e.g. RTP) when FX turns on.
  useEffect(() => {
    if (
      fxActive &&
      formData.paymentMethod &&
      !FX_ALLOWED_METHODS.includes(formData.paymentMethod)
    ) {
      setFormData({ paymentMethod: undefined });
    }
  }, [fxActive, formData.paymentMethod, setFormData]);

  // FR-FX-3: clear an ineligible debtor account when FX turns on / currency changes.
  useEffect(() => {
    if (!fxActive || !formData.fromAccountId) return;
    const account = accounts.find((a) => a.id === formData.fromAccountId);
    if (account && getAccountDisabledReason(account)) {
      setFormData({ fromAccountId: undefined, availableBalance: undefined });
    }
  }, [
    fxActive,
    formData.fromAccountId,
    accounts,
    getAccountDisabledReason,
    setFormData,
  ]);

  const methodAvailability = useMemo(() => {
    if (!fxActive) return undefined;
    // FX rails are the product's value tiers; RTP is never available for a
    // cross-currency payout. Use the same copy as the recipient form.
    const rtpReason = tString(
      'fx.rails.rtpUnavailable',
      'Not available for cross-currency payments'
    );
    const map: Partial<
      Record<PaymentMethodType, { available: boolean; reason?: string }>
    > = {};
    paymentMethods.forEach((m) => {
      const availability = getMethodAvailability(m.id);
      map[m.id] = availability.available
        ? availability
        : { available: false, reason: rtpReason };
    });
    return map;
  }, [fxActive, paymentMethods, getMethodAvailability, tString]);

  const deliveryOverrides = useMemo(() => {
    if (!fxActive) return undefined;
    // Mirror the recipient form's low/high-value descriptions on the cards.
    return {
      ACH: tString(
        'fx.rails.desc.ACH',
        'Non-urgent cross-currency payouts (two to five business days)'
      ),
      WIRE: tString(
        'fx.rails.desc.WIRE',
        'Time-critical cross-currency payouts (same or next business day)'
      ),
    } as Partial<Record<PaymentMethodType, string>>;
  }, [fxActive, tString]);

  // Relabel ACH/WIRE as the FX value tiers ("FX Low-value" / "FX High-value")
  // when a cross-currency payout is active, matching the recipient form. Domestic
  // (USD) payouts keep the host-provided names ("ACH Transfer" / "Wire Transfer").
  const fxPaymentMethods = useMemo(() => {
    if (!fxActive) return paymentMethods;
    const fxLabels: Partial<Record<PaymentMethodType, string>> = {
      ACH: tString('fx.rails.label.ACH', 'FX Low-value'),
      WIRE: tString('fx.rails.label.WIRE', 'FX High-value'),
    };
    return paymentMethods.map((m) =>
      fxLabels[m.id] ? { ...m, name: fxLabels[m.id]! } : m
    );
  }, [fxActive, paymentMethods, tString]);

  // Save-recipient-from-card hook (parity with PaymentFlow).
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
        const isOrganization =
          savedRecipient.partyDetails?.type === 'ORGANIZATION';
        const name = isOrganization
          ? (savedRecipient.partyDetails?.businessName ?? 'Recipient')
          : `${savedRecipient.partyDetails?.firstName ?? ''} ${
              savedRecipient.partyDetails?.lastName ?? ''
            }`.trim() || 'Recipient';
        const enabledMethods = (
          savedRecipient.account?.routingInformation ?? []
        )
          .map((ri) => ri.transactionType as PaymentMethodType)
          .filter(Boolean);
        const currency = readRecipientCurrency(savedRecipient);
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
          unsavedRecipient: undefined,
          targetCurrency: currency,
        });
      }
    },
    onError: (apiError) => {
      const httpStatus = (apiError as { httpStatus?: number })?.httpStatus;
      if (httpStatus === 400 && formData.unsavedRecipient) {
        setSaveRecipientError(apiError as unknown as Error);
        setEditingUnsavedRecipient(formData.unsavedRecipient);
        setRecipientFormKey((k) => k + 1);
        pushView('save-recipient-form');
      }
    },
  });

  // Navigate to success when a transaction completes.
  useEffect(() => {
    if (transactionResponse) {
      replaceView('success');
    }
  }, [transactionResponse, replaceView]);

  // Sync availableBalance when the selected account's balance finishes loading.
  useEffect(() => {
    if (formData.fromAccountId) {
      const account = accounts.find((a) => a.id === formData.fromAccountId);
      const balance = account?.balance?.available;
      const balanceIsLoading = account?.balance?.isLoading ?? true;
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

  // Auto-select account if only one is available.
  useEffect(() => {
    if (accounts.length === 1 && !formData.fromAccountId) {
      const account = accounts[0];
      const availableBalance = account?.balance?.available;
      setFormData({ fromAccountId: account.id!, availableBalance });
    }
  }, [accounts, formData.fromAccountId, setFormData]);

  // Mismatch detection: selected account not present.
  const hasCheckedAccountMismatch = useRef(false);
  useEffect(() => {
    if (
      !hasCheckedAccountMismatch.current &&
      accounts.length > 0 &&
      initialAccountId
    ) {
      hasCheckedAccountMismatch.current = true;
      if (!accounts.find((a) => a.id === initialAccountId)) {
        setFormData({ fromAccountId: undefined, availableBalance: undefined });
        setInitialDataWarning((prev) => ({
          ...prev,
          account: `The pre-selected account (${initialAccountId.slice(-8)}...) was not found. Please select an account.`,
        }));
      }
    }
  }, [accounts, initialAccountId, setFormData]);

  // Merge newly created payee into the appropriate list.
  const mergedPayees = useMemo(() => {
    if (!formData.payee || formData.payee.type === 'LINKED_ACCOUNT') {
      return payees;
    }
    const exists = payees.some((p) => p.id === formData.payee?.id);
    if (exists) return payees;
    return [formData.payee as FXPayee, ...payees];
  }, [payees, formData.payee]);

  const mergedLinkedAccounts = useMemo(() => {
    if (!formData.payee || formData.payee.type === 'RECIPIENT') {
      return linkedAccounts;
    }
    const exists = linkedAccounts.some((p) => p.id === formData.payee?.id);
    if (exists) return linkedAccounts;
    return [formData.payee as FXPayee, ...linkedAccounts];
  }, [linkedAccounts, formData.payee]);

  const allPayees = useMemo(
    () => [...mergedPayees, ...mergedLinkedAccounts],
    [mergedPayees, mergedLinkedAccounts]
  );

  // Mismatch detection: selected payee not present.
  const hasCheckedPayeeMismatch = useRef(false);
  useEffect(() => {
    if (!hasCheckedPayeeMismatch.current && isPayeesLoaded && initialPayeeId) {
      hasCheckedPayeeMismatch.current = true;
      if (!allPayees.find((p) => p.id === initialPayeeId)) {
        setFormData({ payeeId: undefined, payee: undefined });
        setInitialDataWarning((prev) => ({
          ...prev,
          payee: `The pre-selected payee (${initialPayeeId.slice(-8)}...) was not found. Please select a payee.`,
        }));
      }
    }
  }, [allPayees, initialPayeeId, isPayeesLoaded, setFormData]);

  // Keep payee + targetCurrency in sync whenever payeeId resolves to a loaded
  // payee (initialPayeeId and resetKey reopens). Only update when values differ
  // to avoid infinite setFormData loops.
  useEffect(() => {
    if (!isPayeesLoaded || !formData.payeeId) return;
    const payee = allPayees.find((p) => p.id === formData.payeeId);
    if (!payee) return;
    const nextTargetCurrency = getTargetCurrencyForPayee(payee);
    const payeeMissingOrStale =
      !formData.payee || formData.payee.id !== payee.id;
    const currencyOutOfSync = formData.targetCurrency !== nextTargetCurrency;
    if (payeeMissingOrStale || currencyOutOfSync) {
      setFormData({
        payee,
        targetCurrency: nextTargetCurrency,
      });
    }
  }, [
    allPayees,
    formData.payee,
    formData.payeeId,
    formData.targetCurrency,
    isPayeesLoaded,
    setFormData,
  ]);

  // ---- Handlers ----
  const handlePayeeSelect = useCallback(
    (payee: Payee) => {
      const nextTargetCurrency = getTargetCurrencyForPayee(payee as FXPayee);
      const fxWillBeActive = !!nextTargetCurrency;
      const keepMethod =
        payee.enabledPaymentMethods.includes(
          formData.paymentMethod as PaymentMethodType
        ) &&
        (!fxWillBeActive ||
          FX_ALLOWED_METHODS.includes(
            formData.paymentMethod as PaymentMethodType
          ));
      setFormData({
        payeeId: payee.id,
        payee,
        targetCurrency: nextTargetCurrency,
        paymentMethod: keepMethod ? formData.paymentMethod : undefined,
      });
    },
    [formData.paymentMethod, setFormData]
  );

  const handleAddNewPayee = useCallback(() => {
    pushView('payee-type');
  }, [pushView]);

  const handleAddRecipient = useCallback(() => {
    setRecipientFormKey((k) => k + 1);
    pushView('add-recipient-form');
  }, [pushView]);

  const handleLinkAccount = useCallback(() => {
    pushView('link-account');
  }, [pushView]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.fromAccountId),
    [accounts, formData.fromAccountId]
  );
  const isLimitedDDA = selectedAccount?.category === 'LIMITED_DDA';

  const handleSwitchToRecipient = useCallback(() => {
    setRecipientFormKey((k) => k + 1);
    replaceView('add-recipient-form');
  }, [replaceView]);

  const handleSwitchToLinkedAccount = useCallback(() => {
    replaceView('link-account');
  }, [replaceView]);

  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethodType) => {
      setFormData({ paymentMethod: method });
    },
    [setFormData]
  );

  const handleEnablePaymentMethod = useCallback(
    (method: PaymentMethodType) => {
      setPendingPaymentMethod(method);
      pushView('enable-payment-method');
    },
    [pushView]
  );

  const handleAccountSelect = useCallback(
    (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      const availableBalance = account?.balance?.available;
      setFormData({ fromAccountId: accountId, availableBalance });
    },
    [accounts, setFormData]
  );

  const handleAmountChange = useCallback(
    (value: string) => {
      if (value === '') {
        setFormData({ amount: '' });
        return;
      }
      let sanitized = value.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
      }
      if (parts.length === 2 && parts[1].length > 2) {
        sanitized = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
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

  const handleMemoChange = useCallback(
    (memo: string) => {
      setFormData({ memo });
    },
    [setFormData]
  );

  const handlePayeeTypeSelect = useCallback(
    (type: 'link-account' | 'add-recipient') => {
      if (type === 'link-account') {
        pushView('link-account');
      } else {
        setRecipientFormKey((k) => k + 1);
        pushView('add-recipient-form');
      }
    },
    [pushView]
  );

  const buildPayeeFromRecipient = useCallback(
    (recipient: Recipient, type: 'RECIPIENT' | 'LINKED_ACCOUNT'): FXPayee => {
      const isOrganization = recipient.partyDetails?.type === 'ORGANIZATION';
      const name = isOrganization
        ? (recipient.partyDetails?.businessName ??
          (type === 'LINKED_ACCOUNT' ? 'Linked Account' : 'Recipient'))
        : `${recipient.partyDetails?.firstName ?? ''} ${
            recipient.partyDetails?.lastName ?? ''
          }`.trim() ||
          (type === 'LINKED_ACCOUNT' ? 'Linked Account' : 'Recipient');
      const enabledMethods = (recipient.account?.routingInformation ?? [])
        .map((ri) => ri.transactionType as PaymentMethodType)
        .filter(Boolean);
      return {
        id: recipient.id!,
        type,
        name,
        accountNumber: recipient.account?.number ?? '',
        routingNumber:
          recipient.account?.routingInformation?.[0]?.routingNumber ?? '',
        bankName: undefined,
        enabledPaymentMethods:
          enabledMethods.length > 0 ? enabledMethods : ['ACH'],
        recipientType: isOrganization ? 'BUSINESS' : 'INDIVIDUAL',
        currencyCode: readRecipientCurrency(recipient),
      };
    },
    []
  );

  const handleLinkedAccountSuccess = useCallback(
    (recipient: Recipient) => {
      const payee = buildPayeeFromRecipient(recipient, 'LINKED_ACCOUNT');
      const nextTargetCurrency = getTargetCurrencyForPayee(payee);
      setFormData({
        payeeId: payee.id,
        payee,
        targetCurrency: nextTargetCurrency,
        paymentMethod:
          payee.enabledPaymentMethods.length === 1
            ? payee.enabledPaymentMethods[0]
            : undefined,
      });
      popView();
    },
    [setFormData, popView, buildPayeeFromRecipient]
  );

  const handleRecipientSuccess = useCallback(
    (recipient: Recipient) => {
      const payee = buildPayeeFromRecipient(recipient, 'RECIPIENT');
      const nextTargetCurrency = getTargetCurrencyForPayee(payee);
      const keepMethod =
        payee.enabledPaymentMethods.length === 1 &&
        (!nextTargetCurrency ||
          FX_ALLOWED_METHODS.includes(payee.enabledPaymentMethods[0]));
      setFormData({
        payeeId: payee.id,
        payee,
        unsavedRecipient: undefined,
        targetCurrency: nextTargetCurrency,
        paymentMethod: keepMethod
          ? (formData.paymentMethod ?? payee.enabledPaymentMethods[0])
          : undefined,
      });
      popView();
      popView();
    },
    [setFormData, popView, formData.paymentMethod, buildPayeeFromRecipient]
  );

  const handleUnsavedRecipientSubmit = useCallback(
    (unsavedRecipient: UnsavedRecipient) => {
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
      setEditingUnsavedRecipient(undefined);
      popView();
      popView();
    },
    [setFormData, popView, formData.paymentMethod]
  );

  const handleEditUnsavedRecipient = useCallback(() => {
    if (formData.unsavedRecipient) {
      setEditingUnsavedRecipient(formData.unsavedRecipient);
      setRecipientFormKey((k) => k + 1);
      pushView('add-recipient-form');
    }
  }, [formData.unsavedRecipient, pushView]);

  const handleClearUnsavedRecipient = useCallback(() => {
    setFormData({
      unsavedRecipient: undefined,
      paymentMethod: undefined,
      targetCurrency: undefined,
    });
  }, [setFormData]);

  const handleSaveUnsavedRecipient = useCallback(() => {
    if (formData.unsavedRecipient?.originalFormData) {
      resetSaveRecipient();
      saveRecipient(formData.unsavedRecipient.originalFormData);
    }
  }, [formData.unsavedRecipient, saveRecipient, resetSaveRecipient]);

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
    const foundPayee = [...payees, ...linkedAccounts].find(
      (p) => p.id === formData.payeeId
    );
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

  const validAccountCount = useMemo(() => {
    let usable = accounts;
    if (selectedPayee?.type === 'RECIPIENT') {
      usable = usable.filter((a) => a.category !== 'LIMITED_DDA');
    }
    if (fxActive) {
      usable = usable.filter((a) => !getAccountDisabledReason(a));
    }
    return usable.length;
  }, [accounts, selectedPayee?.type, fxActive, getAccountDisabledReason]);

  return (
    <>
      {/* Main Transfer View */}
      <FlowView viewId="main">
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
        <FXTransferView
          payees={mergedPayees}
          linkedAccounts={mergedLinkedAccounts}
          accounts={accounts}
          paymentMethods={fxPaymentMethods}
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
          fxActive={fxActive}
          targetCurrency={targetCurrency}
          getAccountDisabledReason={getAccountDisabledReason}
          getMethodAvailability={getMethodAvailability}
          getPayeeDisabledReason={getPayeeDisabledReason}
          methodAvailability={methodAvailability}
          deliveryOverrides={deliveryOverrides}
          fxQuoteStatus={fxQuoteResult.status}
          fxQuote={fxQuoteResult.quote}
          fxUnavailableReason={fxQuoteResult.reason}
          locale={locale}
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

      {/* Add Recipient Form */}
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
          internationalMode
          supportedCurrencies={supportedTargetCurrencies}
          currencyLabels={CURRENCY_LABELS}
        />
      </FlowView>

      {/* Save Unsaved Recipient Form */}
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
              setFormData({ paymentMethod: pendingPaymentMethod! });
              setPendingPaymentMethod(null);
              popView();
            }}
            onUnsavedSuccess={(updatedUnsaved) => {
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
        <FXSuccessView
          transactionResponse={transactionResponse}
          enrichedDetails={enrichedDetails}
          isEnriching={isEnriching}
          formData={formData}
          payees={[...payees, ...linkedAccounts]}
          accounts={accounts}
          paymentMethods={fxPaymentMethods}
          onClose={onClose}
          onMakeAnotherPayment={onMakeAnotherPayment}
          locale={locale}
        />
      </FlowView>
    </>
  );
}

/**
 * ReviewPanel wrapper that relabels ACH/WIRE as FX value-tier rails when the
 * live form's targetCurrency is a non-USD FX payout. Must render inside
 * FlowContainer (useFlowContext).
 */
function FxAwareReviewPanel({
  paymentMethods,
  ...rest
}: Omit<React.ComponentProps<typeof ReviewPanel>, 'mobileConfig'>) {
  const { formData } = useFlowContext();
  const { tString } = useTranslationWithTokens(['make-payment']);
  const fxActive = isFxActive(
    (formData as PaymentFlowFXFormData).targetCurrency
  );

  const resolvedMethods = useMemo(() => {
    if (!fxActive || !paymentMethods) return paymentMethods;
    const fxLabels: Partial<Record<PaymentMethodType, string>> = {
      ACH: tString('fx.rails.label.ACH', 'FX Low-value'),
      WIRE: tString('fx.rails.label.WIRE', 'FX High-value'),
    };
    const fxDescriptions: Partial<Record<PaymentMethodType, string>> = {
      ACH: tString(
        'fx.rails.desc.ACH',
        'Non-urgent cross-currency payouts (two to five business days)'
      ),
      WIRE: tString(
        'fx.rails.desc.WIRE',
        'Time-critical cross-currency payouts (same or next business day)'
      ),
    };
    return paymentMethods.map((m) => ({
      ...m,
      ...(fxLabels[m.id] ? { name: fxLabels[m.id]! } : {}),
      ...(fxDescriptions[m.id] ? { description: fxDescriptions[m.id]! } : {}),
    }));
  }, [fxActive, paymentMethods, tString]);

  return <ReviewPanel {...rest} paymentMethods={resolvedMethods} />;
}

/**
 * PaymentFlowFX — dialog mode.
 */
export function PaymentFlowFX({
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
  supportedTargetCurrencies = SUPPORTED_TARGET_CURRENCIES,
  fxConfig,
  enrichTransactionAfterSubmit = true,
}: PaymentFlowFXProps) {
  const { tString } = useTranslationWithTokens(['make-payment']);
  const [internalOpen, setInternalOpen] = useState(false);
  const prevOpenRef = useRef(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const {
    accounts,
    payees,
    linkedAccounts,
    isLoadingAccounts,
    isAccountsError,
    refetchAccounts,
    isLoadingRecipients,
    isRecipientsError,
    refetchRecipients,
    fetchNextRecipients,
    hasNextRecipients,
    isFetchingNextRecipients,
    totalRecipients,
    isLoadingLinkedAccounts,
    isLinkedAccountsError,
    refetchLinkedAccounts,
    fetchNextLinkedAccounts,
    hasNextLinkedAccounts,
    isFetchingNextLinkedAccounts,
    totalLinkedAccounts,
    isLoading,
  } = usePaymentFlowFXData();

  const {
    submit,
    isSubmitting,
    response,
    enrichedDetails,
    error: transactionError,
    reset: resetSubmit,
    setError: setTransactionError,
  } = useSubmitTransactionV3({
    fxConfig,
    enrichAfterSubmit: enrichTransactionAfterSubmit,
    onTransactionComplete,
  });

  // Reset transaction state when the dialog re-opens.
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      resetSubmit();
    }
    prevOpenRef.current = open;
  }, [open, resetSubmit]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [setOpen, onClose]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
  }, [setTransactionError]);

  const handleMakeAnotherPayment = useCallback(() => {
    resetSubmit();
  }, [resetSubmit]);

  const handleSubmit = useCallback(
    async (fd: PaymentFlowFormData) => {
      await submit(fd as PaymentFlowFXFormData);
    },
    [submit]
  );

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

  const showReviewPanel = !(
    isAccountsError ||
    (!isLoadingAccounts && accounts.length === 0)
  );

  return (
    <FlowContainer
      title={tString('fx.flowTitle', 'Send Money Internationally')}
      onClose={handleClose}
      asModal
      open={open}
      onOpenChange={setOpen}
      initialData={initialData}
      trigger={trigger}
      resetKey={resetKey}
      reviewPanelWidth="md"
      isSubmitting={isSubmitting}
      reviewPanel={
        showReviewPanel ? (
          <FxAwareReviewPanel
            accounts={{
              items: accounts,
              metadata: { page: 0, limit: 10, total_items: accounts.length },
            }}
            payees={[...payees, ...linkedAccounts]}
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showFees={showFees}
            isLoading={isLoadingAccounts}
            isPayeesLoading={isLoadingRecipients || isLoadingLinkedAccounts}
            transactionError={parseTransactionError(transactionError, true)}
            onDismissError={handleRetry}
            renderExtraContent={(fd) => (
              <FxReviewBlock formData={fd as PaymentFlowFXFormData} />
            )}
          />
        ) : null
      }
    >
      {isLoadingAccounts ? (
        <LoadingStateView />
      ) : isAccountsError ? (
        <FatalErrorView
          title={tString('fx.errorTitle', 'Unable to Load Accounts')}
          message={tString(
            'fx.errorMessage',
            "We couldn't load your accounts. Please check your connection and try again."
          )}
          onRetry={() => refetchAccounts()}
          isRetrying={isLoadingAccounts}
        />
      ) : accounts.length === 0 ? (
        <EmptyAccountsView
          title={tString('fx.emptyTitle', 'No Accounts Available')}
          message={tString(
            'fx.emptyMessage',
            "You don't have any accounts available for transfers. Please contact support if you need assistance."
          )}
          onClose={handleClose}
        />
      ) : (
        <PaymentFlowFXContent
          payees={payees}
          linkedAccounts={linkedAccounts}
          accounts={accounts}
          paymentMethods={paymentMethods}
          isLoading={isLoading}
          transactionResponse={response}
          enrichedDetails={enrichedDetails}
          isEnriching={isSubmitting && !!response && !enrichedDetails}
          onClose={handleClose}
          onMakeAnotherPayment={handleMakeAnotherPayment}
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
          isPayeesLoaded={!isLoadingRecipients && !isLoadingLinkedAccounts}
          initialAccountId={initialAccountId}
          initialPayeeId={initialPayeeId}
          fxConfig={fxConfig}
          supportedTargetCurrencies={supportedTargetCurrencies}
        />
      )}
    </FlowContainer>
  );
}

/**
 * PaymentFlowFXInline — inline / embedded mode.
 */
export function PaymentFlowFXInline({
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
  supportedTargetCurrencies = SUPPORTED_TARGET_CURRENCIES,
  fxConfig,
  enrichTransactionAfterSubmit = true,
}: PaymentFlowFXInlineProps) {
  const { tString } = useTranslationWithTokens(['make-payment']);
  const {
    accounts,
    payees,
    linkedAccounts,
    isLoadingAccounts,
    isAccountsError,
    refetchAccounts,
    isLoadingRecipients,
    isRecipientsError,
    refetchRecipients,
    fetchNextRecipients,
    hasNextRecipients,
    isFetchingNextRecipients,
    totalRecipients,
    isLoadingLinkedAccounts,
    isLinkedAccountsError,
    refetchLinkedAccounts,
    fetchNextLinkedAccounts,
    hasNextLinkedAccounts,
    isFetchingNextLinkedAccounts,
    totalLinkedAccounts,
    isLoading,
  } = usePaymentFlowFXData();

  const {
    submit,
    isSubmitting,
    response,
    enrichedDetails,
    error: transactionError,
    reset: resetSubmit,
    setError: setTransactionError,
  } = useSubmitTransactionV3({
    fxConfig,
    enrichAfterSubmit: enrichTransactionAfterSubmit,
    onTransactionComplete,
  });

  const handleClose = useCallback(() => {
    // Inline mode: no dialog to close; the parent decides what to do.
  }, []);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
  }, [setTransactionError]);

  const handleMakeAnotherPayment = useCallback(() => {
    resetSubmit();
  }, [resetSubmit]);

  const handleSubmit = useCallback(
    async (fd: PaymentFlowFormData) => {
      await submit(fd as PaymentFlowFXFormData);
    },
    [submit]
  );

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

  const showReviewPanel = !(
    isAccountsError ||
    (!isLoadingAccounts && accounts.length === 0)
  );

  return (
    <FlowContainer
      title={tString('fx.flowTitle', 'Send Money Internationally')}
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
        showReviewPanel ? (
          <FxAwareReviewPanel
            accounts={{
              items: accounts,
              metadata: { page: 0, limit: 10, total_items: accounts.length },
            }}
            payees={[...payees, ...linkedAccounts]}
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showFees={showFees}
            isLoading={isLoadingAccounts}
            isPayeesLoading={isLoadingRecipients || isLoadingLinkedAccounts}
            transactionError={parseTransactionError(transactionError, true)}
            onDismissError={handleRetry}
            renderExtraContent={(fd) => (
              <FxReviewBlock formData={fd as PaymentFlowFXFormData} />
            )}
          />
        ) : null
      }
    >
      {isLoadingAccounts ? (
        <LoadingStateView />
      ) : isAccountsError ? (
        <FatalErrorView
          title={tString('fx.errorTitle', 'Unable to Load Accounts')}
          message={tString(
            'fx.errorMessage',
            "We couldn't load your accounts. Please check your connection and try again."
          )}
          onRetry={() => refetchAccounts()}
          isRetrying={isLoadingAccounts}
        />
      ) : accounts.length === 0 ? (
        <EmptyAccountsView
          title={tString('fx.emptyTitle', 'No Accounts Available')}
          message={tString(
            'fx.emptyMessage',
            "You don't have any accounts available for transfers. Please contact support if you need assistance."
          )}
          onClose={handleClose}
        />
      ) : (
        <PaymentFlowFXContent
          payees={payees}
          linkedAccounts={linkedAccounts}
          accounts={accounts}
          paymentMethods={paymentMethods}
          isLoading={isLoading}
          transactionResponse={response}
          enrichedDetails={enrichedDetails}
          isEnriching={isSubmitting && !!response && !enrichedDetails}
          onClose={handleClose}
          onMakeAnotherPayment={handleMakeAnotherPayment}
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
          isPayeesLoaded={!isLoadingRecipients && !isLoadingLinkedAccounts}
          initialAccountId={initialAccountId}
          initialPayeeId={initialPayeeId}
          fxConfig={fxConfig}
          supportedTargetCurrencies={supportedTargetCurrencies}
        />
      )}
    </FlowContainer>
  );
}
