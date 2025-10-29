import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { LinkedAccountCardProps } from '../LinkedAccountWidget.types';
import {
  canMakePayment,
  canVerifyMicrodeposits,
  formatRecipientDate,
  getMaskedAccountNumber,
  getRecipientDisplayName,
  getSupportedPaymentMethods,
} from '../utils/recipientHelpers';
import { StatusBadge } from './StatusBadge';

/**
 * LinkedAccountCard - Displays a single linked account with its details and actions
 */
export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  recipient,
  makePaymentComponent,
  onVerifyClick,
}) => {
  const displayName = getRecipientDisplayName(recipient);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const formattedDate = formatRecipientDate(recipient.createdAt);

  return (
    <div className="eb-space-y-2 eb-rounded-lg eb-border eb-p-4">
      {/* Header with name and type */}
      <div className="eb-flex eb-items-center eb-justify-between">
        <div className="eb-truncate eb-text-base eb-font-semibold">
          {displayName}
        </div>
        <Badge variant="outline" className="eb-text-sm">
          {recipient.partyDetails?.type === 'INDIVIDUAL'
            ? 'Individual'
            : 'Business'}
        </Badge>
      </div>

      {/* Status and creation date */}
      <div className="eb-flex eb-items-center eb-gap-2">
        {recipient.status && <StatusBadge status={recipient.status} />}
        <span className="eb-text-xs eb-text-gray-500">{formattedDate}</span>
      </div>

      {/* Account number */}
      <div className="eb-text-xs eb-text-gray-600">
        <span className="eb-font-medium">Account:</span> {maskedAccount}
      </div>

      {/* Supported payment methods */}
      <div className="eb-mt-1 eb-flex eb-flex-wrap eb-gap-1">
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <Badge key={method} variant="secondary" className="eb-text-xs">
              {method}
            </Badge>
          ))
        ) : (
          <span className="eb-text-xs eb-text-gray-400">
            No payment methods
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
        {showVerifyButton && (
          <Button
            variant="outline"
            size="sm"
            className="eb-text-xs"
            title="Verify microdeposits"
            onClick={() => onVerifyClick?.(recipient.id)}
          >
            Verify microdeposits
          </Button>
        )}
        {showPaymentButton && makePaymentComponent && (
          <div className="eb-ml-auto">
            {React.cloneElement(makePaymentComponent as React.ReactElement, {
              recipientId: recipient.id,
            })}
          </div>
        )}
      </div>
    </div>
  );
};
