import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { ListAccountsResponse, PaymentFormData, Recipient } from './types';
import { formatCurrency, maskAccount, renderRecipientName } from './utils';

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
            <div className="eb-text-2xl eb-font-semibold">
              {amount > 0 ? formatCurrency(amount) : '0.00'} USD
            </div>
            {method && recipient && (
              <div className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                {t('review.subtitle', {
                  defaultValue: `${method} to ${renderRecipientName(recipient)}`,
                })}
              </div>
            )}
            <div className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
              {t('review.schedule', {
                defaultValue: `Scheduled for ${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
              })}
            </div>
          </div>

          {recipient && (
            <div className="eb-space-y-2">
              <div className="eb-text-sm eb-font-medium">
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
            <div className="eb-text-sm eb-font-medium">
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
                <span>${(recipient ? getFee(method, []) : 0).toFixed(2)}</span>
              </div>
              <div className="eb-flex eb-justify-between eb-font-medium">
                <span>{t('labels.total', { defaultValue: 'Total' })}</span>
                <span>
                  ${(amount + (recipient ? getFee(method, []) : 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for fee calculation (simplified for ReviewPanel)
const getFee = (paymentMethodId: string, paymentMethods: any[]): number => {
  // This is a simplified version - in real implementation,
  // you'd pass the actual payment methods array
  const feeMap: Record<string, number> = {
    ACH: 2.5,
    RTP: 1,
    WIRE: 25,
  };
  return feeMap[paymentMethodId] || 0;
};
