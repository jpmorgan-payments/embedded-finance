import React from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { RECIPIENT_USER_JOURNEYS } from '../../Recipients.constants';
import { getSupportedPaymentMethods } from '../../utils/getSupportedPaymentMethods';
import { formatRecipientName } from '../../utils/recipientHelpers';
import { StatusBadge } from '../StatusBadge/StatusBadge';

export interface RecipientCardProps {
  recipient: Recipient;
  onView: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  canDeactivate: boolean;
  isDeactivating: boolean;
  makePaymentComponent?: React.ReactNode;
  isWidget?: boolean;
}

export const RecipientCard: React.FC<RecipientCardProps> = ({
  recipient,
  onView,
  onEdit,
  onDeactivate,
  canDeactivate,
  isDeactivating,
  makePaymentComponent,
  isWidget = false,
}) => {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  const locale = useLocale();
  const naText = t('common:na', { defaultValue: 'N/A' });

  return (
    <Card className="eb-mb-4 eb-space-y-2 eb-p-4 eb-shadow-sm">
      <div className="eb-flex eb-items-center eb-justify-between">
        <div className="eb-truncate eb-text-base eb-font-semibold">
          {isWidget ? (
            <Button
              variant="link"
              className="eb-h-auto eb-p-0 eb-text-left eb-font-semibold hover:eb-underline"
              data-user-event={RECIPIENT_USER_JOURNEYS.VIEW_DETAILS}
              onClick={onView}
              title={t('recipients:actions.viewRecipientDetails', {
                defaultValue: 'View recipient details',
              })}
            >
              {formatRecipientName(recipient)}
            </Button>
          ) : (
            formatRecipientName(recipient)
          )}
        </div>
        <Badge variant="outline" className="eb-text-sm">
          {recipient.partyDetails?.type === 'INDIVIDUAL'
            ? t('recipients:details.partyType.individual', {
                defaultValue: 'Individual',
              })
            : t('recipients:details.partyType.business', {
                defaultValue: 'Business',
              })}
        </Badge>
      </div>
      <div className="eb-flex eb-items-center eb-gap-2">
        <StatusBadge status={recipient.status!} />
        <span className="eb-text-xs eb-text-gray-500">
          {recipient.createdAt
            ? new Date(recipient.createdAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : naText}
        </span>
      </div>
      <div className="eb-text-xs eb-text-gray-600">
        <span className="eb-font-medium">
          {t('recipients:card.account', { defaultValue: 'Account:' })}
        </span>{' '}
        {recipient.account?.number
          ? `****${recipient.account.number.slice(-4)}`
          : naText}
      </div>
      {/* Supported Payment Methods */}
      <div className="eb-mt-1 eb-flex eb-flex-wrap eb-gap-1">
        {getSupportedPaymentMethods(recipient).length > 0 ? (
          getSupportedPaymentMethods(recipient).map((method) => (
            <Badge key={method} variant="secondary" className="eb-text-xs">
              {method}
            </Badge>
          ))
        ) : (
          <span className="eb-text-xs eb-text-gray-400">
            {t('recipients:card.noPaymentMethods', {
              defaultValue: 'No payment methods',
            })}
          </span>
        )}
      </div>
      <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-4">
        {makePaymentComponent && recipient.status === 'ACTIVE' && (
          <div className={isWidget ? 'eb-ml-auto' : 'eb-mr-auto'}>
            {React.cloneElement(makePaymentComponent as React.ReactElement, {
              recipientId: recipient.id,
            })}
          </div>
        )}
        {!isWidget && (
          <>
            <Button
              variant="link"
              size="sm"
              className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
              data-user-event={RECIPIENT_USER_JOURNEYS.VIEW_DETAILS}
              onClick={onView}
              title={t('recipients:actions.viewDetails', {
                defaultValue: 'View details',
              })}
            >
              {t('recipients:actions.viewDetails', {
                defaultValue: 'Details',
              })}
            </Button>
            <Button
              variant="link"
              size="sm"
              className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
              data-user-event={RECIPIENT_USER_JOURNEYS.EDIT_STARTED}
              onClick={onEdit}
              title={t('recipients:actions.editRecipientTitle', {
                defaultValue: 'Edit recipient',
              })}
            >
              {t('recipients:actions.edit', { defaultValue: 'Edit' })}
            </Button>
            {canDeactivate && (
              <Button
                variant="link"
                size="sm"
                className={`eb-h-auto eb-px-2 eb-py-0 eb-text-xs ${
                  isDeactivating
                    ? 'eb-cursor-not-allowed eb-text-gray-400'
                    : 'eb-text-red-600 hover:eb-text-red-700'
                }`}
                data-user-event={RECIPIENT_USER_JOURNEYS.DEACTIVATE_STARTED}
                onClick={onDeactivate}
                disabled={isDeactivating}
                title={t('recipients:actions.deactivateRecipientTitle', {
                  defaultValue: 'Deactivate recipient',
                })}
              >
                {isDeactivating
                  ? t('recipients:actions.deactivating', {
                      defaultValue: 'Deactivating...',
                    })
                  : t('recipients:actions.deactivate', {
                      defaultValue: 'Deactivate',
                    })}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
