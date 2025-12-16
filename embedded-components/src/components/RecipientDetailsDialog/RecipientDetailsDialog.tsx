import React, { useState } from 'react';
import { BuildingIcon, EyeIcon, EyeOffIcon, UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getMaskedAccountNumber,
  getSupportedPaymentMethods,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/core/LinkedAccountWidget/components/StatusBadge/StatusBadge';

export interface RecipientDetailsDialogProps {
  /** The recipient/account data to display */
  recipient: Recipient;
  /** The trigger element to open the dialog */
  children: React.ReactNode;
}

/**
 * RecipientDetailsDialog - Displays detailed information about a recipient/linked account
 * Account number is obfuscated for security, with option to reveal
 */
export const RecipientDetailsDialog: React.FC<RecipientDetailsDialogProps> = ({
  recipient,
  children,
}) => {
  const { t } = useTranslation('linked-accounts');
  const [showFullAccount, setShowFullAccount] = useState(false);

  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const fullAccountNumber = recipient.account?.number || maskedAccount;
  const isIndividual = recipient.partyDetails?.type === 'INDIVIDUAL';

  // Get the actual account holder name (not the transformed display name)
  const accountHolderName = isIndividual
    ? [recipient.partyDetails?.firstName, recipient.partyDetails?.lastName]
        .filter(Boolean)
        .join(' ')
    : recipient.partyDetails?.businessName || '';

  // Determine the recipient type translation key
  const getRecipientTypeKey = () => {
    const isLinkedAccount = recipient.type === 'LINKED_ACCOUNT';
    if (isIndividual) {
      return isLinkedAccount
        ? 'accountDetails.recipientType.individualLinkedAccount'
        : 'accountDetails.recipientType.individualRecipient';
    }
    return isLinkedAccount
      ? 'accountDetails.recipientType.businessLinkedAccount'
      : 'accountDetails.recipientType.businessRecipient';
  };

  // Helper to get routing number for a payment method
  const getRoutingForMethod = (method: string) => {
    const routingInfo = recipient.account?.routingInformation?.find(
      (info) => info.transactionType === method
    );
    return routingInfo?.routingNumber || null;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-w-md eb-space-y-4">
        <DialogHeader className="eb-space-y-3">
          <div className="eb-flex eb-items-center eb-gap-3 eb-font-header">
            <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
              {isIndividual ? (
                <UserIcon className="eb-h-5 eb-w-5 eb-text-primary" />
              ) : (
                <BuildingIcon className="eb-h-5 eb-w-5 eb-text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="eb-text-xl">
                {accountHolderName}
              </DialogTitle>
              <p className="eb-text-sm eb-text-muted-foreground">
                {t(getRecipientTypeKey() as any)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="eb-space-y-4">
          {/* Status */}
          <div className="eb-flex eb-items-center eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('accountDetails.status')}
            </span>
            <div>
              {recipient.status && <StatusBadge status={recipient.status} />}
            </div>
          </div>

          {/* Account Number */}
          <div className="eb-flex eb-items-center eb-justify-between">
            <span className="eb-text-sm eb-text-muted-foreground">
              {t('accountDetails.accountNumber')}
            </span>
            <div className="eb-flex eb-items-center eb-gap-2">
              <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
                {showFullAccount ? fullAccountNumber : maskedAccount}
              </span>
              {fullAccountNumber !== maskedAccount && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="eb-h-6 eb-w-6"
                  onClick={() => setShowFullAccount(!showFullAccount)}
                  aria-label={
                    showFullAccount
                      ? t('accountDetails.hideAccountNumber')
                      : t('accountDetails.showAccountNumber')
                  }
                >
                  {showFullAccount ? (
                    <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
                  ) : (
                    <EyeIcon className="eb-h-3.5 eb-w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Payment Methods with Routing Numbers */}
          {paymentMethods.length > 0 && (
            <div className="eb-space-y-2">
              <span className="eb-text-sm eb-text-muted-foreground">
                {t('accountDetails.paymentMethods')}
              </span>
              <div className="eb-rounded-lg eb-border eb-bg-muted/30">
                {paymentMethods.map((method, index) => {
                  const routing = getRoutingForMethod(method);
                  const isLast = index === paymentMethods.length - 1;
                  return (
                    <div
                      key={method}
                      className={cn(
                        'eb-flex eb-items-center eb-justify-between eb-px-4 eb-py-1',
                        { 'eb-border-b': !isLast }
                      )}
                    >
                      <span className="eb-text-sm eb-text-foreground">
                        {t(
                          `bank-account-form:paymentMethods.${method}.label` as any
                        )}
                      </span>
                      {routing ? (
                        <div className="eb-text-right">
                          <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                            {t('recipients:columns.routingNumber' as any)}
                          </span>
                          <p className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
                            {routing}
                          </p>
                        </div>
                      ) : (
                        <span className="eb-text-xs eb-italic eb-text-muted-foreground">
                          {t('accountDetails.noRoutingNumber' as any)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
