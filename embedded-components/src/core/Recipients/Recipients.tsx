import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useElementWidth } from '@/utils/useElementWidth';
// Icons
import { AlertCircle, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  getDefaultRecipientsColumnConfig,
  getVisibleColumns,
  getWidgetRecipientsColumnConfig,
  mergeColumnConfig,
  type RecipientColumnKey,
  type RecipientsColumnConfiguration,
} from './Recipients.columns';
// Types
import type { RecipientsProps } from './Recipients.types';
// Utils
import { formatRecipientName } from './utils/recipientHelpers';

export const Recipients: React.FC<RecipientsProps> = ({
  clientId,
  initialRecipientType = 'RECIPIENT', // eslint-disable-line @typescript-eslint/no-unused-vars -- deprecated, kept for backward compatibility
  showCreateButton = true,
  // config is deprecated and no longer used
  makePaymentComponent,
  onRecipientCreated,
  onRecipientUpdated,
  onRecipientDeactivated,
  userEventsHandler,
  isWidget = false,
  columnConfig,
}) => {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  const locale = useLocale();
  const { interceptorReady } = useInterceptorStatus();

  // Determine column configuration based on widget mode and user config
  const [localColumnConfig, setLocalColumnConfig] =
    useState<RecipientsColumnConfiguration | null>(null);

  const finalColumnConfig = useMemo(() => {
    const baseConfig = isWidget
      ? getWidgetRecipientsColumnConfig(t)
      : getDefaultRecipientsColumnConfig(t);
    // Merge user config over base config (deep merge for nested properties)
    const merged = mergeColumnConfig(columnConfig, baseConfig);
    // Apply local visibility changes if any
    if (localColumnConfig) {
      return localColumnConfig;
    }
    return merged;
  }, [columnConfig, isWidget, localColumnConfig, t]);

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
          ? getWidgetRecipientsColumnConfig(t)
          : getDefaultRecipientsColumnConfig(t);
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
    [columnConfig, isWidget, t]
  );

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [recipientToDeactivate, setRecipientToDeactivate] =
    useState<Recipient | null>(null);

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

  // Pagination state (UI is 1-based; API is 0-based). Defaults aligned to OAS (page 0, limit 25).
  const [totalItems, setTotalItems] = useState(0);
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    paginationInfo,
  } = useRecipientsPagination(totalItems, {
    initialPage: 1, // UI shows page 1, maps to API page 0
    initialPageSize: 25, // OAS default
  });

  // API queries
  // Convert UI page (1-based) to API page (0-based) per OAS spec
  const apiPage = currentPage - 1;
  const {
    data: recipientsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllRecipients(
    {
      clientId,
      type: filters.type,
      page: apiPage,
      limit: pageSize,
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
    typeFilter: filters.type,
    sortRecipients,
  });

  // Derive pagination metadata from API (OAS aligned) with safe fallbacks
  const apiTotalItems =
    recipientsData?.metadata?.total_items ?? recipientsData?.total_items ?? 0;

  // When client-side filters/search are active, fall back to the filtered count
  const effectiveTotalItems =
    searchTerm || filters.status
      ? filteredRecipients.length
      : apiTotalItems || filteredRecipients.length;

  // Keep pagination totals in sync with API/filters
  useEffect(() => {
    setTotalItems(effectiveTotalItems);
  }, [effectiveTotalItems]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.status, filters.type, setCurrentPage, pageSize]);

  // Dialog management
  const {
    isCreateDialogOpen,
    isEditDialogOpen,
    isDetailsDialogOpen,
    selectedRecipient,
    setIsCreateDialogOpen,
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

  const handleDeactivateRecipient = useCallback((recipient: Recipient) => {
    setRecipientToDeactivate(recipient);
    setDeactivateDialogOpen(true);
  }, []);

  const confirmDeactivate = useCallback(() => {
    if (recipientToDeactivate) {
      deactivateRecipient(recipientToDeactivate.id);
      userEventsHandler?.({ actionName: 'recipient_deactivate_started' });
      setDeactivateDialogOpen(false);
      setRecipientToDeactivate(null);
    }
  }, [recipientToDeactivate, deactivateRecipient, userEventsHandler]);

  // Current page recipients (data already scoped by API pagination)
  const paginatedRecipients = filteredRecipients;

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
              {t('recipients:error.loadFailed', {
                defaultValue: 'Failed to load recipients. Please try again.',
              })}
              <Button
                variant="link"
                className="eb-ml-2 eb-h-auto eb-p-0"
                onClick={() => refetch()}
              >
                {t('recipients:error.retry', { defaultValue: 'Retry' })}
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
            {t('recipients:title', { defaultValue: 'Recipients' })}
          </CardTitle>
          {showCreateButton && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="eb-mr-2 eb-h-4 eb-w-4" />
                  {t('recipients:actions.addRecipient', {
                    defaultValue: 'Add Recipient',
                  })}
                </Button>
              </DialogTrigger>
              <DialogContent className="eb-max-h-full eb-max-w-2xl eb-overflow-hidden eb-p-0 sm:eb-max-h-[95vh]">
                <DialogHeader className="eb-shrink-0 eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
                  <DialogTitle className="eb-font-header eb-text-xl">
                    {t('recipients:actions.createNewRecipient', {
                      defaultValue: 'Create New Recipient',
                    })}
                  </DialogTitle>
                </DialogHeader>
                <RecipientForm
                  mode="create"
                  onSubmit={handleCreateRecipient}
                  onCancel={closeCreateDialog}
                  isLoading={isCreating}
                  showCardWrapper={false}
                />
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
                  placeholder={t('recipients:filters.searchPlaceholder', {
                    defaultValue: 'Search recipients...',
                  })}
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
                  <SelectValue
                    placeholder={t('recipients:filters.type.label', {
                      defaultValue: 'Type',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('recipients:filters.type.all', {
                      defaultValue: 'All Types',
                    })}
                  </SelectItem>
                  <SelectItem value="RECIPIENT">
                    {t('recipients:filters.type.recipient', {
                      defaultValue: 'Recipient',
                    })}
                  </SelectItem>
                  <SelectItem value="LINKED_ACCOUNT">
                    {t('recipients:filters.type.linkedAccount', {
                      defaultValue: 'Linked Account',
                    })}
                  </SelectItem>
                  <SelectItem value="SETTLEMENT_ACCOUNT">
                    {t('recipients:filters.type.settlementAccount', {
                      defaultValue: 'Settlement Account',
                    })}
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
                  <SelectValue
                    placeholder={t('recipients:filters.status.label', {
                      defaultValue: 'Status',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('recipients:filters.status.all', {
                      defaultValue: 'All Status',
                    })}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {t('recipients:filters.status.active', {
                      defaultValue: 'Active',
                    })}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {t('recipients:filters.status.inactive', {
                      defaultValue: 'Inactive',
                    })}
                  </SelectItem>
                  <SelectItem value="MICRODEPOSITS_INITIATED">
                    {t('recipients:filters.status.microdepositsInitiated', {
                      defaultValue: 'Microdeposits Initiated',
                    })}
                  </SelectItem>
                  <SelectItem value="READY_FOR_VALIDATION">
                    {t('recipients:filters.status.readyForValidation', {
                      defaultValue: 'Ready for Validation',
                    })}
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    {t('recipients:filters.status.rejected', {
                      defaultValue: 'Rejected',
                    })}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="secondary"
                onClick={clearFilters}
                className="eb-h-9 eb-px-3"
              >
                {t('recipients:filters.clearFilters', {
                  defaultValue: 'Clear Filters',
                })}
              </Button>
            </div>
          )}
        </div>

        {/* Recipients List/Table */}
        {shouldUseMobileLayout ? (
          <div>
            {paginatedRecipients.length === 0 ? (
              <div className="eb-py-8 eb-text-center eb-text-gray-500">
                {t('recipients:emptyState.noRecipients', {
                  defaultValue: 'No recipients found',
                })}
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
            locale={locale}
            layout={
              shouldUseWidgetLayout
                ? 'widget'
                : shouldUseTabletLayout
                  ? 'tablet'
                  : 'desktop'
            }
          />
        )}
        <RecipientsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={effectiveTotalItems}
          startIndex={paginationInfo.startIndex}
          endIndex={paginationInfo.endIndex}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
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
        <DialogContent className="eb-scrollable-dialog eb-max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t('recipients:details.title', {
                defaultValue: 'Recipient: {{name}}',
                name: selectedRecipient
                  ? formatRecipientName(selectedRecipient)
                  : t('recipients:details.unknown', {
                      defaultValue: 'Unknown',
                    }),
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="eb-scrollable-content eb-space-y-2">
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
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent className="eb-max-h-full eb-max-w-2xl eb-overflow-hidden eb-p-0 sm:eb-max-h-[95vh]">
          <DialogHeader className="eb-shrink-0 eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
            <DialogTitle className="eb-font-header eb-text-xl">
              {t('recipients:actions.editRecipient', {
                defaultValue: 'Edit Recipient',
              })}
            </DialogTitle>
          </DialogHeader>
          {selectedRecipient && (
            <RecipientForm
              mode="edit"
              recipient={selectedRecipient}
              onSubmit={handleUpdateRecipient}
              onCancel={closeEditDialog}
              isLoading={isUpdating}
              showCardWrapper={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('recipients:deactivateDialog.title', {
                defaultValue: 'Deactivate Recipient',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('recipients:deactivateDialog.description', {
                defaultValue:
                  'Are you sure you want to deactivate {{name}}? This action cannot be undone.',
                name: recipientToDeactivate
                  ? formatRecipientName(recipientToDeactivate)
                  : t('recipients:deactivateDialog.unknownRecipient', {
                      defaultValue: 'this recipient',
                    }),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('recipients:deactivateDialog.cancel', {
                defaultValue: 'Cancel',
              })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              {t('recipients:deactivateDialog.confirm', {
                defaultValue: 'Deactivate',
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
