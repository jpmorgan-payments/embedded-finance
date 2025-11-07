import React from 'react';
import {
  ArrowRightIcon,
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

import { EditAccountFormDialogTrigger } from '../forms/EditAccountForm';
import { MicrodepositsFormDialogTrigger } from '../forms/MicrodepositsForm/MicrodepositsForm';
import { RemoveAccountDialogTrigger } from '../forms/RemoveAccountDialog';
import { LinkedAccountCardProps } from '../LinkedAccountWidget.types';
import { AccountDisplayCard } from './AccountDisplayCard';
import { StatusAlert } from './StatusAlert';

/**
 * LinkedAccountCard - Displays a single linked account with its details and actions
 * Enhanced with better visual hierarchy and contextual information
 * Now uses AccountDisplayCard for consistent display patterns
 */
export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  recipient,
  makePaymentComponent,
  onLinkedAccountSettled,
  hideActions = false,
}) => {
  const isActive = recipient.status === 'ACTIVE';
  const displayName = getRecipientDisplayName(recipient);
  const showVerifyButton = canVerifyMicrodeposits(recipient);
  const showPaymentButton = canMakePayment(recipient);
  const missingPaymentMethods = getMissingPaymentMethods(recipient);

  // Generate button label based on missing methods
  const getAddRoutingButtonLabel = () => {
    if (missingPaymentMethods.length === 0) return '';
    if (missingPaymentMethods.length === 2) return 'Add Wire/RTP';
    return `Add ${missingPaymentMethods[0]}`;
  };

  // Helper to get tooltip message for disabled pay button
  const getDisabledPayTooltip = () => {
    if (!recipient.status) return 'Payment unavailable';

    switch (recipient.status) {
      case 'READY_FOR_VALIDATION':
        return 'Complete account verification to enable payments';
      case 'MICRODEPOSITS_INITIATED':
        return 'Waiting for microdeposit verification to enable payments';
      case 'INACTIVE':
        return 'Account is inactive. Please activate to make payments';
      case 'REJECTED':
        return 'Account verification was rejected. Please contact support';
      case 'PENDING':
        return 'Account is being processed. Please wait to make payments';
      default:
        return 'Payment unavailable for this account';
    }
  };

  // Add routing button component
  const renderAddRoutingButton = (isExpanded: boolean) => (
    <EditAccountFormDialogTrigger
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
    </EditAccountFormDialogTrigger>
  );

  // Status alert component
  const statusAlert =
    !hideActions && recipient.status && recipient.status !== 'ACTIVE' ? (
      <StatusAlert
        status={recipient.status}
        action={
          showVerifyButton ? (
            <MicrodepositsFormDialogTrigger recipientId={recipient.id}>
              <Button
                variant="default"
                size="sm"
                aria-label={`Verify account for ${displayName}`}
              >
                <span>Verify Account</span>
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
                  aria-label={`Make payment from ${displayName} - ${getDisabledPayTooltip()}`}
                >
                  <span>Pay</span>
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
          <Button
            variant="outline"
            size="sm"
            className="eb-bg-background"
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
            <EditAccountFormDialogTrigger
              recipient={recipient}
              onLinkedAccountSettled={onLinkedAccountSettled}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="eb-cursor-pointer"
              >
                <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                <span>Edit Payment Methods</span>
              </DropdownMenuItem>
            </EditAccountFormDialogTrigger>
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
                <span>Remove Account</span>
              </DropdownMenuItem>
            </RemoveAccountDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : undefined;

  return (
    <AccountDisplayCard
      recipient={recipient}
      statusAlert={statusAlert}
      actionsContent={actionsContent}
      renderAddRoutingButton={renderAddRoutingButton}
    />
  );
};
