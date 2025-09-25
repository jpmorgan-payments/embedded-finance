import React, { useMemo } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  ListAccountsResponse,
  PaymentFormData,
  Recipient,
} from '../../types';
import { formatCurrency, maskAccount, renderRecipientName } from '../../utils';

interface PaymentSuccessProps {
  onMakeAnotherPayment: () => void;
  filteredRecipients: Recipient[];
  accounts: ListAccountsResponse | undefined;
  formData: PaymentFormData;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  onMakeAnotherPayment,
  filteredRecipients,
  accounts,
  formData,
}) => {
  const { t } = useTranslation(['make-payment']);

  const today = useMemo(() => new Date(), []);

  const { amount: amountStr, from, to, method, memo } = formData;
  const amount = Number.parseFloat(amountStr || '0');

  const recipient = filteredRecipients?.find((r) => r.id === to);
  const fromAccount = accounts?.items?.find((a) => a.id === from);

  return (
    <div className="eb-space-y-6">
      {/* Success Message */}
      <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-4 eb-rounded-lg eb-bg-muted eb-p-6 eb-text-center">
        <h2 className="eb-text-xl eb-font-semibold">{t('success.title')}</h2>
        <p className="eb-text-muted-foreground">{t('success.message')}</p>
      </div>

      {/* Payment Review Information */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-text-base eb-font-semibold">
            {t('success.reviewTitle', { defaultValue: 'Payment Details' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-4">
          <div>
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-2xl eb-font-semibold">
              <DollarSign className="eb-h-6 eb-w-6" />
              {amount > 0 ? formatCurrency(amount) : '0.00'} USD
            </div>
            {method && recipient && (
              <div className="eb-mt-1 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                <CreditCard className="eb-h-4 eb-w-4" />
                {t('review.subtitle', {
                  defaultValue: `${method} to ${renderRecipientName(recipient)}`,
                })}
              </div>
            )}
            <div className="eb-mt-1 eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-muted-foreground">
              <Calendar className="eb-h-3 eb-w-3" />
              {t('success.processedDate', {
                defaultValue: `Processed on ${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
              })}
            </div>
          </div>

          {recipient && (
            <div className="eb-space-y-2">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                <User className="eb-h-4 eb-w-4" />
                {t('review.recipient', { defaultValue: 'Recipient' })}
              </div>
              <div className="eb-ml-6 eb-space-y-1 eb-text-sm">
                <div className="eb-font-medium">
                  {renderRecipientName(recipient)}
                </div>
                <div className="eb-text-muted-foreground">
                  {maskAccount(recipient.account?.number)}
                </div>
              </div>
            </div>
          )}

          {fromAccount && (
            <div className="eb-space-y-2">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                <Building2 className="eb-h-4 eb-w-4" />
                {t('review.fromAccount', { defaultValue: 'From Account' })}
              </div>
              <div className="eb-ml-6 eb-text-sm">
                <div className="eb-font-medium">{fromAccount.label}</div>
                <div className="eb-text-muted-foreground">
                  {fromAccount.category}
                </div>
              </div>
            </div>
          )}

          {memo && (
            <div className="eb-space-y-2">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                <FileText className="eb-h-4 eb-w-4" />
                {t('review.memo', { defaultValue: 'Memo' })}
              </div>
              <div className="eb-ml-6 eb-text-sm eb-text-muted-foreground">
                {memo}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Another Payment Button */}
      <div className="eb-flex eb-justify-center">
        <Button onClick={onMakeAnotherPayment} variant="outline">
          {t('buttons.makeAnotherPayment')}
        </Button>
      </div>
    </div>
  );
};
