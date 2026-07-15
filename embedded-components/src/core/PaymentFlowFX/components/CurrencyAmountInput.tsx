/**
 * CurrencyAmountInput
 *
 * Amount entry for the FX transfer step, plus a memo field with a character
 * counter (SPECIFICATION.md V-5).
 *
 * - Domestic (USD) payments: a single USD field, matching PaymentFlow's
 *   AmountMemoSection.
 * - Cross-border payouts: a bidirectional dual-currency input. The user can
 *   define the amount in EITHER the debit currency (USD — "You send") OR the
 *   credit currency (the recipient's currency — "Recipient gets"); the other
 *   side is derived live from the FX rate, and a caption spells out exactly how
 *   the conversion is applied (FR-FX-7).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowDownUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { formatTargetCurrency } from '../utils/format';

/** Max memo length for cross-border payments (SPECIFICATION.md V-5). */
export const FX_MEMO_MAX_LENGTH = 140;
/** Show the memo counter once the user is within this many chars of the limit. */
const MEMO_COUNTER_THRESHOLD = 120;

/**
 * Resolve the number of minor-unit digits a currency uses (e.g. 2 for USD/EUR,
 * 0 for zero-decimal currencies like KRW/VND). Falls back to 2 when unknown.
 */
function getCurrencyFractionDigits(currency: string, locale: string): number {
  try {
    return (
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Shared numeric-key guard for the amount inputs. */
function blockNonNumericKeys(e: React.KeyboardEvent) {
  if (
    ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.'].includes(e.key) ||
    (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
    ['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)
  ) {
    return;
  }
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Sanitize a raw amount string to digits with at most `fractionDigits` decimals,
 * mirroring the parent flow's amount handling (single dot, trimmed leading
 * zeros). `fractionDigits === 0` drops the decimal portion entirely.
 */
function sanitizeAmountValue(value: string, fractionDigits: number): string {
  if (value === '') return '';
  let sanitized = value.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (fractionDigits === 0) {
    [sanitized] = sanitized.split('.');
  } else if (parts.length === 2 && parts[1].length > fractionDigits) {
    sanitized = `${parts[0]}.${parts[1].slice(0, fractionDigits)}`;
  }
  if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
    sanitized = sanitized.replace(/^0+/, '');
  }
  return sanitized;
}

export interface CurrencyAmountInputProps {
  amount: string;
  memo?: string;
  exceedsBalance: boolean;
  availableBalance?: number;
  hasAmountError: boolean;
  onAmountChange: (amount: string) => void;
  onMemoChange: (memo: string) => void;
  isSubmitting: boolean;
  amountInputRef: React.RefObject<HTMLInputElement>;
  amountSectionRef: React.RefObject<HTMLDivElement>;
  /** Active target currency (undefined for domestic/USD). */
  targetCurrency?: string;
  /** Effective exchange rate (target units per 1 USD), when a quote exists. */
  fxRate?: number;
  /** Whether the current rate is indicative rather than locked. */
  isIndicativeRate?: boolean;
  /** Locale for number formatting. */
  locale?: string;
}

export function CurrencyAmountInput({
  amount,
  memo,
  exceedsBalance,
  availableBalance,
  hasAmountError,
  onAmountChange,
  onMemoChange,
  isSubmitting,
  amountInputRef,
  amountSectionRef,
  targetCurrency,
  fxRate,
  isIndicativeRate,
  locale = 'en-US',
}: CurrencyAmountInputProps) {
  const { t, tString } = useTranslationWithTokens(['make-payment']);

  // Cross-border mode is driven by the *currency*, not the transient rate: the
  // dual-currency UI must stay mounted while a quote is (re)fetching, otherwise
  // the "Recipient gets" field unmounts on every keystroke (layout shift).
  const isFxCurrency = !!targetCurrency && targetCurrency !== 'USD';

  // Keep the last valid rate for the current currency so conversions stay stable
  // while the quote reloads (provider/realtime modes blank `fxRate` on each
  // amount change). Guarded by currency so a payee switch never reuses a stale rate.
  const [stickyRate, setStickyRate] = useState<{
    currency: string;
    rate: number;
  } | null>(null);
  useEffect(() => {
    if (isFxCurrency && fxRate !== undefined && fxRate > 0) {
      setStickyRate({ currency: targetCurrency as string, rate: fxRate });
    }
  }, [isFxCurrency, targetCurrency, fxRate]);

  const effectiveRate =
    fxRate !== undefined && fxRate > 0
      ? fxRate
      : stickyRate && stickyRate.currency === targetCurrency
        ? stickyRate.rate
        : undefined;
  const hasRate = effectiveRate !== undefined && effectiveRate > 0;

  const targetFractionDigits = useMemo(
    () =>
      targetCurrency ? getCurrencyFractionDigits(targetCurrency, locale) : 2,
    [targetCurrency, locale]
  );

  const numericAmount = parseFloat(amount) || 0;
  const computedCredit = hasRate
    ? numericAmount * (effectiveRate as number)
    : 0;

  // Each side keeps a local draft so the field the user is actively typing in is
  // never overwritten by the value derived on re-render (the parent reducer +
  // FX-quote refetch round-trip previously caused the inputs to flicker).
  // `lastEdited` records which side currently drives the conversion.
  const [debitDraft, setDebitDraft] = useState<string | null>(null);
  const [creditDraft, setCreditDraft] = useState<string | null>(null);
  const [lastEdited, setLastEdited] = useState<'debit' | 'credit'>('debit');

  // Reset drafts when the target currency changes (payee switch)…
  useEffect(() => {
    setDebitDraft(null);
    setCreditDraft(null);
    setLastEdited('debit');
  }, [targetCurrency]);
  // …or when the amount is cleared externally (e.g. make-another-payment reset).
  useEffect(() => {
    if (amount === '') {
      setDebitDraft(null);
      setCreditDraft(null);
    }
  }, [amount]);

  // "You send" shows the user's draft while they own the field, else the
  // canonical USD amount coming from the parent.
  const debitValue =
    lastEdited === 'debit' && debitDraft !== null ? debitDraft : amount;

  // "Recipient gets" shows the user's draft while they own the field, else the
  // amount derived live from the FX rate.
  const creditValue =
    lastEdited === 'credit' && creditDraft !== null
      ? creditDraft
      : computedCredit > 0
        ? computedCredit.toFixed(targetFractionDigits)
        : '';

  const convertedAmount =
    hasRate && numericAmount > 0
      ? formatTargetCurrency(computedCredit, targetCurrency as string, locale)
      : null;

  // The USD ("You send") field is the source of truth for the submitted amount.
  const handleDebitChange = (value: string) => {
    const sanitized = sanitizeAmountValue(value, 2);
    setLastEdited('debit');
    setDebitDraft(sanitized);
    setCreditDraft(null);
    onAmountChange(sanitized);
  };

  // Editing the credit ("Recipient gets") field back-calculates the USD amount.
  const handleCreditChange = (value: string) => {
    const sanitized = sanitizeAmountValue(value, targetFractionDigits);
    setLastEdited('credit');
    setCreditDraft(sanitized);
    setDebitDraft(null);
    const numericCredit = parseFloat(sanitized) || 0;
    if (sanitized === '' || numericCredit === 0) {
      onAmountChange('');
    } else if (hasRate) {
      onAmountChange((numericCredit / (effectiveRate as number)).toFixed(2));
    }
  };

  const memoLength = memo?.length ?? 0;
  const showMemoCounter = memoLength >= MEMO_COUNTER_THRESHOLD;

  const handleMemoChange = (value: string) => {
    // Hard-limit the memo to the FX max length.
    onMemoChange(value.slice(0, FX_MEMO_MAX_LENGTH));
  };

  return (
    <div ref={amountSectionRef} className="eb-space-y-4">
      <div>
        <label
          htmlFor="fx-amount"
          className={cn(
            'eb-mb-1.5 eb-block eb-text-sm eb-font-medium',
            hasAmountError && 'eb-text-destructive'
          )}
        >
          {isFxCurrency
            ? t('fx.youSendLabel', 'You send')
            : t('amountSection.amountLabel', 'Amount')}
          {hasAmountError && (
            <span className="eb-ml-1 eb-text-xs eb-font-normal">
              {t('amountSection.required', '(Required)')}
            </span>
          )}
        </label>
        <div className="eb-relative eb-flex eb-items-center">
          <span
            className={cn(
              'eb-absolute eb-left-3',
              exceedsBalance || hasAmountError
                ? 'eb-text-destructive'
                : 'eb-text-muted-foreground'
            )}
          >
            $
          </span>
          <Input
            ref={amountInputRef}
            id="fx-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={debitValue}
            onChange={(e) => handleDebitChange(e.target.value)}
            onKeyDown={blockNonNumericKeys}
            className={cn(
              'eb-w-full eb-pl-7 eb-pr-14',
              (exceedsBalance || hasAmountError) &&
                'eb-border-destructive eb-text-destructive focus-visible:eb-ring-destructive'
            )}
            autoComplete="off"
            disabled={isSubmitting}
          />
          <span className="eb-absolute eb-right-3 eb-text-sm eb-font-medium eb-text-muted-foreground">
            USD
          </span>
        </div>

        {/* Cross-border: editable credit-currency amount with a live rate. */}
        {isFxCurrency && (
          <>
            <div className="eb-my-2 eb-flex eb-items-center eb-gap-2">
              <span className="eb-flex eb-h-6 eb-w-6 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted eb-text-muted-foreground">
                <ArrowDownUp className="eb-h-3.5 eb-w-3.5" />
              </span>
              <span className="eb-text-xs eb-text-muted-foreground">
                {hasRate
                  ? t('fx.rateLine', '1 USD = {{rate}} {{currency}}', {
                      rate: (effectiveRate as number).toLocaleString(locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      }),
                      currency: targetCurrency,
                    })
                  : t('fx.rateLoading', 'Getting the latest rate…')}
                {hasRate && isIndicativeRate && (
                  <span className="eb-ml-1">
                    {t('fx.indicativeSuffix', '(indicative)')}
                  </span>
                )}
              </span>
            </div>

            <label
              htmlFor="fx-target-amount"
              className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
            >
              {t('fx.recipientGetsLabel', 'Recipient gets (approx.)')}
            </label>
            <div className="eb-relative eb-flex eb-items-center">
              <Input
                id="fx-target-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={creditValue}
                onChange={(e) => handleCreditChange(e.target.value)}
                onKeyDown={blockNonNumericKeys}
                className="eb-w-full eb-pr-16"
                autoComplete="off"
                disabled={isSubmitting}
              />
              <span className="eb-absolute eb-right-3 eb-text-sm eb-font-medium eb-text-muted-foreground">
                {targetCurrency}
              </span>
            </div>

            {convertedAmount && (
              <p
                className="eb-mt-1.5 eb-text-xs eb-text-muted-foreground"
                aria-live="polite"
              >
                {t(
                  'fx.conversionCaption',
                  'Recipient gets ≈ {{amount}}, converted from your USD at the rate above.',
                  { amount: convertedAmount }
                )}
              </p>
            )}
          </>
        )}

        {exceedsBalance && availableBalance !== undefined && (
          <p className="eb-mt-1.5 eb-text-sm eb-text-destructive">
            {t(
              'amountSection.exceedsBalance',
              'Amount exceeds available balance ($'
            )}
            {availableBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            )
          </p>
        )}
      </div>

      <div>
        <div className="eb-mb-1.5 eb-flex eb-items-center eb-justify-between">
          <label
            htmlFor="fx-memo"
            className="eb-block eb-text-sm eb-font-medium"
          >
            {t('amountSection.memoLabel', 'Memo')}{' '}
            <span className="eb-font-normal eb-text-muted-foreground">
              {t('amountSection.optional', '(optional)')}
            </span>
          </label>
          {showMemoCounter && (
            <span
              className={cn(
                'eb-text-xs eb-text-muted-foreground',
                memoLength >= FX_MEMO_MAX_LENGTH && 'eb-text-destructive'
              )}
            >
              {memoLength}/{FX_MEMO_MAX_LENGTH}
            </span>
          )}
        </div>
        <Textarea
          id="fx-memo"
          placeholder={tString(
            'amountSection.memoPlaceholder',
            'Add a note...'
          )}
          value={memo ?? ''}
          onChange={(e) => handleMemoChange(e.target.value)}
          maxLength={FX_MEMO_MAX_LENGTH}
          rows={2}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}
