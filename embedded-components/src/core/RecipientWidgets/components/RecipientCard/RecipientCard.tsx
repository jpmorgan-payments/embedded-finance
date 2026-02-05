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

import { MicrodepositsFormDialogTrigger } from '../../forms/MicrodepositsForm/MicrodepositsForm';
import { LINKED_ACCOUNT_USER_JOURNEYS } from '../../RecipientWidgets.constants';
import { RecipientI18nNamespace, SupportedRecipientType } from '../../types';
import { RecipientAccountDisplayCard } from '../RecipientAccountDisplayCard/RecipientAccountDisplayCard';
import { RecipientDetailsDialog } from '../RecipientDetailsDialog/RecipientDetailsDialog';
import { RecipientFormDialog } from '../RecipientFormDialog/RecipientFormDialog';
import { RemoveAccountDialogTrigger } from '../RemoveAccountDialog/RemoveAccountDialog';
import { StatusAlert } from '../StatusAlert/StatusAlert';

/**
 * Props for the RecipientCard component
 */
export interface RecipientCardProps {
  /** The recipient data to display */
  recipient: Recipient;

  /** Optional custom payment action component to render when recipient is active */
  makePaymentComponent?: React.ReactNode;

  /**
   * Callback to open the edit dialog for a recipient.
   * The edit dialog is lifted to the parent component to survive data updates.
   */
  onEditRecipient?: (recipient: Recipient) => void;

  /** Callback when recipient is edited or removed */
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /** Callback when microdeposit verification is completed */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;

  /** Callback when recipient is successfully removed */
  onRemoveSuccess?: (recipient: Recipient) => void;

  /** Hide action buttons and status alerts (useful for confirmation views) */
  hideActions?: boolean;

  /** Use compact display mode with reduced padding and smaller elements */
  compact?: boolean;

  /** Additional CSS classes to apply to the card */
  className?: string;

  /**
   * Hide microdeposit verification actions (for RECIPIENT type)
   * @default false
   */
  hideMicrodepositActions?: boolean;

  /**
   * i18n namespace to use for translations
   * @default 'linked-accounts'
   */
  i18nNamespace?: RecipientI18nNamespace;

  /**
   * Type of recipient (used for form dialogs)
   * @default 'LINKED_ACCOUNT'
   */
  recipientType?: SupportedRecipientType;
}

/**
 * RecipientCard - Displays a single recipient with its details and actions
 * Enhanced with better visual hierarchy and contextual information
 * Uses RecipientAccountDisplayCard for consistent display patterns
 * Supports LINKED_ACCOUNT, RECIPIENT, and future SETTLEMENT_ACCOUNT types
 */
export const RecipientCard: React.FC<RecipientCardProps> = ({
  recipient,
  makePaymentComponent,
  onEditRecipient,
  onRecipientSettled,
  onMicrodepositVerifySettled,
  onRemoveSuccess,
  hideActions = false,
  compact = false,
  className,
  hideMicrodepositActions = false,
  i18nNamespace = 'linked-accounts',
  recipientType = 'LINKED_ACCOUNT',
}) => {
  const { t } = useTranslation(i18nNamespace);

  const isActive = recipient.status === 'ACTIVE';
  const displayName = getRecipientDisplayName(recipient);
  // Only show verify button if microdeposit actions are not hidden
  const showVerifyButton =
    !hideMicrodepositActions && canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);

  // Get status message for inline display (used in RecipientAccountDisplayCard)
  const statusMessage =
    recipient.status && recipient.status !== 'ACTIVE'
      ? t(`status.messages.${recipient.status}`)
      : undefined;

  // Generate button label based on missing methods
  const getAddRoutingButtonLabel = (): string => {
    if (missingPaymentMethods.length === 0) return '';
    if (missingPaymentMethods.length === 2) return t('actions.addWireRtp');
    return t(
      `actions.add${missingPaymentMethods[0].charAt(0) + missingPaymentMethods[0].slice(1).toLowerCase()}` as any
    );
  };

  // Add routing button component - uses lifted dialog via callback
  const renderAddRoutingButton = (isExpanded: boolean) => {
    // Use lifted dialog callback if available, otherwise fall back to inline dialog
    if (onEditRecipient) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={
            isExpanded
              ? 'eb-mt-1 eb-h-8 eb-justify-start eb-border eb-border-dashed eb-border-border/30 eb-text-xs eb-text-muted-foreground hover:eb-border-border/50 hover:eb-bg-muted/50 hover:eb-text-foreground'
              : 'eb-h-6 eb-gap-1 eb-border eb-border-dashed eb-px-2 eb-text-xs eb-text-muted-foreground'
          }
          aria-label={`Add ${missingPaymentMethods.join(' or ')} routing information for ${displayName}`}
          onClick={() => onEditRecipient(recipient)}
        >
          <PlusIcon
            className="eb-mr-1.5 eb-h-3.5 eb-w-3.5"
            aria-hidden="true"
          />
          <span>{getAddRoutingButtonLabel()}</span>
        </Button>
      );
    }

    // Fallback to inline dialog when onEditRecipient is not provided
    return (
      <RecipientFormDialog
        mode="edit"
        recipient={recipient}
        onRecipientSettled={onRecipientSettled}
        recipientType={recipientType}
        i18nNamespace={i18nNamespace}
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
          <PlusIcon
            className="eb-mr-1.5 eb-h-3.5 eb-w-3.5"
            aria-hidden="true"
          />
          <span>{getAddRoutingButtonLabel()}</span>
        </Button>
      </RecipientFormDialog>
    );
  };

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

  // Actions footer component with progressive disclosure
  const hidePayButton = recipient.status === 'MICRODEPOSITS_INITIATED';

  // Configuration: Define which actions appear outside the menu
  const actionsOutsideMenu = {
    payOrVerify: showVerifyButton || showPaymentButton || !hidePayButton,
    viewDetails: compact && isActive, // Show outside in compact+active mode (with responsive CSS)
  };

  // Shared menu items (Edit and Remove)
  const sharedMenuItems = (
    <>
      {/* Edit - disabled for non-ACTIVE recipients, uses lifted dialog when available */}
      {isActive ? (
        onEditRecipient ? (
          <DropdownMenuItem
            onSelect={() => onEditRecipient(recipient)}
            className="eb-cursor-pointer"
          >
            <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
            <span>{t('actions.edit')}</span>
          </DropdownMenuItem>
        ) : (
          <RecipientFormDialog
            mode="edit"
            recipient={recipient}
            onRecipientSettled={onRecipientSettled}
            recipientType={recipientType}
            i18nNamespace={i18nNamespace}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="eb-cursor-pointer"
            >
              <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              <span>{t('actions.edit')}</span>
            </DropdownMenuItem>
          </RecipientFormDialog>
        )
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
        onRecipientSettled={onRecipientSettled}
        onRemoveSuccess={onRemoveSuccess}
        i18nNamespace={i18nNamespace}
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
    </>
  );

  // View Details menu item
  const viewDetailsMenuItem = (
    <>
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
    </>
  );

  // Menu trigger button
  const menuTrigger = (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        className={compact ? 'eb-h-8 eb-w-8' : ''}
        aria-label={t('actions.moreActions', { name: displayName })}
      >
        <MoreVerticalIcon
          className={compact ? 'eb-h-4 eb-w-4' : 'eb-ml-2 eb-h-4 eb-w-4'}
          aria-hidden="true"
        />
      </Button>
    </DropdownMenuTrigger>
  );

  const actionsContent =
    !hideActions && (showPaymentButton || !isActive || showVerifyButton) ? (
      <div
        className={cn('eb-flex eb-flex-wrap eb-items-center eb-gap-2', {
          'eb-w-full': compact,
          'eb-justify-between': !compact,
        })}
        role="group"
        aria-label="Account actions"
      >
        {/* Primary actions group - wraps naturally */}
        <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
          {/* Primary: Payment or Verify button */}
          {actionsOutsideMenu.payOrVerify && (
            <>
              {showVerifyButton && compact ? (
                <MicrodepositsFormDialogTrigger
                  recipientId={recipient.id}
                  onVerificationSettled={onMicrodepositVerifySettled}
                >
                  <Button
                    variant="default"
                    size="sm"
                    className="eb-h-8 eb-shrink-0 eb-text-xs"
                    aria-label={`${t('actions.verifyAccount')} for ${displayName}`}
                  >
                    <span>{t('actions.verifyAccount')}</span>
                  </Button>
                </MicrodepositsFormDialogTrigger>
              ) : makePaymentComponent && !hidePayButton ? (
                React.cloneElement(makePaymentComponent as React.ReactElement, {
                  recipientId: recipient.id,
                  className: compact
                    ? 'eb-h-8 eb-shrink-0 eb-text-xs'
                    : undefined,
                })
              ) : null}
            </>
          )}

          {/* Secondary: View Details inline (progressive disclosure)
              - Tiny (<@sm): Buttons wrap to new row, full width available → VISIBLE
              - Small (@sm): Buttons on same row as content, limited space → HIDDEN (in menu)
              - Medium+ (@md): Buttons on same row, more space → VISIBLE
          */}
          {actionsOutsideMenu.viewDetails && (
            <RecipientDetailsDialog recipient={recipient}>
              <Button
                variant="ghost"
                size="sm"
                className="eb-h-8 eb-shrink-0 eb-gap-1.5 eb-text-xs @sm:eb-hidden @lg:eb-inline-flex"
                aria-label={`${t('actions.viewDetails')} for ${displayName}`}
              >
                <ClipboardListIcon
                  className="eb-h-3.5 eb-w-3.5"
                  aria-hidden="true"
                />
                <span className="eb-inline @sm:eb-hidden @lg:eb-inline">
                  {t('actions.viewDetailsShort', { defaultValue: 'Details' })}
                </span>
              </Button>
            </RecipientDetailsDialog>
          )}
        </div>

        {/* Manage menu - always at the end, positioned right
            Render two versions for responsive View Details visibility:
            - Menu WITH View Details: shown at @sm (when inline button is hidden)
            - Menu WITHOUT View Details: shown at <@sm and @md+ (when inline button is visible)
        */}
        <div className="eb-ml-auto">
          {actionsOutsideMenu.viewDetails ? (
            <>
              {/* Menu WITH View Details - only at @sm breakpoint */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size={compact ? 'icon' : 'sm'}
                    className={cn(
                      'eb-hidden @sm:eb-inline-flex @lg:eb-hidden',
                      compact ? 'eb-h-8 eb-w-8' : ''
                    )}
                    aria-label={t('actions.moreActions', { name: displayName })}
                  >
                    <MoreVerticalIcon
                      className={
                        compact ? 'eb-h-4 eb-w-4' : 'eb-ml-2 eb-h-4 eb-w-4'
                      }
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewDetailsMenuItem}
                  {sharedMenuItems}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu WITHOUT View Details - at <@sm and @md+ */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size={compact ? 'icon' : 'sm'}
                    className={cn(
                      '@sm:eb-hidden @lg:eb-inline-flex',
                      compact ? 'eb-h-8 eb-w-8' : ''
                    )}
                    aria-label={t('actions.moreActions', { name: displayName })}
                  >
                    <MoreVerticalIcon
                      className={
                        compact ? 'eb-h-4 eb-w-4' : 'eb-ml-2 eb-h-4 eb-w-4'
                      }
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sharedMenuItems}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Standard menu - always includes View Details */
            <DropdownMenu>
              {menuTrigger}
              <DropdownMenuContent align="end">
                {viewDetailsMenuItem}
                {sharedMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
