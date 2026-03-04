import React, { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { PaginationState } from '@tanstack/react-table';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import {
  AlertCircle,
  ChevronDown,
  ChevronDownIcon,
  ChevronUp,
  PlusIcon,
  RefreshCw,
} from 'lucide-react';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import type { HeadingLevelProps } from '@/lib/types/headingLevel.types';
import { getChildHeadingLevel } from '@/lib/types/headingLevel.types';
import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import type { ErrorType } from '@/api/axios-instance';
import {
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import type { ApiError } from '@/api/generated/ep-recipients.schemas';
import type {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';
import { Button } from '@/components/ui/button';
import { useServerError } from '@/components/ServerErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { PaymentFlow } from '@/core/PaymentFlow';
import type { PaymentMethod } from '@/core/PaymentFlow/PaymentFlow.types';

import { useRecipients, useRecipientsTable } from '../../hooks';
import {
  getRecipientTypeConfig,
  getUserJourneys,
  SupportedRecipientType,
} from '../../types';
import {
  invalidateRecipientQueries,
  shouldShowCreateButton,
} from '../../utils';
import { EmptyState } from '../EmptyState/EmptyState';
import { Pagination } from '../Pagination';
import { RecipientCard } from '../RecipientCard/RecipientCard';
import { RecipientCardSkeleton } from '../RecipientCardSkeleton/RecipientCardSkeleton';
import { RecipientFormDialog } from '../RecipientFormDialog/RecipientFormDialog';
import {
  RecipientsTableView,
  RecipientsTableViewSkeleton,
} from '../RecipientsTableView';
import { RemoveAccountResultDialog } from '../RemoveAccountResultDialog/RemoveAccountResultDialog';
import { VerificationResultDialog } from '../VerificationResultDialog/VerificationResultDialog';

/**
 * Props for the BaseRecipientsWidget component
 *
 * This is the internal base component that powers both
 * LinkedAccountsWidget and RecipientsWidget.
 */
export interface BaseRecipientsWidgetProps
  extends UserTrackingProps,
    HeadingLevelProps {
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
   * - `'cards'`: Display recipients as full cards with rich details
   * - `'compact-cards'`: Display recipients as compact rows with minimal spacing (default)
   * - `'table'`: Display recipients in a sortable/paginated table
   *
   * @default 'compact-cards'
   */
  viewMode?: 'cards' | 'compact-cards' | 'table';

  /**
   * Enable scrollable container with virtualization and infinite scroll.
   *
   * @default false
   */
  scrollable?: boolean;

  /**
   * Maximum height of the scrollable container (only applies when `scrollable={true}`).
   *
   * @default '400px'
   */
  scrollableMaxHeight?: number | string;

  /**
   * Number of recipients to fetch per API request.
   *
   * @default 10
   */
  pageSize?: number;

  /**
   * Pagination style for cards and compact-cards views.
   * - `'loadMore'`: Show a "Load More" button to incrementally load recipients
   * - `'pages'`: Show page navigation controls similar to the table view (default)
   *
   * Note: This prop has no effect when `viewMode` is `'table'` (table always uses pages).
   *
   * @default 'pages'
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
   * If not provided, a default PaymentFlow button will be rendered.
   */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  /**
   * Payment methods available for PaymentFlow.
   */
  paymentMethods?: PaymentMethod[];

  /**
   * Whether to show fees in the PaymentFlow review panel.
   * @default false
   */
  showPaymentFees?: boolean;

  /**
   * Callback when a payment transaction completes.
   */
  onPaymentComplete?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;

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
 * - `LinkedAccountsWidget` for managing linked bank accounts (LINKED_ACCOUNT type)
 * - `RecipientsWidget` for managing payment recipients (RECIPIENT type)
 *
 * @internal
 */
export const BaseRecipientsWidget: React.FC<BaseRecipientsWidgetProps> = ({
  recipientType,
  mode = 'list',
  viewMode = 'compact-cards',
  scrollable = false,
  scrollableMaxHeight = '400px',
  pageSize = 10,
  paginationStyle = 'pages',
  hideCreateButton = false,
  headingLevel = 2,
  renderPaymentAction,
  paymentMethods,
  showPaymentFees = false,
  onPaymentComplete,
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

  // Calculate child heading level (for h3 elements like cards, empty state)
  const childHeadingLevel = getChildHeadingLevel(headingLevel);

  const isCompact = viewMode === 'compact-cards';
  const usePagesPagination = paginationStyle === 'pages' && !scrollable;
  // Table view always uses page-based pagination
  const usePageBasedData = usePagesPagination || viewMode === 'table';

  // ============================================================================
  // Component State
  // ============================================================================

  const { t, tString } = useTranslationWithTokens(config.i18nNamespace);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
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

  // Lifted dialog state - survives data updates because it's at the parent level
  // Edit dialog - stores the recipient being edited
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(
    null
  );
  // Create dialog - controls open state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // PaymentFlow dialog state - single instance for all recipients
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentPayeeId, setPaymentPayeeId] = useState<string | undefined>(
    undefined
  );
  // Reset key counter - increments each time the dialog opens to force state reset
  const [paymentResetKey, setPaymentResetKey] = useState(0);

  // Pagination state for pages-style pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  // Ref for scroll container (virtualization)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use infinite query hook for load-more pagination (default)
  const loadMoreData = useRecipients({
    variant: mode === 'single' ? 'singleAccount' : 'default',
    pageSize,
    recipientType,
  });

  // Use page-based query hook for pages pagination
  const pagesData = useRecipientsTable({
    pagination,
    onPaginationChange: setPagination,
    recipientType,
  });

  // Select which data source to use based on pagination style
  const {
    recipients,
    hasActiveRecipient,
    isLoading,
    isError,
    error: recipientsError,
    isSuccess,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
    totalCount,
    nextLoadCount,
  } = usePageBasedData
    ? {
        recipients: pagesData.recipients,
        hasActiveRecipient: pagesData.hasRecipients,
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
        recipients: loadMoreData.recipients,
        hasActiveRecipient: loadMoreData.hasActiveRecipient,
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

  // Parse error for custom display
  const errorInfo = useServerError(
    recipientsError as unknown as ErrorType<ApiError> | null
  );
  const errorMessage = errorInfo?.getErrorMessage({
    '400': t('errors.loading.400'),
    default: t('errors.loading.default'),
  });

  // Setup virtualizer for scrollable mode
  const rowVirtualizer = useVirtualizer({
    count: recipients.length,
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
    if (lastItem.index >= recipients.length - 5) {
      loadMore();
    }
  }, [
    scrollable,
    hasMore,
    isLoadingMore,
    rowVirtualizer.getVirtualItems(),
    recipients.length,
    loadMore,
  ]);

  // Determine if create button should be shown
  const showCreate = shouldShowCreateButton(
    mode === 'single' ? 'singleAccount' : 'default',
    hasActiveRecipient,
    !hideCreateButton
  );

  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'recipient-widget',
    userEventsHandler,
    userEventsLifecycle,
  });

  // Track view when component loads with recipients
  React.useEffect(() => {
    if (isSuccess && recipients.length > 0) {
      trackUserEvent({
        actionName: userJourneys.VIEW_ACCOUNTS,
        metadata: { count: recipients.length },
        userEventsHandler,
      });
    }
  }, [
    isSuccess,
    recipients.length,
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
    invalidateRecipientQueries(queryClient, recipientType);
    setRemovedRecipient(recipient);
    setShowRemoveResultDialog(true);
    trackUserEvent({
      actionName: userJourneys.REMOVE_COMPLETED,
      metadata: { recipientId: recipient.id },
      userEventsHandler,
    });
  };

  // Handle recipient creation/edit success
  const handleRecipientSettled = (recipient?: Recipient, error?: any) => {
    if (recipient && !error) {
      trackUserEvent({
        actionName: userJourneys.LINK_COMPLETED,
        metadata: { recipientId: recipient.id },
        userEventsHandler,
      });
    }
    onAccountSettled?.(recipient, error);
  };

  // Handle opening the create dialog (lifted to parent level)
  const handleOpenCreateDialog = React.useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  // Handle create dialog state changes
  const handleCreateDialogOpenChange = React.useCallback((open: boolean) => {
    setIsCreateDialogOpen(open);
  }, []);

  // Handle opening the edit dialog (lifted to parent level)
  const handleEditRecipient = React.useCallback((recipient: Recipient) => {
    setEditingRecipient(recipient);
  }, []);

  // Handle edit dialog state changes
  const handleEditDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setEditingRecipient(null);
    }
  }, []);

  // Handle edit settled - notify parent but don't close dialog (let user see success state)
  const handleEditSettled = React.useCallback(
    (recipient?: Recipient, error?: any) => {
      onAccountSettled?.(recipient, error);
    },
    [onAccountSettled]
  );

  // Handle opening the payment dialog for a specific recipient
  const handleOpenPaymentDialog = React.useCallback((recipientId: string) => {
    setPaymentPayeeId(recipientId);
    setPaymentResetKey((prev) => prev + 1); // Increment to force state reset
    setPaymentDialogOpen(true);
  }, []);

  // Handle payment dialog close
  const handlePaymentDialogClose = React.useCallback(() => {
    setPaymentDialogOpen(false);
    setPaymentPayeeId(undefined);
  }, []);

  // Default payment action renderer - uses PaymentFlow
  const defaultRenderPaymentAction = React.useCallback(
    (recipient: Recipient) => {
      return (
        <Button
          variant="outline"
          size="sm"
          className="eb-h-8 eb-text-xs"
          onClick={() => handleOpenPaymentDialog(recipient.id)}
          aria-label={`${t('actions.makePayment', { defaultValue: 'Pay' })} to ${getRecipientDisplayName(recipient)}`}
        >
          {t('actions.makePayment', { defaultValue: 'Pay' })}
        </Button>
      );
    },
    [handleOpenPaymentDialog, t]
  );

  // Use custom renderer if provided, otherwise use default
  const effectiveRenderPaymentAction =
    renderPaymentAction ?? defaultRenderPaymentAction;

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

      {/* Lifted Create Dialog - Rendered at parent level to survive data updates */}
      <RecipientFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={handleCreateDialogOpenChange}
        onRecipientSettled={handleRecipientSettled}
        recipientType={recipientType}
        i18nNamespace={config.i18nNamespace}
      />

      {/* Lifted Edit Dialog - Rendered at parent level to survive data updates */}
      {editingRecipient && (
        <RecipientFormDialog
          mode="edit"
          recipient={editingRecipient}
          open
          onOpenChange={handleEditDialogOpenChange}
          onRecipientSettled={handleEditSettled}
          recipientType={recipientType}
          i18nNamespace={config.i18nNamespace}
        />
      )}

      {/* PaymentFlow Dialog - Single instance for all recipients */}
      <PaymentFlow
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onClose={handlePaymentDialogClose}
        initialPayeeId={paymentPayeeId}
        paymentMethods={paymentMethods}
        showFees={showPaymentFees}
        onTransactionComplete={onPaymentComplete}
        resetKey={paymentResetKey}
      />

      <Card
        className={cn(
          'eb-component eb-w-full eb-overflow-hidden',
          viewMode === 'table' ? 'eb-mx-0' : 'eb-mx-auto eb-max-w-5xl',
          className
        )}
      >
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-col eb-gap-2 @xs:eb-flex-row @xs:eb-items-center @xs:eb-justify-between @xs:eb-gap-4">
            <div className="eb-min-w-0 eb-flex-1">
              <div className="eb-flex eb-items-center eb-gap-2">
                <CardTitle
                  headingLevel={headingLevel}
                  className="eb-h-8 eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-8 @md:eb-text-xl"
                >
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
            {showCreate && !isLoading && recipients.length > 0 && (
              <div className="eb-animate-fade-in">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('eb-shrink-0 eb-bg-background', {
                    'eb-h-8 eb-px-3': isCompact,
                  })}
                  data-user-event={userJourneys.LINK_STARTED}
                  onClick={handleOpenCreateDialog}
                >
                  <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                  <span className="@md:eb-hidden">{t('link')}</span>
                  <span className="eb-hidden @md:eb-inline">
                    {t('linkNewAccount')}
                  </span>
                </Button>
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
          {/* Loading state with skeleton */}
          {isLoading && (
            <>
              {viewMode === 'table' ? (
                // Table skeleton for table view
                <div className="eb-p-1">
                  <RecipientsTableViewSkeleton rowCount={pageSize} />
                </div>
              ) : (
                // Card skeleton for card views
                <div
                  className={cn('eb-grid eb-grid-cols-1 eb-gap-3', {
                    'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable,
                  })}
                >
                  <RecipientCardSkeleton compact={isCompact} />
                </div>
              )}
            </>
          )}

          {/* Error state */}
          {isError && (
            <div
              className={cn('eb-py-6', {
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable || isCompact,
              })}
            >
              <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-2 eb-text-center">
                <div className="eb-flex eb-h-12 eb-w-12 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
                  <AlertCircle className="eb-h-6 eb-w-6 eb-text-destructive" />
                </div>
                <div className="eb-space-y-1">
                  <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                    {t('errors.loading.title')}
                  </h3>
                  <p className="eb-max-w-xs eb-text-xs eb-text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="eb-mt-2"
                >
                  <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4" />
                  {t('errors.tryAgain', { defaultValue: 'Try again' })}
                </Button>

                {/* Expandable details */}
                {errorInfo?.hasDetails && (
                  <div className="eb-mt-2 eb-w-full eb-max-w-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="eb-text-xs eb-text-muted-foreground"
                    >
                      {showErrorDetails ? (
                        <ChevronUp className="eb-mr-1 eb-h-3 eb-w-3" />
                      ) : (
                        <ChevronDown className="eb-mr-1 eb-h-3 eb-w-3" />
                      )}
                      {showErrorDetails
                        ? t('errors.hideDetails', {
                            defaultValue: 'Hide details',
                          })
                        : t('errors.showDetails', {
                            defaultValue: 'Show details',
                          })}
                    </Button>

                    {showErrorDetails && (
                      <div className="eb-mt-2 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-3 eb-text-left eb-text-xs">
                        {errorInfo.httpStatus && (
                          <div className="eb-mb-2">
                            <span className="eb-font-medium">Status:</span>{' '}
                            {errorInfo.httpStatus}
                            {errorInfo.title && ` - ${errorInfo.title}`}
                          </div>
                        )}
                        {errorInfo.reasons.length > 0 && (
                          <div className="eb-mb-2">
                            <span className="eb-font-medium">Reasons:</span>
                            <ul className="eb-mt-1 eb-list-inside eb-list-disc eb-space-y-1 eb-text-muted-foreground">
                              {errorInfo.reasons.map(
                                (reason: any, i: number) => (
                                  <li key={i}>
                                    {reason.field && (
                                      <span className="eb-font-medium">
                                        {reason.field}:{' '}
                                      </span>
                                    )}
                                    {reason.message || reason}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        {errorInfo.context.length > 0 && (
                          <div>
                            <span className="eb-font-medium">Context:</span>
                            <ul className="eb-mt-1 eb-list-inside eb-list-disc eb-space-y-1 eb-text-muted-foreground">
                              {errorInfo.context.map((ctx: any, i: number) => (
                                <li key={i}>
                                  {ctx.field && (
                                    <span className="eb-font-medium">
                                      {ctx.field}:{' '}
                                    </span>
                                  )}
                                  {ctx.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {isSuccess && recipients.length === 0 && (
            <div
              className={cn({
                'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4': scrollable || isCompact,
              })}
            >
              <EmptyState
                className="eb-animate-fade-in"
                compact={isCompact}
                i18nNamespace={config.i18nNamespace}
                headingLevel={childHeadingLevel}
                action={
                  showCreate && (
                    <Button
                      variant="default"
                      size="sm"
                      className={cn({
                        'eb-h-8 eb-px-3': isCompact,
                      })}
                      onClick={handleOpenCreateDialog}
                    >
                      <PlusIcon className="eb-mr-1.5 eb-h-4 eb-w-4" />
                      {t('linkNewAccount')}
                    </Button>
                  )
                }
              />
            </div>
          )}

          {/* Recipients list */}
          {isSuccess && recipients.length > 0 && (
            <>
              {viewMode === 'table' ? (
                // Table view with server-side pagination
                <div className="eb-p-1">
                  <RecipientsTableView
                    data={recipients}
                    paginationState={{
                      pagination,
                      onPaginationChange: setPagination,
                      totalCount,
                      pageCount: pagesData.pageCount,
                      isLoading,
                    }}
                    recipientType={recipientType}
                    renderPaymentAction={effectiveRenderPaymentAction}
                    onEditRecipient={handleEditRecipient}
                    onRecipientSettled={onAccountSettled}
                    onMicrodepositVerifySettled={
                      handleMicrodepositVerifySettled
                    }
                    onRemoveSuccess={handleRemoveSuccess}
                  />
                </div>
              ) : scrollable ? (
                // Virtualized scrollable list
                <div
                  ref={scrollContainerRef}
                  style={{
                    maxHeight: scrollableMaxHeight,
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
                        const recipient = recipients[virtualRow.index];
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
                            <RecipientCard
                              recipient={recipient}
                              makePaymentComponent={effectiveRenderPaymentAction?.(
                                recipient
                              )}
                              onEditRecipient={handleEditRecipient}
                              onRecipientSettled={onAccountSettled}
                              onMicrodepositVerifySettled={
                                handleMicrodepositVerifySettled
                              }
                              onRemoveSuccess={handleRemoveSuccess}
                              compact={isCompact}
                              i18nNamespace={config.i18nNamespace}
                              recipientType={recipientType}
                              headingLevel={childHeadingLevel}
                              className={cn({
                                'eb-border-b-0':
                                  isCompact &&
                                  virtualRow.index === recipients.length - 1,
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
                        !isCompact && recipients.length > 1,
                    })}
                  >
                    {recipients.map((recipient, index) => (
                      <div
                        key={recipient.id}
                        className="eb-animate-fade-in"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'backwards',
                        }}
                      >
                        <RecipientCard
                          recipient={recipient}
                          makePaymentComponent={effectiveRenderPaymentAction?.(
                            recipient
                          )}
                          onEditRecipient={handleEditRecipient}
                          onRecipientSettled={onAccountSettled}
                          onMicrodepositVerifySettled={
                            handleMicrodepositVerifySettled
                          }
                          onRemoveSuccess={handleRemoveSuccess}
                          compact={isCompact}
                          i18nNamespace={config.i18nNamespace}
                          recipientType={recipientType}
                          headingLevel={childHeadingLevel}
                          className={cn({
                            'eb-border-b-0':
                              isCompact && index === recipients.length - 1,
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {usePagesPagination
                    ? // PAGES PAGINATION - Navigation controls like table view
                      // Only hide pagination if there are 5 or fewer items
                      totalCount > 5 && (
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
                              aria-label={tString('showMoreWithCount', {
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
