import React, { ReactNode, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
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

import {
  getAccountHolderType,
  getMaskedAccountNumber,
  getRecipientDisplayName,
  getSupportedPaymentMethods,
  needsAdditionalRouting,
} from '@/lib/recipientHelpers';
import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import { cn } from '@/lib/utils';
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
import {
  getRecipientPaymentMethodDisplayLabel,
  getRecipientRoutingFieldDisplayLabel,
} from '@/core/PaymentFlowFX/fxRecipientRequirements';

import { RecipientCurrencyBadge } from '../RecipientCurrencyBadge';
import { StatusBadge } from '../StatusBadge/StatusBadge';

export interface RecipientAccountDisplayCardProps {
  /** The recipient/account data to display */
  recipient: Recipient;

  /** Optional header content (e.g., success message) */
  headerContent?: ReactNode;

  /** Optional status alert content */
  statusAlert?: ReactNode;

  /** Optional status message (for inline display) */
  statusMessage?: ReactNode;

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

  /**
   * When true, shows currency flag badges on the card.
   * @default false
   */
  showRecipientCurrency?: boolean;

  /**
   * Heading level for the card title.
   * Should be one level below the parent widget's heading.
   *
   * @default 3
   */
  headingLevel?: HeadingLevel;
}

/** Look up the routing number for a given payment method on a recipient. */
const getRoutingForMethod = (
  recipient: Recipient,
  method: string
): string | null => {
  const routingInfo = recipient.account?.routingInformation?.find(
    (info) => info.transactionType === method
  );
  return routingInfo?.routingNumber || null;
};

interface AccountViewProps {
  recipient: Recipient;
  statusAlert?: ReactNode;
  statusMessage?: ReactNode;
  actionsContent?: ReactNode;
  showAccountToggle: boolean;
  showPaymentMethods: boolean;
  allowDetailedPaymentMethods: boolean;
  showRecipientCurrency?: boolean;
  renderAddRoutingButton?: (isExpanded: boolean) => ReactNode;
  headingLevel: HeadingLevel;
}

/**
 * Small ghost-button + popover used in the compact row to surface REJECTED /
 * INACTIVE status details on demand.
 */
const StatusInfoPopover: React.FC<{
  buttonClassName: string;
  ariaLabel: string;
  label: string;
  children: ReactNode;
}> = ({ buttonClassName, ariaLabel, label, children }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={buttonClassName}
        aria-label={ariaLabel}
      >
        <AlertCircleIcon className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="eb-w-96" align="end" side="bottom">
      {children}
    </PopoverContent>
  </Popover>
);

/** Status badge shown in the compact row for terminal / non-inline statuses. */
const CompactStatusBadge: React.FC<{ recipient: Recipient }> = ({
  recipient,
}) => {
  const { status } = recipient;
  const hideBadge =
    !status ||
    status === 'ACTIVE' ||
    status === 'READY_FOR_VALIDATION' ||
    status === 'MICRODEPOSITS_INITIATED' ||
    status === 'PENDING';

  if (hideBadge) {
    return null;
  }
  return <StatusBadge status={status} className="eb-shrink-0" />;
};

/**
 * Inline status message for the compact row: amber for action-required,
 * slate for pending verification. Rendered only when a status message applies.
 */
const CompactStatusLine: React.FC<{
  recipient: Recipient;
  statusMessage?: ReactNode;
}> = ({ recipient, statusMessage }) => {
  const { t } = useTranslationWithTokens('linked-accounts');

  if (recipient.status === 'READY_FOR_VALIDATION') {
    return (
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
    );
  }

  return (
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
  );
};

/** Account number (with reveal toggle) plus routing information. */
const CompactAccountNumberRow: React.FC<{
  recipient: Recipient;
  showAccountToggle: boolean;
  showPaymentMethods: boolean;
}> = ({ recipient, showAccountToggle, showPaymentMethods }) => {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const fullAccountNumber = recipient.account?.number || maskedAccount;
  const paymentMethods = getSupportedPaymentMethods(recipient);

  return (
    <div className="eb-flex eb-flex-col eb-gap-1 @3xl:eb-flex-row @3xl:eb-items-center @3xl:eb-gap-6">
      {/* Account number with show/hide toggle */}
      <div className="eb-flex eb-max-w-full eb-flex-wrap eb-items-center eb-gap-x-2 eb-gap-y-0.5 eb-pt-1 @3xl:eb-pt-0">
        <span className="eb-shrink-0 eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
          Account
        </span>
        <span className="eb-flex eb-items-center eb-gap-2">
          <span
            className="eb-font-mono eb-break-all eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          >
            {showFullAccount ? fullAccountNumber : maskedAccount}
          </span>
          {showAccountToggle && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullAccount(!showFullAccount)}
              className="eb-h-auto eb-shrink-0 eb-p-0"
              aria-label={
                showFullAccount
                  ? 'Hide full account number'
                  : 'Show full account number'
              }
              aria-pressed={showFullAccount}
            >
              {showFullAccount ? (
                <EyeOffIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
              ) : (
                <EyeIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
              )}
            </Button>
          )}
        </span>
      </div>

      {/* Routing information - inline for single method, popover for multiple */}
      {showPaymentMethods && paymentMethods.length > 0 && (
        <CompactRoutingInfo
          recipient={recipient}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

/** Middle column of the compact row: name, status badge, and status/account line. */
const CompactAccountDetails: React.FC<{
  recipient: Recipient;
  statusMessage?: ReactNode;
  showAccountToggle: boolean;
  showPaymentMethods: boolean;
  showRecipientCurrency?: boolean;
  headingLevel: HeadingLevel;
}> = ({
  recipient,
  statusMessage,
  showAccountToggle,
  showPaymentMethods,
  showRecipientCurrency = false,
  headingLevel,
}) => {
  const Heading = getHeadingTag(headingLevel);
  const displayName = getRecipientDisplayName(recipient);
  const needsAttention = recipient.status === 'READY_FOR_VALIDATION';
  const isPending =
    recipient.status === 'MICRODEPOSITS_INITIATED' ||
    recipient.status === 'PENDING';
  const showStatusLine = (needsAttention || isPending) && !!statusMessage;

  return (
    <div className="eb-min-w-0 eb-flex-1 eb-overflow-hidden">
      <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
        <Heading
          className="eb-max-w-full eb-break-words eb-text-sm eb-font-semibold eb-leading-tight"
          id={`account-name-${recipient.id}`}
          title={displayName}
          style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
        >
          {displayName}
        </Heading>
        {showRecipientCurrency && (
          <RecipientCurrencyBadge
            currency={recipient.account?.currencyCode ?? 'USD'}
          />
        )}
        <CompactStatusBadge recipient={recipient} />
      </div>

      <div className="eb-flex eb-max-w-full eb-flex-col eb-gap-1 eb-text-xs">
        {showStatusLine ? (
          <CompactStatusLine
            recipient={recipient}
            statusMessage={statusMessage}
          />
        ) : (
          <CompactAccountNumberRow
            recipient={recipient}
            showAccountToggle={showAccountToggle}
            showPaymentMethods={showPaymentMethods}
          />
        )}
      </div>
    </div>
  );
};

/** Right column of the compact row: status-info popovers and action buttons. */
const CompactStatusActions: React.FC<{
  recipient: Recipient;
  statusAlert?: ReactNode;
  actionsContent?: ReactNode;
}> = ({ recipient, statusAlert, actionsContent }) => (
  <div className="eb-col-span-full eb-flex eb-w-full eb-flex-wrap eb-items-center eb-justify-start eb-gap-2 @sm:eb-col-span-1 @sm:eb-w-auto @sm:eb-justify-end">
    {/* REJECTED - Red error info */}
    {statusAlert && recipient.status === 'REJECTED' && (
      <StatusInfoPopover
        buttonClassName="eb-h-8 eb-gap-1.5 eb-text-xs eb-text-red-600 hover:eb-bg-red-50 hover:eb-text-red-700"
        ariaLabel="Account rejected - click for details"
        label="Error"
      >
        {statusAlert}
      </StatusInfoPopover>
    )}

    {/* INACTIVE - Gray info indicator */}
    {statusAlert && recipient.status === 'INACTIVE' && (
      <StatusInfoPopover
        buttonClassName="eb-h-8 eb-gap-1.5 eb-text-xs eb-text-muted-foreground hover:eb-bg-muted hover:eb-text-foreground"
        ariaLabel="Account inactive - click for details"
        label="Info"
      >
        {statusAlert}
      </StatusInfoPopover>
    )}

    {/* Actions - render directly, parent component will handle layout */}
    {actionsContent}
  </div>
);

/**
 * Compact, information-dense row layout for a recipient account.
 * Self-contained: owns its own translation hook and account-toggle state.
 */
const CompactAccountRow: React.FC<AccountViewProps> = ({
  recipient,
  statusAlert,
  statusMessage,
  actionsContent,
  showAccountToggle,
  showPaymentMethods,
  showRecipientCurrency = false,
  headingLevel,
}) => {
  const accountType = getAccountHolderType(recipient);
  const AccountIcon = accountType === 'Individual' ? UserIcon : BuildingIcon;

  const needsAttention = recipient.status === 'READY_FOR_VALIDATION';
  const isPending =
    recipient.status === 'MICRODEPOSITS_INITIATED' ||
    recipient.status === 'PENDING';
  const hasError = recipient.status === 'REJECTED';

  return (
    <div className="eb-group eb-grid eb-gap-3 eb-p-3 @sm:eb-grid-cols-[auto_1fr_auto] @sm:eb-items-center @sm:eb-gap-4 @sm:eb-px-4 @md:eb-px-5">
      {/* Left: Icon + Account Info */}
      <div className="eb-flex eb-min-w-0 eb-items-center eb-gap-3 @sm:eb-col-span-2">
        {/* Icon with status indicator */}
        <div
          className={cn(
            'eb-relative eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-transition-colors',
            {
              'eb-bg-amber-200/80 group-hover:eb-bg-amber-200': needsAttention,
              'eb-bg-slate-200/80 group-hover:eb-bg-slate-200': isPending,
              'eb-bg-red-100 group-hover:eb-bg-red-200': hasError,
              'eb-bg-primary/10 group-hover:eb-bg-primary/15':
                !needsAttention && !isPending && !hasError,
            }
          )}
        >
          <AccountIcon
            className={cn('eb-h-5 eb-w-5', {
              'eb-text-amber-700': needsAttention || hasError,
              'eb-text-slate-500': isPending,
              'eb-text-primary': !needsAttention && !hasError && !isPending,
            })}
            aria-hidden="true"
          />
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

        <CompactAccountDetails
          recipient={recipient}
          statusMessage={statusMessage}
          showAccountToggle={showAccountToggle}
          showPaymentMethods={showPaymentMethods}
          showRecipientCurrency={showRecipientCurrency}
          headingLevel={headingLevel}
        />
      </div>

      <CompactStatusActions
        recipient={recipient}
        statusAlert={statusAlert}
        actionsContent={actionsContent}
      />
    </div>
  );
};

/**
 * Routing display for the compact view: inline for a single payment method,
 * a compact popover table for multiple methods.
 */
const CompactRoutingInfo: React.FC<{
  recipient: Recipient;
  paymentMethods: string[];
}> = ({ recipient, paymentMethods }) => {
  const currencyCode = recipient.account?.currencyCode;
  const routingFieldLabel = getRecipientRoutingFieldDisplayLabel(currencyCode);
  const methodLabel = (method: string) =>
    getRecipientPaymentMethodDisplayLabel(method, currencyCode);

  if (paymentMethods.length === 1) {
    const routing = getRoutingForMethod(recipient, paymentMethods[0]);
    if (!routing) {
      return null;
    }
    return (
      <div className="eb-flex eb-items-center eb-gap-2">
        <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
          {routingFieldLabel}
        </span>
        <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
          {routing}
        </span>
        <Badge
          variant="outline"
          className="eb-h-4 eb-border-muted-foreground/20 eb-px-1.5 eb-text-[9px] eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground"
        >
          {methodLabel(paymentMethods[0])}
        </Badge>
      </div>
    );
  }

  return (
    <div className="eb-flex eb-items-center eb-gap-2">
      <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
        {routingFieldLabel}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className="eb-h-auto eb-gap-1 eb-p-0 eb-text-xs"
            aria-label={`View ${routingFieldLabel.toLowerCase()} for ${paymentMethods.length} payment methods`}
          >
            <span>{paymentMethods.length} methods</span>
            <ChevronDownIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="eb-w-auto eb-min-w-[180px] eb-p-0"
          align="start"
          side="bottom"
        >
          <table className="eb-w-full">
            <thead>
              <tr className="eb-border-b eb-bg-muted/40">
                <th className="eb-px-2.5 eb-py-1 eb-text-left eb-text-[10px] eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                  Method
                </th>
                <th className="eb-px-2.5 eb-py-1 eb-text-right eb-text-[10px] eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                  {routingFieldLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((method, index) => {
                const routing = getRoutingForMethod(recipient, method);
                return (
                  <tr
                    key={method}
                    className={cn(
                      index < paymentMethods.length - 1 &&
                        'eb-border-b eb-border-muted/30'
                    )}
                  >
                    <td className="eb-px-2.5 eb-py-1">
                      <span className="eb-text-[10px] eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                        {methodLabel(method)}
                      </span>
                    </td>
                    <td className="eb-px-2.5 eb-py-1 eb-text-right">
                      {routing ? (
                        <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                          {routing}
                        </span>
                      ) : (
                        <span className="eb-text-xs eb-italic eb-text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/**
 * Full card layout for a recipient account (normal, non-compact mode).
 * Self-contained: owns account-toggle and payment-method expansion state,
 * and renders the payment-methods, status-alert, and actions-footer sections.
 */
const NormalAccountCard: React.FC<AccountViewProps> = ({
  recipient,
  statusAlert,
  actionsContent,
  showAccountToggle,
  showPaymentMethods,
  allowDetailedPaymentMethods,
  showRecipientCurrency = false,
  renderAddRoutingButton,
  headingLevel,
}) => {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showDetailedPaymentMethods, setShowDetailedPaymentMethods] =
    useState(true);

  const Heading = getHeadingTag(headingLevel);
  const displayName = getRecipientDisplayName(recipient);
  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const accountType = getAccountHolderType(recipient);
  const AccountIcon = accountType === 'Individual' ? UserIcon : BuildingIcon;
  const fullAccountNumber = recipient.account?.number || maskedAccount;
  const currencyCode = recipient.account?.currencyCode;
  const routingFieldLabel = getRecipientRoutingFieldDisplayLabel(currencyCode);
  const methodLabel = (method: string) =>
    getRecipientPaymentMethodDisplayLabel(method, currencyCode);

  const showAddRoutingButton = needsAdditionalRouting(recipient);
  const addRoutingButton =
    showAddRoutingButton && renderAddRoutingButton
      ? renderAddRoutingButton(showDetailedPaymentMethods)
      : null;

  return (
    <>
      <div className="eb-space-y-3 eb-p-3 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-4">
        {/* Name, Type, and Status */}
        <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
          <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
            <Heading
              className="eb-break-words eb-text-base eb-font-semibold eb-leading-tight"
              id={`account-name-${recipient.id}`}
            >
              {displayName}
            </Heading>
            <div className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
              <AccountIcon className="eb-h-3.5 eb-w-3.5" />
              <span>{accountType}</span>
              {showRecipientCurrency && (
                <RecipientCurrencyBadge
                  currency={recipient.account?.currencyCode ?? 'USD'}
                />
              )}
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
            )}
          </div>
          <div
            className="eb-font-mono eb-break-all eb-text-sm eb-font-medium eb-tracking-wide"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
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
              {showDetailedPaymentMethods ? (
                // Detailed View with bank-identifier / routing values
                <div className="eb-space-y-1.5">
                  {paymentMethods.map((method) => {
                    const routing = getRoutingForMethod(recipient, method);
                    return (
                      <div
                        key={method}
                        className="eb-flex eb-max-w-xs eb-items-center eb-justify-between eb-gap-3 eb-rounded eb-bg-muted/40 eb-px-2.5 eb-py-1.5"
                      >
                        <Badge
                          variant="outline"
                          className="eb-text-xs eb-font-semibold"
                        >
                          {methodLabel(method)}
                        </Badge>
                        {routing ? (
                          <div className="eb-flex eb-items-baseline eb-gap-2">
                            <span className="eb-text-[10px] eb-uppercase eb-text-muted-foreground/70">
                              {routingFieldLabel}
                            </span>
                            <span
                              className="eb-font-mono eb-text-xs eb-font-medium"
                              aria-label={`${routingFieldLabel} ${routing}`}
                            >
                              {routing}
                            </span>
                          </div>
                        ) : (
                          <span className="eb-text-[10px] eb-italic eb-text-muted-foreground">
                            No {routingFieldLabel.toLowerCase()}
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
                      {methodLabel(method)}
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
    </>
  );
};

/**
 * RecipientAccountDisplayCard - Generic reusable card component for displaying recipient account information
 *
 * This component provides a consistent display pattern for:
 * - RecipientCard (with full actions and status)
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
  showRecipientCurrency = false,
  headingLevel = 3,
}) => {
  const displayName = getRecipientDisplayName(recipient);

  // Determine if this card needs attention (action required states)
  const needsAttention = recipient.status === 'READY_FOR_VALIDATION';
  const isPending =
    recipient.status === 'MICRODEPOSITS_INITIATED' ||
    recipient.status === 'PENDING';
  const hasError = recipient.status === 'REJECTED';
  const isInactive = recipient.status === 'INACTIVE';

  return (
    <Card
      className={cn(
        'eb-overflow-hidden eb-transition-all',
        compact &&
          'eb-rounded-none eb-border-x-0 eb-border-t-0 eb-shadow-none eb-transition-colors',
        compact && {
          'eb-border-l-4 eb-border-l-amber-500 eb-bg-amber-50/30 hover:eb-bg-amber-50/60':
            needsAttention,
          'eb-border-l-4 eb-border-l-slate-400 eb-bg-slate-50/40 hover:eb-bg-slate-50/60':
            isPending,
          'eb-border-l-4 eb-border-l-red-500 eb-bg-red-50/20 hover:eb-bg-red-50/40':
            hasError,
          'eb-bg-muted/30 hover:eb-bg-muted/50': isInactive,
          'hover:eb-bg-accent/50':
            !needsAttention && !isPending && !hasError && !isInactive,
        },
        !compact && {
          'eb-border-red-200 eb-bg-red-50/30 hover:eb-shadow-lg hover:eb-shadow-red-100':
            hasError,
          'hover:eb-shadow-md': !hasError,
        },
        className
      )}
      role="article"
      aria-label={`Account: ${displayName}${needsAttention ? ' - Action required' : ''}${isPending ? ' - Pending verification' : ''}${hasError ? ' - Error' : ''}`}
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
          <CompactAccountRow
            recipient={recipient}
            statusAlert={statusAlert}
            statusMessage={statusMessage}
            actionsContent={actionsContent}
            showAccountToggle={showAccountToggle}
            showPaymentMethods={showPaymentMethods}
            allowDetailedPaymentMethods={allowDetailedPaymentMethods}
            showRecipientCurrency={showRecipientCurrency}
            renderAddRoutingButton={renderAddRoutingButton}
            headingLevel={headingLevel}
          />
        ) : (
          <NormalAccountCard
            recipient={recipient}
            statusAlert={statusAlert}
            statusMessage={statusMessage}
            actionsContent={actionsContent}
            showAccountToggle={showAccountToggle}
            showPaymentMethods={showPaymentMethods}
            allowDetailedPaymentMethods={allowDetailedPaymentMethods}
            showRecipientCurrency={showRecipientCurrency}
            renderAddRoutingButton={renderAddRoutingButton}
            headingLevel={headingLevel}
          />
        )}
      </CardContent>
    </Card>
  );
};
