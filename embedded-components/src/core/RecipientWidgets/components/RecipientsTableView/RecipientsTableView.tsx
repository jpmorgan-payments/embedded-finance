import * as React from 'react';
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  PaginationState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClipboardListIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  canMakePayment,
  canVerifyMicrodeposits,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import { ApiError } from '@/api/generated/ep-recipients.schemas';
import type {
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MakePayment } from '@/core/MakePayment';

import { MicrodepositsFormDialogTrigger } from '../../forms/MicrodepositsForm/MicrodepositsForm';
import {
  getRecipientTypeConfig,
  getUserJourneys,
  SupportedRecipientType,
} from '../../types';
import { RecipientDetailsDialog } from '../RecipientDetailsDialog/RecipientDetailsDialog';
import { RemoveAccountDialogTrigger } from '../RemoveAccountDialog/RemoveAccountDialog';
import { getRecipientsColumns } from './RecipientsTableView.columns';

/**
 * Server-side pagination state passed from parent component
 */
export interface TablePaginationState {
  /** Current pagination state */
  pagination: PaginationState;
  /** Callback to update pagination */
  onPaginationChange: (
    pagination: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => void;
  /** Total count of all items */
  totalCount: number;
  /** Total number of pages */
  pageCount: number;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Props for RecipientsTableView component
 */
export interface RecipientsTableViewProps {
  /** Array of recipients to display (required) */
  data: Recipient[];

  /** Pagination state managed by parent component */
  paginationState: TablePaginationState;

  /** Type of recipients being displayed */
  recipientType: SupportedRecipientType;

  /** Optional MakePayment component renderer */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  /**
   * Callback to open the edit dialog for a recipient.
   * The edit dialog is lifted to the parent component to survive data updates.
   */
  onEditRecipient?: (recipient: Recipient) => void;

  /** Callback when recipient is edited or removed */
  onRecipientSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /** Callback when microdeposit verification is completed */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;

  /** Callback when recipient is successfully removed */
  onRemoveSuccess?: (recipient: Recipient) => void;

  /** Optional additional CSS classes */
  className?: string;
}

/**
 * RecipientsTableView - Table view for recipients using TanStack Table
 *
 * This is a presentational component that receives all data from its parent.
 * The parent is responsible for data fetching and pagination state management.
 * Supports all recipient types: LINKED_ACCOUNT, RECIPIENT, and future SETTLEMENT_ACCOUNT.
 *
 * Features:
 * - Sortable columns (account holder, status, created date)
 * - Filterable by status
 * - Server-side pagination controlled by parent
 * - Row actions (edit, verify, delete)
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <RecipientsTableView
 *   data={recipients}
 *   paginationState={{
 *     pagination,
 *     onPaginationChange: setPagination,
 *     totalCount,
 *     pageCount,
 *     isLoading,
 *   }}
 *   recipientType="LINKED_ACCOUNT"
 *   onRecipientSettled={(recipient, error) => {
 *     if (error) console.error('Error:', error);
 *     else console.log('Success:', recipient);
 *   }}
 * />
 * ```
 */
export const RecipientsTableView: React.FC<RecipientsTableViewProps> = ({
  data,
  paginationState,
  recipientType,
  renderPaymentAction,
  onEditRecipient,
  onRecipientSettled,
  onMicrodepositVerifySettled,
  onRemoveSuccess,
  className,
}) => {
  // Get config for recipient type
  const config = getRecipientTypeConfig(recipientType);
  const userJourneys = getUserJourneys(config.eventPrefix);
  const { t } = useTranslation(config.i18nNamespace);

  // Destructure pagination state from parent
  const { pagination, totalCount, pageCount, isLoading } = paginationState;

  // Track which account numbers are visible (show full number)
  const [visibleAccountNumbers, setVisibleAccountNumbers] = React.useState<
    Set<string>
  >(new Set());

  // Toggle account number visibility
  const handleToggleAccountNumber = React.useCallback((id: string) => {
    setVisibleAccountNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Table state - only filters and visibility are managed internally
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Render all row actions (inline buttons + overflow menu)
  const renderRowActionsCell = React.useCallback(
    (recipient: Recipient) => {
      const displayName = getRecipientDisplayName(recipient);
      const showVerifyButton = canVerifyMicrodeposits(recipient);
      const showPaymentButton = canMakePayment(recipient);
      const isActive = recipient.status === 'ACTIVE';

      // Determine what to show inline vs in menu
      // Prioritize: Pay > Verify > Details > Edit
      const primaryAction = showPaymentButton
        ? 'pay'
        : showVerifyButton
          ? 'verify'
          : null;

      // Shared menu items (Verify when not inline, Edit, Remove)
      const sharedMenuItems = (
        <>
          {/* Verify Microdeposits - only in menu when not shown inline */}
          {showVerifyButton && primaryAction !== 'verify' && (
            <>
              <MicrodepositsFormDialogTrigger
                recipientId={recipient.id}
                onVerificationSettled={(response) =>
                  onMicrodepositVerifySettled?.(response, recipient)
                }
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="eb-cursor-pointer"
                  data-user-event={userJourneys.VERIFY_STARTED}
                >
                  <ArrowRightIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                  {t('actions.verifyAccount', {
                    defaultValue: 'Verify account',
                  })}
                </DropdownMenuItem>
              </MicrodepositsFormDialogTrigger>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Edit Account */}
          {isActive && onEditRecipient ? (
            <DropdownMenuItem
              onSelect={() => onEditRecipient(recipient)}
              className="eb-cursor-pointer"
            >
              <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {t('actions.edit', { defaultValue: 'Edit' })}
            </DropdownMenuItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DropdownMenuItem
                    disabled
                    className="eb-cursor-not-allowed eb-opacity-50"
                  >
                    <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                    {t('actions.edit', { defaultValue: 'Edit' })}
                  </DropdownMenuItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>
                  {t('actions.editDisabledTooltip', {
                    defaultValue: 'Cannot edit inactive account',
                  })}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <DropdownMenuSeparator />

          {/* Remove Account */}
          <RemoveAccountDialogTrigger
            recipient={recipient}
            onRecipientSettled={onRecipientSettled}
            onRemoveSuccess={onRemoveSuccess}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="eb-cursor-pointer eb-text-destructive focus:eb-text-destructive"
              data-user-event={userJourneys.REMOVE_STARTED}
            >
              <TrashIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {t('actions.remove', { defaultValue: 'Remove' })}
            </DropdownMenuItem>
          </RemoveAccountDialogTrigger>
        </>
      );

      // View Details menu item
      const viewDetailsMenuItem = (
        <>
          <RecipientDetailsDialog recipient={recipient}>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="eb-cursor-pointer"
            >
              <ClipboardListIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {t('actions.viewDetails', { defaultValue: 'View details' })}
            </DropdownMenuItem>
          </RecipientDetailsDialog>
          <DropdownMenuSeparator />
        </>
      );

      return (
        <div className="eb-flex eb-items-center eb-justify-end eb-gap-1">
          {/* Primary action - Pay or Verify */}
          {primaryAction === 'pay' && (
            <>
              {renderPaymentAction ? (
                renderPaymentAction(recipient)
              ) : (
                <MakePayment
                  triggerButton={
                    <Button
                      variant="outline"
                      size="sm"
                      className="eb-h-8 eb-text-xs"
                      aria-label={`${t('actions.makePayment')} from ${displayName}`}
                    >
                      {t('actions.makePayment', { defaultValue: 'Pay' })}
                    </Button>
                  }
                  recipientId={recipient.id}
                />
              )}
            </>
          )}

          {primaryAction === 'verify' && (
            <MicrodepositsFormDialogTrigger
              recipientId={recipient.id}
              onVerificationSettled={(response) =>
                onMicrodepositVerifySettled?.(response, recipient)
              }
            >
              <Button
                variant="default"
                size="sm"
                className="eb-h-8 eb-text-xs"
                data-user-event={userJourneys.VERIFY_STARTED}
                aria-label={`${t('actions.verifyAccount')} for ${displayName}`}
              >
                {t('actions.verifyAccount', { defaultValue: 'Verify' })}
              </Button>
            </MicrodepositsFormDialogTrigger>
          )}

          {/* Secondary inline actions - shown at wider widths
              Use two menus for responsive View Details visibility:
              - When Details is inline (@2xl+): hide Details from menu
              - When Details is NOT inline (<@2xl): show Details in menu
          */}
          <div className="eb-hidden eb-items-center eb-gap-1 @2xl:eb-flex">
            {/* Details button - inline at @2xl+ (icon only, full label at @3xl+) */}
            <RecipientDetailsDialog recipient={recipient}>
              <Button
                variant="ghost"
                size="sm"
                className="eb-h-8 eb-gap-1 eb-text-xs"
                aria-label={`${t('actions.viewDetails')} for ${displayName}`}
              >
                <ClipboardListIcon className="eb-h-3.5 eb-w-3.5" />
                <span className="eb-hidden @3xl:eb-inline">
                  {t('actions.viewDetailsShort', { defaultValue: 'Details' })}
                </span>
              </Button>
            </RecipientDetailsDialog>
          </div>

          {/* Menu WITH View Details - shown at <@2xl (when inline Details is hidden) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="eb-h-8 eb-w-8 @2xl:eb-hidden"
                aria-label={t('actions.moreActions', {
                  defaultValue: 'More actions for {{name}}',
                  name: displayName,
                })}
              >
                <MoreVerticalIcon className="eb-h-4 eb-w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {viewDetailsMenuItem}
              {sharedMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu WITHOUT View Details - shown at @2xl+ (when inline Details is visible) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="eb-hidden eb-h-8 eb-w-8 @2xl:eb-flex"
                aria-label={t('actions.moreActions', {
                  defaultValue: 'More actions for {{name}}',
                  name: displayName,
                })}
              >
                <MoreVerticalIcon className="eb-h-4 eb-w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sharedMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [
      t,
      userJourneys.VERIFY_STARTED,
      userJourneys.REMOVE_STARTED,
      renderPaymentAction,
      onEditRecipient,
      onMicrodepositVerifySettled,
      onRemoveSuccess,
      onRecipientSettled,
    ]
  );

  // Generate columns with actions
  const columns = React.useMemo(
    () =>
      getRecipientsColumns({
        t: t as unknown as (key: string, options?: unknown) => string,
        renderActionsCell: renderRowActionsCell,
        visibleAccountNumbers,
        onToggleAccountNumber: handleToggleAccountNumber,
      }),
    [t, renderRowActionsCell, visibleAccountNumbers, handleToggleAccountNumber]
  );

  // Initialize table instance
  const table = useReactTable({
    data,
    columns,
    // Always use manual pagination since parent controls the data
    manualPagination: true,
    pageCount,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: paginationState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <div className={cn('eb-w-full eb-space-y-4 eb-@container', className)}>
      {/* Table */}
      <div className="eb-rounded-md eb-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="eb-whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_col, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="eb-h-5 eb-w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="eb-transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="eb-h-24 eb-text-center"
                >
                  {t('table.noResults', {
                    defaultValue: 'No linked accounts found.',
                  })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - only show if there are more items than page size */}
      {totalCount > table.getState().pagination.pageSize && (
        <div className="eb-flex eb-items-center eb-justify-between eb-px-2">
          <div className="eb-flex eb-items-center eb-space-x-2 eb-text-sm eb-text-muted-foreground">
            <span>
              {t('table.showing', {
                defaultValue: 'Showing {{from}} to {{to}} of {{total}}',
                from:
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1,
                to: Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  totalCount
                ),
                total: totalCount,
              })}
            </span>
          </div>
          <div className="eb-flex eb-items-center eb-space-x-6 lg:eb-space-x-8">
            {/* Page size selector */}
            <div className="eb-flex eb-items-center eb-space-x-2">
              <span className="eb-text-sm eb-font-medium">
                {t('table.rowsPerPage', { defaultValue: 'Rows per page' })}
              </span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="eb-h-8 eb-w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page info */}
            <div className="eb-flex eb-w-[100px] eb-items-center eb-justify-center eb-text-sm eb-font-medium">
              {t('table.pageOf', {
                defaultValue: 'Page {{page}} of {{total}}',
                page: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
              })}
            </div>

            {/* Navigation buttons */}
            <div className="eb-flex eb-items-center eb-space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label={t('table.firstPage', {
                  defaultValue: 'Go to first page',
                })}
              >
                <ChevronsLeftIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-h-8 eb-w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label={t('table.previousPage', {
                  defaultValue: 'Go to previous page',
                })}
              >
                <ChevronLeftIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-h-8 eb-w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label={t('table.nextPage', {
                  defaultValue: 'Go to next page',
                })}
              >
                <ChevronRightIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label={t('table.lastPage', {
                  defaultValue: 'Go to last page',
                })}
              >
                <ChevronsRightIcon className="eb-h-4 eb-w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
