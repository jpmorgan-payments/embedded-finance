import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useElementWidth } from '@/utils/useElementWidth';
// Icons
import { AlertCircle, Plus, Search } from 'lucide-react';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RecipientRequest,
  RecipientStatus,
  RecipientType,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { RecipientCard } from './components/RecipientCard/RecipientCard';
import { RecipientDetails } from './components/RecipientDetails/RecipientDetails';
import { RecipientForm } from './components/RecipientForm/RecipientForm';
import { RecipientsColumnVisibility } from './components/RecipientsColumnVisibility/RecipientsColumnVisibility';
import { RecipientsPagination } from './components/RecipientsPagination/RecipientsPagination';
import { RecipientsTable } from './components/RecipientsTable/RecipientsTable';
// Hooks
import {
  useRecipientsData,
  useRecipientsDialogs,
  useRecipientsFilters,
  useRecipientsMutations,
  useRecipientsPagination,
  useRecipientsSorting,
} from './hooks';
// Column Configuration
import {
  defaultRecipientsColumnConfig,
  getVisibleColumns,
  mergeColumnConfig,
  widgetRecipientsColumnConfig,
  type RecipientColumnKey,
  type RecipientsColumnConfiguration,
} from './Recipients.columns';
// Types
import type { RecipientsProps } from './Recipients.types';
import { createRecipientsConfig } from './types/paymentConfig';
// Utils
import { formatRecipientName } from './utils/recipientHelpers';

export const Recipients: React.FC<RecipientsProps> = ({
  clientId,
  initialRecipientType = 'RECIPIENT',
  showCreateButton = true,
  config,
  makePaymentComponent,
  onRecipientCreated,
  onRecipientUpdated,
  onRecipientDeactivated,
  userEventsHandler,
  isWidget = false,
  columnConfig,
}) => {
  const { interceptorReady } = useInterceptorStatus();
  // Merge user config with defaults
  const resolvedConfig = createRecipientsConfig(config);

  // Determine column configuration based on widget mode and user config
  const [localColumnConfig, setLocalColumnConfig] =
    useState<RecipientsColumnConfiguration | null>(null);

  const finalColumnConfig = useMemo(() => {
    const baseConfig = isWidget
      ? widgetRecipientsColumnConfig
      : defaultRecipientsColumnConfig;
    // Merge user config over base config (deep merge for nested properties)
    const merged = mergeColumnConfig(columnConfig, baseConfig);
    // Apply local visibility changes if any
    if (localColumnConfig) {
      return localColumnConfig;
    }
    return merged;
  }, [columnConfig, isWidget, localColumnConfig]);

  // Get visible columns in order
  const visibleColumns = useMemo(
    () => getVisibleColumns(finalColumnConfig),
    [finalColumnConfig]
  );

  // Handle column visibility change
  const handleColumnVisibilityChange = useCallback(
    (columnKey: RecipientColumnKey, visible: boolean) => {
      setLocalColumnConfig((prev) => {
        const baseConfig = isWidget
          ? widgetRecipientsColumnConfig
          : defaultRecipientsColumnConfig;
        const current = prev || mergeColumnConfig(columnConfig, baseConfig);
        return {
          ...current,
          [columnKey]: {
            ...current[columnKey],
            visible,
          },
        };
      });
    },
    [columnConfig, isWidget]
  );

  // State
  const [searchTerm, setSearchTerm] = useState('');

  // Custom hooks
  const { filters, updateFilter, clearFilters } = useRecipientsFilters();

  // Use element width instead
  const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();
  const isMobile = containerWidth > 0 && containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 1024;

  // Determine layout based on isWidget prop and screen size
  const shouldUseWidgetLayout = isWidget;
  const shouldUseMobileLayout = !isWidget && isMobile;
  const shouldUseTabletLayout = !isWidget && isTablet;

  // API queries
  const {
    data: recipientsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllRecipients(
    {
      clientId,
      type: filters.type,
      page: 1,
      limit: 1000, // Get all for client-side filtering
    },
    {
      query: {
        enabled: interceptorReady,
      },
    }
  );

  // Sorting hook
  const { sortBy, sortOrder, handleSort, sortRecipients } =
    useRecipientsSorting((column) => {
      return finalColumnConfig[column]?.sortable ?? false;
    });

  // Filtered and sorted recipients
  const { filteredRecipients } = useRecipientsData({
    recipients: recipientsData?.recipients,
    searchTerm,
    statusFilter: filters.status,
    sortRecipients,
  });

  // Pagination hook
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    paginatedItems,
    paginationInfo,
  } = useRecipientsPagination(filteredRecipients.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.status, filters.type, setCurrentPage]);

  // Dialog management
  const {
    isCreateDialogOpen,
    isEditDialogOpen,
    isDetailsDialogOpen,
    selectedRecipient,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDetailsDialog,
    closeDetailsDialog,
  } = useRecipientsDialogs();

  // Mutations
  const {
    createRecipient,
    updateRecipient,
    deactivateRecipient,
    isCreating,
    isUpdating,
    isDeactivating,
  } = useRecipientsMutations({
    onRecipientCreated,
    onRecipientUpdated,
    onRecipientDeactivated,
    userEventsHandler,
    refetch,
    onSuccess: () => {
      closeCreateDialog();
      closeEditDialog();
    },
  });

  // Handlers
  const handleCreateRecipient = useCallback(
    (data: RecipientRequest) => {
      createRecipient(data);
    },
    [createRecipient]
  );

  const handleUpdateRecipient = useCallback(
    (data: UpdateRecipientRequest) => {
      if (selectedRecipient) {
        updateRecipient(selectedRecipient.id, data);
      }
    },
    [selectedRecipient, updateRecipient]
  );

  const handleViewDetails = useCallback(
    (recipient: Recipient) => {
      openDetailsDialog(recipient);
      userEventsHandler?.({ actionName: 'recipient_details_viewed' });
    },
    [openDetailsDialog, userEventsHandler]
  );

  const handleEditRecipient = useCallback(
    (recipient: Recipient) => {
      openEditDialog(recipient);
      userEventsHandler?.({ actionName: 'recipient_edit_started' });
    },
    [openEditDialog, userEventsHandler]
  );

  const handleDeactivateRecipient = useCallback(
    (recipient: Recipient) => {
      if (
        window.confirm(
          `Are you sure you want to deactivate ${formatRecipientName(recipient)}?`
        )
      ) {
        deactivateRecipient(recipient.id);
        userEventsHandler?.({ actionName: 'recipient_deactivate_started' });
      }
    },
    [deactivateRecipient, userEventsHandler]
  );

  // Paginated recipients
  const paginatedRecipients = paginatedItems(filteredRecipients);

  // Loading state
  if (isLoading) {
    return (
      <Card className="eb-component eb-w-full">
        <CardHeader>
          <div className="eb-flex eb-items-center eb-justify-between">
            <Skeleton className="eb-h-6 eb-w-32" />
            <Skeleton className="eb-h-10 eb-w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="eb-space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="eb-h-12 eb-w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="eb-component eb-w-full">
        <CardContent className="eb-pt-6">
          <Alert variant="destructive">
            <AlertCircle className="eb-h-4 eb-w-4" />
            <AlertDescription>
              Failed to load recipients. Please try again.
              <Button
                variant="link"
                className="eb-ml-2 eb-h-auto eb-p-0"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="eb-component eb-w-full" ref={containerRef}>
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            Recipients
          </CardTitle>
          {showCreateButton && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (open) {
                  openCreateDialog();
                } else {
                  closeCreateDialog();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="eb-mr-2 eb-h-4 eb-w-4" />
                  Add Recipient
                </Button>
              </DialogTrigger>
              <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Recipient</DialogTitle>
                </DialogHeader>
                <div className="eb-scrollable-content">
                  <RecipientForm
                    mode="create"
                    onSubmit={handleCreateRecipient}
                    onCancel={closeCreateDialog}
                    isLoading={isCreating}
                    config={resolvedConfig}
                    showCardWrapper={false}
                    recipientType={initialRecipientType}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters and Search */}
        <div className="eb-mb-6 eb-space-y-4">
          {/* Search and View Controls */}
          <div className="eb-flex eb-items-center eb-justify-between eb-gap-4">
            {/* Search Input */}
            <div className="eb-flex eb-w-full eb-items-center sm:eb-max-w-xs">
              <div className="eb-relative eb-w-full">
                <Search className="eb-absolute eb-left-2 eb-top-1/2 eb-h-4 eb-w-4 eb--translate-y-1/2 eb-transform eb-text-gray-400" />
                <Input
                  placeholder="Search recipients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="eb-h-8 eb-rounded eb-border eb-border-gray-300 eb-pl-8 eb-text-sm focus:eb-border-primary"
                />
              </div>
            </div>

            {/* Column Visibility Toggle - Only show when not in widget mode */}
            {!shouldUseWidgetLayout && (
              <RecipientsColumnVisibility
                columnConfig={finalColumnConfig}
                onColumnVisibilityChange={handleColumnVisibilityChange}
              />
            )}
          </div>

          {/* Filters - Only show when not in widget mode */}
          {!shouldUseWidgetLayout && (
            <div className="eb-flex eb-flex-wrap eb-gap-2 sm:eb-flex-nowrap">
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) =>
                  updateFilter(
                    'type',
                    value === 'all' ? undefined : (value as RecipientType)
                  )
                }
              >
                <SelectTrigger className="eb-h-9 eb-w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RECIPIENT">Recipient</SelectItem>
                  <SelectItem value="LINKED_ACCOUNT">Linked Account</SelectItem>
                  <SelectItem value="SETTLEMENT_ACCOUNT">
                    Settlement Account
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  updateFilter(
                    'status',
                    value === 'all' ? undefined : (value as RecipientStatus)
                  )
                }
              >
                <SelectTrigger className="eb-h-9 eb-w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MICRODEPOSITS_INITIATED">
                    Microdeposits Initiated
                  </SelectItem>
                  <SelectItem value="READY_FOR_VALIDATION">
                    Ready for Validation
                  </SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="secondary"
                onClick={clearFilters}
                className="eb-h-9 eb-px-3"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Recipients List/Table */}
        {shouldUseMobileLayout ? (
          <div>
            {paginatedRecipients.length === 0 ? (
              <div className="eb-py-8 eb-text-center eb-text-gray-500">
                No recipients found
              </div>
            ) : (
              paginatedRecipients.map((recipient) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  onView={() => handleViewDetails(recipient)}
                  onEdit={() => handleEditRecipient(recipient)}
                  onDeactivate={() => handleDeactivateRecipient(recipient)}
                  canDeactivate={recipient.status === 'ACTIVE'}
                  isDeactivating={isDeactivating}
                  makePaymentComponent={makePaymentComponent}
                  isWidget={shouldUseWidgetLayout}
                />
              ))
            )}
          </div>
        ) : (
          <>
            <RecipientsTable
              recipients={paginatedRecipients}
              visibleColumns={visibleColumns}
              columnConfig={finalColumnConfig}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onViewDetails={handleViewDetails}
              onEdit={handleEditRecipient}
              onDeactivate={handleDeactivateRecipient}
              makePaymentComponent={makePaymentComponent}
              isDeactivating={isDeactivating}
              layout={
                shouldUseWidgetLayout
                  ? 'widget'
                  : shouldUseTabletLayout
                    ? 'tablet'
                    : 'desktop'
              }
            />
            <RecipientsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredRecipients.length}
              startIndex={paginationInfo.startIndex}
              endIndex={paginationInfo.endIndex}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog();
          }
        }}
      >
        <DialogContent className="eb-scrollable-dialog eb-max-w-3xl">
          <DialogHeader className="eb-pb-4">
            <DialogTitle>
              Recipient:{' '}
              {selectedRecipient
                ? formatRecipientName(selectedRecipient)
                : 'Unknown'}
            </DialogTitle>
          </DialogHeader>
          <div className="eb-scrollable-content">
            {selectedRecipient && (
              <RecipientDetails
                recipient={selectedRecipient}
                onEdit={handleEditRecipient}
                onDeactivate={handleDeactivateRecipient}
                showEditButton
                showDeactivateButton
                canDeactivate={selectedRecipient.status === 'ACTIVE'}
                isDeactivating={isDeactivating}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Recipient</DialogTitle>
          </DialogHeader>
          <div className="eb-scrollable-content">
            {selectedRecipient && (
              <RecipientForm
                mode="edit"
                recipient={selectedRecipient}
                onSubmit={handleUpdateRecipient}
                onCancel={closeEditDialog}
                isLoading={isUpdating}
                config={resolvedConfig}
                showCardWrapper={false}
                recipientType={selectedRecipient.type ?? 'RECIPIENT'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
