import React from 'react';
import {
  ArrowRightIcon,
  ClipboardListIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  canMakePayment,
  canVerifyMicrodeposits,
  getMissingPaymentMethods,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import {
  ApiError,
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RecipientAccountDisplayCard } from '@/components/RecipientAccountDisplayCard/RecipientAccountDisplayCard';
import { RecipientDetailsDialog } from '@/components/RecipientDetailsDialog/RecipientDetailsDialog';
import { MakePayment } from '@/core/MakePayment';

import { MicrodepositsFormDialogTrigger } from '../../forms/MicrodepositsForm/MicrodepositsForm';
import { LINKED_ACCOUNT_USER_JOURNEYS } from '../../LinkedAccountWidget.constants';
import { LinkedAccountFormDialog } from '../LinkedAccountFormDialog/LinkedAccountFormDialog';
import { RemoveAccountDialogTrigger } from '../RemoveAccountDialog/RemoveAccountDialog';
import { StatusAlert } from '../StatusAlert/StatusAlert';

/**
 * Props for the LinkedAccountCard component
 */
export interface LinkedAccountCardProps {
  /** The recipient/linked account data to display */
  recipient: Recipient;

  /** Optional MakePayment component to render when account is active */
  makePaymentComponent?: React.ReactNode;

  /** Callback when account is edited or removed */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /** Callback when microdeposit verification is completed */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;

  /** Callback when account is successfully removed */
  onRemoveSuccess?: (recipient: Recipient) => void;

  /** Hide action buttons and status alerts (useful for confirmation views) */
  hideActions?: boolean;

  /** Use compact display mode with reduced padding and smaller elements */
  compact?: boolean;

  /** Additional CSS classes to apply to the card */
  className?: string;
}

/**
 * LinkedAccountCard - Displays a single linked account with its details and actions
 * Enhanced with better visual hierarchy and contextual information
 * Now uses RecipientAccountDisplayCard for consistent display patterns
 */
export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  recipient,
  makePaymentComponent,
  onLinkedAccountSettled,
  onMicrodepositVerifySettled,
  onRemoveSuccess,
  hideActions = false,
  compact = false,
  className,
}) => {
  const { t } = useTranslation('linked-accounts');
  const isActive = recipient.status === 'ACTIVE';
  const displayName = getRecipientDisplayName(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);

  // Get status message for inline display (used in RecipientAccountDisplayCard)
  const statusMessage =
    recipient.status && recipient.status !== 'ACTIVE'
      ? t(`status.messages.${recipient.status}`)
      : undefined;

  // Generate button label based on missing methods
  const getAddRoutingButtonLabel = () => {
    if (missingPaymentMethods.length === 0) return '';
    if (missingPaymentMethods.length === 2) return t('actions.addWireRtp');
    return t(
      `actions.add${missingPaymentMethods[0].charAt(0) + missingPaymentMethods[0].slice(1).toLowerCase()}` as any
    );
  };

  // Helper to get tooltip message for disabled pay button
  const getDisabledPayTooltip = () => {
    if (!recipient.status)
      return t('status.paymentDisabledTooltip.unavailable');
    return t([
      `status.paymentDisabledTooltip.${recipient.status}`,
      'status.paymentDisabledTooltip.unavailable',
    ]);
  };

  // Add routing button component
  const renderAddRoutingButton = (isExpanded: boolean) => (
    <LinkedAccountFormDialog
      mode="edit"
      recipient={recipient}
      onLinkedAccountSettled={onLinkedAccountSettled}
    >
      <Button
        variant="ghost"
        size="sm"
        className={
          isExpanded
            ? 'eb-mt-1 eb-h-8 eb-justify-start eb-border eb-border-dashed eb-border-border/30 eb-text-xs eb-text-muted-foreground hover:eb-border-border/50 hover:eb-bg-muted/50 hover:eb-text-foreground'
            : 'eb-h-6 eb-gap-1 eb-border eb-border-dashed eb-px-2 eb-text-xs eb-text-muted-foreground'
        }
        aria-label={`Add ${missingPaymentMethods.join(' or ')} routing information for ${displayName}`}
      >
        <PlusIcon className="eb-mr-1.5 eb-h-3.5 eb-w-3.5" aria-hidden="true" />
        <span>{getAddRoutingButtonLabel()}</span>
      </Button>
    </LinkedAccountFormDialog>
  );

  // Status alert component (shows in non-compact mode)
  // In compact mode, statuses with inline messages don't need the alert
  const statusAlert =
    !hideActions && recipient.status && recipient.status !== 'ACTIVE' ? (
      <StatusAlert
        status={recipient.status}
        action={
          showVerifyButton && !compact ? (
            // In non-compact mode, show verify button in the alert
            <MicrodepositsFormDialogTrigger
              recipientId={recipient.id}
              onVerificationSettled={onMicrodepositVerifySettled}
            >
              <Button
                variant="default"
                size="sm"
                data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.VERIFY_STARTED}
                aria-label={`${t('actions.verifyAccount')} for ${displayName}`}
              >
                <span>{t('actions.verifyAccount')}</span>
                <ArrowRightIcon
                  className="eb-ml-2 eb-h-4 eb-w-4"
                  aria-hidden="true"
                />
              </Button>
            </MicrodepositsFormDialogTrigger>
          ) : undefined
        }
      />
    ) : undefined;

  // Actions footer component
  // Determine if pay button should be hidden (not just disabled) for MICRODEPOSITS_INITIATED
  const hidePayButton = recipient.status === 'MICRODEPOSITS_INITIATED';
  const actionsContent =
    !hideActions && (showPaymentButton || !isActive || showVerifyButton) ? (
      <div
        className={cn('eb-flex eb-flex-wrap eb-items-center eb-gap-2', {
          'eb-justify-end': compact,
          'eb-justify-between': !compact,
        })}
        role="group"
        aria-label="Account actions"
      >
        {/* Payment or Verify button - always show, even in compact mode */}
        {showVerifyButton && compact ? (
          // In compact mode, show verify button to replace pay button
          <MicrodepositsFormDialogTrigger
            recipientId={recipient.id}
            onVerificationSettled={onMicrodepositVerifySettled}
          >
            <Button
              variant="default"
              size="sm"
              className="eb-h-8 eb-text-xs"
              aria-label={`${t('actions.verifyAccount')} for ${displayName}`}
            >
              <span>{t('actions.verifyAccount')}</span>
            </Button>
          </MicrodepositsFormDialogTrigger>
        ) : makePaymentComponent && !hidePayButton ? (
          React.cloneElement(makePaymentComponent as React.ReactElement, {
            recipientId: recipient.id,
          })
        ) : !showPaymentButton && !hidePayButton ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant={compact ? 'outline' : 'outline'}
                  size="sm"
                  className={compact ? 'eb-h-8 eb-text-xs' : 'eb-bg-background'}
                  disabled
                  aria-label={`${t('actions.makePayment')} from ${displayName} - ${getDisabledPayTooltip()}`}
                >
                  <span>{t('actions.makePayment')}</span>
                  {!compact && (
                    <ArrowRightIcon
                      className="eb-ml-2 eb-h-4 eb-w-4"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getDisabledPayTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        ) : showPaymentButton && !hidePayButton ? (
          <MakePayment
            triggerButton={
              <Button
                variant="outline"
                size="sm"
                className={compact ? 'eb-h-8 eb-text-xs' : 'eb-bg-background'}
                aria-label={`${t('actions.makePayment')} from ${displayName}`}
              >
                <span>{t('actions.makePayment')}</span>
                {!compact && (
                  <ArrowRightIcon
                    className="eb-ml-2 eb-h-4 eb-w-4"
                    aria-hidden="true"
                  />
                )}
              </Button>
            }
            recipientId={recipient.id}
          />
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={compact ? 'icon' : 'sm'}
              className={compact ? 'eb-h-8 eb-w-8' : ''}
              aria-label={t('actions.moreActions', { name: displayName })}
            >
              {!compact && <span>{t('actions.manage')}</span>}
              <MoreVerticalIcon
                className={compact ? 'eb-h-4 eb-w-4' : 'eb-ml-2 eb-h-4 eb-w-4'}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* View Details - always available */}
            <RecipientDetailsDialog recipient={recipient}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="eb-cursor-pointer"
              >
                <ClipboardListIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                <span>{t('actions.viewDetails')}</span>
              </DropdownMenuItem>
            </RecipientDetailsDialog>
            <DropdownMenuSeparator />
            {/* Edit - disabled for non-ACTIVE accounts */}
            {isActive ? (
              <LinkedAccountFormDialog
                mode="edit"
                recipient={recipient}
                onLinkedAccountSettled={onLinkedAccountSettled}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="eb-cursor-pointer"
                >
                  <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                  <span>{t('actions.edit')}</span>
                </DropdownMenuItem>
              </LinkedAccountFormDialog>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      disabled
                      className="eb-cursor-not-allowed eb-opacity-50"
                    >
                      <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                      <span>{t('actions.edit')}</span>
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{t('actions.editDisabledTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenuSeparator />
            <RemoveAccountDialogTrigger
              recipient={recipient}
              onLinkedAccountSettled={onLinkedAccountSettled}
              onRemoveSuccess={onRemoveSuccess}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.REMOVE_STARTED}
                className="eb-cursor-pointer eb-text-destructive focus:eb-text-destructive"
              >
                <TrashIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                <span>{t('actions.remove')}</span>
              </DropdownMenuItem>
            </RemoveAccountDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : undefined;

  return (
    <RecipientAccountDisplayCard
      recipient={recipient}
      statusAlert={statusAlert}
      statusMessage={statusMessage}
      actionsContent={actionsContent}
      renderAddRoutingButton={renderAddRoutingButton}
      compact={compact}
      className={className}
    />
  );
};
