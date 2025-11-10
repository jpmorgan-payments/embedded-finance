import React, { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';

import { shouldShowCreateButton } from '@/lib/recipientHelpers';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { Button } from '@/components/ui/button';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { EmptyState } from './components/EmptyState';
import { LinkedAccountCard } from './components/LinkedAccountCard';
import { LinkedAccountCardSkeleton } from './components/LinkedAccountCardSkeleton';
import { LinkAccountFormDialogTrigger } from './forms/LinkAccountForm/LinkAccountForm';
import { LinkedAccountWidgetProps } from './LinkedAccountWidget.types';

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
  const { data, isLoading, isError, error, isSuccess, refetch } =
    useGetAllRecipients({
      type: 'LINKED_ACCOUNT',
    });

  // Filter recipients based on variant
  const linkedAccounts = useMemo(() => {
    const filtered = data?.recipients?.filter(
      (recipient) => recipient.type === 'LINKED_ACCOUNT'
    );
    if (!filtered) return [];
    return variant === 'singleAccount' ? filtered.slice(0, 1) : filtered;
  }, [data?.recipients, variant]);

  // Check if there's at least one active account
  const hasActiveAccount = useMemo(
    () => linkedAccounts.some((r) => r.status === 'ACTIVE'),
    [linkedAccounts]
  );

  const showCreate = shouldShowCreateButton(
    variant,
    hasActiveAccount,
    showCreateButton
  );

  return (
    <div className="eb-w-full eb-@container">
      <Card
        className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl ${className || ''}`}
      >
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4">
            <div>
              <CardTitle className="eb-text-lg eb-font-semibold @md:eb-text-xl">
                Linked Accounts{' '}
                {!isLoading && !isError && (
                  <span className="eb-animate-fade-in">
                    ({linkedAccounts.length})
                  </span>
                )}
              </CardTitle>
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                Manage your external bank accounts for payments
              </p>
            </div>
            {showCreate && !isLoading && (
              <div className="eb-animate-fade-in">
                <LinkAccountFormDialogTrigger
                  onLinkedAccountSettled={onLinkedAccountSettled}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="eb-shrink-0 eb-bg-background"
                  >
                    <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                    Link A New Account
                  </Button>
                </LinkAccountFormDialogTrigger>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          {/* Loading state with skeleton cards */}
          {isLoading && (
            <div className="eb-grid eb-grid-cols-1 eb-gap-3 @4xl:eb-grid-cols-2">
              {/* Show 1 skeleton card during loading */}
              <LinkedAccountCardSkeleton />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <ServerErrorAlert
              customTitle="Error loading linked accounts"
              customErrorMessage={{
                default:
                  'An unexpected error occurred while loading your linked accounts. Please try again.',
                400: 'Your platform does not have permission to access linked accounts. Please contact support.',
              }}
              error={error}
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
