import React from 'react';
import { ArrowRightIcon, BuildingIcon, PlusIcon, UserIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui';

import { LinkedAccountCardProps } from '../LinkedAccountWidget.types';
import {
  canMakePayment,
  canVerifyMicrodeposits,
  getAccountHolderType,
  getMaskedAccountNumber,
  getRecipientDisplayName,
  getSupportedPaymentMethods,
  needsAdditionalRouting,
} from '../utils/recipientHelpers';
import { StatusAlert } from './StatusAlert';
import { StatusBadge } from './StatusBadge';

/**
 * LinkedAccountCard - Displays a single linked account with its details and actions
 * Enhanced with better visual hierarchy and contextual information
 */
export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  recipient,
  makePaymentComponent,
  onVerifyClick,
  onUpdateRoutingClick,
}) => {
  const displayName = getRecipientDisplayName(recipient);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const accountType = getAccountHolderType(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const showAddRoutingButton = needsAdditionalRouting(recipient);

  return (
    <Card className="eb-h-full eb-overflow-hidden eb-transition-shadow hover:eb-shadow-md">
      <CardContent className="eb-flex eb-h-full eb-flex-col eb-p-0">
        {/* Header Section */}
        <div className="eb-space-y-3 eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
            <div className="eb-flex-1 eb-space-y-1.5">
              <h3 className="eb-truncate eb-text-base eb-font-semibold eb-leading-tight">
                {displayName}
              </h3>
              <div className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                {accountType === 'Individual' ? (
                  <UserIcon className="eb-h-3.5 eb-w-3.5" />
                ) : (
                  <BuildingIcon className="eb-h-3.5 eb-w-3.5" />
                )}
                <span>{accountType}</span>
              </div>
            </div>
            {recipient.status && <StatusBadge status={recipient.status} />}
          </div>

          {/* Account Information */}
          <div className="eb-space-y-1.5">
            <div className="eb-flex eb-items-center eb-justify-between">
              <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                Account Number
              </span>
              <span className="eb-font-mono eb-text-sm eb-font-medium">
                {maskedAccount}
              </span>
            </div>

            {/* Supported Payment Methods */}
            <div className="eb-flex eb-items-center eb-justify-between">
              <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                Payment Methods
              </span>
              <div className="eb-flex eb-flex-wrap eb-justify-end eb-gap-1">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <Badge
                      key={method}
                      variant="secondary"
                      className="eb-text-xs"
                    >
                      {method}
                    </Badge>
                  ))
                ) : (
                  <span className="eb-text-xs eb-text-muted-foreground">
                    None configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert - Show for non-active statuses or when action is needed */}
        {recipient.status && recipient.status !== 'ACTIVE' && (
          <>
            <Separator />
            <div className="eb-px-4 eb-py-3">
              <StatusAlert status={recipient.status} />
            </div>
          </>
        )}

        {/* Action Buttons Section */}
        {(showVerifyButton || showPaymentButton || showAddRoutingButton) && (
          <>
            <Separator />
            <div className="eb-mt-auto eb-flex eb-flex-wrap eb-gap-2 eb-bg-muted/30 eb-p-3">
              {showVerifyButton && (
                <Button
                  variant="default"
                  size="sm"
                  className="eb-min-w-[120px] eb-flex-1"
                  onClick={() => onVerifyClick?.(recipient.id)}
                >
                  Verify Account
                  <ArrowRightIcon className="eb-ml-1 eb-h-3.5 eb-w-3.5" />
                </Button>
              )}

              {showAddRoutingButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="eb-min-w-[120px]"
                  onClick={() => onUpdateRoutingClick?.(recipient.id)}
                >
                  <PlusIcon className="eb-mr-1 eb-h-3.5 eb-w-3.5" />
                  Add Wire/RTP
                </Button>
              )}

              {showPaymentButton && makePaymentComponent && (
                <>
                  {React.cloneElement(
                    makePaymentComponent as React.ReactElement,
                    {
                      recipientId: recipient.id,
                    }
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
