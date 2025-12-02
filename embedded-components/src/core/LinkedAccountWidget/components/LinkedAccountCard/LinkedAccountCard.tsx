import React from 'react';
import {
  ArrowRightIcon,
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
import { MakePayment } from '@/core/MakePayment';

import { MicrodepositsFormDialogTrigger } from '../../forms/MicrodepositsForm/MicrodepositsForm';
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

  /** Hide action buttons and status alerts (useful for confirmation views) */
  hideActions?: boolean;
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
  hideActions = false,
}) => {
  const { t } = useTranslation('linked-accounts');
  const isActive = recipient.status === 'ACTIVE';
  const displayName = getRecipientDisplayName(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);

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

  // Status alert component
  const statusAlert =
    !hideActions && recipient.status && recipient.status !== 'ACTIVE' ? (
      <StatusAlert
        status={recipient.status}
        action={
          showVerifyButton ? (
            <MicrodepositsFormDialogTrigger
              recipientId={recipient.id}
              onVerificationSettled={onMicrodepositVerifySettled}
            >
              <Button
                variant="default"
                size="sm"
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
  const actionsContent =
    !hideActions && (showPaymentButton || !isActive) ? (
      <div
        className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2"
        role="group"
        aria-label="Account actions"
      >
        {makePaymentComponent ? (
          React.cloneElement(makePaymentComponent as React.ReactElement, {
            recipientId: recipient.id,
          })
        ) : !showPaymentButton ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  className="eb-bg-background"
                  disabled
                  aria-label={`${t('actions.makePayment')} from ${displayName} - ${getDisabledPayTooltip()}`}
                >
                  <span>{t('actions.makePayment')}</span>
                  <ArrowRightIcon
                    className="eb-ml-2 eb-h-4 eb-w-4"
                    aria-hidden="true"
                  />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getDisabledPayTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <MakePayment
            triggerButton={
              <Button
                variant="outline"
                size="sm"
                className="eb-bg-background"
                aria-label={`${t('actions.makePayment')} from ${displayName}`}
              >
                <span>{t('actions.makePayment')}</span>
                <ArrowRightIcon
                  className="eb-ml-2 eb-h-4 eb-w-4"
                  aria-hidden="true"
                />
              </Button>
            }
            recipientId={recipient.id}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('actions.moreActions', { name: displayName })}
            >
              <span>{t('actions.manage')}</span>
              <MoreVerticalIcon
                className="eb-ml-2 eb-h-4 eb-w-4"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
            <DropdownMenuSeparator />
            <RemoveAccountDialogTrigger
              recipient={recipient}
              onLinkedAccountSettled={onLinkedAccountSettled}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
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
      actionsContent={actionsContent}
      renderAddRoutingButton={renderAddRoutingButton}
    />
  );
};
