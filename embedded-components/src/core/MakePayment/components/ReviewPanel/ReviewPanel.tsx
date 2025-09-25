import React, { useMemo } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  User,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  ListAccountsResponse,
  PaymentFormData,
  Recipient,
} from '../../types';
import { formatCurrency, maskAccount, renderRecipientName } from '../../utils';

interface ReviewPanelProps {
  filteredRecipients: Recipient[];
  accounts: ListAccountsResponse | undefined;
  accountsStatus: string;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  filteredRecipients,
  accounts,
  accountsStatus,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  const today = useMemo(() => new Date(), []);

  const amount = Number.parseFloat(form.watch('amount') || '0');
  const from = form.watch('from');
  const to = form.watch('to');
  const method = form.watch('method');
  const memo = form.watch('memo');

  const recipient = filteredRecipients?.find((r) => r.id === to);

  return (
    <div className="eb-sticky eb-top-0 eb-space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="eb-text-base eb-font-semibold">
            {t('review.title', { defaultValue: 'Review payment' })}
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
              {t('review.schedule', {
                defaultValue: `Scheduled for ${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
              })}
            </div>
          </div>

          {recipient && (
            <div className="eb-space-y-2">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                <User className="eb-h-4 eb-w-4" />
                {t('sections.recipientDetails', {
                  defaultValue: 'Recipient details',
                })}
              </div>
              <div className="eb-rounded-md eb-border eb-p-3 eb-text-sm">
                <div className="eb-flex eb-justify-between">
                  <span className="eb-text-muted-foreground">
                    {t('labels.individualName', {
                      defaultValue: 'Individual name',
                    })}
                  </span>
                  <span>{renderRecipientName(recipient)}</span>
                </div>
                <div className="eb-flex eb-justify-between">
                  <span className="eb-text-muted-foreground">
                    {t('labels.routingNumber', {
                      defaultValue: 'Routing number',
                    })}
                  </span>
                  <span>
                    {(recipient as any)?.account?.routingInformation?.[0]
                      ?.routingNumber || '—'}
                  </span>
                </div>
                <div className="eb-flex eb-justify-between">
                  <span className="eb-text-muted-foreground">
                    {t('labels.accountType', {
                      defaultValue: 'Account type',
                    })}
                  </span>
                  <span>{(recipient as any)?.account?.type || '—'}</span>
                </div>
                <div className="eb-flex eb-justify-between">
                  <span className="eb-text-muted-foreground">
                    {t('labels.accountNumber', {
                      defaultValue: 'Account number',
                    })}
                  </span>
                  <span>{maskAccount(recipient?.account?.number)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="eb-space-y-2">
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
              <Building2 className="eb-h-4 eb-w-4" />
              {t('sections.paymentDetails', {
                defaultValue: 'Payment details',
              })}
            </div>
            <div className="eb-space-y-1 eb-rounded-md eb-border eb-p-3 eb-text-sm">
              <div className="eb-flex eb-justify-between">
                <span className="eb-text-muted-foreground">
                  {t('labels.payFrom', { defaultValue: 'Pay from' })}
                </span>
                <span>
                  {accountsStatus === 'success'
                    ? accounts?.items.find((a: any) => a.id === from)?.label ||
                      '—'
                    : '—'}
                </span>
              </div>
              <div className="eb-flex eb-justify-between">
                <span className="eb-text-muted-foreground">
                  {t('labels.paymentMethod', {
                    defaultValue: 'Payment method',
                  })}
                </span>
                <span>
                  {method
                    ? t(`paymentMethods.${method}`, { defaultValue: method })
                    : '—'}
                </span>
              </div>
              <div className="eb-flex eb-justify-between">
                <span className="eb-text-muted-foreground">
                  {t('labels.fee', { defaultValue: 'Fee' })}
                </span>
                <span>
                  ${formatCurrency(recipient && method ? getFee(method) : 0)}
                </span>
              </div>
              <div className="eb-flex eb-justify-between eb-font-medium">
                <span>{t('labels.total', { defaultValue: 'Total' })}</span>
                <span>
                  ${formatCurrency(
                    amount + (recipient && method ? getFee(method) : 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section 7: Additional Notes */}
          {memo && (
            <div className="eb-space-y-2">
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                <FileText className="eb-h-4 eb-w-4" />
                {t('sections.additionalNotes', {
                  defaultValue: 'Additional Notes',
                })}
              </div>
              <div className="eb-rounded-md eb-border eb-p-3 eb-text-sm">
                <div className="eb-text-muted-foreground">{memo}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for fee calculation (simplified for ReviewPanel)
const getFee = (paymentMethodId: string): number => {
  // This is a simplified version - in real implementation,
  // you'd pass the actual payment methods array
  const feeMap: Record<string, number> = {
    ACH: 2.5,
    RTP: 1,
    WIRE: 25,
  };
  return feeMap[paymentMethodId] || 0;
};
