import React from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
}) => (
  <Card className="eb-mb-4 eb-space-y-2 eb-p-4 eb-shadow-sm">
    <div className="eb-flex eb-items-center eb-justify-between">
      <div className="eb-truncate eb-text-base eb-font-semibold">
        {isWidget ? (
          <Button
            variant="link"
            className="eb-h-auto eb-p-0 eb-text-left eb-font-semibold hover:eb-underline"
            onClick={onView}
            title="View recipient details"
          >
            {formatRecipientName(recipient)}
          </Button>
        ) : (
          formatRecipientName(recipient)
        )}
      </div>
      <Badge variant="outline" className="eb-text-sm">
        {recipient.partyDetails?.type === 'INDIVIDUAL'
          ? 'Individual'
          : 'Business'}
      </Badge>
    </div>
    <div className="eb-flex eb-items-center eb-gap-2">
      <StatusBadge status={recipient.status!} />
      <span className="eb-text-xs eb-text-gray-500">
        {recipient.createdAt
          ? new Date(recipient.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A'}
      </span>
    </div>
    <div className="eb-text-xs eb-text-gray-600">
      <span className="eb-font-medium">Account:</span>{' '}
      {recipient.account?.number
        ? `****${recipient.account.number.slice(-4)}`
        : 'N/A'}
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
        <span className="eb-text-xs eb-text-gray-400">No payment methods</span>
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
            onClick={onView}
            title="View details"
          >
            Details
          </Button>
          <Button
            variant="link"
            size="sm"
            className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
            onClick={onEdit}
            title="Edit recipient"
          >
            Edit
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
              onClick={onDeactivate}
              disabled={isDeactivating}
              title="Deactivate recipient"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          )}
        </>
      )}
    </div>
  </Card>
);
