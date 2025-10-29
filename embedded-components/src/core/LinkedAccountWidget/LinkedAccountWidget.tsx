import React, { useState } from 'react';
import { AlertTriangleIcon, PlusIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { EmptyState } from './components/EmptyState';
import { LinkedAccountCard } from './components/LinkedAccountCard';
import { LinkedAccountCardSkeleton } from './components/LinkedAccountCardSkeleton';
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
  className,
}) => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null
  );
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const { recipients, hasActiveAccount, isLoading, isError, error, isSuccess } =
    useLinkedAccounts({ variant });

  const showCreate = shouldShowCreateButton(
    variant,
    hasActiveAccount,
    showCreateButton
  );

  const handleVerifyClick = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    setIsVerifyDialogOpen(true);
  };

  const handleUpdateRoutingClick = (recipientId: string) => {
    // TODO: Implement update routing dialog in future iteration
    // This would open a form to add Wire or RTP routing information
    // For now, we just prevent the unused variable warning
    if (recipientId) {
      // Placeholder for future implementation
    }
  };

  return (
    <div className="eb-w-full eb-@container">
      <Card
        className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl ${className || ''}`}
      >
        <CardHeader className="eb-border-b eb-bg-muted/30">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4">
            <div>
              <CardTitle className="eb-text-lg eb-font-semibold @md:eb-text-xl">
                Linked Accounts
              </CardTitle>
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                Manage your external bank accounts for payments
              </p>
            </div>
            {showCreate && !isLoading && (
              <LinkAccountFormDialogTrigger
                onLinkedAccountSettled={onLinkedAccountSettled}
              >
                <Button size="sm" className="eb-shrink-0">
                  <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                  Link Account
                </Button>
              </LinkAccountFormDialogTrigger>
            )}
          </div>
        </CardHeader>

        <CardContent className="eb-space-y-4 eb-p-6">
          {/* Loading state with skeleton cards */}
          {isLoading && (
            <div className="eb-grid eb-grid-cols-1 eb-gap-3 @4xl:eb-grid-cols-2">
              {/* Show 1 skeleton card during loading */}
              <LinkedAccountCardSkeleton />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <Alert variant="destructive" className="eb-animate-fade-in">
              <AlertTriangleIcon className="eb-h-4 eb-w-4" />
              <AlertTitle>Error loading accounts</AlertTitle>
              <AlertDescription>
                {error?.message ??
                  'An unexpected error occurred while loading your linked accounts. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Empty state */}
          {isSuccess && recipients.length === 0 && (
            <div className="eb-animate-fade-in">
              <EmptyState />
            </div>
          )}

          {/* Linked accounts list with staggered fade-in animation */}
          {isSuccess && recipients.length > 0 && (
            <div className="eb-grid eb-grid-cols-1 eb-gap-3 @4xl:eb-grid-cols-2">
              {recipients.map((recipient, index) => (
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
                    onVerifyClick={handleVerifyClick}
                    onUpdateRoutingClick={handleUpdateRoutingClick}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Microdeposits verification dialog */}
        {selectedRecipientId && (
          <MicrodepositsFormDialogTrigger
            recipientId={selectedRecipientId}
            open={isVerifyDialogOpen}
            onOpenChange={(open) => {
              setIsVerifyDialogOpen(open);
              if (!open) {
                setSelectedRecipientId(null);
              }
            }}
            onLinkedAccountSettled={onLinkedAccountSettled}
          >
            <div style={{ display: 'none' }} />
          </MicrodepositsFormDialogTrigger>
        )}
      </Card>
    </div>
  );
};
