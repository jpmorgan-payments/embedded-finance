/**
 * FXSuccessView
 *
 * Payment success confirmation for PaymentFlowFX. Extends the domestic success
 * screen with FX details: a "being converted to {currency}" note, and — once
 * the post-submit enrichment resolves — the settled target amount and exchange
 * rate (SPECIFICATION.md FR-FX-9). Enrichment is best-effort; the screen
 * degrades gracefully when it is unavailable.
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Check, Copy, Loader2 } from 'lucide-react';

import type {
  TransactionGetResponseV3,
  TransactionResponseV3,
} from '@/api/generated/ep-transactions-v3.schemas';
import { Button } from '@/components/ui/button';

import { useFlowContext } from '../../PaymentFlow/FlowContainer';
import type {
  AccountResponse,
  PaymentMethod,
} from '../../PaymentFlow/PaymentFlow.types';
import { formatCurrency } from '../../PaymentFlow/utils/formatCurrency';
import type { FXPayee, PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import { formatTargetCurrency } from '../utils/format';

export interface FXSuccessViewProps {
  transactionResponse?: TransactionResponseV3;
  enrichedDetails?: TransactionGetResponseV3;
  isEnriching?: boolean;
  formData: PaymentFlowFXFormData;
  payees: FXPayee[];
  accounts: AccountResponse[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onMakeAnotherPayment?: () => void;
  locale?: string;
}

export function FXSuccessView({
  transactionResponse,
  enrichedDetails,
  isEnriching = false,
  formData,
  payees,
  accounts,
  paymentMethods,
  onClose,
  onMakeAnotherPayment,
  locale = 'en-US',
}: FXSuccessViewProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  const { replaceView, setFormData } = useFlowContext();
  const [copied, setCopied] = useState(false);

  const handleMakeAnotherPayment = useCallback(() => {
    setFormData({
      payeeId: undefined,
      payee: undefined,
      unsavedRecipient: undefined,
      fromAccountId: undefined,
      availableBalance: undefined,
      paymentMethod: undefined,
      amount: '',
      memo: undefined,
      targetCurrency: undefined,
      fxQuote: undefined,
    });
    replaceView('main');
    onMakeAnotherPayment?.();
  }, [setFormData, replaceView, onMakeAnotherPayment]);

  const amount = parseFloat(formData.amount) || 0;
  const payee = payees.find((p) => p.id === formData.payeeId);
  const { unsavedRecipient, targetCurrency } = formData;
  const account = accounts.find((a) => a.id === formData.fromAccountId);
  const selectedMethod = paymentMethods.find(
    (m) => m.id === formData.paymentMethod
  );
  const transactionId =
    transactionResponse?.id ?? transactionResponse?.transactionReferenceId;

  const recipientInfo = useMemo(() => {
    if (payee) {
      return {
        name: payee.name,
        lastFour: payee.accountNumber?.slice(-4),
      };
    }
    if (unsavedRecipient) {
      return {
        name: unsavedRecipient.displayName,
        lastFour: unsavedRecipient.accountNumber?.slice(-4),
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

  // Settled FX details from enrichment (best-effort). V3 amounts/rates are strings.
  const settledTargetAmount =
    enrichedDetails?.targetAmount !== undefined
      ? parseFloat(enrichedDetails.targetAmount)
      : undefined;
  const settledTargetCurrency =
    enrichedDetails?.targetCurrency ?? targetCurrency;
  const settledRate =
    enrichedDetails?.fxInformation?.exchangeRate !== undefined
      ? parseFloat(enrichedDetails.fxInformation.exchangeRate)
      : undefined;

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center">
      <div className="eb-mb-6 eb-flex eb-h-16 eb-w-16 eb-items-center eb-justify-center eb-rounded-full eb-bg-green-600 eb-duration-300 eb-animate-in eb-zoom-in-50">
        <Check className="eb-h-8 eb-w-8 eb-text-white" strokeWidth={3} />
      </div>

      <h2 className="eb-mb-2 eb-text-xl eb-font-semibold eb-text-foreground">
        {t('fx.paymentSent', 'Payment Sent!')}
      </h2>
      <p className="eb-mb-2 eb-text-muted-foreground">
        {t(
          'fx.paymentInitiated',
          'Your payment of {{amount}} has been initiated',
          {
            amount: formatCurrency(amount),
          }
        )}
      </p>
      {targetCurrency && targetCurrency !== 'USD' && (
        <p className="eb-mb-6 eb-text-sm eb-text-muted-foreground">
          {t('fx.beingConverted', 'Being converted to {{currency}}', {
            currency: targetCurrency,
          })}
        </p>
      )}

      <div className="eb-w-full eb-max-w-sm eb-space-y-3 eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-4 eb-text-left">
        {recipientInfo && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('reviewPanel.toLabel', 'To')}
            </span>
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
            </div>
          </div>
        )}
        {account && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('reviewPanel.fromLabel', 'From')}
            </span>
            <span className="eb-text-sm eb-font-medium">
              {account.label ?? t('fx.accountFallback', 'Account')}
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
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('reviewPanel.methodLabel', 'Method')}
            </span>
            <span className="eb-text-sm eb-font-medium">
              {selectedMethod.name}
            </span>
          </div>
        )}
        <div className="eb-flex eb-justify-between">
          <span className="eb-text-sm eb-text-muted-foreground">
            {t('reviewPanel.amountLabel', 'Amount')}
          </span>
          <span className="eb-text-sm eb-font-medium">
            {formatCurrency(amount)}
          </span>
        </div>

        {/* FX settlement details (from enrichment) */}
        {settledTargetAmount !== undefined &&
          Number.isFinite(settledTargetAmount) &&
          settledTargetCurrency && (
            <div className="eb-flex eb-justify-between">
              <span className="eb-text-sm eb-text-muted-foreground">
                {t('fx.recipientReceives', 'Recipient receives')}
              </span>
              <span className="eb-text-sm eb-font-medium">
                {formatTargetCurrency(
                  settledTargetAmount,
                  settledTargetCurrency,
                  locale
                )}
              </span>
            </div>
          )}
        {settledRate !== undefined &&
          Number.isFinite(settledRate) &&
          settledTargetCurrency && (
            <div className="eb-flex eb-justify-between">
              <span className="eb-text-sm eb-text-muted-foreground">
                {t('fx.exchangeRate', 'Exchange rate')}
              </span>
              <span className="eb-text-sm eb-font-medium">
                {t('fx.rateLine', '1 USD = {{rate}} {{currency}}', {
                  rate: settledRate.toLocaleString(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }),
                  currency: settledTargetCurrency,
                })}
              </span>
            </div>
          )}
        {isEnriching &&
          settledTargetAmount === undefined &&
          targetCurrency &&
          targetCurrency !== 'USD' && (
            <div className="eb-flex eb-items-center eb-justify-end eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
              <Loader2 className="eb-h-3 eb-w-3 eb-animate-spin" />
              {t('fx.loadingSettlement', 'Loading conversion details...')}
            </div>
          )}

        {enrichedDetails?.status && (
          <div className="eb-flex eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('reviewPanel.statusLabel', 'Status')}
            </span>
            <span className="eb-text-sm eb-font-medium eb-capitalize">
              {enrichedDetails.status.toLowerCase().replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {transactionId && (
          <div className="eb-flex eb-items-center eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('reviewPanel.referenceLabel', 'Reference')}
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

      <div className="eb-mt-6 eb-flex eb-w-full eb-max-w-sm eb-flex-col eb-gap-2">
        <Button
          variant="outline"
          onClick={handleMakeAnotherPayment}
          className="eb-w-full"
        >
          {t('fx.makeAnotherPayment', 'Make Another Payment')}
        </Button>
        <Button onClick={onClose} className="eb-w-full">
          {t('fx.done', 'Done')}
        </Button>
      </div>
    </div>
  );
}
