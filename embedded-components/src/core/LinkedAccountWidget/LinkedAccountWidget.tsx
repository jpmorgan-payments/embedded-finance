import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { EmptyState } from './components/EmptyState/EmptyState';
import { LinkedAccountCard } from './components/LinkedAccountCard/LinkedAccountCard';
import { LinkedAccountCardSkeleton } from './components/LinkedAccountCardSkeleton/LinkedAccountCardSkeleton';
import { LinkedAccountFormDialog } from './components/LinkedAccountFormDialog/LinkedAccountFormDialog';
import { RemoveAccountResultDialog } from './components/RemoveAccountResultDialog/RemoveAccountResultDialog';
import { VerificationResultDialog } from './components/VerificationResultDialog/VerificationResultDialog';
import { useLinkedAccounts } from './hooks';
import { LinkedAccountWidgetProps } from './LinkedAccountWidget.types';
import { shouldShowCreateButton } from './utils';

/**
 * LinkedAccountWidget - Main component for managing linked bank accounts
 *
 * This component displays a list of linked bank accounts and provides functionality
 * for linking new accounts and verifying microdeposits.
 *
 * Enhanced with improved loading states, error handling, and visual design.
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
  onMicrodepositVerifySettled,
  className,
}) => {
  const { t } = useTranslation('linked-accounts');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultVariant, setResultVariant] = useState<
    'success' | 'maxAttemptsExceeded'
  >('success');
  const [resultRecipient, setResultRecipient] = useState<Recipient | undefined>(
    undefined
  );
  const [showRemoveResultDialog, setShowRemoveResultDialog] = useState(false);
  const [removedRecipient, setRemovedRecipient] = useState<
    Recipient | undefined
  >(undefined);

  // Use custom hook for data fetching and state management
  const {
    linkedAccounts,
    metadata,
    hasActiveAccount,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
  } = useLinkedAccounts({ variant });

  // Determine if create button should be shown
  const showCreate = shouldShowCreateButton(
    variant,
    hasActiveAccount,
    showCreateButton
  );

  // Handle microdeposit verification completed
  const handleMicrodepositVerifySettled = (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => {
    // Check if max attempts exceeded
    if (response.status === 'FAILED_MAX_ATTEMPTS_EXCEEDED') {
      setResultRecipient(recipient);
      setResultVariant('maxAttemptsExceeded');
      setShowResultDialog(true);
    }

    // Check if verification succeeded
    if (response.status === 'VERIFIED') {
      setResultRecipient(recipient);
      setResultVariant('success');
      setShowResultDialog(true);
    }

    onMicrodepositVerifySettled?.(response, recipient);
  };

  // Handle account removal success
  const handleRemoveSuccess = (recipient: Recipient) => {
    setRemovedRecipient(recipient);
    setShowRemoveResultDialog(true);
  };

  return (
    <div className="eb-w-full eb-@container">
      <VerificationResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        recipient={resultRecipient}
        variant={resultVariant}
      />

      <RemoveAccountResultDialog
        open={showRemoveResultDialog}
        onOpenChange={setShowRemoveResultDialog}
        recipient={removedRecipient}
      />

      <Card
        className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl ${className || ''}`}
      >
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4">
            <div>
              <CardTitle className="eb-font-header eb-text-lg eb-font-semibold @md:eb-text-xl">
                {t('title')}{' '}
                {!isLoading && !isError && (
                  <span className="eb-animate-fade-in">
                    {t('count', {
                      count: metadata?.total_items || linkedAccounts.length,
                    })}
                  </span>
                )}
              </CardTitle>
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                {t('description')}
              </p>
            </div>
            {showCreate && !isLoading && (
              <div className="eb-animate-fade-in">
                <LinkedAccountFormDialog
                  mode="create"
                  onLinkedAccountSettled={onLinkedAccountSettled}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="eb-shrink-0 eb-bg-background"
                  >
                    <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                    {t('linkNewAccount')}
                  </Button>
                </LinkedAccountFormDialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          {/* Loading state with skeleton cards */}
          {isLoading && (
            <div className="eb-grid eb-grid-cols-1 eb-gap-3">
              {/* Show 1 skeleton card during loading */}
              <LinkedAccountCardSkeleton />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <ServerErrorAlert
              customTitle={t('errors.loading.title')}
              customErrorMessage={{
                default: t('errors.loading.default'),
                400: t('errors.loading.400'),
              }}
              error={error as any}
              tryAgainAction={refetch}
              showDetails
            />
          )}

          {/* Empty state */}
          {isSuccess && linkedAccounts.length === 0 && (
            <EmptyState className="eb-animate-fade-in" />
          )}

          {/* Linked accounts list with staggered fade-in animation */}
          {isSuccess && linkedAccounts.length > 0 && (
            <div
              className={`eb-grid eb-grid-cols-1 eb-items-start eb-gap-3 ${linkedAccounts.length > 1 ? '@4xl:eb-grid-cols-2' : ''}`}
            >
              {linkedAccounts.map((recipient, index) => (
                <div
                  key={recipient.id}
                  className="eb-animate-fade-in"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <LinkedAccountCard
                    recipient={recipient}
                    makePaymentComponent={makePaymentComponent}
                    onLinkedAccountSettled={onLinkedAccountSettled}
                    onMicrodepositVerifySettled={
                      handleMicrodepositVerifySettled
                    }
                    onRemoveSuccess={handleRemoveSuccess}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
