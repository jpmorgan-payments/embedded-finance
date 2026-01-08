import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PaginationState } from '@tanstack/react-table';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import {
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import type { ApiError } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { useLinkedAccounts, useLinkedAccountsTable } from '../../hooks';
import {
  getRecipientTypeConfig,
  getUserJourneys,
  SupportedRecipientType,
} from '../../types';
import {
  invalidateLinkedAccountQueries,
  shouldShowCreateButton,
} from '../../utils';
import { EmptyState } from '../EmptyState/EmptyState';
import { LinkedAccountCard } from '../LinkedAccountCard/LinkedAccountCard';
import { LinkedAccountCardSkeleton } from '../LinkedAccountCardSkeleton/LinkedAccountCardSkeleton';
import { LinkedAccountFormDialog } from '../LinkedAccountFormDialog/LinkedAccountFormDialog';
import { LinkedAccountsTableView } from '../LinkedAccountsTableView';
import { Pagination } from '../Pagination';
import { RemoveAccountResultDialog } from '../RemoveAccountResultDialog/RemoveAccountResultDialog';
import { VerificationResultDialog } from '../VerificationResultDialog/VerificationResultDialog';

/**
 * Props for the BaseRecipientsWidget component
 *
 * This is the internal base component that powers both
 * LinkedAccountWidget and RecipientsWidget.
 */
export interface BaseRecipientsWidgetProps extends UserTrackingProps {
  /**
   * Type of recipients to display
   */
  recipientType: SupportedRecipientType;

  /**
   * Layout mode for the widget
   * - `'list'`: Show all recipients with expand/collapse pagination (default)
   * - `'single'`: Show only the first recipient; hides "Add New Recipient"
   *   button when an active recipient exists
   *
   * @default 'list'
   */
  mode?: 'list' | 'single';

  /**
   * View mode for displaying recipients
   * - `'cards'`: Display recipients as full cards with rich details (default)
   * - `'compact-cards'`: Display recipients as compact rows with minimal spacing
   * - `'table'`: Display recipients in a sortable/paginated table
   *
   * @default 'cards'
   */
  viewMode?: 'cards' | 'compact-cards' | 'table';

  /**
   * Enable scrollable container with virtualization and infinite scroll.
   *
   * @default false
   */
  scrollable?: boolean;

  /**
   * Maximum height of the scrollable container (only when `scrollable={true}`).
   *
   * @default '400px'
   */
  maxHeight?: number | string;

  /**
   * Number of recipients to fetch per API request.
   *
   * @default 10
   */
  pageSize?: number;

  /**
   * Pagination style for cards and compact-cards views.
   * - `'loadMore'`: Show a "Load More" button to incrementally load recipients (default)
   * - `'pages'`: Show page navigation controls similar to the table view
   *
   * Note: This prop has no effect when `viewMode` is `'table'` (table always uses pages).
   *
   * @default 'loadMore'
   */
  paginationStyle?: 'loadMore' | 'pages';

  /**
   * Hide the "Add New Recipient" button.
   *
   * @default false
   */
  hideCreateButton?: boolean;

  /**
   * Render a custom payment/action component for each recipient card.
   */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  /**
   * Called when a recipient operation completes (success or failure).
   */
  onAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /**
   * Called when microdeposit verification completes.
   * Note: Only applicable for LINKED_ACCOUNT type.
   */
  onVerificationComplete?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;

  /**
   * Additional CSS class name(s) for the root Card element.
   */
  className?: string;
}

/**
 * BaseRecipientsWidget - Internal base component for managing recipients (linked accounts and payment recipients)
 *
 * This component is not meant to be used directly. Instead, use:
 * - `LinkedAccountWidget` for managing linked bank accounts (LINKED_ACCOUNT type)
 * - `RecipientsWidget` for managing payment recipients (RECIPIENT type)
 *
 * @internal
 */
export const BaseRecipientsWidget: React.FC<BaseRecipientsWidgetProps> = ({
  recipientType,
  mode = 'list',
  viewMode = 'cards',
  scrollable = false,
  maxHeight = '400px',
  pageSize = 10,
  paginationStyle = 'loadMore',
  hideCreateButton = false,
  renderPaymentAction,
  onAccountSettled,
  onVerificationComplete,
  className,
  userEventsHandler,
  userEventsLifecycle,
}) => {
  // Get configuration for the recipient type
  const config = getRecipientTypeConfig(recipientType);
  const userJourneys = getUserJourneys(config.eventPrefix);
  const queryClient = useQueryClient();

  const isCompact = viewMode === 'compact-cards';
  const usePagesPagination = paginationStyle === 'pages' && !scrollable;

  // ============================================================================
  // Component State
  // ============================================================================

  const { t } = useTranslation(config.i18nNamespace);
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

  // Pagination state for pages-style pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  // Ref for scroll container (virtualization)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use infinite query hook for load-more pagination (default)
  const loadMoreData = useLinkedAccounts({
    variant: mode === 'single' ? 'singleAccount' : 'default',
    pageSize,
    recipientType,
  });

  // Use page-based query hook for pages pagination
  const pagesData = useLinkedAccountsTable({
    pagination,
    onPaginationChange: setPagination,
    recipientType,
  });

  // Select which data source to use based on pagination style
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
  } = usePagesPagination
    ? {
        linkedAccounts: pagesData.linkedAccounts,
        hasActiveAccount: pagesData.hasAccounts,
        isLoading: pagesData.isLoading,
        isError: pagesData.isError,
        error: pagesData.error,
        isSuccess: pagesData.isSuccess,
        refetch: pagesData.refetch,
        hasMore: pagination.pageIndex < pagesData.pageCount - 1,
        loadMore: () => {},
        isLoadingMore: false,
        totalCount: pagesData.totalCount,
        nextLoadCount: 0,
      }
    : {
        linkedAccounts: loadMoreData.linkedAccounts,
        hasActiveAccount: loadMoreData.hasActiveAccount,
        isLoading: loadMoreData.isLoading,
        isError: loadMoreData.isError,
        error: loadMoreData.error,
        isSuccess: loadMoreData.isSuccess,
        refetch: loadMoreData.refetch,
        hasMore: loadMoreData.hasMore,
        loadMore: loadMoreData.loadMore,
        isLoadingMore: loadMoreData.isLoadingMore,
        totalCount: loadMoreData.totalCount,
        nextLoadCount: loadMoreData.nextLoadCount,
      };

  // Setup virtualizer for scrollable mode
  const rowVirtualizer = useVirtualizer({
    count: linkedAccounts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 240, // Estimated height - will be measured dynamically
    overscan: 2, // Render 2 items above/below viewport for smooth scrolling
    enabled: scrollable, // Only enable when scrollable is true
    measureElement:
      typeof window !== 'undefined'
        ? (element: Element) => (element as HTMLElement).offsetHeight
        : undefined,
  });

  // Auto-load more when scrolling near bottom (infinite scroll)
  useEffect(() => {
    if (!scrollable || !hasMore || isLoadingMore) return;

    const lastItem = rowVirtualizer.getVirtualItems().slice(-1)[0];
    if (!lastItem) return;

    // Load more when within 5 items of the end
    if (lastItem.index >= linkedAccounts.length - 5) {
      loadMore();
    }
  }, [
    scrollable,
    hasMore,
    isLoadingMore,
    rowVirtualizer.getVirtualItems(),
    linkedAccounts.length,
    loadMore,
  ]);

  // Determine if create button should be shown
  const showCreate = shouldShowCreateButton(
    mode === 'single' ? 'singleAccount' : 'default',
    hasActiveAccount,
    !hideCreateButton
  );

  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'recipient-widget',
    userEventsHandler,
    userEventsLifecycle,
  });

  // Track view when component loads with accounts
  React.useEffect(() => {
    if (isSuccess && linkedAccounts.length > 0) {
      trackUserEvent({
        actionName: userJourneys.VIEW_ACCOUNTS,
        metadata: { count: linkedAccounts.length },
        userEventsHandler,
      });
    }
  }, [
    isSuccess,
    linkedAccounts.length,
    userEventsHandler,
    userJourneys.VIEW_ACCOUNTS,
  ]);

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
        actionName: userJourneys.VERIFY_COMPLETED,
        metadata: { recipientId: recipient?.id, status: response.status },
        userEventsHandler,
      });
    }

    onVerificationComplete?.(response, recipient);
  };

  // Handle account removal success
  const handleRemoveSuccess = (recipient: Recipient) => {
    // Invalidate queries to refresh the list
    invalidateLinkedAccountQueries(queryClient, recipientType);
    setRemovedRecipient(recipient);
    setShowRemoveResultDialog(true);
    trackUserEvent({
      actionName: userJourneys.REMOVE_COMPLETED,
      metadata: { recipientId: recipient.id },
      userEventsHandler,
    });
  };

  // Handle account link success
  const handleLinkedAccountSettled = (recipient?: Recipient, error?: any) => {
    if (recipient && !error) {
      trackUserEvent({
        actionName: userJourneys.LINK_COMPLETED,
        metadata: { recipientId: recipient.id },
        userEventsHandler,
      });
    }
    onAccountSettled?.(recipient, error);
  };

  return (
    <div id="recipient-widget" className="eb-w-full eb-@container">
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
        i18nNamespace={config.i18nNamespace}
      />

      <Card
        className={cn(
          'eb-component eb-w-full eb-overflow-hidden',
          viewMode === 'table'
            ? 'eb-mx-0'
            : 'eb-mx-auto eb-max-w-5xl',
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
              {!isCompact && (
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
                  recipientType={recipientType}
                  i18nNamespace={config.i18nNamespace}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('eb-shrink-0 eb-bg-background', {
                      'eb-h-8 eb-px-3': isCompact,
                    })}
                    data-user-event={userJourneys.LINK_STARTED}
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
            'eb-space-y-0 eb-p-0': isCompact,
            'eb-p-0': scrollable,
            'eb-space-y-4 eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': !(
              scrollable || isCompact
            ),
          })}
        >
          {/* Loading state with skeleton cards */}
          {isLoading && (
            <div
              className={cn('eb-grid eb-grid-cols-1 eb-gap-3', {
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable,
              })}
            >
              {/* Show 1 skeleton card during loading */}
              <LinkedAccountCardSkeleton compact={isCompact} />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div
              className={cn({
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable || isCompact,
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
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable || isCompact,
              })}
            >
              <EmptyState
                className="eb-animate-fade-in"
                compact={isCompact}
                i18nNamespace={config.i18nNamespace}
                action={
                  showCreate && (
                    <LinkedAccountFormDialog
                      mode="create"
                      onLinkedAccountSettled={handleLinkedAccountSettled}
                      recipientType={recipientType}
                      i18nNamespace={config.i18nNamespace}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className={cn({
                          'eb-h-8 eb-px-3': isCompact,
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
                <div className="eb-p-1">
                  <LinkedAccountsTableView
                    useServerPagination
                    renderPaymentAction={renderPaymentAction}
                    onLinkedAccountSettled={onAccountSettled}
                    onMicrodepositVerifySettled={
                      handleMicrodepositVerifySettled
                    }
                    onRemoveSuccess={handleRemoveSuccess}
                    defaultPageSize={pageSize}
                    showPagination
                    recipientType={recipientType}
                  />
                </div>
              ) : scrollable ? (
                // Virtualized scrollable list
                <div
                  ref={scrollContainerRef}
                  style={{
                    maxHeight,
                    overflow: 'auto',
                  }}
                  className={cn('eb-relative', {
                    'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': !isCompact,
                  })}
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer
                      .getVirtualItems()
                      .map((virtualRow: VirtualItem) => {
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
                            <LinkedAccountCard
                              recipient={recipient}
                              makePaymentComponent={renderPaymentAction?.(
                                recipient
                              )}
                              onLinkedAccountSettled={onAccountSettled}
                              onMicrodepositVerifySettled={
                                handleMicrodepositVerifySettled
                              }
                              onRemoveSuccess={handleRemoveSuccess}
                              compact={isCompact}
                              i18nNamespace={config.i18nNamespace}
                              recipientType={recipientType}
                              className={cn({
                                'eb-border-b-0':
                                  isCompact &&
                                  virtualRow.index ===
                                    linkedAccounts.length - 1,
                              })}
                            />
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
                      'eb-gap-0': isCompact,
                      'eb-gap-3': !isCompact,
                      '@4xl:eb-grid-cols-2':
                        !isCompact && linkedAccounts.length > 1,
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
                          makePaymentComponent={renderPaymentAction?.(
                            recipient
                          )}
                          onLinkedAccountSettled={onAccountSettled}
                          onMicrodepositVerifySettled={
                            handleMicrodepositVerifySettled
                          }
                          onRemoveSuccess={handleRemoveSuccess}
                          compact={isCompact}
                          i18nNamespace={config.i18nNamespace}
                          recipientType={recipientType}
                          className={cn({
                            'eb-border-b-0':
                              isCompact && index === linkedAccounts.length - 1,
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {usePagesPagination
                    ? // PAGES PAGINATION - Navigation controls like table view
                      totalCount > 0 && (
                        <div
                          className={cn({
                            'eb-border-t eb-bg-muted/30': isCompact,
                            'eb-pt-2': !isCompact,
                          })}
                        >
                          <Pagination
                            pageIndex={pagination.pageIndex}
                            pageSize={pagination.pageSize}
                            totalCount={totalCount}
                            pageCount={pagesData.pageCount}
                            canPreviousPage={pagination.pageIndex > 0}
                            canNextPage={
                              pagination.pageIndex < pagesData.pageCount - 1
                            }
                            onPageChange={(pageIndex) =>
                              setPagination((prev) => ({ ...prev, pageIndex }))
                            }
                            onPageSizeChange={(newPageSize) =>
                              setPagination({
                                pageIndex: 0,
                                pageSize: newPageSize,
                              })
                            }
                            variant={isCompact ? 'compact' : 'default'}
                          />
                        </div>
                      )
                    : isCompact
                      ? // COMPACT MODE - Full width clickable area
                        hasMore && (
                          <div className="eb-border-t">
                            <button
                              type="button"
                              onClick={loadMore}
                              disabled={isLoadingMore}
                              className="eb-group eb-w-full eb-bg-muted eb-py-2 eb-text-center eb-transition-colors hover:eb-bg-muted/60 disabled:eb-opacity-50"
                              aria-label={t('showMoreWithCount', {
                                defaultValue:
                                  'Show {{count}} more account_other',
                                count: nextLoadCount,
                              })}
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
                                      {t('showMoreWithCount', {
                                        defaultValue:
                                          'Show {{count}} more account_other',
                                        count: nextLoadCount,
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </button>
                          </div>
                        )
                      : // NON-COMPACT MODE - Small button
                        hasMore && (
                          <div className="eb-flex eb-justify-center eb-gap-2 eb-pt-2">
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
                                    defaultValue:
                                      'Show {{count}} more account_other',
                                    count: nextLoadCount,
                                  })}
                                </>
                              )}
                            </Button>
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
