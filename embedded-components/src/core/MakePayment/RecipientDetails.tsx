import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Recipient } from './types';
import { maskAccount, renderRecipientName } from './utils';

interface RecipientDetailsProps {
  selectedRecipient: Recipient | undefined;
}

export const RecipientDetails: React.FC<RecipientDetailsProps> = ({
  selectedRecipient,
}) => {
  const { t } = useTranslation(['make-payment']);

  if (!selectedRecipient) return null;

  return (
    <div className="eb-space-y-2 eb-rounded-md eb-border eb-p-3">
      <div className="eb-text-sm eb-font-medium">
        {t('sections.recipientDetails', {
          defaultValue: 'Recipient details',
        })}
      </div>
      <div className="eb-grid eb-grid-cols-1 eb-gap-x-4 eb-text-sm sm:eb-grid-cols-2">
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.individualName', {
              defaultValue: 'Individual name',
            })}
          </span>
          <span className="sm:eb-block">
            {renderRecipientName(selectedRecipient)}
          </span>
        </div>
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.country', {
              defaultValue: 'Country',
            })}
          </span>
          <span className="sm:eb-block">
            {(selectedRecipient as any)?.address?.country || 'United States'}
          </span>
        </div>
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.currency', {
              defaultValue: 'Currency',
            })}
          </span>
          <span className="sm:eb-block">USD</span>
        </div>
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.routingNumber', {
              defaultValue: 'Routing number',
            })}
          </span>
          <span className="sm:eb-block">
            {(selectedRecipient as any)?.account?.routingInformation?.[0]
              ?.routingNumber || '—'}
          </span>
        </div>
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.accountType', {
              defaultValue: 'Account type',
            })}
          </span>
          <span className="sm:eb-block">
            {(selectedRecipient as any)?.account?.type || 'Checking'}
          </span>
        </div>
        <div className="eb-flex eb-justify-between sm:eb-block">
          <span className="eb-text-muted-foreground">
            {t('labels.accountNumber', {
              defaultValue: 'Account number',
            })}
          </span>
          <span className="sm:eb-block">
            {maskAccount(selectedRecipient?.account?.number)}
          </span>
        </div>
      </div>
      <div className="eb-text-[11px] eb-text-muted-foreground">
        {t('helpers.recipientDetails', {
          defaultValue:
            'These details are derived from the selected recipient.',
        })}
      </div>
    </div>
  );
};
