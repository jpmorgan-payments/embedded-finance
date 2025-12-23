import React, { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
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
import { LinkedAccountsTableView } from './components/LinkedAccountsTableView';
import { RemoveAccountResultDialog } from './components/RemoveAccountResultDialog/RemoveAccountResultDialog';
import { VerificationResultDialog } from './components/VerificationResultDialog/VerificationResultDialog';
import { useLinkedAccounts } from './hooks';
import { LINKED_ACCOUNT_USER_JOURNEYS } from './LinkedAccountWidget.constants';
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
 * @example Basic usage
 * ```tsx
 * <LinkedAccountWidget
 *   onAccountLinked={(recipient, error) => {
 *     if (error) {
 *       console.error('Failed to link account:', error);
 *     } else {
 *       console.log('Account linked successfully:', recipient);
 *     }
 *   }}
 * />
 * ```
 *
 * @example Single account mode (for payment flows)
 * ```tsx
 * <LinkedAccountWidget mode="single" />
 * ```
 *
 * @example Scrollable with custom height
 * ```tsx
 * <LinkedAccountWidget scrollable maxHeight={500} />
 * ```
 *
 * @example Compact mode with custom payment action
 * ```tsx
 * <LinkedAccountWidget
 *   compact
 *   renderPaymentAction={(recipient) => (
 *     <Button onClick={() => pay(recipient)}>Pay</Button>
 *   )}
 * />
 * ```
 */
export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  // New props (preferred)
  mode,
  viewMode = 'cards',
  compact = false,
  scrollable,
  maxHeight,
  defaultVisibleCount = 10,
  pageSize = 10,
  hideCreateButton,
  renderPaymentAction,
  onAccountLinked,
  onVerificationComplete,
  className,
  userEventsHandler,
  userEventsLifecycle,

  // Deprecated props (for backward compatibility)
  variant,
  showCreateButton,
  scrollHeight,
  makePaymentComponent,
  onLinkedAccountSettled,
  onMicrodepositVerifySettled,
}) => {
  // ============================================================================
  // Normalize deprecated props to new props
  // ============================================================================

  // mode: 'list' | 'single' (new) vs variant: 'default' | 'singleAccount' (deprecated)
  const resolvedMode =
    mode ?? (variant === 'singleAccount' ? 'single' : 'list');

  // scrollable + maxHeight (new) vs scrollHeight (deprecated)
  const resolvedScrollable = scrollable ?? scrollHeight !== undefined;
  const resolvedMaxHeight = maxHeight ?? scrollHeight ?? '400px';

  // hideCreateButton (new) vs showCreateButton (deprecated, inverted logic)
  const resolvedHideCreateButton =
    hideCreateButton ??
    (showCreateButton !== undefined ? !showCreateButton : false);

  // renderPaymentAction (new) vs makePaymentComponent (deprecated)
  // For backward compatibility, wrap makePaymentComponent in a function
  const resolvedRenderPaymentAction =
    renderPaymentAction ??
    (makePaymentComponent ? () => makePaymentComponent : undefined);

  // Callback normalization
  const resolvedOnAccountLinked = onAccountLinked ?? onLinkedAccountSettled;
  const resolvedOnVerificationComplete =
    onVerificationComplete ?? onMicrodepositVerifySettled;

  // ============================================================================
  // Component State
  // ============================================================================

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

  // Ref for scroll container (virtualization)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use custom hook for data fetching and state management
  const {
    linkedAccounts,
    hasActiveAccount,
    isLoading,
    isError,
    error: linkedAccountsError,
    isSuccess,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
    totalCount,
    nextLoadCount,
    isExpanded,
    toggleExpanded,
  } = useLinkedAccounts({
    variant: resolvedMode === 'single' ? 'singleAccount' : 'default',
    defaultVisibleCount,
    pageSize,
  });

  // Setup virtualizer for scrollable mode
  const rowVirtualizer = useVirtualizer({
    count: linkedAccounts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 240, // Estimated height - will be measured dynamically
    overscan: 2, // Render 2 items above/below viewport for smooth scrolling
    enabled: resolvedScrollable, // Only enable when scrollable is true
    measureElement:
      typeof window !== 'undefined'
        ? (element) => (element as HTMLElement).offsetHeight
        : undefined,
  });

  // Auto-load more when scrolling near bottom (infinite scroll)
  useEffect(() => {
    if (!resolvedScrollable || !hasMore || isLoadingMore) return;

    const lastItem = rowVirtualizer.getVirtualItems().slice(-1)[0];
    if (!lastItem) return;

    // Load more when within 5 items of the end
    if (lastItem.index >= linkedAccounts.length - 5) {
      loadMore();
    }
  }, [
    resolvedScrollable,
    hasMore,
    isLoadingMore,
    rowVirtualizer.getVirtualItems(),
    linkedAccounts.length,
    loadMore,
  ]);

  // Determine if create button should be shown
  const showCreate = shouldShowCreateButton(
    resolvedMode === 'single' ? 'singleAccount' : 'default',
    hasActiveAccount,
    !resolvedHideCreateButton
  );

  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'linked-account-widget',
    userEventsHandler,
    userEventsLifecycle,
  });

  // Track view when component loads with accounts
  React.useEffect(() => {
    if (isSuccess && linkedAccounts.length > 0) {
      trackUserEvent({
        actionName: LINKED_ACCOUNT_USER_JOURNEYS.VIEW_ACCOUNTS,
        metadata: { count: linkedAccounts.length },
        userEventsHandler,
      });
    }
  }, [isSuccess, linkedAccounts.length, userEventsHandler]);

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
      trackUserEvent({
        actionName: LINKED_ACCOUNT_USER_JOURNEYS.VERIFY_COMPLETED,
        metadata: { recipientId: recipient?.id, status: response.status },
        userEventsHandler,
      });
    }

    resolvedOnVerificationComplete?.(response, recipient);
  };

  // Handle account removal success
  const handleRemoveSuccess = (recipient: Recipient) => {
    setRemovedRecipient(recipient);
    setShowRemoveResultDialog(true);
    trackUserEvent({
      actionName: LINKED_ACCOUNT_USER_JOURNEYS.REMOVE_COMPLETED,
      metadata: { recipientId: recipient.id },
      userEventsHandler,
    });
  };

  // Handle account link success
  const handleLinkedAccountSettled = (recipient?: Recipient, error?: any) => {
    if (recipient && !error) {
      trackUserEvent({
        actionName: LINKED_ACCOUNT_USER_JOURNEYS.LINK_COMPLETED,
        metadata: { recipientId: recipient.id },
        userEventsHandler,
      });
    }
    resolvedOnAccountLinked?.(recipient, error);
  };

  return (
    <div id="linked-account-widget" className="eb-w-full eb-@container">
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
        className={cn(
          'eb-component eb-mx-auto eb-w-full eb-max-w-5xl eb-overflow-hidden',
          className
        )}
      >
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-col eb-gap-2 @xs:eb-flex-row @xs:eb-items-center @xs:eb-justify-between @xs:eb-gap-4">
            <div className="eb-min-w-0 eb-flex-1">
              <div className="eb-flex eb-items-center eb-gap-2">
                <CardTitle className="eb-h-8 eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-8 @md:eb-text-xl">
                  {t('title')}{' '}
                  {!isLoading && !isError && (
                    <span className="eb-animate-fade-in">
                      {`(${totalCount})`}
                    </span>
                  )}
                </CardTitle>
              </div>
              {!compact && (
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {t('description')}
                </p>
              )}
            </div>
            {showCreate && !isLoading && linkedAccounts.length > 0 && (
              <div className="eb-animate-fade-in">
                <LinkedAccountFormDialog
                  mode="create"
                  onLinkedAccountSettled={handleLinkedAccountSettled}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('eb-shrink-0 eb-bg-background', {
                      'eb-h-8 eb-px-3': compact,
                    })}
                    data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.LINK_STARTED}
                  >
                    <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                    <span className="@md:eb-hidden">{t('link')}</span>
                    <span className="eb-hidden @md:eb-inline">
                      {t('linkNewAccount')}
                    </span>
                  </Button>
                </LinkedAccountFormDialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent
          className={cn('eb-transition-all eb-duration-300 eb-ease-in-out', {
            'eb-space-y-0 eb-p-0': compact,
            'eb-p-0': resolvedScrollable,
            'eb-space-y-4 eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': !(
              resolvedScrollable || compact
            ),
          })}
        >
          {/* Loading state with skeleton cards */}
          {isLoading && (
            <div
              className={cn('eb-grid eb-grid-cols-1 eb-gap-3', {
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': resolvedScrollable,
              })}
            >
              {/* Show 1 skeleton card during loading */}
              <LinkedAccountCardSkeleton compact={compact} />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div
              className={cn({
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': resolvedScrollable || compact,
              })}
            >
              <ServerErrorAlert
                customTitle={t('errors.loading.title')}
                customErrorMessage={{
                  default: t('errors.loading.default'),
                  400: t('errors.loading.400'),
                }}
                error={linkedAccountsError as any}
                tryAgainAction={refetch}
                showDetails
              />
            </div>
          )}

          {/* Empty state */}
          {isSuccess && linkedAccounts.length === 0 && (
            <div
              className={cn({
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': resolvedScrollable || compact,
              })}
            >
              <EmptyState
                className="eb-animate-fade-in"
                compact={compact}
                action={
                  showCreate && (
                    <LinkedAccountFormDialog
                      mode="create"
                      onLinkedAccountSettled={handleLinkedAccountSettled}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className={cn({
                          'eb-h-8 eb-px-3': compact,
                        })}
                      >
                        <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                        {t('linkNewAccount')}
                      </Button>
                    </LinkedAccountFormDialog>
                  )
                }
              />
            </div>
          )}

          {/* Linked accounts list */}
          {isSuccess && linkedAccounts.length > 0 && (
            <>
              {viewMode === 'table' ? (
                // Table view with server-side pagination
                <div
                  className={cn({
                    'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': true,
                  })}
                >
                  <LinkedAccountsTableView
                    useServerPagination
                    renderPaymentAction={resolvedRenderPaymentAction}
                    onLinkedAccountSettled={resolvedOnAccountLinked}
                    onMicrodepositVerifySettled={
                      handleMicrodepositVerifySettled
                    }
                    onRemoveSuccess={handleRemoveSuccess}
                    defaultPageSize={defaultVisibleCount}
                    showPagination
                  />
                </div>
              ) : resolvedScrollable ? (
                // Virtualized scrollable list
                <div
                  ref={scrollContainerRef}
                  style={{
                    maxHeight: resolvedMaxHeight,
                    overflow: 'auto',
                  }}
                  className={cn('eb-relative', {
                    'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': !compact,
                  })}
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const recipient = linkedAccounts[virtualRow.index];
                      return (
                        <div
                          key={recipient.id}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div className={cn({ 'eb-px-1 eb-pb-3': !compact })}>
                            <LinkedAccountCard
                              recipient={recipient}
                              makePaymentComponent={resolvedRenderPaymentAction?.(
                                recipient
                              )}
                              onLinkedAccountSettled={resolvedOnAccountLinked}
                              onMicrodepositVerifySettled={
                                handleMicrodepositVerifySettled
                              }
                              onRemoveSuccess={handleRemoveSuccess}
                              compact={compact}
                              className={cn({
                                'eb-border-b-0':
                                  compact &&
                                  virtualRow.index ===
                                    linkedAccounts.length - 1,
                              })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Loading indicator at bottom when fetching more */}
                  {isLoadingMore && (
                    <div className="eb-flex eb-justify-center eb-py-4">
                      <div className="eb-h-6 eb-w-6 eb-animate-spin eb-rounded-full eb-border-2 eb-border-current eb-border-t-transparent" />
                    </div>
                  )}
                </div>
              ) : (
                // Non-virtualized grid layout (default)
                <>
                  <div
                    className={cn('eb-grid eb-grid-cols-1 eb-items-start', {
                      'eb-gap-0': compact,
                      'eb-gap-3': !compact,
                      '@4xl:eb-grid-cols-2':
                        !compact && linkedAccounts.length > 1,
                    })}
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
                          makePaymentComponent={resolvedRenderPaymentAction?.(
                            recipient
                          )}
                          onLinkedAccountSettled={resolvedOnAccountLinked}
                          onMicrodepositVerifySettled={
                            handleMicrodepositVerifySettled
                          }
                          onRemoveSuccess={handleRemoveSuccess}
                          compact={compact}
                          className={cn({
                            'eb-border-b-0':
                              compact && index === linkedAccounts.length - 1,
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Expand/Load More/Collapse Actions */}
                  {compact
                    ? // COMPACT MODE - Full width clickable areas
                      ((!isExpanded && hasMore) ||
                        (isExpanded &&
                          (hasMore ||
                            linkedAccounts.length > defaultVisibleCount))) && (
                        <div className="eb-space-y-0 eb-border-t">
                          {/* Collapse Button - Only when expanded and showing more than initial */}
                          {isExpanded &&
                            linkedAccounts.length > defaultVisibleCount && (
                              <button
                                type="button"
                                onClick={toggleExpanded}
                                className="eb-group eb-w-full eb-bg-muted/40 eb-py-2 eb-text-center eb-transition-colors hover:eb-bg-muted/60"
                                aria-label={t('actions.showLess', {
                                  defaultValue: 'Show less',
                                })}
                              >
                                <div className="eb-flex eb-items-center eb-justify-center eb-gap-2 eb-text-xs eb-text-muted-foreground group-hover:eb-text-foreground">
                                  <ChevronUpIcon className="eb-h-4 eb-w-4" />
                                  <span>
                                    {t('actions.showLess', {
                                      defaultValue: 'Show less',
                                    })}
                                  </span>
                                </div>
                              </button>
                            )}

                          {/* Show More / Load More Button - Full width clickable area */}
                          {((!isExpanded && hasMore) ||
                            (isExpanded && hasMore)) && (
                            <button
                              type="button"
                              onClick={!isExpanded ? toggleExpanded : loadMore}
                              disabled={isLoadingMore}
                              className={cn(
                                'eb-group eb-w-full eb-bg-muted eb-py-2 eb-text-center eb-transition-colors hover:eb-bg-muted/60 disabled:eb-opacity-50',
                                {
                                  'eb-border-t':
                                    isExpanded &&
                                    linkedAccounts.length > defaultVisibleCount,
                                }
                              )}
                              aria-label={
                                !isExpanded
                                  ? t('showMoreWithCount', {
                                      defaultValue:
                                        'Show {{count}} more account_other',
                                      count: nextLoadCount,
                                    })
                                  : t('showMoreWithCount', {
                                      count: nextLoadCount,
                                    })
                              }
                            >
                              <div className="eb-flex eb-items-center eb-justify-center eb-gap-2 eb-text-xs eb-text-muted-foreground group-hover:eb-text-foreground">
                                {isLoadingMore ? (
                                  <>
                                    <div className="eb-h-4 eb-w-4 eb-animate-spin eb-rounded-full eb-border-2 eb-border-current eb-border-t-transparent" />
                                    <span>{t('loadingMore')}</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="eb-h-4 eb-w-4" />
                                    <span>
                                      {!isExpanded
                                        ? t('showMoreWithCount', {
                                            defaultValue:
                                              'Show {{count}} more account_other',
                                            count: nextLoadCount,
                                          })
                                        : t('showMoreWithCount', {
                                            count: nextLoadCount,
                                          })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                      )
                    : // NON-COMPACT MODE - Small buttons side by side
                      ((!isExpanded && hasMore) ||
                        (isExpanded &&
                          linkedAccounts.length > defaultVisibleCount) ||
                        (isExpanded && hasMore)) && (
                        <div className="eb-flex eb-justify-center eb-gap-2 eb-pt-2">
                          {/* Show expand button when collapsed and there are more items available */}
                          {!isExpanded && hasMore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleExpanded}
                              className="eb-h-8 eb-text-xs eb-text-muted-foreground hover:eb-text-foreground"
                            >
                              <ChevronDownIcon className="eb-mr-1.5 eb-h-3.5 eb-w-3.5" />
                              {t('showMoreWithCount', {
                                defaultValue:
                                  'Show {{count}} more account_other',
                                count: nextLoadCount,
                              })}
                            </Button>
                          )}

                          {/* Show "Show less" when expanded and showing more than initial */}
                          {isExpanded &&
                            linkedAccounts.length > defaultVisibleCount && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleExpanded}
                                className="eb-h-8 eb-text-xs eb-text-muted-foreground hover:eb-text-foreground"
                              >
                                <ChevronUpIcon className="eb-mr-1.5 eb-h-3.5 eb-w-3.5" />
                                {t('actions.showLess', {
                                  defaultValue: 'Show less',
                                })}
                              </Button>
                            )}

                          {/* Show "Load more" when all current items are shown but there's more to fetch */}
                          {isExpanded && hasMore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={loadMore}
                              disabled={isLoadingMore}
                              className="eb-h-8 eb-text-xs eb-text-muted-foreground hover:eb-text-foreground"
                            >
                              {isLoadingMore ? (
                                <>
                                  <div className="eb-mr-1.5 eb-h-3.5 eb-w-3.5 eb-animate-spin eb-rounded-full eb-border-2 eb-border-current eb-border-t-transparent" />
                                  {t('loadingMore')}
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="eb-mr-1.5 eb-h-3.5 eb-w-3.5" />
                                  {t('showMoreWithCount', {
                                    count: nextLoadCount,
                                  })}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
