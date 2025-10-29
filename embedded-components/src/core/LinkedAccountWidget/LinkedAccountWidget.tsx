import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { EmptyState } from './components/EmptyState';
import { LinkedAccountCard } from './components/LinkedAccountCard';
import { LinkAccountFormDialogTrigger } from './forms/LinkAccountForm/LinkAccountForm';
import { MicrodepositsFormDialogTrigger } from './forms/MicrodepositsForm/MicrodepositsForm';
import { useLinkedAccounts } from './hooks/useLinkedAccounts';
import { LinkedAccountWidgetProps } from './LinkedAccountWidget.types';
import { shouldShowCreateButton } from './utils/recipientHelpers';

/**
 * LinkedAccountWidget - Main component for managing linked bank accounts
 *
 * This component displays a list of linked bank accounts and provides functionality
 * for linking new accounts and verifying microdeposits.
 *
 * @example
 * ```tsx
 * <LinkedAccountWidget
 *   variant="default"
 *   showCreateButton={true}
 *   onLinkedAccountSettled={(recipient, error) => {
 *     if (error) {
 *       console.error('Failed to link account:', error);
 *     } else {
 *       console.log('Account linked successfully:', recipient);
 *     }
 *   }}
 * />
 * ```
 */
export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  variant = 'default',
  showCreateButton = true,
  makePaymentComponent,
  onLinkedAccountSettled,
  className,
}) => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null
  );

  const { recipients, hasActiveAccount, isLoading, isError, error, isSuccess } =
    useLinkedAccounts({ variant });

  const showCreate = shouldShowCreateButton(
    variant,
    hasActiveAccount,
    showCreateButton
  );

  const handleVerifyClick = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
  };

  return (
    <Card className={`eb-component eb-w-full ${className || ''}`}>
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            Linked Accounts
          </CardTitle>
          {showCreate && (
            <LinkAccountFormDialogTrigger
              onLinkedAccountSettled={onLinkedAccountSettled}
            >
              <Button>Link A New Account</Button>
            </LinkAccountFormDialogTrigger>
          )}
        </div>
      </CardHeader>

      <CardContent className="eb-space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            Loading linked accounts...
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="eb-py-8 eb-text-center eb-text-red-500">
            Error: {error?.message ?? 'Unknown error'}
          </div>
        )}

        {/* Empty state */}
        {isSuccess && recipients.length === 0 && <EmptyState />}

        {/* Linked accounts list */}
        {isSuccess &&
          recipients.length > 0 &&
          recipients.map((recipient) => (
            <LinkedAccountCard
              key={recipient.id}
              recipient={recipient}
              makePaymentComponent={makePaymentComponent}
              onVerifyClick={handleVerifyClick}
            />
          ))}
      </CardContent>

      {/* Microdeposits verification dialog */}
      {selectedRecipientId && (
        <MicrodepositsFormDialogTrigger
          recipientId={selectedRecipientId}
          onLinkedAccountSettled={onLinkedAccountSettled}
        >
          <div style={{ display: 'none' }} />
        </MicrodepositsFormDialogTrigger>
      )}
    </Card>
  );
};
