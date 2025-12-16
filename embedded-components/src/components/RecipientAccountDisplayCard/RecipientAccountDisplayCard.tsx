import React, { ReactNode, useState } from 'react';
import {
  AlertCircleIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

  /** Optional status message (string only, for inline display) */
  statusMessage?: string;

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

  /** Enable compact row mode with minimal spacing and reduced padding */
  compact?: boolean;
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
  statusMessage,
  actionsContent,
  showAccountToggle = true,
  showPaymentMethods = true,
  allowDetailedPaymentMethods = true,
  renderAddRoutingButton,
  className = '',
  compact = false,
}) => {
  const { t } = useTranslation('linked-accounts');
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

  // Determine if this card needs attention (action required states)
  const needsAttention = recipient.status === 'READY_FOR_VALIDATION';
  const isPending =
    recipient.status === 'MICRODEPOSITS_INITIATED' ||
    recipient.status === 'PENDING';
  const hasError = recipient.status === 'REJECTED';
  const isInactive = recipient.status === 'INACTIVE';

  return (
    <Card
      className={`eb-overflow-hidden eb-transition-all ${
        compact
          ? `eb-rounded-none eb-border-x-0 eb-border-t-0 eb-shadow-none eb-transition-colors ${
              needsAttention
                ? 'eb-border-l-4 eb-border-l-amber-500 eb-bg-amber-50/30 hover:eb-bg-amber-50/60'
                : isPending
                  ? 'eb-border-l-4 eb-border-l-slate-400 eb-bg-slate-50/40 hover:eb-bg-slate-50/60'
                  : hasError
                    ? 'eb-border-l-4 eb-border-l-red-500 eb-bg-red-50/20 hover:eb-bg-red-50/40'
                    : isInactive
                      ? 'eb-bg-muted/30 hover:eb-bg-muted/50'
                      : 'hover:eb-bg-accent/50'
            }`
          : hasError
            ? 'eb-border-red-200 eb-bg-red-50/30 hover:eb-shadow-lg hover:eb-shadow-red-100'
            : 'hover:eb-shadow-md'
      } ${className}`}
      role="article"
      aria-label={`Account: ${displayName}${needsAttention ? ' - Action required' : isPending ? ' - Pending verification' : hasError ? ' - Error' : ''}`}
    >
      <CardContent
        className={compact ? 'eb-p-0' : 'eb-flex eb-flex-col eb-p-0'}
      >
        {/* Optional Header Content (e.g., success message) */}
        {headerContent && (
          <>
            {headerContent}
            <Separator />
          </>
        )}

        {compact ? (
          // COMPACT MODE - Modern, accessible, information-dense design
          <div className="eb-group eb-flex eb-flex-col eb-gap-3 eb-p-3 @sm:eb-flex-row @sm:eb-items-center @sm:eb-gap-4 @sm:eb-px-4 @md:eb-px-5">
            {/* Left: Icon + Account Info */}
            <div className="eb-flex eb-min-w-0 eb-flex-1 eb-items-center eb-gap-3">
              {/* Icon with status indicator */}
              <div
                className={`eb-relative eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-transition-colors ${
                  needsAttention
                    ? 'eb-bg-amber-200/80 group-hover:eb-bg-amber-200'
                    : isPending
                      ? 'eb-bg-slate-200/80 group-hover:eb-bg-slate-200'
                      : hasError
                        ? 'eb-bg-red-100 group-hover:eb-bg-red-200'
                        : 'eb-bg-primary/10 group-hover:eb-bg-primary/15'
                }`}
              >
                {accountType === 'Individual' ? (
                  <UserIcon
                    className={`eb-h-5 eb-w-5 ${needsAttention || hasError ? 'eb-text-amber-700' : isPending ? 'eb-text-slate-500' : 'eb-text-primary'}`}
                    aria-hidden="true"
                  />
                ) : (
                  <BuildingIcon
                    className={`eb-h-5 eb-w-5 ${needsAttention || hasError ? 'eb-text-amber-700' : isPending ? 'eb-text-slate-500' : 'eb-text-primary'}`}
                    aria-hidden="true"
                  />
                )}
                {/* Status indicator pulse for action required */}
                {needsAttention && (
                  <div className="eb-absolute -eb-right-1 -eb-top-1">
                    <span className="eb-relative eb-flex eb-h-3 eb-w-3">
                      <span className="eb-absolute eb-inline-flex eb-h-full eb-w-full eb-animate-ping eb-rounded-full eb-bg-amber-500 eb-opacity-75"></span>
                      <span className="eb-relative eb-inline-flex eb-h-3 eb-w-3 eb-rounded-full eb-bg-amber-500"></span>
                    </span>
                  </div>
                )}
              </div>

              {/* Account details */}
              <div className="eb-min-w-0 eb-flex-1">
                <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                  {/* Name */}
                  <h3
                    className="eb-truncate eb-text-sm eb-font-semibold eb-leading-tight @sm:eb-max-w-none"
                    id={`account-name-${recipient.id}`}
                    title={displayName}
                  >
                    {displayName}
                  </h3>
                  {/* Status badge - hide in compact mode for states with inline messages, always show in non-compact */}
                  {recipient.status &&
                    recipient.status !== 'ACTIVE' &&
                    (compact ? (
                      // In compact mode, hide badge for states with inline messages
                      recipient.status !== 'READY_FOR_VALIDATION' &&
                      recipient.status !== 'MICRODEPOSITS_INITIATED' &&
                      recipient.status !== 'PENDING' ? (
                        <StatusBadge
                          status={recipient.status}
                          className="eb-shrink-0"
                        />
                      ) : null
                    ) : (
                      // In non-compact mode, always show the badge
                      <StatusBadge
                        status={recipient.status}
                        className="eb-shrink-0"
                      />
                    ))}
                </div>

                {/* Account number and routing information */}
                <div className="eb-mt-0.5 eb-flex eb-flex-col eb-gap-1 eb-text-xs">
                  {compact && needsAttention && statusMessage ? (
                    // Show "Action Required: message" for verification needed (compact mode only)
                    <span className="eb-mt-1 eb-flex eb-items-start eb-gap-1.5 eb-text-amber-700">
                      <AlertCircleIcon
                        className="eb-mt-0.5 eb-h-3.5 eb-w-3.5 eb-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="eb-font-semibold">
                          {t('status.labels.READY_FOR_VALIDATION')}:
                        </span>{' '}
                        {statusMessage}
                      </span>
                    </span>
                  ) : compact && isPending && statusMessage ? (
                    // Show "Pending Verification: message" for microdeposits initiated (compact mode only)
                    <span className="eb-mt-1 eb-flex eb-items-start eb-gap-1.5 eb-text-slate-700">
                      <ClockIcon
                        className="eb-mt-0.5 eb-h-3.5 eb-w-3.5 eb-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="eb-font-semibold">
                          {recipient.status === 'MICRODEPOSITS_INITIATED'
                            ? t('status.labels.MICRODEPOSITS_INITIATED')
                            : t('status.labels.PENDING')}
                          :
                        </span>{' '}
                        {statusMessage}
                      </span>
                    </span>
                  ) : (
                    <>
                      {/* Account number with show/hide toggle */}
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                          Account
                        </span>
                        <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                          {showFullAccount ? fullAccountNumber : maskedAccount}
                        </span>
                        {showAccountToggle && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowFullAccount(!showFullAccount)}
                            className="eb-h-auto eb-p-0"
                            aria-label={
                              showFullAccount
                                ? 'Hide full account number'
                                : 'Show full account number'
                            }
                            aria-pressed={showFullAccount}
                          >
                            {showFullAccount ? (
                              <EyeOffIcon
                                className="eb-h-3 eb-w-3"
                                aria-hidden="true"
                              />
                            ) : (
                              <EyeIcon
                                className="eb-h-3 eb-w-3"
                                aria-hidden="true"
                              />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Routing information - show inline for single method, compact popover for multiple */}
                      {showPaymentMethods && paymentMethods.length > 0 && (
                        <>
                          {paymentMethods.length === 1 ? (
                            // Single routing number - show inline
                            (() => {
                              const routing = getRoutingForMethod(
                                paymentMethods[0]
                              );
                              return routing ? (
                                <div className="eb-flex eb-items-center eb-gap-2">
                                  <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                                    Routing
                                  </span>
                                  <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                                    {routing}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="eb-h-4 eb-border-muted-foreground/20 eb-px-1.5 eb-text-[9px] eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground"
                                  >
                                    {paymentMethods[0]}
                                  </Badge>
                                </div>
                              ) : null;
                            })()
                          ) : (
                            // Multiple routing numbers - show in elegant compact popover
                            <div className="eb-flex eb-items-center eb-gap-2">
                              <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                                Routing
                              </span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="eb-h-auto eb-gap-1 eb-p-0 eb-text-xs"
                                    aria-label={`View routing information for ${paymentMethods.length} payment methods`}
                                  >
                                    <span>{paymentMethods.length} methods</span>
                                    <ChevronDownIcon
                                      className="eb-h-3 eb-w-3"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="eb-w-72 eb-p-2"
                                  align="start"
                                  side="bottom"
                                >
                                  <div className="eb-space-y-1.5">
                                    {paymentMethods.map((method) => {
                                      const routing =
                                        getRoutingForMethod(method);
                                      return (
                                        <div
                                          key={method}
                                          className="eb-flex eb-items-center eb-justify-between eb-gap-3 eb-rounded eb-bg-muted/40 eb-px-2.5 eb-py-1.5"
                                        >
                                          <Badge
                                            variant="outline"
                                            className="eb-shrink-0 eb-border-muted-foreground/30 eb-text-[10px] eb-font-bold eb-uppercase eb-tracking-wide"
                                          >
                                            {method}
                                          </Badge>
                                          {routing ? (
                                            <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                                              {routing}
                                            </span>
                                          ) : (
                                            <span className="eb-text-xs eb-italic eb-text-muted-foreground">
                                              Not configured
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {addRoutingButton && (
                                      <div className="eb-border-t eb-pt-1.5">
                                        {addRoutingButton}
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Status indicators + Actions */}
            <div className="eb-flex eb-w-full eb-flex-wrap eb-items-center eb-gap-2 @sm:eb-w-auto @sm:eb-shrink-0 @sm:eb-justify-end">
              {/* Status info popovers for REJECTED and INACTIVE */}
              {recipient.status &&
                recipient.status !== 'ACTIVE' &&
                recipient.status !== 'READY_FOR_VALIDATION' && (
                  <>
                    {/* REJECTED - Red error info */}
                    {recipient.status === 'REJECTED' && statusAlert && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="eb-h-8 eb-gap-1.5 eb-text-xs eb-text-red-600 hover:eb-bg-red-50 hover:eb-text-red-700"
                            aria-label="Account rejected - click for details"
                          >
                            <AlertCircleIcon
                              className="eb-h-3.5 eb-w-3.5"
                              aria-hidden="true"
                            />
                            <span>Error</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="eb-w-96"
                          align="end"
                          side="bottom"
                        >
                          {statusAlert}
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* INACTIVE - Gray info indicator */}
                    {recipient.status === 'INACTIVE' && statusAlert && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="eb-h-8 eb-gap-1.5 eb-text-xs eb-text-muted-foreground hover:eb-bg-muted hover:eb-text-foreground"
                            aria-label="Account inactive - click for details"
                          >
                            <AlertCircleIcon
                              className="eb-h-3.5 eb-w-3.5"
                              aria-hidden="true"
                            />
                            <span>Info</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="eb-w-96"
                          align="end"
                          side="bottom"
                        >
                          {statusAlert}
                        </PopoverContent>
                      </Popover>
                    )}
                  </>
                )}

              {/* Actions - Pay/Verify button + manage dropdown */}
              {actionsContent && (
                <div className="eb-flex eb-flex-1 eb-items-center eb-justify-end eb-gap-2 @sm:eb-flex-initial">
                  {actionsContent}
                </div>
              )}
            </div>
          </div>
        ) : (
          // NORMAL MODE - Full card layout
          <div className="eb-space-y-3 eb-p-3 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-4">
            {/* Name, Type, and Status */}
            <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
              <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
                <h3
                  className={`eb-break-words eb-font-semibold eb-leading-tight ${
                    compact ? 'eb-text-sm' : 'eb-text-base'
                  }`}
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
        )}

        {/* Payment Methods Section - Only show in normal mode */}
        {!compact && showPaymentMethods && paymentMethods.length > 0 && (
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
                          className="eb-flex eb-max-w-xs eb-items-center eb-justify-between eb-gap-3 eb-rounded eb-bg-muted/40 eb-px-2.5 eb-py-1.5"
                        >
                          <Badge
                            variant="outline"
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
                        variant="outline"
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

        {/* Status Alert Section - Only show in normal mode */}
        {!compact && statusAlert && (
          <>
            <Separator />
            <div className="eb-px-3 eb-py-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-4 @md:eb-py-3">
              {statusAlert}
            </div>
          </>
        )}

        {/* Actions Footer Section - Only show in normal mode (compact shows inline) */}
        {!compact && actionsContent && (
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
