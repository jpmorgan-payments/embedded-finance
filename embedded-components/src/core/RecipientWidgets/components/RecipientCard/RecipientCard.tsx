import React from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightIcon,
  ClipboardListIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';

import {
  canMakePayment,
  canVerifyMicrodeposits,
  getMissingPaymentMethods,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import type { HeadingLevel } from '@/lib/types/headingLevel.types';
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

  /**
   * When true, omits Remove from the overflow menu.
   *
   * @default false
   */
  hideRemoveRecipient?: boolean;

  /**
   * Heading level for the recipient card title.
   * Should be one level below the parent widget's heading.
   *
   * @default 3
   */
  headingLevel?: HeadingLevel;

  /**
   * Show/hide the account number reveal toggle.
   * @default true
   */
  showAccountToggle?: boolean;

  /**
   * Show/hide the payment methods section in non-compact mode.
   * @default true
   */
  showPaymentMethods?: boolean;

  /**
   * Allow expanding payment methods to show detailed routing numbers.
   * When false, only payment method badges are shown.
   * @default true
   */
  allowDetailedPaymentMethods?: boolean;
}

/** Compute the label for the "add routing" button based on missing methods. */
const getAddRoutingSuffix = (
  missingPaymentMethods: string[]
): string | null => {
  if (missingPaymentMethods.length === 0) return null;
  if (missingPaymentMethods.length === 2) return 'WireRtp';
  const method = missingPaymentMethods[0];
  return method.charAt(0) + method.slice(1).toLowerCase();
};

const ADD_ROUTING_BUTTON_EXPANDED_CLASS =
  'eb-mt-1 eb-h-8 eb-justify-start eb-border eb-border-dashed eb-border-border/30 eb-text-xs eb-text-muted-foreground hover:eb-border-border/50 hover:eb-bg-muted/50 hover:eb-text-foreground';
const ADD_ROUTING_BUTTON_COMPACT_CLASS =
  'eb-h-6 eb-gap-1 eb-border eb-border-dashed eb-px-2 eb-text-xs eb-text-muted-foreground';

interface AddRoutingButtonProps {
  recipient: Recipient;
  isExpanded: boolean;
  onEditRecipient?: (recipient: Recipient) => void;
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;
  recipientType: SupportedRecipientType;
  i18nNamespace: RecipientI18nNamespace;
}

/** Button that lets the user add missing routing information for a recipient. */
const AddRoutingButton: React.FC<AddRoutingButtonProps> = ({
  recipient,
  isExpanded,
  onEditRecipient,
  onRecipientSettled,
  recipientType,
  i18nNamespace,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);
  const displayName = getRecipientDisplayName(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);
  const labelSuffix = getAddRoutingSuffix(missingPaymentMethods);
  const buttonClass = isExpanded
    ? ADD_ROUTING_BUTTON_EXPANDED_CLASS
    : ADD_ROUTING_BUTTON_COMPACT_CLASS;
  const ariaLabel = `Add ${missingPaymentMethods.join(' or ')} routing information for ${displayName}`;
  const buttonContent = (
    <>
      <PlusIcon className="eb-mr-1.5 eb-h-3.5 eb-w-3.5" aria-hidden="true" />
      <span>{labelSuffix ? t(`actions.add${labelSuffix}` as any) : ''}</span>
    </>
  );

  // Use lifted dialog callback if available, otherwise fall back to inline dialog
  if (onEditRecipient) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        aria-label={ariaLabel}
        onClick={() => onEditRecipient(recipient)}
      >
        {buttonContent}
      </Button>
    );
  }

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
        className={buttonClass}
        aria-label={ariaLabel}
      >
        {buttonContent}
      </Button>
    </RecipientFormDialog>
  );
};

interface RecipientCardStatusAlertProps {
  recipient: Recipient;
  showVerifyButton: boolean;
  compact: boolean;
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;
  i18nNamespace: RecipientI18nNamespace;
}

/** Status alert shown for non-active recipients (with an optional verify action). */
const RecipientCardStatusAlert: React.FC<RecipientCardStatusAlertProps> = ({
  recipient,
  showVerifyButton,
  compact,
  onMicrodepositVerifySettled,
  i18nNamespace,
}) => {
  const { t, tString } = useTranslationWithTokens(i18nNamespace);
  const displayName = getRecipientDisplayName(recipient);

  return (
    <StatusAlert
      status={recipient.status!}
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
              aria-label={`${tString('actions.verifyAccount')} for ${displayName}`}
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
  );
};

interface EditMenuItemProps {
  recipient: Recipient;
  isActive: boolean;
  onEditRecipient?: (recipient: Recipient) => void;
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;
  recipientType: SupportedRecipientType;
  i18nNamespace: RecipientI18nNamespace;
}

/** Edit dropdown item — disabled for non-active recipients, uses lifted dialog when available. */
const EditMenuItem: React.FC<EditMenuItemProps> = ({
  recipient,
  isActive,
  onEditRecipient,
  onRecipientSettled,
  recipientType,
  i18nNamespace,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);
  const editLabel = (
    <>
      <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
      <span>{t('actions.edit')}</span>
    </>
  );

  if (!isActive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <DropdownMenuItem
              disabled
              className="eb-cursor-not-allowed eb-opacity-50"
            >
              {editLabel}
            </DropdownMenuItem>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('actions.editDisabledTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (onEditRecipient) {
    return (
      <DropdownMenuItem
        onSelect={() => onEditRecipient(recipient)}
        className="eb-cursor-pointer"
      >
        {editLabel}
      </DropdownMenuItem>
    );
  }

  return (
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
        {editLabel}
      </DropdownMenuItem>
    </RecipientFormDialog>
  );
};

interface SharedMenuItemsProps {
  recipient: Recipient;
  isActive: boolean;
  onEditRecipient?: (recipient: Recipient) => void;
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;
  onRemoveSuccess?: (recipient: Recipient) => void;
  recipientType: SupportedRecipientType;
  hideRemoveRecipient: boolean;
  i18nNamespace: RecipientI18nNamespace;
}

/** Shared Edit + Remove dropdown items. */
const SharedMenuItems: React.FC<SharedMenuItemsProps> = ({
  recipient,
  isActive,
  onEditRecipient,
  onRecipientSettled,
  onRemoveSuccess,
  recipientType,
  hideRemoveRecipient,
  i18nNamespace,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);

  return (
    <>
      <EditMenuItem
        recipient={recipient}
        isActive={isActive}
        onEditRecipient={onEditRecipient}
        onRecipientSettled={onRecipientSettled}
        recipientType={recipientType}
        i18nNamespace={i18nNamespace}
      />
      {!hideRemoveRecipient ? (
        <>
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
      ) : null}
    </>
  );
};

interface ViewDetailsMenuItemProps {
  recipient: Recipient;
  i18nNamespace: RecipientI18nNamespace;
}

/** View Details dropdown item followed by a separator. */
const ViewDetailsMenuItem: React.FC<ViewDetailsMenuItemProps> = ({
  recipient,
  i18nNamespace,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);

  return (
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
};

interface RecipientMenuButtonProps {
  recipient: Recipient;
  compact: boolean;
  className?: string;
  i18nNamespace: RecipientI18nNamespace;
}

/** Dropdown trigger button ("more actions") with consistent styling. */
const RecipientMenuButton: React.FC<RecipientMenuButtonProps> = ({
  recipient,
  compact,
  className,
  i18nNamespace,
}) => {
  const { tString } = useTranslationWithTokens(i18nNamespace);
  const displayName = getRecipientDisplayName(recipient);

  return (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        className={cn(compact ? 'eb-h-8 eb-w-8' : '', className)}
        aria-label={tString('actions.moreActions', { name: displayName })}
      >
        <MoreVerticalIcon
          className={compact ? 'eb-h-4 eb-w-4' : 'eb-ml-2 eb-h-4 eb-w-4'}
          aria-hidden="true"
        />
      </Button>
    </DropdownMenuTrigger>
  );
};

interface RecipientCardActionsProps {
  recipient: Recipient;
  makePaymentComponent?: React.ReactNode;
  onEditRecipient?: (recipient: Recipient) => void;
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;
  onRemoveSuccess?: (recipient: Recipient) => void;
  compact: boolean;
  isActive: boolean;
  showVerifyButton: boolean;
  showPaymentButton: boolean;
  hidePayButton: boolean;
  recipientType: SupportedRecipientType;
  hideRemoveRecipient: boolean;
  i18nNamespace: RecipientI18nNamespace;
}

/** Actions footer with primary buttons and a responsive overflow menu. */
const RecipientCardActions: React.FC<RecipientCardActionsProps> = ({
  recipient,
  makePaymentComponent,
  onEditRecipient,
  onRecipientSettled,
  onMicrodepositVerifySettled,
  onRemoveSuccess,
  compact,
  isActive,
  showVerifyButton,
  showPaymentButton,
  hidePayButton,
  recipientType,
  hideRemoveRecipient,
  i18nNamespace,
}) => {
  const { t, tString } = useTranslationWithTokens(i18nNamespace);
  const displayName = getRecipientDisplayName(recipient);

  // Configuration: Define which actions appear outside the menu
  const showPayOrVerify =
    showVerifyButton || showPaymentButton || !hidePayButton;
  const showInlineViewDetails = compact && isActive;

  const sharedItems = (
    <SharedMenuItems
      recipient={recipient}
      isActive={isActive}
      onEditRecipient={onEditRecipient}
      onRecipientSettled={onRecipientSettled}
      onRemoveSuccess={onRemoveSuccess}
      recipientType={recipientType}
      hideRemoveRecipient={hideRemoveRecipient}
      i18nNamespace={i18nNamespace}
    />
  );
  const viewDetailsItem = (
    <ViewDetailsMenuItem recipient={recipient} i18nNamespace={i18nNamespace} />
  );

  const renderManageMenu = (
    triggerClassName: string | undefined,
    includeViewDetails: boolean
  ) => (
    <DropdownMenu>
      <RecipientMenuButton
        recipient={recipient}
        compact={compact}
        className={triggerClassName}
        i18nNamespace={i18nNamespace}
      />
      <DropdownMenuContent align="end">
        {includeViewDetails && viewDetailsItem}
        {sharedItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
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
        {showPayOrVerify && (
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
                  aria-label={`${tString('actions.verifyAccount')} for ${displayName}`}
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
        {showInlineViewDetails && (
          <RecipientDetailsDialog recipient={recipient}>
            <Button
              variant="ghost"
              size="sm"
              className="eb-h-8 eb-shrink-0 eb-gap-1.5 eb-text-xs @sm:eb-hidden @lg:eb-inline-flex"
              aria-label={`${tString('actions.viewDetails')} for ${displayName}`}
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
        {showInlineViewDetails ? (
          <>
            {/* Menu WITH View Details - only at @sm breakpoint */}
            {renderManageMenu(
              'eb-hidden @sm:eb-inline-flex @lg:eb-hidden',
              true
            )}
            {/* Menu WITHOUT View Details - at <@sm and @md+ */}
            {renderManageMenu('@sm:eb-hidden @lg:eb-inline-flex', false)}
          </>
        ) : (
          /* Standard menu - always includes View Details */
          renderManageMenu(undefined, true)
        )}
      </div>
    </div>
  );
};

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
  headingLevel = 3,
  hideRemoveRecipient = false,
  showAccountToggle,
  showPaymentMethods,
  allowDetailedPaymentMethods,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);

  const isActive = recipient.status === 'ACTIVE';
  // Only show verify button if microdeposit actions are not hidden
  const showVerifyButton =
    !hideMicrodepositActions && canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);

  // Get status message for inline display (used in RecipientAccountDisplayCard)
  const statusMessage =
    recipient.status && recipient.status !== 'ACTIVE'
      ? t(`status.messages.${recipient.status}`)
      : undefined;

  // Status alert component (shows in non-compact mode)
  // In compact mode, statuses with inline messages don't need the alert
  const statusAlert =
    !hideActions && recipient.status && recipient.status !== 'ACTIVE' ? (
      <RecipientCardStatusAlert
        recipient={recipient}
        showVerifyButton={showVerifyButton}
        compact={compact}
        onMicrodepositVerifySettled={onMicrodepositVerifySettled}
        i18nNamespace={i18nNamespace}
      />
    ) : undefined;

  const hidePayButton = recipient.status === 'MICRODEPOSITS_INITIATED';

  const showActions =
    !hideActions && (showPaymentButton || !isActive || showVerifyButton);
  const actionsContent = showActions ? (
    <RecipientCardActions
      recipient={recipient}
      makePaymentComponent={makePaymentComponent}
      onEditRecipient={onEditRecipient}
      onRecipientSettled={onRecipientSettled}
      onMicrodepositVerifySettled={onMicrodepositVerifySettled}
      onRemoveSuccess={onRemoveSuccess}
      compact={compact}
      isActive={isActive}
      showVerifyButton={showVerifyButton}
      showPaymentButton={showPaymentButton}
      hidePayButton={hidePayButton}
      recipientType={recipientType}
      hideRemoveRecipient={hideRemoveRecipient}
      i18nNamespace={i18nNamespace}
    />
  ) : undefined;

  const renderAddRoutingButton = (isExpanded: boolean) => (
    <AddRoutingButton
      recipient={recipient}
      isExpanded={isExpanded}
      onEditRecipient={onEditRecipient}
      onRecipientSettled={onRecipientSettled}
      recipientType={recipientType}
      i18nNamespace={i18nNamespace}
    />
  );

  return (
    <RecipientAccountDisplayCard
      recipient={recipient}
      statusAlert={statusAlert}
      statusMessage={statusMessage}
      actionsContent={actionsContent}
      renderAddRoutingButton={renderAddRoutingButton}
      compact={compact}
      className={className}
      headingLevel={headingLevel}
      showAccountToggle={showAccountToggle}
      showPaymentMethods={showPaymentMethods}
      allowDetailedPaymentMethods={allowDetailedPaymentMethods}
    />
  );
};
