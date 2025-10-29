import React, { useState } from 'react';
import {
  ArrowRightIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui';

import { LinkedAccountCardProps } from '../LinkedAccountWidget.types';
import {
  canMakePayment,
  canVerifyMicrodeposits,
  getAccountHolderType,
  getMaskedAccountNumber,
  getMissingPaymentMethods,
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
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showDetailedPaymentMethods, setShowDetailedPaymentMethods] =
    useState(false);

  const isActive = recipient.status === 'ACTIVE';

  const displayName = getRecipientDisplayName(recipient);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const accountType = getAccountHolderType(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const showAddRoutingButton = needsAdditionalRouting(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);

  // Get full account number if available
  const fullAccountNumber = recipient.account?.number || maskedAccount;

  // Generate button label based on missing methods
  const getAddRoutingButtonLabel = () => {
    if (missingPaymentMethods.length === 0) return '';
    if (missingPaymentMethods.length === 2) return 'Add Wire/RTP';
    return `Add ${missingPaymentMethods[0]}`;
  };

  // Helper to get routing number for a payment method
  const getRoutingForMethod = (method: string) => {
    const routingInfo = recipient.account?.routingInformation?.find(
      (info) => info.transactionType === method
    );
    return routingInfo?.routingNumber || null;
  };

  return (
    <Card
      className="eb-overflow-hidden eb-transition-shadow hover:eb-shadow-md"
      role="article"
      aria-label={`Linked account: ${displayName}`}
    >
      <CardContent className="eb-flex eb-flex-col eb-p-0">
        {/* Header Section */}
        <div className="eb-space-y-3 eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
            <div className="eb-flex-1 eb-space-y-1.5">
              <h3
                className="eb-truncate eb-text-base eb-font-semibold eb-leading-tight"
                id={`account-name-${recipient.id}`}
              >
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

          {/* Account Number with Toggle */}
          <div className="eb-space-y-1.5">
            <div className="eb-flex eb-items-center eb-gap-2">
              <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                Account Number
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFullAccount(!showFullAccount)}
                className="eb-h-auto eb-p-0 eb-text-xs"
                aria-label={
                  showFullAccount
                    ? 'Hide full account number'
                    : 'Show full account number'
                }
                aria-pressed={showFullAccount}
              >
                {showFullAccount ? (
                  <>
                    <EyeOffIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
                    <span>Show</span>
                  </>
                )}
              </Button>
            </div>
            <div
              className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide"
              aria-live="polite"
              aria-atomic="true"
            >
              {showFullAccount ? fullAccountNumber : maskedAccount}
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        {paymentMethods.length > 0 && (
          <>
            <Separator />
            <div className="eb-space-y-2 eb-bg-muted/20 eb-px-4 eb-py-3">
              <div className="eb-flex eb-items-center eb-gap-2">
                <h4
                  className="eb-text-xs eb-font-medium eb-text-muted-foreground"
                  id="payment-methods-heading"
                >
                  Payment Methods
                </h4>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    setShowDetailedPaymentMethods(!showDetailedPaymentMethods)
                  }
                  className="eb-h-auto eb-p-0 eb-text-xs"
                  aria-label={
                    showDetailedPaymentMethods
                      ? 'Collapse payment methods details'
                      : 'Expand payment methods details'
                  }
                  aria-pressed={showDetailedPaymentMethods}
                  aria-controls="payment-methods-content"
                  aria-expanded={showDetailedPaymentMethods}
                >
                  {showDetailedPaymentMethods ? (
                    <>
                      <ChevronUpIcon
                        className="eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon
                        className="eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                      <span>Expand</span>
                    </>
                  )}
                </Button>
              </div>

              <div
                id="payment-methods-content"
                aria-labelledby="payment-methods-heading"
                role="region"
              >
                {showDetailedPaymentMethods ? (
                  // Detailed View with Routing Numbers - Structured List
                  <div className="eb-space-y-1.5">
                    {paymentMethods.map((method) => {
                      const routing = getRoutingForMethod(method);
                      return (
                        <div
                          key={method}
                          className="eb-flex eb-max-w-sm eb-items-center eb-justify-between eb-gap-3 eb-rounded eb-border eb-border-border/40 eb-bg-background/50 eb-px-2.5 eb-py-2"
                        >
                          <Badge
                            variant="secondary"
                            className="eb-text-xs eb-font-semibold"
                          >
                            {method}
                          </Badge>
                          {routing ? (
                            <div className="eb-flex eb-items-baseline eb-gap-2">
                              <span className="eb-text-[10px] eb-uppercase eb-text-muted-foreground/70">
                                Routing
                              </span>
                              <span
                                className="eb-font-mono eb-text-xs eb-font-medium"
                                aria-label={`Routing number ${routing}`}
                              >
                                {routing}
                              </span>
                            </div>
                          ) : (
                            <span className="eb-text-[10px] eb-italic eb-text-muted-foreground">
                              No routing
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* Add Wire/RTP button in expanded view */}
                    {showAddRoutingButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="eb-mt-1 eb-h-8 eb-justify-start eb-border eb-border-dashed eb-border-border/30 eb-text-xs eb-text-muted-foreground hover:eb-border-border/50 hover:eb-bg-muted/50 hover:eb-text-foreground"
                        onClick={() => onUpdateRoutingClick?.(recipient.id)}
                        aria-label={`Add ${missingPaymentMethods.join(' or ')} routing information for ${displayName}`}
                      >
                        <PlusIcon
                          className="eb-mr-1.5 eb-h-3.5 eb-w-3.5"
                          aria-hidden="true"
                        />
                        <span>{getAddRoutingButtonLabel()}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  // Simple View - Just Badges with add button
                  <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-1.5">
                    {paymentMethods.map((method) => (
                      <Badge
                        key={method}
                        variant="secondary"
                        className="eb-text-xs eb-font-semibold"
                      >
                        {method}
                      </Badge>
                    ))}
                    {showAddRoutingButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="eb-h-6 eb-gap-1 eb-border eb-border-dashed eb-px-2 eb-text-xs eb-text-muted-foreground"
                        onClick={() => onUpdateRoutingClick?.(recipient.id)}
                        aria-label={`Add ${missingPaymentMethods.join(' or ')} routing information for ${displayName}`}
                      >
                        <PlusIcon
                          className="eb-h-3 eb-w-3"
                          aria-hidden="true"
                        />
                        <span>
                          Add{' '}
                          {missingPaymentMethods.length === 2
                            ? ''
                            : missingPaymentMethods[0]}
                        </span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Status Alert - Show for non-active statuses or when action is needed */}
        {recipient.status && recipient.status !== 'ACTIVE' && (
          <>
            <Separator />
            <div className="eb-px-4 eb-py-3">
              <StatusAlert
                status={recipient.status}
                action={
                  showVerifyButton ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onVerifyClick?.(recipient.id)}
                      aria-label={`Verify account for ${displayName}`}
                    >
                      <span>Verify Account</span>
                      <ArrowRightIcon
                        className="eb-ml-2 eb-h-4 eb-w-4"
                        aria-hidden="true"
                      />
                    </Button>
                  ) : undefined
                }
              />
            </div>
          </>
        )}

        {/* Action Buttons Section - Show pay button (disabled if not active or no component) and manage menu */}
        {(showPaymentButton || !isActive) && (
          <>
            <Separator />
            <div
              className="eb-mt-auto eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2 eb-bg-muted/30 eb-p-3"
              role="group"
              aria-label="Account actions"
            >
              {makePaymentComponent ? (
                React.cloneElement(makePaymentComponent as React.ReactElement, {
                  recipientId: recipient.id,
                })
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!showPaymentButton}
                  aria-label={`Make payment from ${displayName}`}
                >
                  <span>Pay</span>
                  <ArrowRightIcon
                    className="eb-ml-2 eb-h-4 eb-w-4"
                    aria-hidden="true"
                  />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Manage account options for ${displayName}`}
                  >
                    <span>Manage</span>
                    <MoreVerticalIcon
                      className="eb-ml-2 eb-h-4 eb-w-4"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={!isActive}
                    onClick={() => onUpdateRoutingClick?.(recipient.id)}
                    className="eb-cursor-pointer"
                  >
                    <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                    <span>Edit Payment Methods</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="eb-cursor-pointer eb-text-destructive focus:eb-text-destructive"
                    onClick={() => {
                      // TODO: Implement remove account functionality
                      console.log('Remove account:', recipient.id);
                    }}
                  >
                    <TrashIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                    <span>Remove Account</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
