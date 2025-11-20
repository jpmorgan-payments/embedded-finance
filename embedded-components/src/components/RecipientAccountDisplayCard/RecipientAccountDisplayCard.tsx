import React, { ReactNode, useState } from 'react';
import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
} from 'lucide-react';

import {
  getAccountHolderType,
  getMaskedAccountNumber,
  getRecipientDisplayName,
  getSupportedPaymentMethods,
  needsAdditionalRouting,
} from '@/lib/recipientHelpers';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui';
import { StatusBadge } from '@/core/LinkedAccountWidget/components/StatusBadge/StatusBadge';

export interface RecipientAccountDisplayCardProps {
  /** The recipient/account data to display */
  recipient: Recipient;

  /** Optional header content (e.g., success message) */
  headerContent?: ReactNode;

  /** Optional status alert content */
  statusAlert?: ReactNode;

  /** Optional actions footer content */
  actionsContent?: ReactNode;

  /** Show/hide the account number toggle */
  showAccountToggle?: boolean;

  /** Show/hide payment methods section */
  showPaymentMethods?: boolean;

  /** Show/hide detailed payment method routing info */
  allowDetailedPaymentMethods?: boolean;

  /** Callback to render add routing button with expanded state */
  renderAddRoutingButton?: (isExpanded: boolean) => ReactNode;

  /** Custom card className */
  className?: string;
}

/**
 * RecipientAccountDisplayCard - Generic reusable card component for displaying recipient account information
 *
 * This component provides a consistent display pattern for:
 * - LinkedAccountCard (with full actions and status)
 * - Recipients (in recipient management)
 * - Account confirmation views
 *
 * By centralizing the display logic, we maintain consistency and reduce duplication.
 */
export const RecipientAccountDisplayCard: React.FC<
  RecipientAccountDisplayCardProps
> = ({
  recipient,
  headerContent,
  statusAlert,
  actionsContent,
  showAccountToggle = true,
  showPaymentMethods = true,
  allowDetailedPaymentMethods = true,
  renderAddRoutingButton,
  className = '',
}) => {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showDetailedPaymentMethods, setShowDetailedPaymentMethods] =
    useState(false);

  const displayName = getRecipientDisplayName(recipient);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const accountType = getAccountHolderType(recipient);
  const showAddRoutingButton = needsAdditionalRouting(recipient);

  // Get full account number if available
  const fullAccountNumber = recipient.account?.number || maskedAccount;

  // Helper to get routing number for a payment method
  const getRoutingForMethod = (method: string) => {
    const routingInfo = recipient.account?.routingInformation?.find(
      (info) => info.transactionType === method
    );
    return routingInfo?.routingNumber || null;
  };

  // Render the add routing button with appropriate styling based on expanded state
  const addRoutingButton =
    showAddRoutingButton && renderAddRoutingButton
      ? renderAddRoutingButton(showDetailedPaymentMethods)
      : null;

  return (
    <Card
      className={`eb-overflow-hidden eb-transition-shadow hover:eb-shadow-md ${className}`}
      role="article"
      aria-label={`Account: ${displayName}`}
    >
      <CardContent className="eb-flex eb-flex-col eb-p-0">
        {/* Optional Header Content (e.g., success message) */}
        {headerContent && (
          <>
            {headerContent}
            <Separator />
          </>
        )}

        {/* Main Account Information Section */}
        <div className="eb-space-y-3 eb-p-3 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-4">
          {/* Name, Type, and Status */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
            <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
              <h3
                className="eb-break-words eb-text-base eb-font-semibold eb-leading-tight"
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
            {recipient.status && (
              <div className="eb-shrink-0 eb-self-start">
                <StatusBadge status={recipient.status} />
              </div>
            )}
          </div>

          {/* Account Number with Toggle */}
          <div className="eb-space-y-1.5">
            <div className="eb-flex eb-items-center eb-gap-2">
              <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                Account Number
              </span>
              {showAccountToggle && (
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
                      <EyeOffIcon
                        className="eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
                      <span>Show</span>
                    </>
                  )}
                </Button>
              )}
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
        {showPaymentMethods && paymentMethods.length > 0 && (
          <>
            <Separator />
            <div className="eb-space-y-2 eb-bg-muted/20 eb-px-3 eb-py-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-4 @md:eb-py-3">
              <div className="eb-flex eb-items-center eb-gap-2">
                <h4
                  className="eb-text-xs eb-font-medium eb-text-muted-foreground"
                  id="payment-methods-heading"
                >
                  Payment Methods
                </h4>
                {allowDetailedPaymentMethods && (
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
                )}
              </div>

              <div
                id="payment-methods-content"
                aria-labelledby="payment-methods-heading"
                role="region"
              >
                {allowDetailedPaymentMethods && showDetailedPaymentMethods ? (
                  // Detailed View with Routing Numbers
                  <div className="eb-space-y-1.5">
                    {paymentMethods.map((method) => {
                      const routing = getRoutingForMethod(method);
                      return (
                        <div
                          key={method}
                          className="eb-flex eb-max-w-xs eb-items-center eb-justify-between eb-gap-3 eb-rounded eb-border eb-border-border/40 eb-bg-background/50 eb-px-2.5 eb-py-2"
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
                    {addRoutingButton}
                  </div>
                ) : (
                  // Simple View - Just Badges
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
                    {addRoutingButton}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Status Alert Section */}
        {statusAlert && (
          <>
            <Separator />
            <div className="eb-px-3 eb-py-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-4 @md:eb-py-3">
              {statusAlert}
            </div>
          </>
        )}

        {/* Actions Footer Section */}
        {actionsContent && (
          <>
            <Separator />
            <div className="eb-mt-auto eb-bg-muted eb-px-2.5 eb-py-2 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-3 @md:eb-py-2.5">
              {actionsContent}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
