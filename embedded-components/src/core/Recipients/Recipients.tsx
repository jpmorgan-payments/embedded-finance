import React, { useCallback, useMemo, useState } from 'react';
// Icons
import { AlertCircle, Plus, Search } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  useAmendRecipient,
  useCreateRecipient,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RecipientRequest,
  RecipientStatus,
  RecipientType,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { RecipientDetails } from './components/RecipientDetails/RecipientDetails';
// Sub-components
import { RecipientForm } from './components/RecipientForm/RecipientForm';
import { VerificationFlow } from './components/VerificationFlow/VerificationFlow';
// Hooks
import { useRecipientsFilters } from './hooks/useRecipientsFilters';
import type { RecipientsConfig } from './types/paymentConfig';
import { createRecipientsConfig } from './types/paymentConfig';
// Utils
import { formatRecipientName } from './utils/recipientHelpers';

export interface RecipientsProps {
  /** Optional client ID filter */
  clientId?: string;
  /** Default recipient type */
  initialRecipientType?: RecipientType;
  /** Show/hide create functionality */
  showCreateButton?: boolean;
  /** Enable microdeposit verification */
  enableVerification?: boolean;
  /** Configuration for payment methods and validation rules */
  config?: RecipientsConfig;
  /** Callback when recipient is created */
  onRecipientCreated?: (recipient: Recipient) => void;
  /** Callback when recipient is updated */
  onRecipientUpdated?: (recipient: Recipient) => void;
  /** Callback when verification is complete */
  onVerificationComplete?: (recipient: Recipient) => void;
  /** List of user events to track */
  userEventsToTrack?: string[];
  /** Handler for user events */
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
}

// Status badge component
const StatusBadge: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  return (
    <Badge variant="secondary" className="eb-text-xs">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

// Mobile card for a single recipient
const RecipientCard: React.FC<{
  recipient: Recipient;
  onView: () => void;
  onEdit: () => void;
  onVerify?: () => void;
  enableVerification?: boolean;
}> = ({ recipient, onView, onEdit, onVerify, enableVerification }) => (
  <Card className="eb-mb-4 eb-space-y-2 eb-p-4 eb-shadow-sm">
    <div className="eb-flex eb-items-center eb-justify-between">
      <div className="eb-truncate eb-text-base eb-font-semibold">
        {formatRecipientName(recipient)}
      </div>
      <Badge variant="outline" className="eb-text-xs">
        {recipient.type?.replace(/_/g, ' ') || 'Unknown'}
      </Badge>
    </div>
    <div className="eb-flex eb-items-center eb-gap-2">
      <StatusBadge status={recipient.status!} />
      <span className="eb-text-xs eb-text-gray-500">
        {recipient.createdAt
          ? new Date(recipient.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A'}
      </span>
    </div>
    <div className="eb-text-xs eb-text-gray-600">
      <span className="eb-font-medium">Account:</span>{' '}
      {recipient.account?.number
        ? `****${recipient.account.number.slice(-4)}`
        : 'N/A'}
    </div>
    <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-4">
      <span
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onView();
        }}
        className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
        title="View details"
      >
        Details
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onEdit();
        }}
        className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
        title="Edit recipient"
      >
        Edit
      </span>
      {enableVerification &&
        recipient.status === 'MICRODEPOSITS_INITIATED' &&
        onVerify && (
          <span
            role="button"
            tabIndex={0}
            onClick={onVerify}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onVerify();
            }}
            className="eb-cursor-pointer eb-text-green-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
            title="Verify microdeposits"
          >
            Verify
          </span>
        )}
    </div>
  </Card>
);

export const Recipients: React.FC<RecipientsProps> = ({
  clientId,
  initialRecipientType = 'RECIPIENT',
  showCreateButton = true,
  enableVerification = true,
  config,
  onRecipientCreated,
  onRecipientUpdated,
  onVerificationComplete,
  userEventsHandler,
}) => {
  // Merge user config with defaults
  const resolvedConfig = createRecipientsConfig(config);

  // State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Custom hooks
  const { filters, updateFilter, clearFilters } = useRecipientsFilters();
  const isMobile = useMediaQuery('(max-width: 640px)');

  // API queries
  const {
    data: recipientsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllRecipients({
    clientId,
    type: filters.type,
    page: currentPage,
    limit: pageSize,
  });

  const createRecipientMutation = useCreateRecipient({
    mutation: {
      onSuccess: (data) => {
        setIsCreateDialogOpen(false);
        refetch();
        onRecipientCreated?.(data);
        userEventsHandler?.({ actionName: 'recipient_created' });
      },
      onError: (error) => {
        console.error('Failed to create recipient:', error);
      },
    },
  });

  const updateRecipientMutation = useAmendRecipient({
    mutation: {
      onSuccess: (data) => {
        setIsEditDialogOpen(false);
        setSelectedRecipient(null);
        refetch();
        onRecipientUpdated?.(data);
        userEventsHandler?.({ actionName: 'recipient_updated' });
      },
      onError: (error) => {
        console.error('Failed to update recipient:', error);
      },
    },
  });

  // Handlers
  const handleCreateRecipient = useCallback(
    (data: RecipientRequest) => {
      createRecipientMutation.mutate({ data });
    },
    [createRecipientMutation]
  );

  const handleUpdateRecipient = useCallback(
    (data: UpdateRecipientRequest) => {
      if (selectedRecipient) {
        updateRecipientMutation.mutate({ id: selectedRecipient.id, data });
      }
    },
    [selectedRecipient, updateRecipientMutation]
  );

  const handleViewDetails = useCallback(
    (recipient: Recipient) => {
      setSelectedRecipient(recipient);
      setIsDetailsDialogOpen(true);
      userEventsHandler?.({ actionName: 'recipient_details_viewed' });
    },
    [userEventsHandler]
  );

  const handleEditRecipient = useCallback(
    (recipient: Recipient) => {
      setSelectedRecipient(recipient);
      setIsEditDialogOpen(true);
      userEventsHandler?.({ actionName: 'recipient_edit_started' });
    },
    [userEventsHandler]
  );

  const handleVerifyRecipient = useCallback(
    (recipient: Recipient) => {
      setSelectedRecipient(recipient);
      setIsVerificationDialogOpen(true);
      userEventsHandler?.({ actionName: 'recipient_verification_started' });
    },
    [userEventsHandler]
  );

  const handleVerificationComplete = useCallback(
    (recipient: Recipient) => {
      setIsVerificationDialogOpen(false);
      setSelectedRecipient(null);
      refetch();
      onVerificationComplete?.(recipient);
      userEventsHandler?.({ actionName: 'recipient_verification_completed' });
    },
    [refetch, onVerificationComplete, userEventsHandler]
  );

  // Filtered recipients
  const filteredRecipients = useMemo(() => {
    if (!recipientsData?.recipients) return [];

    return recipientsData.recipients.filter((recipient) => {
      const matchesSearch =
        searchTerm === '' ||
        formatRecipientName(recipient)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        recipient.account?.number?.includes(searchTerm);

      const matchesStatus =
        !filters.status || recipient.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [recipientsData?.recipients, searchTerm, filters.status]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="eb-w-full">
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
      <Card className="eb-w-full">
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
    <Card className="eb-w-full">
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            Recipients
          </CardTitle>
          {showCreateButton && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
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
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={createRecipientMutation.isPending}
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

          {/* Filters */}
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
        </div>

        {/* Recipients List/Table */}
        {isMobile ? (
          <div>
            {filteredRecipients.length === 0 ? (
              <div className="eb-py-8 eb-text-center eb-text-gray-500">
                No recipients found
              </div>
            ) : (
              filteredRecipients.map((recipient) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  onView={() => handleViewDetails(recipient)}
                  onEdit={() => handleEditRecipient(recipient)}
                  onVerify={
                    enableVerification &&
                    recipient.status === 'MICRODEPOSITS_INITIATED'
                      ? () => handleVerifyRecipient(recipient)
                      : undefined
                  }
                  enableVerification={enableVerification}
                />
              ))
            )}
          </div>
        ) : (
          <div className="eb-overflow-hidden eb-rounded-md eb-border">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="eb-hidden sm:eb-table-cell">
                      Account
                    </TableHead>
                    <TableHead className="eb-hidden md:eb-table-cell">
                      Created
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="eb-py-8 eb-text-center eb-text-gray-500"
                      >
                        No recipients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="eb-truncate eb-font-medium">
                          {formatRecipientName(recipient)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="eb-text-xs">
                            {recipient.type?.replace(/_/g, ' ') || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={recipient.status!} />
                        </TableCell>
                        <TableCell className="eb-hidden sm:eb-table-cell">
                          <span className="eb-text-sm eb-text-gray-600">
                            {recipient.account?.number
                              ? `****${recipient.account.number.slice(-4)}`
                              : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="eb-hidden md:eb-table-cell">
                          <span className="eb-text-sm eb-text-gray-600">
                            {recipient.createdAt
                              ? new Date(
                                  recipient.createdAt
                                ).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="eb-flex eb-gap-3">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => handleViewDetails(recipient)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  handleViewDetails(recipient);
                              }}
                              className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                              title="View details"
                            >
                              Details
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => handleEditRecipient(recipient)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  handleEditRecipient(recipient);
                              }}
                              className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                              title="Edit recipient"
                            >
                              Edit
                            </span>
                            {enableVerification &&
                              recipient.status ===
                                'MICRODEPOSITS_INITIATED' && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    handleVerifyRecipient(recipient)
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                      handleVerifyRecipient(recipient);
                                  }}
                                  className="eb-cursor-pointer eb-text-green-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                                  title="Verify microdeposits"
                                >
                                  Verify
                                </span>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {/* Pagination */}
        {recipientsData &&
          recipientsData.total_items &&
          recipientsData.total_items > pageSize && (
            <div className="eb-mt-4 eb-flex eb-items-center eb-justify-between">
              <div className="eb-text-sm eb-text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, recipientsData.total_items)}{' '}
                of {recipientsData.total_items} recipients
              </div>
              <div className="eb-flex eb-gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    currentPage * pageSize >= recipientsData.total_items
                  }
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="eb-scrollable-dialog eb-max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recipient Details</DialogTitle>
          </DialogHeader>
          <div className="eb-scrollable-content">
            {selectedRecipient && (
              <RecipientDetails
                recipient={selectedRecipient}
                onClose={() => setIsDetailsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRecipient(null);
                }}
                isLoading={updateRecipientMutation.isPending}
                config={resolvedConfig}
                showCardWrapper={false}
                recipientType={selectedRecipient.type ?? 'RECIPIENT'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      {enableVerification && (
        <Dialog
          open={isVerificationDialogOpen}
          onOpenChange={setIsVerificationDialogOpen}
        >
          <DialogContent className="eb-scrollable-dialog eb-max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Microdeposits</DialogTitle>
            </DialogHeader>
            <div className="eb-scrollable-content">
              {selectedRecipient && (
                <VerificationFlow
                  recipient={selectedRecipient}
                  onComplete={handleVerificationComplete}
                  onCancel={() => {
                    setIsVerificationDialogOpen(false);
                    setSelectedRecipient(null);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
